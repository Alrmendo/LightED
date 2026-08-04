import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from './AppError';

// Format lỗi thống nhất cho toàn bộ API: { error: { code, message, details? } }
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dữ liệu gửi lên không hợp lệ',
        details: err.flatten(),
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Lỗi hệ thống, vui lòng thử lại sau.' } });
}
