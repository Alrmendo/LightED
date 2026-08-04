import type { NextFunction, Request, RequestHandler, Response } from 'express';

// Express 4 không tự bắt promise reject trong route handler async — wrapper này forward lỗi
// sang errorHandler.ts qua next(err) thay vì làm crash process.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
