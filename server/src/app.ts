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

app.use(express.json());
app.use(cors({ origin: env.FRONTEND_ORIGIN }));

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
