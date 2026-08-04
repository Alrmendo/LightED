import { Prisma } from '@prisma/client';

// Postgres SQLSTATE cho lỗi FK: 23503 = foreign_key_violation, 23001 = restrict_violation.
const POSTGRES_FK_CODES = new Set(['23503', '23001']);

// Prisma 7 + driver adapter (@prisma/adapter-pg) KHÔNG map lỗi DB thô về P2003 như engine cổ điển
// nữa — mọi lỗi không nhận diện được đều bọc chung thành P2039 kèm SQLSTATE gốc ở
// err.meta.driverAdapterError.cause.code. Phải kiểm tra cả 2 đường (P2003 để phòng hờ tương lai
// đổi engine, và SQLSTATE thật) mới bắt đúng lỗi "xoá 1 row đang bị row khác reference tới".
export function isForeignKeyConstraintError(err: unknown): boolean {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (err.code === 'P2003') return true;

  const meta = err.meta as { driverAdapterError?: { cause?: { code?: string } } } | undefined;
  const pgCode = meta?.driverAdapterError?.cause?.code;
  return typeof pgCode === 'string' && POSTGRES_FK_CODES.has(pgCode);
}

// P2002 = unique constraint violation.
export function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}
