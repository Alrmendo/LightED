import type { EnglishClass, Prisma } from '@prisma/client';
import type { z } from 'zod';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/AppError';
import { addDays, currentYearMonth, monthDateRange, parseDateOnly } from '../../utils/date';
import { isForeignKeyConstraintError } from '../../utils/prismaErrors';
import { recalcBillsForStudent } from '../bills/bills.service';
import { syncScheduleForRange } from '../attendance/attendance.service';
import type { classSchema } from './classes.schemas';

type ClassInput = z.infer<typeof classSchema>;
type Tx = Prisma.TransactionClient;

export function listClasses() {
  return prisma.englishClass.findMany({ orderBy: { name: 'asc' } });
}

// startDate/endDate đến từ zod dưới dạng string "YYYY-MM-DD" (dateOnly) — convert sang Date thật
// trước khi ghi vào cột @db.Date, cùng convention parseDateOnly() đang dùng ở attendance.service.ts
// cho AttendanceRecord.date, không phó mặc Prisma tự coerce string.
function toPrismaData(data: ClassInput) {
  return {
    ...data,
    startDate: data.startDate ? parseDateOnly(data.startDate) : undefined,
    endDate: data.endDate ? parseDateOnly(data.endDate) : undefined,
  };
}

// Side-effect lúc lưu lớp (tạo mới/sửa): nếu đã có startDate VÀ đã cấu hình daysOfWeek thì tự
// sinh điểm danh cho toàn bộ [startDate, endDate hoặc hết tháng hiện tại nếu bỏ trống endDate).
// Cố tình KHÔNG gọi syncScheduleForRange khi daysOfWeek rỗng (thay vì để nó tự throw
// CLASS_NO_SCHEDULE) — đây là side-effect ngầm lúc lưu form, không được phép chặn việc lưu thông
// tin lớp chỉ vì giáo viên chưa cấu hình lịch học.
async function maybeAutoSync(tx: Tx, cls: EnglishClass) {
  if (!cls.startDate || cls.daysOfWeek.length === 0) return undefined;

  const endDateExclusive = cls.endDate ? addDays(cls.endDate, 1) : monthDateRange(currentYearMonth()).end;
  return syncScheduleForRange(tx, cls.id, cls.startDate, endDateExclusive);
}

export async function createClass(data: ClassInput) {
  return prisma.$transaction(async (tx) => {
    const created = await tx.englishClass.create({ data: toPrismaData(data) });
    const syncResult = await maybeAutoSync(tx, created);
    return { ...created, syncResult };
  });
}

export async function updateClass(id: string, data: ClassInput) {
  const existing = await prisma.englishClass.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'CLASS_NOT_FOUND', 'Không tìm thấy lớp học');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.englishClass.update({ where: { id }, data: toPrismaData(data) });

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

    const syncResult = await maybeAutoSync(tx, updated);

    return { ...updated, syncResult };
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
