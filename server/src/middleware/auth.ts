import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './AppError';

export type AuthRole = 'TEACHER' | 'PORTAL';

export interface AuthTokenPayload {
  role: AuthRole;
  teacherId?: string;
  studentId?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

// Verify JWT từ header `Authorization: Bearer <token>`, gắn payload vào req.user.
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHORIZED', 'Thiếu token xác thực');
  }

  const token = header.slice('Bearer '.length);
  try {
    req.user = jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
    next();
  } catch {
    throw new AppError(401, 'UNAUTHORIZED', 'Token không hợp lệ hoặc đã hết hạn');
  }
}

// Đặt SAU requireAuth. Chặn mọi route quản trị nếu không đúng role yêu cầu.
export function requireRole(role: AuthRole) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (req.user?.role !== role) {
      throw new AppError(403, 'FORBIDDEN', 'Không có quyền truy cập');
    }
    next();
  };
}

// Đặt SAU requireAuth, dùng cho mọi route /api/portal/*. KHÔNG nhận studentId từ client input
// dưới bất kỳ hình thức nào (params/query/body) — luôn lấy từ token đã verify, để 1 phụ huynh
// không thể sửa studentId trong request để xem/đổi dữ liệu của học sinh khác.
export function requirePortalOwnership(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== 'PORTAL' || !req.user.studentId) {
    throw new AppError(403, 'FORBIDDEN', 'Chỉ tài khoản phụ huynh/học sinh mới truy cập được');
  }
  next();
}
