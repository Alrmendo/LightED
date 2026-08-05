import fs from 'node:fs';
import path from 'node:path';
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

// Render (và mọi PaaS tương tự — Railway, Heroku...) đặt app sau 1 reverse proxy, request thật
// tới Express đi qua proxy nội bộ kèm header X-Forwarded-For. Thiếu dòng này, express-rate-limit
// (dùng cho 2 endpoint login) ném lỗi validation ngay khi thấy X-Forwarded-For mà trust proxy
// chưa bật (`ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`) — tức là login lỗi ngay sau khi deploy. `1`
// nghĩa là tin đúng 1 hop proxy ngay trước app (đúng kiến trúc Render), không tin xa hơn.
app.set('trust proxy', 1);

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

// Phục vụ static build của frontend (dist/, tạo bởi `vite build` — xem script "build" ở
// package.json). Thư mục này CHỈ tồn tại sau khi build production; ở dev thường ngày
// (`npm run dev` chạy Vite dev server riêng ở port 3000 + `npm run dev:server` chạy API riêng ở
// port 4000) thư mục không tồn tại — express.static() tự gọi next() khi không tìm thấy file,
// không ảnh hưởng gì tới luồng dev hiện có.
const distDir = path.resolve(process.cwd(), 'dist');
app.use(express.static(distDir));

// SPA fallback — mọi GET không khớp `/api/*` (đã xử lý ở trên) và không phải 1 file tĩnh có thật
// (đã bị express.static() ở trên "nuốt" nếu tồn tại) thì trả về index.html. App hiện không dùng
// client-side router (chỉ có 1 route "/", điều hướng tab bằng state nội bộ) nhưng fallback này
// vẫn cần để load "/" lần đầu ra đúng index.html thay vì rơi xuống 404 JSON bên dưới. Guard bằng
// `fs.existsSync` — nếu dist/ chưa build (dev-only chạy `dev:server` mà quên `vite build` trước)
// thì next() để rơi xuống 404 JSON như cũ, không throw ENOENT giữa chừng.
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  const indexPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexPath)) return next();
  res.sendFile(indexPath, (err) => {
    if (err) next(err);
  });
});

app.use((_req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', 'Không tìm thấy endpoint'));
});

app.use(errorHandler);

export default app;
