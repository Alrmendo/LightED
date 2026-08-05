import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { authRouter } from './modules/auth/auth.routes';
import { classesRouter } from './modules/classes/classes.routes';
import { studentsRouter } from './modules/students/students.routes';
import { portalRouter } from './modules/portal/portal.routes';
import { attendanceRouter } from './modules/attendance/attendance.routes';
import { billsRouter } from './modules/bills/bills.routes';
import { bankConfigRouter } from './modules/bankConfig/bankConfig.routes';
import { errorHandler } from './middleware/errorHandler';
import { AppError } from './middleware/AppError';

// Lắp ráp Express app — KHÔNG listen ở đây, để server.ts (root) tự quyết định port/lifecycle.
const app = express();

// cors() PHẢI chạy TRƯỚC express.json() — nếu ngược lại, 1 request với body JSON không hợp lệ sẽ
// làm express.json() ném lỗi và nhảy thẳng tới errorHandler mà chưa qua cors() (middleware lỗi bỏ
// qua mọi middleware thường còn lại), khiến response 400 hợp lệ nhưng THIẾU header
// Access-Control-Allow-Origin — browser ở FRONTEND_ORIGIN sẽ thấy đây là lỗi CORS (network error
// mù mờ) thay vì đọc được message 400 rõ ràng.
app.use(cors({ origin: env.FRONTEND_ORIGIN }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/classes', classesRouter);
app.use('/api/students', studentsRouter);
app.use('/api/portal', portalRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/bills', billsRouter);
app.use('/api/bank-config', bankConfigRouter);

app.use((_req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', 'Không tìm thấy endpoint'));
});

app.use(errorHandler);

export default app;
