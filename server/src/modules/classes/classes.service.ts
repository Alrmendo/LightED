import type { z } from 'zod';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/AppError';
import { isForeignKeyConstraintError } from '../../utils/prismaErrors';
import { recalcBillsForClassPriceChange } from '../bills/bills.service';
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
      await recalcBillsForClassPriceChange(tx, id, updated.pricePerSession);
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
