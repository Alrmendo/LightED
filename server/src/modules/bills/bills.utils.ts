// Nguồn tính toán DUY NHẤT cho "điểm danh present trong 1 tháng -> số buổi + tiền + danh sách
// ngày đã học". Dùng bởi CẢ bills.service.ts (ghi lại TuitionBill khi có trigger recalc) LẪN
// portal.service.ts (hiển thị real-time cho GET /api/portal/me).
//
// QUAN TRỌNG cho Giai đoạn 4 (module bills thật — GET /api/bills, PUT /api/bills/:id/status):
// PHẢI tái dùng computeBillSummary() ở đây, KHÔNG viết lại logic đếm điểm danh/tính tiền ở nơi
// khác — nếu không 2 (hoặc 3) chỗ sẽ tính bill lệch nhau khi có người sửa 1 chỗ mà quên chỗ kia.
import type { Prisma } from '@prisma/client';
import { monthDateRange } from '../../utils/date';

type Db = Prisma.TransactionClient;

export interface BillSummary {
  totalAttendedSessions: number;
  totalAmount: number;
  attendedDates: string[]; // "DD/MM", sắp xếp tăng dần theo ngày
}

export async function computeBillSummary(
  db: Db,
  studentId: string,
  month: string,
  pricePerSession: number
): Promise<BillSummary> {
  const { start, end } = monthDateRange(month);
  const records = await db.attendanceRecord.findMany({
    where: { studentId, status: 'present', date: { gte: start, lt: end } },
    select: { date: true },
    orderBy: { date: 'asc' },
  });

  const totalAttendedSessions = records.length;
  const totalAmount = totalAttendedSessions * pricePerSession;
  const attendedDates = records.map(
    (r) => `${String(r.date.getUTCDate()).padStart(2, '0')}/${String(r.date.getUTCMonth() + 1).padStart(2, '0')}`
  );

  return { totalAttendedSessions, totalAmount, attendedDates };
}
