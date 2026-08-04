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
