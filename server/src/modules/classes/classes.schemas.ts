import { z } from 'zod';

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'date phải đúng định dạng YYYY-MM-DD');

// PUT thay toàn bộ resource (giống onUpdateClass(updatedClass: EnglishClass) ở frontend hiện tại)
// nên POST và PUT dùng chung 1 schema đầy đủ field.
// startDate/endDate optional — trống thì không auto-sync điểm danh (xem
// classes.service.ts#maybeAutoSync). refine endDate >= startDate: so sánh string "YYYY-MM-DD" là
// đủ vì cùng định dạng cố định độ dài, thứ tự lexicographic khớp thứ tự thời gian.
export const classSchema = z
  .object({
    name: z.string().min(1, 'Thiếu tên lớp'),
    teacherName: z.string().min(1, 'Thiếu tên giáo viên'),
    pricePerSession: z.number().int().positive('Học phí/buổi phải là số dương'),
    scheduleDays: z.string().min(1, 'Thiếu lịch học'),
    targetMonthSessions: z.number().int().positive('Số buổi/tháng phải là số dương'),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).default([]),
    scheduleTime: z.string().optional(),
    room: z.string().optional(),
    startDate: dateOnly.optional(),
    endDate: dateOnly.optional(),
  })
  .refine((data) => !data.startDate || !data.endDate || data.endDate >= data.startDate, {
    message: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu',
    path: ['endDate'],
  });
