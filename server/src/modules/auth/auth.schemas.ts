import { z } from 'zod';

export const teacherLoginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Thiếu mật khẩu'),
});

export const portalLoginSchema = z.object({
  phone: z.string().min(8, 'Số điện thoại không hợp lệ').max(15, 'Số điện thoại không hợp lệ'),
  accessCode: z
    .string()
    .length(6, 'Mã truy cập phải gồm đúng 6 chữ số')
    .regex(/^\d{6}$/, 'Mã truy cập phải gồm đúng 6 chữ số'),
});
