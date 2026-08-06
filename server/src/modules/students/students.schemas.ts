import { z } from 'zod';

// PUT thay toàn bộ resource (giống onUpdateStudent(updatedStudent: Student) ở frontend hiện tại)
// nên POST và PUT dùng chung 1 schema đầy đủ field.
export const studentSchema = z.object({
  name: z.string().min(1, 'Thiếu tên học sinh'),
  parentName: z.string().optional(),
  // Optional nhưng vẫn validate độ dài KHI CÓ giá trị — không thể chỉ thêm .optional() vào
  // z.string().min(8).max(15) vì frontend gửi '' (chuỗi rỗng) khi để trống, không phải
  // undefined, và '' vẫn bị .min(8) reject.
  phone: z
    .string()
    .optional()
    .refine((val) => !val || (val.length >= 8 && val.length <= 15), {
      message: 'Số điện thoại không hợp lệ',
    }),
  studentPhone: z.string().max(15, 'Số điện thoại không hợp lệ').optional(),
  classId: z.string().min(1, 'Thiếu classId'),
  email: z.string().optional(),
  avatar: z.string().optional(),
  dob: z.string().optional(),
  parentDob: z.string().optional(),
  parentOccupation: z.string().optional(),
  futureOrientation: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/students?classId=... — filter tuỳ chọn, bỏ trống thì trả toàn bộ học sinh.
export const listStudentsQuerySchema = z.object({
  classId: z.string().min(1, 'classId rỗng không hợp lệ').optional(),
});
