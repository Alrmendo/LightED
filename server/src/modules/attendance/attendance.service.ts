import type { Prisma, AttendanceStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/AppError';
import { formatDateOnly, monthDateRange, monthsInRange, parseDateOnly } from '../../utils/date';
import { recalcBillsForStudent } from '../bills/bills.service';

type Tx = Prisma.TransactionClient;

interface UpsertAttendanceInput {
  studentId: string;
  date: string; // "YYYY-MM-DD", đã validate format ở schema layer
  status: AttendanceStatus;
  note?: string;
  lessonTopic?: string;
  homework?: string;
}

// GET /api/attendance — danh sách điểm danh, filter tuỳ chọn theo classId/month/studentId (bỏ
// trống filter nào thì không lọc theo field đó, giống pattern GET /api/bills). Cần cho teacher
// dashboard hiển thị toàn bộ điểm danh của 1 lớp (AttendanceMatrix.tsx).
export async function listAttendance(filters: { classId?: string; month?: string; studentId?: string }) {
  const monthRange = filters.month ? monthDateRange(filters.month) : undefined;

  const records = await prisma.attendanceRecord.findMany({
    where: {
      ...(filters.classId ? { classId: filters.classId } : {}),
      ...(filters.studentId ? { studentId: filters.studentId } : {}),
      ...(monthRange ? { date: { gte: monthRange.start, lt: monthRange.end } } : {}),
    },
    orderBy: { date: 'asc' },
  });

  return records.map((r) => ({ ...r, date: formatDateOnly(r.date) }));
}

// PUT /api/attendance — upsert theo unique (studentId, date) đã có sẵn trong schema. classId
// LUÔN lấy theo lớp HIỆN TẠI của học sinh (không nhận classId từ client) — nhất quán với cách
// students.service.ts/bills.service.ts xác định "lớp đang áp dụng" cho 1 học sinh. Sau khi ghi
// điểm danh, recalc lại ĐÚNG bill của tháng chứa `date` đó (không đụng tới tháng khác).
export async function upsertAttendance(input: UpsertAttendanceInput) {
  const student = await prisma.student.findUnique({
    where: { id: input.studentId },
    include: { class: true },
  });
  if (!student) throw new AppError(400, 'STUDENT_NOT_FOUND', 'studentId không tồn tại');

  const date = parseDateOnly(input.date);
  const month = input.date.slice(0, 7);

  const record = await prisma.$transaction(async (tx) => {
    const record = await tx.attendanceRecord.upsert({
      where: { studentId_date: { studentId: input.studentId, date } },
      update: {
        status: input.status,
        note: input.note,
        lessonTopic: input.lessonTopic,
        homework: input.homework,
      },
      create: {
        studentId: input.studentId,
        classId: student.classId,
        date,
        status: input.status,
        note: input.note,
        lessonTopic: input.lessonTopic,
        homework: input.homework,
      },
    });

    await recalcBillsForStudent(tx, {
      studentId: student.id,
      classId: student.classId,
      month,
      pricePerSession: student.class.pricePerSession,
    });

    return record;
  });

  return { ...record, date: formatDateOnly(record.date) };
}

// POST /api/attendance/session-date — thêm 1 buổi học mới cho MỌI học sinh đang thuộc classId,
// mặc định status='present'. CHỈ tạo bản ghi cho học sinh CHƯA điểm danh ở ngày đó — không ghi
// đè trạng thái đã có sẵn (khớp hành vi handleAddClassSessionDate cũ ở frontend). Nhờ
// @@unique([studentId, date]) + skipDuplicates, gọi lại nhiều lần cùng classId+date không tạo
// bản ghi trùng — idempotent.
export async function addSessionDate(classId: string, dateStr: string) {
  const cls = await prisma.englishClass.findUnique({ where: { id: classId } });
  if (!cls) throw new AppError(400, 'CLASS_NOT_FOUND', 'classId không tồn tại');

  const students = await prisma.student.findMany({ where: { classId }, select: { id: true } });
  const date = parseDateOnly(dateStr);
  const month = dateStr.slice(0, 7);

  const createdSessionsCount = await prisma.$transaction(async (tx) => {
    let created = 0;
    if (students.length > 0) {
      const data: Prisma.AttendanceRecordCreateManyInput[] = students.map((s) => ({
        studentId: s.id,
        classId,
        date,
        status: 'present',
        lessonTopic: 'Bài giảng theo lịch',
      }));
      // createMany trả về { count } = số row THỰC SỰ được tạo (Prisma tự loại phần bị
      // skipDuplicates bỏ qua) — dùng số này cho createdSessionsCount, KHÔNG suy đoán bằng
      // students.length, để response phản ánh đúng có bao nhiêu bản ghi mới thật sự (vd gọi lại
      // lần 2 cùng classId+date thì createdSessionsCount phải là 0).
      const result = await tx.attendanceRecord.createMany({ data, skipDuplicates: true });
      created = result.count;
    }

    for (const s of students) {
      await recalcBillsForStudent(tx, {
        studentId: s.id,
        classId,
        month,
        pricePerSession: cls.pricePerSession,
      });
    }

    return created;
  });

  return { classId, date: dateStr, studentsCount: students.length, createdSessionsCount };
}

// Lõi dùng chung cho cả sync theo tháng (route thủ công) lẫn auto-sync theo startDate/endDate của
// lớp (classes.service.ts#createClass/updateClass). Sinh toàn bộ buổi học trong [startDate,
// endDateExclusive) dựa theo EnglishClass.daysOfWeek (vd T2/T4/T6), tạo attendance
// status='present' cho mọi học sinh đang thuộc classId ở từng ngày khớp lịch — CHỈ với (student,
// date) CHƯA có bản ghi, không ghi đè điểm danh đã có sẵn (idempotent — gọi lại nhiều lần cùng
// range không tạo bản ghi trùng, không đụng bản ghi đã sửa tay).
// Nhận `tx` từ NGOÀI truyền vào (không tự mở transaction riêng) để classes.service.ts có thể gọi
// hàm này bên trong transaction lưu lớp học của chính nó — cùng pattern recalcBillsForStudent(tx,
// ...) đang dùng.
export async function syncScheduleForRange(
  tx: Tx,
  classId: string,
  startDate: Date,
  endDateExclusive: Date
) {
  const cls = await tx.englishClass.findUnique({ where: { id: classId } });
  if (!cls) throw new AppError(400, 'CLASS_NOT_FOUND', 'classId không tồn tại');
  if (cls.daysOfWeek.length === 0) {
    throw new AppError(
      400,
      'CLASS_NO_SCHEDULE',
      'Lớp chưa cấu hình daysOfWeek để đồng bộ lịch học'
    );
  }

  const students = await tx.student.findMany({ where: { classId }, select: { id: true } });

  const dates: Date[] = [];
  for (let d = new Date(startDate); d < endDateExclusive; d.setUTCDate(d.getUTCDate() + 1)) {
    if (cls.daysOfWeek.includes(d.getUTCDay())) dates.push(new Date(d));
  }

  let createdSessionsCount = 0;
  if (students.length > 0 && dates.length > 0) {
    const data: Prisma.AttendanceRecordCreateManyInput[] = dates.flatMap((date) =>
      students.map((s) => ({
        studentId: s.id,
        classId,
        date,
        status: 'present',
        lessonTopic: 'Bài giảng theo lịch học',
      }))
    );
    // Xem chú thích tương tự ở addSessionDate() — createMany({ skipDuplicates: true }).count là
    // số bản ghi MỚI thật sự, dùng cho createdSessionsCount thay vì suy đoán.
    const result = await tx.attendanceRecord.createMany({ data, skipDuplicates: true });
    createdSessionsCount = result.count;
  }

  // monthsAffected tính trực tiếp từ range [startDate, endDateExclusive), KHÔNG lọc theo `dates`
  // sinh ra — giữ đúng hành vi bản cũ: recalc bill cho MỌI tháng nằm trong range bất kể lần gọi
  // này có sinh ngày mới hay không (vd đã có sẵn điểm danh thủ công/session lẻ trong tháng đó).
  const monthsAffected = monthsInRange(startDate, endDateExclusive);
  for (const s of students) {
    for (const month of monthsAffected) {
      await recalcBillsForStudent(tx, {
        studentId: s.id,
        classId,
        month,
        pricePerSession: cls.pricePerSession,
      });
    }
  }

  return {
    generatedDatesCount: dates.length,
    studentsCount: students.length,
    createdSessionsCount,
    monthsAffected,
  };
}

// POST /api/attendance/sync-schedule — bản đồng bộ thủ công theo 1 THÁNG (nút "Đồng bộ buổi dạy
// sang Điểm Danh" ở ClassManagement.tsx) — giữ nguyên hành vi & response shape cũ, chỉ implement
// lại bằng cách gọi syncScheduleForRange với range = monthDateRange(month) (đã đúng dạng [start,
// end) exclusive sẵn, không cần chỉnh) để không có 2 bản logic sinh ngày/recalc riêng biệt.
export async function syncSchedule(classId: string, month: string) {
  const { start, end } = monthDateRange(month);
  const result = await prisma.$transaction((tx) => syncScheduleForRange(tx, classId, start, end));
  return { classId, month, ...result };
}
