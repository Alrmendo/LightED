// Engine tính lại TuitionBill + route service cho GET/PUT /api/bills.
import type { Prisma, PaidStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/AppError';
import { formatDateOnly } from '../../utils/date';
import { computeBillSummary } from './bills.utils';

type Tx = Prisma.TransactionClient;

export interface RecalcBillTarget {
  studentId: string;
  classId: string;
  month: string;
  pricePerSession: number;
}

// Hàm DUY NHẤT tính lại đúng 1 bill (unique theo studentId+month) theo classId/pricePerSession
// truyền vào — gọi trực tiếp trong transaction ở ĐÚNG 4 nơi trigger recalc của hệ thống:
//   1) classes.service.ts#updateClass      — EnglishClass.pricePerSession đổi
//   2) students.service.ts#createStudent/updateStudent — học sinh mới / đổi classId
//   3) attendance.service.ts#upsertAttendance — 1 bản ghi điểm danh đổi
//   4) attendance.service.ts#addSessionDate/syncSchedule — nhiều bản ghi điểm danh đổi 1 lần
// Không viết thêm hàm tính bill nào khác — mọi nơi cần "điểm danh present trong tháng -> buổi +
// tiền" phải qua computeBillSummary() (bills.utils.ts), mọi nơi cần "ghi lại kết quả đó vào
// TuitionBill" phải qua đây.
// Bất biến: bill đã paidStatus='paid' KHÔNG bao giờ bị sửa (xem server/README.md, quy tắc #1).
export async function recalcBillsForStudent(tx: Tx, target: RecalcBillTarget): Promise<void> {
  const existing = await tx.tuitionBill.findUnique({
    where: { studentId_month: { studentId: target.studentId, month: target.month } },
  });
  if (existing?.paidStatus === 'paid') return;

  const { totalAttendedSessions, totalAmount } = await computeBillSummary(
    tx,
    target.studentId,
    target.month,
    target.pricePerSession
  );

  await tx.tuitionBill.upsert({
    where: { studentId_month: { studentId: target.studentId, month: target.month } },
    update: {
      classId: target.classId,
      pricePerSession: target.pricePerSession,
      totalAttendedSessions,
      totalAmount,
    },
    create: {
      studentId: target.studentId,
      classId: target.classId,
      month: target.month,
      pricePerSession: target.pricePerSession,
      totalAttendedSessions,
      totalAmount,
      paidStatus: 'unpaid',
    },
  });
}

// GET /api/bills — filter tuỳ ý theo classId/month/studentId (bỏ trống filter nào thì không lọc
// theo field đó). paidDate format lại "YYYY-MM-DD" giống hệt cách portal.service.ts đang trả, để
// 2 nơi hiển thị cùng 1 field không lệch định dạng.
export async function listBills(filters: { classId?: string; month?: string; studentId?: string }) {
  const bills = await prisma.tuitionBill.findMany({
    where: {
      ...(filters.classId ? { classId: filters.classId } : {}),
      ...(filters.month ? { month: filters.month } : {}),
      ...(filters.studentId ? { studentId: filters.studentId } : {}),
    },
    orderBy: [{ month: 'desc' }, { studentId: 'asc' }],
  });

  return bills.map((b) => ({ ...b, paidDate: b.paidDate ? formatDateOnly(b.paidDate) : null }));
}

// PUT /api/bills/:id/status — giáo viên chủ động đổi paidStatus (đánh dấu đã thu / thu lại tiền
// mặt sau khi đã lỡ đánh dấu nhầm...). Đây là hành động CON NGƯỜI chủ đích, khác với recalc tự
// động ở trên — vẫn CHO PHÉP sửa 1 bill đang paid (đổi ngược lại unpaid) vì chính route này là
// nơi duy nhất định nghĩa "paid" nghĩa là gì; recalcBillsForStudent() chỉ tôn trọng giá trị đã set
// ở đây và không tự ý ghi đè.
export async function updateBillStatus(id: string, data: { paidStatus: PaidStatus; note?: string }) {
  const existing = await prisma.tuitionBill.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'BILL_NOT_FOUND', 'Không tìm thấy hoá đơn');

  const updated = await prisma.tuitionBill.update({
    where: { id },
    data: {
      paidStatus: data.paidStatus,
      paidDate: data.paidStatus === 'paid' ? new Date() : null,
      ...(data.note !== undefined ? { note: data.note } : {}),
    },
  });

  return { ...updated, paidDate: updated.paidDate ? formatDateOnly(updated.paidDate) : null };
}
