function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Thiếu biến môi trường bắt buộc: ${name}`);
  return value;
}

export const env = {
  JWT_SECRET: required('JWT_SECRET'),
  PORT: Number(process.env.PORT ?? 4000),
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
};
