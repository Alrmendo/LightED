import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/AppError';
import { currentYearMonth, monthDateRange, formatDateOnly } from '../../utils/date';
import { computeBillSummary } from '../bills/bills.utils';

// GET /api/portal/me — trả đúng data shape ParentPortal.tsx cần: student + class +
// attendanceRecords (cả tháng, mọi status — để hiện nhật ký) + bill tháng hiện tại + bankConfig.
//
// totalAttendedSessions/totalAmount/attendedDates của bill LUÔN tính live qua
// computeBillSummary() (server/src/modules/bills/bills.utils.ts) thay vì tin tưởng tuyệt đối cột
// đã lưu trong TuitionBill — để hiển thị luôn đúng dù lỡ có 1 trigger recalc nào đó bị bỏ sót.
// paidStatus/paidDate/note/receiptUrl thì lấy từ row đã lưu (hoặc mặc định unpaid nếu bill
// tháng này chưa tồn tại — vd học sinh mới, chưa có buổi học nào trong tháng).
export async function getPortalMe(studentId: string) {
  const student = await prisma.student.findUnique({ where: { id: studentId }, include: { class: true } });
  if (!student) throw new AppError(401, 'UNAUTHORIZED', 'Tài khoản không còn tồn tại');

  const month = currentYearMonth();
  const { start, end } = monthDateRange(month);

  const [attendanceRecords, existingBill, bankConfig, billSummary] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: { studentId, date: { gte: start, lt: end } },
      orderBy: { date: 'asc' },
    }),
    prisma.tuitionBill.findUnique({ where: { studentId_month: { studentId, month } } }),
    prisma.bankConfig.findFirst(),
    computeBillSummary(prisma, studentId, month, student.class.pricePerSession),
  ]);

  const bill = {
    id: existingBill?.id ?? `bill-${studentId}-${month}`,
    studentId,
    classId: student.classId,
    month,
    pricePerSession: student.class.pricePerSession,
    totalAttendedSessions: billSummary.totalAttendedSessions,
    totalAmount: billSummary.totalAmount,
    attendedDates: billSummary.attendedDates,
    paidStatus: existingBill?.paidStatus ?? 'unpaid',
    paidDate: existingBill?.paidDate ? formatDateOnly(existingBill.paidDate) : null,
    note: existingBill?.note ?? null,
    receiptUrl: existingBill?.receiptUrl ?? null,
  };

  // KHÔNG bao giờ trả portalAccessCodeHash ra ngoài — kể cả cho chính học sinh sở hữu nó.
  const { class: _class, portalAccessCodeHash: _hash, ...studentPublic } = student;

  return {
    student: studentPublic,
    class: student.class,
    attendanceRecords: attendanceRecords.map((r) => ({ ...r, date: formatDateOnly(r.date) })),
    bill,
    bankConfig,
    month,
  };
}

// POST /api/portal/confirm-payment — verify billId thuộc đúng student trong token (không nhận
// studentId từ input dưới bất kỳ hình thức nào) rồi mới cho set paidStatus='paid'.
export async function confirmPayment(studentId: string, billId: string) {
  const bill = await prisma.tuitionBill.findUnique({ where: { id: billId } });
  // Cố ý trả cùng 1 lỗi 404 dù billId không tồn tại HAY thuộc học sinh khác — không tiết lộ
  // billId đó có tồn tại hay không cho người không sở hữu nó.
  if (!bill || bill.studentId !== studentId) {
    throw new AppError(404, 'BILL_NOT_FOUND', 'Không tìm thấy hoá đơn');
  }
  if (bill.paidStatus === 'paid') return bill;

  return prisma.tuitionBill.update({
    where: { id: billId },
    data: { paidStatus: 'paid', paidDate: new Date() },
  });
}
