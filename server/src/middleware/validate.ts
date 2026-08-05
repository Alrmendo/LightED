import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

// Parse + validate req.body bằng zod, gán lại req.body với dữ liệu đã parse (đã strip field thừa).
// Lỗi ném ra là ZodError, được errorHandler.ts bắt và format thành 400 { error: { code, message, details } }.
export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}

// Tương tự validateBody nhưng cho query string (?classId=...&month=...). Trước đây các route
// list (GET /api/students, GET /api/bills) tự đọc req.query bằng `typeof x === 'string' ? x :
// undefined` — im lặng bỏ qua filter nếu client gửi sai kiểu (vd lặp param `?classId=a&classId=b`
// khiến Express parse thành mảng) thay vì báo lỗi rõ ràng như mọi input khác. Dùng zod ở đây để
// mọi input từ client (dù body hay query) đều đi qua cùng 1 con đường validate + cùng 1 format
// lỗi 400 VALIDATION_ERROR.
export function validateQuery(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as typeof req.query;
      next();
    } catch (err) {
      next(err);
    }
  };
}
