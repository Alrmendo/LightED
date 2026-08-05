import { z } from 'zod';

// PUT thay toàn bộ resource — chỉ có đúng 1 row cấu hình ngân hàng cho cả trung tâm, không có
// POST riêng (route GET/PUT tự upsert theo id cố định, xem bankConfig.service.ts).
export const bankConfigSchema = z.object({
  bankId: z.string().min(1, 'Thiếu bankId'),
  bankName: z.string().min(1, 'Thiếu tên ngân hàng'),
  accountNumber: z.string().min(1, 'Thiếu số tài khoản'),
  accountHolder: z.string().min(1, 'Thiếu tên chủ tài khoản'),
  centerName: z.string().min(1, 'Thiếu tên trung tâm'),
  teacherName: z.string().min(1, 'Thiếu tên giáo viên'),
});
