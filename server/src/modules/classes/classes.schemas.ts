import { z } from 'zod';

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'date phải đúng định dạng YYYY-MM-DD');

// PUT thay toàn bộ resource (giống onUpdateClass(updatedClass: EnglishClass) ở frontend hiện tại)
// nên POST và PUT dùng chung 1 schema đầy đủ field.
// startDate optional — trống thì không auto-sync điểm danh (xem classes.service.ts#maybeAutoSync).
// KHÔNG nhận endDate thô từ client nữa — endDate giờ LUÔN do backend tự tính từ totalSessions (xem
// classes.service.ts#toPrismaData + date.ts#calculateEndDateFromSessions), client chỉ gửi
// totalSessions?: number (mode "Số buổi học") hoặc bỏ trống (mode "Dài hạn"). max(2000) chặn input
// bất thường khiến calculateEndDateFromSessions lặp quá lâu.
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
    totalSessions: z.number().int().positive('Số buổi phải là số dương').max(2000, 'Số buổi tối đa 2000').optional(),
  })
  .refine((data) => !data.totalSessions || (data.startDate && data.daysOfWeek.length > 0), {
    message: 'Cần có Ngày Bắt Đầu và cấu hình Ngày Dạy Trong Tuần để tính theo Số Buổi Học',
    path: ['totalSessions'],
  });
