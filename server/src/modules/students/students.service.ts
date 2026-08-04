import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import type { z } from 'zod';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/AppError';
import { currentYearMonth } from '../../utils/date';
import { isForeignKeyConstraintError } from '../../utils/prismaErrors';
import { recalcCurrentMonthBillForStudent } from '../bills/bills.service';
import type { studentSchema } from './students.schemas';

type StudentInput = z.infer<typeof studentSchema>;

const BCRYPT_ROUNDS = 10;

async function assertClassExists(classId: string) {
  const cls = await prisma.englishClass.findUnique({ where: { id: classId } });
  if (!cls) throw new AppError(400, 'CLASS_NOT_FOUND', 'classId không tồn tại');
}

export function listStudents(classId?: string) {
  return prisma.student.findMany({
    where: classId ? { classId } : undefined,
    orderBy: { name: 'asc' },
  });
}

export async function createStudent(data: StudentInput) {
  await assertClassExists(data.classId);

  return prisma.$transaction(async (tx) => {
    const student = await tx.student.create({ data });
    await recalcCurrentMonthBillForStudent(tx, student.id, currentYearMonth());
    return student;
  });
}

export async function updateStudent(id: string, data: StudentInput) {
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'STUDENT_NOT_FOUND', 'Không tìm thấy học sinh');
  await assertClassExists(data.classId);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.student.update({ where: { id }, data });
    if (existing.classId !== updated.classId) {
      await recalcCurrentMonthBillForStudent(tx, id, currentYearMonth());
    }
    return updated;
  });
}

export async function deleteStudent(id: string) {
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'STUDENT_NOT_FOUND', 'Không tìm thấy học sinh');

  try {
    await prisma.student.delete({ where: { id } });
  } catch (err) {
    if (isForeignKeyConstraintError(err)) {
      throw new AppError(
        409,
        'STUDENT_HAS_HISTORY',
        'Không thể xoá học sinh đã có lịch sử điểm danh hoặc học phí.'
      );
    }
    throw err;
  }
}

// Trả PIN dạng plaintext 1 LẦN DUY NHẤT cho giáo viên gửi thủ công cho phụ huynh — không lưu
// plaintext ở đâu cả, không log (xem server/README.md phần "Không log password/PIN").
export async function resetAccessCode(id: string): Promise<string> {
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) throw new AppError(404, 'STUDENT_NOT_FOUND', 'Không tìm thấy học sinh');

  const accessCode = String(crypto.randomInt(100000, 1000000)); // 6 chữ số: 100000-999999
  const portalAccessCodeHash = await bcrypt.hash(accessCode, BCRYPT_ROUNDS);

  await prisma.student.update({
    where: { id },
    data: { portalAccessCodeHash, portalAccessEnabled: true },
  });

  return accessCode;
}

export async function revokeAccessCode(id: string) {
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) throw new AppError(404, 'STUDENT_NOT_FOUND', 'Không tìm thấy học sinh');

  await prisma.student.update({
    where: { id },
    data: { portalAccessCodeHash: null, portalAccessEnabled: false },
  });
}
