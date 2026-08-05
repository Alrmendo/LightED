import 'dotenv/config';
import app from './server/src/app';
import { env } from './server/src/config/env';

// Entry point production: `npm run build` bundle file này (+ toàn bộ server/src/**) thành
// server.js ở root qua esbuild (xem script "build:server" ở package.json), app.ts tự phục vụ
// static dist/ (frontend đã build) song song với API trong CÙNG 1 process — đúng kiến trúc single
// Web Service trên Render (không cần 2 service riêng frontend/backend).
app.listen(env.PORT, () => {
  console.log(`LightED server đang chạy tại http://localhost:${env.PORT}`);
});
