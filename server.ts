import 'dotenv/config';
import app from './server/src/app';
import { env } from './server/src/config/env';

// TODO (Phase sau): mount static dist/ (build Vite) khi build:server (esbuild bundle server.js)
// được triển khai — DoD Phase 1 đánh dấu bước này là optional, chưa cần làm.
app.listen(env.PORT, () => {
  console.log(`LightED server đang chạy tại http://localhost:${env.PORT}`);
});
