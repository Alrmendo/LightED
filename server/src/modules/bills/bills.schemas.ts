import { z } from 'zod';

// PUT /api/bills/:id/status — chỉ đổi paidStatus (+ note tuỳ chọn). KHÔNG cho sửa
// totalAttendedSessions/totalAmount qua route này — 2 field đó luôn do recalcBillsForStudent()
// tính lại từ điểm danh, sửa tay ở đây sẽ lệch khỏi điểm danh thật.
export const updateBillStatusSchema = z.object({
  paidStatus: z.enum(['unpaid', 'paid', 'partially_paid']),
  note: z.string().optional(),
});
