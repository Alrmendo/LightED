import { z } from 'zod';

// PUT thay toàn bộ resource (giống onUpdateClass(updatedClass: EnglishClass) ở frontend hiện tại)
// nên POST và PUT dùng chung 1 schema đầy đủ field.
export const classSchema = z.object({
  name: z.string().min(1, 'Thiếu tên lớp'),
  teacherName: z.string().min(1, 'Thiếu tên giáo viên'),
  pricePerSession: z.number().int().positive('Học phí/buổi phải là số dương'),
  scheduleDays: z.string().min(1, 'Thiếu lịch học'),
  targetMonthSessions: z.number().int().positive('Số buổi/tháng phải là số dương'),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).default([]),
  scheduleTime: z.string().optional(),
  room: z.string().optional(),
});
