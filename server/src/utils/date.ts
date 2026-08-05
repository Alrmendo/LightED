// "Tháng hiện tại" theo ngày thực tế trên server — xem quy tắc #2 trong server/README.md.
export function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// [start, end) — end là ngày 1 của tháng kế tiếp, dùng cho query `date: { gte: start, lt: end }`.
export function monthDateRange(month: string): { start: Date; end: Date } {
  const [year, monthNum] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, monthNum - 1, 1));
  const end = new Date(Date.UTC(year, monthNum, 1));
  return { start, end };
}

// Format 1 Date (cột kiểu @db.Date, Prisma trả về Date object) thành đúng chuỗi "YYYY-MM-DD" mà
// frontend dùng — KHÔNG để res.json() tự serialize Date thành ISO string kèm giờ, vì
// parseDateToDDMM() ở frontend (src/utils/vietqr.ts) split('-') giả định đúng 3 phần YYYY/MM/DD.
export function formatDateOnly(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

// Chiều ngược lại formatDateOnly(): parse chuỗi "YYYY-MM-DD" (đã validate format bằng zod ở
// schema layer) thành Date UTC thuần ngày để ghi vào cột @db.Date — KHÔNG dùng `new Date(str)`
// trực tiếp vì cách JS/Node parse chuỗi đó phụ thuộc runtime, dễ lệch múi giờ.
export function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}
