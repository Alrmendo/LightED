import rateLimit from 'express-rate-limit';

// Factory thay vì 1 instance dùng chung — mỗi endpoint login (teacher/portal) có bộ đếm riêng,
// để brute-force PIN portal không ăn chung quota với login giáo viên và ngược lại.
export function createLoginRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: { code: 'RATE_LIMITED', message: 'Quá nhiều lần thử đăng nhập, vui lòng thử lại sau.' },
      });
    },
  });
}
