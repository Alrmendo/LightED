import { z } from 'zod';

// PUT /api/bills/:id/status — chỉ đổi paidStatus (+ note tuỳ chọn). KHÔNG cho sửa
// totalAttendedSessions/totalAmount qua route này — 2 field đó luôn do recalcBillsForStudent()
// tính lại từ điểm danh, sửa tay ở đây sẽ lệch khỏi điểm danh thật.
export const updateBillStatusSchema = z.object({
  paidStatus: z.enum(['unpaid', 'paid', 'partially_paid']),
  note: z.string().optional(),
});

// GET /api/bills?classId=...&month=YYYY-MM&studentId=... — mọi filter đều tuỳ chọn, bỏ trống
// filter nào thì không lọc theo field đó.
export const listBillsQuerySchema = z.object({
  classId: z.string().min(1, 'classId rỗng không hợp lệ').optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'month phải đúng định dạng YYYY-MM').optional(),
  studentId: z.string().min(1, 'studentId rỗng không hợp lệ').optional(),
});
