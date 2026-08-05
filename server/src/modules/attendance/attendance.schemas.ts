import { z } from 'zod';

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'date phải đúng định dạng YYYY-MM-DD');

const yearMonth = z
  .string()
  .regex(/^\d{4}-\d{2}$/, 'month phải đúng định dạng YYYY-MM');

export const attendanceStatusSchema = z.enum(['present', 'excused', 'unexcused', 'holiday']);

// PUT /api/attendance — upsert theo unique (studentId, date). classId KHÔNG nhận từ client, luôn
// suy ra từ lớp hiện tại của student (xem attendance.service.ts#upsertAttendance).
export const upsertAttendanceSchema = z.object({
  studentId: z.string().min(1, 'Thiếu studentId'),
  date: dateOnly,
  status: attendanceStatusSchema,
  note: z.string().optional(),
  lessonTopic: z.string().optional(),
  homework: z.string().optional(),
});

// POST /api/attendance/session-date
export const sessionDateSchema = z.object({
  classId: z.string().min(1, 'Thiếu classId'),
  date: dateOnly,
});

// POST /api/attendance/sync-schedule
export const syncScheduleSchema = z.object({
  classId: z.string().min(1, 'Thiếu classId'),
  month: yearMonth,
});

// GET /api/attendance?classId=...&month=YYYY-MM&studentId=... — mọi filter đều tuỳ chọn, bỏ trống
// filter nào thì không lọc theo field đó (giống pattern GET /api/bills).
export const listAttendanceQuerySchema = z.object({
  classId: z.string().min(1, 'classId rỗng không hợp lệ').optional(),
  month: yearMonth.optional(),
  studentId: z.string().min(1, 'studentId rỗng không hợp lệ').optional(),
});
