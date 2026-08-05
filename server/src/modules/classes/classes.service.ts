import type { z } from 'zod';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/AppError';
import { isForeignKeyConstraintError } from '../../utils/prismaErrors';
import { recalcBillsForStudent } from '../bills/bills.service';
import type { classSchema } from './classes.schemas';

type ClassInput = z.infer<typeof classSchema>;

export function listClasses() {
  return prisma.englishClass.findMany({ orderBy: { name: 'asc' } });
}

export function createClass(data: ClassInput) {
  return prisma.englishClass.create({ data });
}

export async function updateClass(id: string, data: ClassInput) {
  const existing = await prisma.englishClass.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'CLASS_NOT_FOUND', 'Không tìm thấy lớp học');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.englishClass.update({ where: { id }, data });

    if (existing.pricePerSession !== updated.pricePerSession) {
      // Đổi giá lớp -> recalc MỌI bill (mọi tháng) đang gắn classId này, bỏ qua bill đã paid.
      // Dựa theo TuitionBill.classId (lớp đã tính phí lúc bill đó được tạo), KHÔNG dựa vào lớp
      // hiện tại của học sinh — xem "Lưu ý ngầm khi đổi giá lớp" trong server/README.md.
      const bills = await tx.tuitionBill.findMany({
        where: { classId: id, paidStatus: { not: 'paid' } },
        select: { studentId: true, month: true },
      });

      for (const bill of bills) {
        await recalcBillsForStudent(tx, {
          studentId: bill.studentId,
          classId: id,
          month: bill.month,
          pricePerSession: updated.pricePerSession,
        });
      }
    }

    return updated;
  });
}

export async function deleteClass(id: string) {
  const existing = await prisma.englishClass.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'CLASS_NOT_FOUND', 'Không tìm thấy lớp học');

  try {
    await prisma.englishClass.delete({ where: { id } });
  } catch (err) {
    if (isForeignKeyConstraintError(err)) {
      throw new AppError(
        409,
        'CLASS_HAS_STUDENTS',
        'Không thể xoá lớp đang có học sinh — chuyển học sinh sang lớp khác trước.'
      );
    }
    throw err;
  }
}
