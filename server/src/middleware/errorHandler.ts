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

  // express.json() (body-parser) ném SyntaxError kèm status=400 + type='entity.parse.failed' khi
  // client gửi body không phải JSON hợp lệ — đây là lỗi CLIENT, không phải lỗi server, nên PHẢI
  // trả 400 theo cùng format { error: { code, message } } như mọi lỗi validate khác, không rơi
  // xuống nhánh 500 generic bên dưới (vốn chỉ dành cho lỗi thật sự không lường trước được).
  if (
    err instanceof SyntaxError &&
    (err as SyntaxError & { status?: number; type?: string }).status === 400 &&
    (err as SyntaxError & { status?: number; type?: string }).type === 'entity.parse.failed'
  ) {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Body gửi lên không phải JSON hợp lệ' },
    });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Lỗi hệ thống, vui lòng thử lại sau.' } });
}
