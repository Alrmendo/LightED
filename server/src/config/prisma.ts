// Prisma 7 bỏ hẳn việc tự đọc `datasource.url` từ schema — PrismaClient bắt buộc phải nhận
// 1 driver adapter tường minh khi khởi tạo (xem https://pris.ly/d/driver-adapters).
// File này là nguồn khởi tạo PrismaClient duy nhất, dùng chung cho seed script và toàn bộ
// route ở Phase 2, để không lặp lại logic tạo adapter ở nhiều nơi.
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL chưa được set trong .env');
}

const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });
