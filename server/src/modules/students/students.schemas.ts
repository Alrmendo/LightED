import { z } from 'zod';

// PUT thay toàn bộ resource (giống onUpdateStudent(updatedStudent: Student) ở frontend hiện tại)
// nên POST và PUT dùng chung 1 schema đầy đủ field.
export const studentSchema = z.object({
  name: z.string().min(1, 'Thiếu tên học sinh'),
  parentName: z.string().min(1, 'Thiếu tên phụ huynh'),
  phone: z.string().min(8, 'Số điện thoại không hợp lệ').max(15, 'Số điện thoại không hợp lệ'),
  classId: z.string().min(1, 'Thiếu classId'),
  email: z.string().optional(),
  avatar: z.string().optional(),
  dob: z.string().optional(),
  parentDob: z.string().optional(),
  parentOccupation: z.string().optional(),
  futureOrientation: z.string().optional(),
  notes: z.string().optional(),
});
