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

// Cộng thêm `days` ngày (UTC thuần ngày, không giờ) — dùng để đổi 1 mốc ngày INCLUSIVE (vd
// EnglishClass.endDate — ngày cuối cùng lớp còn dạy) sang dạng EXCLUSIVE mà
// syncScheduleForRange/monthDateRange đang dùng ([start, end)): addDays(endDate, 1).
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

// Liệt kê mọi tháng "YYYY-MM" nằm trong [start, endExclusive) — dùng để xác định TẤT CẢ tháng bị
// ảnh hưởng bởi 1 khoảng ngày (syncScheduleForRange), để recalc bill đúng cho từng tháng đó thay
// vì chỉ 1 `month` cố định như syncSchedule(month) bản cũ.
export function monthsInRange(start: Date, endExclusive: Date): string[] {
  const months: string[] = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  while (cursor < endExclusive) {
    months.push(`${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}`);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

// Tính ngày buổi học CUỐI CÙNG (inclusive) khi lớp có tổng số buổi cố định — đếm dần từ
// `startDate` (tính luôn ngày đó nếu khớp daysOfWeek) tới khi đủ `totalSessions` ngày khớp
// daysOfWeek. Dùng cho classes.service.ts#toPrismaData khi giáo viên chọn mode "Số buổi học"
// thay vì tự nhập endDate.
// Precondition (đảm bảo bởi caller, KHÔNG tự check ở đây để hàm thuần/dễ test — xem
// classes.schemas.ts refine): daysOfWeek không rỗng và totalSessions > 0. Gọi hàm này với
// daysOfWeek=[] sẽ khiến vòng lặp không bao giờ thoát.
export function calculateEndDateFromSessions(
  startDate: Date,
  daysOfWeek: number[],
  totalSessions: number
): Date {
  const cursor = new Date(startDate);
  let count = 0;
  while (count < totalSessions) {
    if (daysOfWeek.includes(cursor.getUTCDay())) {
      count++;
      if (count === totalSessions) return new Date(cursor);
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return cursor;
}
