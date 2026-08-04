// Engine tính lại TuitionBill — dùng nội bộ bởi module classes/students (và sau này attendance).
// CHƯA có route /api/bills nào ở đây, route GET/PUT bills sẽ làm ở phase sau.
import type { Prisma } from '@prisma/client';
import { computeBillSummary } from './bills.utils';

type Tx = Prisma.TransactionClient;

interface RecalcTarget {
  studentId: string;
  classId: string;
  month: string;
  pricePerSession: number;
}

// Hàm lõi: tính lại đúng 1 bill (studentId, month) theo classId + pricePerSession truyền vào.
// Bất biến: bill đã paidStatus='paid' KHÔNG bao giờ bị sửa (xem server/README.md, quy tắc #1).
async function applyBillRecalc(tx: Tx, target: RecalcTarget) {
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

// Dùng khi tạo học sinh mới hoặc học sinh đổi lớp: tính lại bill của THÁNG được truyền vào
// (gọi với currentYearMonth() ở service layer) theo lớp HIỆN TẠI (mới nhất) của học sinh.
export async function recalcCurrentMonthBillForStudent(tx: Tx, studentId: string, month: string) {
  const student = await tx.student.findUnique({ where: { id: studentId }, include: { class: true } });
  if (!student) return;

  await applyBillRecalc(tx, {
    studentId: student.id,
    classId: student.classId,
    month,
    pricePerSession: student.class.pricePerSession,
  });
}

// Dùng khi EnglishClass.pricePerSession đổi: tính lại MỌI bill (mọi tháng) đang gắn với đúng
// classId này. Cố ý KHÔNG dựa vào lớp hiện tại của học sinh — 1 học sinh có thể đã chuyển lớp
// từ lúc đó, bill cũ vẫn phải phản ánh đúng lớp đã tính phí lúc đó. Bỏ qua bill đã paid.
export async function recalcBillsForClassPriceChange(tx: Tx, classId: string, newPricePerSession: number) {
  const bills = await tx.tuitionBill.findMany({
    where: { classId, paidStatus: { not: 'paid' } },
    select: { studentId: true, month: true },
  });

  for (const bill of bills) {
    await applyBillRecalc(tx, {
      studentId: bill.studentId,
      classId,
      month: bill.month,
      pricePerSession: newPricePerSession,
    });
  }
}
