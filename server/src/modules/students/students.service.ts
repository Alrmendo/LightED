import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import type { z } from 'zod';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/AppError';
import { currentYearMonth } from '../../utils/date';
import { isForeignKeyConstraintError } from '../../utils/prismaErrors';
import { recalcBillsForStudent } from '../bills/bills.service';
import type { studentSchema } from './students.schemas';

type StudentInput = z.infer<typeof studentSchema>;

const BCRYPT_ROUNDS = 10;

// Trả về cả pricePerSession vì createStudent/updateStudent cần nó để gọi recalcBillsForStudent
// ngay sau đó — tránh query lại EnglishClass 1 lần nữa.
async function getClassOrThrow(classId: string) {
  const cls = await prisma.englishClass.findUnique({ where: { id: classId } });
  if (!cls) throw new AppError(400, 'CLASS_NOT_FOUND', 'classId không tồn tại');
  return cls;
}

// `omit: { portalAccessCodeHash: true }` ở cả 3 hàm dưới đây (list/create/update) — bcrypt hash
// của PIN portal (chỉ 6 chữ số, keyspace 900,000 khả năng) không bao giờ được lộ ra response API,
// kể cả cho giáo viên đã đăng nhập — tránh brute-force offline nếu Network tab/response bị lộ.
// Cùng nguyên tắc portal.service.ts#getPortalMe đã áp dụng cho phía học sinh.
export function listStudents(classId?: string) {
  return prisma.student.findMany({
    where: classId ? { classId } : undefined,
    orderBy: { name: 'asc' },
    omit: { portalAccessCodeHash: true },
  });
}

export async function createStudent(data: StudentInput) {
  const cls = await getClassOrThrow(data.classId);

  return prisma.$transaction(async (tx) => {
    const student = await tx.student.create({ data, omit: { portalAccessCodeHash: true } });
    // Học sinh mới -> tạo/tính bill THÁNG HIỆN TẠI (theo ngày thực server, quy tắc #2) theo lớp
    // vừa gán.
    await recalcBillsForStudent(tx, {
      studentId: student.id,
      classId: cls.id,
      month: currentYearMonth(),
      pricePerSession: cls.pricePerSession,
    });
    return student;
  });
}

export async function updateStudent(id: string, data: StudentInput) {
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'STUDENT_NOT_FOUND', 'Không tìm thấy học sinh');
  const cls = await getClassOrThrow(data.classId);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.student.update({ where: { id }, data, omit: { portalAccessCodeHash: true } });
    if (existing.classId !== updated.classId) {
      // Đổi lớp -> recalc bill THÁNG HIỆN TẠI theo lớp MỚI (không đụng tới bill các tháng khác).
      await recalcBillsForStudent(tx, {
        studentId: id,
        classId: cls.id,
        month: currentYearMonth(),
        pricePerSession: cls.pricePerSession,
      });
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
  // loginPortal() match theo Student.phone — cấp mã cho học sinh chưa có phone thì mã đó không
  // bao giờ đăng nhập được (không có gì để match). Chặn rõ ràng ở đây thay vì để lỗi ngầm.
  if (!student.phone) {
    throw new AppError(
      400,
      'STUDENT_NO_PHONE',
      'Học sinh chưa có SĐT phụ huynh, cần bổ sung trước khi cấp mã truy cập portal'
    );
  }

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
