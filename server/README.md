# LightED Backend

Trạng thái hiện tại: **Phase 2 — schema/migration/seed (Phase 1) + module `auth`, `classes`, `students`, `portal`**. Module `attendance` và `bills` (route GET/PUT thật cho giáo viên) + `bankConfig` (route CRUD) chưa làm.

## Setup

1. Cần Postgres chạy sẵn (local hoặc Neon). Tạo `.env` ở root project:
   ```
   DATABASE_URL="postgresql://user:pass@host:5432/dbname?schema=public"
   SEED_TEACHER_EMAIL="teacher@lighted.local"
   SEED_TEACHER_PASSWORD="..."
   PORT=4000
   FRONTEND_ORIGIN="http://localhost:3000"
   JWT_SECRET="<chuỗi random dài, vd: openssl rand -hex 48>"
   ```
2. Cài dependencies: `npm install`
3. Migrate: `npm run db:migrate`
4. Seed: `npm run db:seed` (idempotent — chạy lại nhiều lần không tạo trùng dữ liệu)
5. Chạy server: `npm run dev:server` — mặc định lắng nghe tại `http://localhost:4000`

Schema nằm ở `server/prisma/schema.prisma`. Cấu hình Prisma CLI (đường dẫn schema, migrations, seed command) nằm ở `prisma.config.ts` tại root — **Prisma 7 không cho khai báo `url` ngay trong `schema.prisma` nữa**, và `PrismaClient` runtime bắt buộc phải nhận driver adapter tường minh (không tự đọc `DATABASE_URL` như bản cũ). Do đó:
- `prisma.config.ts` cung cấp `datasource.url` cho riêng CLI (migrate/seed/studio).
- Runtime code (seed script, và route API ở Phase 2) phải import `prisma` từ `server/src/config/prisma.ts` — nơi duy nhất khởi tạo `PrismaClient` với `@prisma/adapter-pg`. Không tạo `new PrismaClient()` trực tiếp ở nơi khác.

## Quy tắc nghiệp vụ quan trọng (áp dụng khi viết route ở Phase 2)

**1. Bill đã `paid` là bất biến.**
Mọi job tự động tính lại `TuitionBill` (khi điểm danh đổi, khi `EnglishClass.pricePerSession` đổi, khi học sinh chuyển lớp...) PHẢI bỏ qua bill có `paidStatus = 'paid'`. Chỉ recalc bill đang `unpaid` hoặc `partially_paid`. Không được sửa hồi tố một bill đã thanh toán.

**2. "Tháng hiện tại" = ngày thực tế trên server.**
Khi tạo bill mới cho học sinh mới hoặc học sinh vừa đổi lớp, "tháng hiện tại" nghĩa là tháng theo `new Date()` tại thời điểm server xử lý request — format `"YYYY-MM"` — KHÔNG lấy theo tham số client gửi lên và không suy ra từ `selectedMonth` phía frontend.

**3. `TuitionBill.month` dùng format chuẩn hoá `"YYYY-MM"`.**
Đây là quyết định có chủ đích khác với frontend hiện tại (`Navbar.tsx` đang dùng label `"THÁNG 5"` không có năm). Phase 2 sẽ cần cập nhật Navbar để gửi đúng format này khi gọi API.

**4. `TuitionBill.totalAttendedSessions` chỉ đếm điểm danh (`status='present'`) trong đúng `month` của bill đó** — không cộng dồn all-time như bug hiện tại của `App.tsx` (`recalculateBills` cũ không lọc theo tháng).

## Seed data

Tương đương `src/data/mockData.ts`, seed cho "Tháng 5/2026" (`month = "2026-05"`):
- 1 `TeacherAccount` (email/password từ env)
- 4 `EnglishClass`, 8 `Student`, ~76 `AttendanceRecord`, 8 `TuitionBill`, 1 `BankConfig`
- Mỗi học sinh có PIN portal demo `123456` (`portalAccessEnabled=true`) để test `/api/auth/portal/login` — chỉ dùng cho dev local, không phải giá trị production.

## Auth API (`/api/auth`)

Mọi response lỗi có format `{ "error": { "code", "message", "details"? } }`. 2 endpoint login có rate limit riêng: tối đa 10 lần/15 phút/IP (đếm độc lập giữa 2 endpoint), vượt quá trả `429 RATE_LIMITED`.

```bash
# 1. Teacher login (dùng SEED_TEACHER_EMAIL / SEED_TEACHER_PASSWORD trong .env)
curl -s -X POST http://localhost:4000/api/auth/teacher/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@lighted.local","password":"ChangeMe123!"}'
# -> { "token": "..." }

# 2. Teacher login sai mật khẩu -> 401 INVALID_CREDENTIALS
curl -s -X POST http://localhost:4000/api/auth/teacher/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@lighted.local","password":"sai"}'

# 3. Portal login (mọi học sinh seed đều có PIN demo 123456)
curl -s -X POST http://localhost:4000/api/auth/portal/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"0988123456","accessCode":"123456"}'
# -> { "token": "..." }

# 4. Portal login sai PIN -> 401 INVALID_CREDENTIALS
curl -s -X POST http://localhost:4000/api/auth/portal/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"0988123456","accessCode":"000000"}'

# 5. Lấy profile theo token hiện tại (thay $TOKEN bằng token ở bước 1 hoặc 3)
curl -s http://localhost:4000/api/auth/me -H "Authorization: Bearer $TOKEN"

# 6. Gọi /me không kèm token -> 401 UNAUTHORIZED
curl -s http://localhost:4000/api/auth/me
```

Lưu vào biến để test nhanh:
```bash
TEACHER_TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/teacher/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@lighted.local","password":"ChangeMe123!"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).token")

PORTAL_TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/portal/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"0988123456","accessCode":"123456"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).token")

curl -s http://localhost:4000/api/auth/me -H "Authorization: Bearer $TEACHER_TOKEN"
curl -s http://localhost:4000/api/auth/me -H "Authorization: Bearer $PORTAL_TOKEN"
```

### Middleware dùng cho route ở Phase sau

`server/src/middleware/auth.ts` export:
- `requireAuth` — verify JWT, gắn `req.user = { role, teacherId? | studentId? }`
- `requireRole('TEACHER')` — đặt sau `requireAuth`, chặn 403 nếu không đúng role
- `requirePortalOwnership` — đặt sau `requireAuth`, dùng cho mọi route `/api/portal/*`; luôn lấy `studentId` từ `req.user` (token đã verify), không bao giờ nhận `studentId` từ params/query/body của client.

### Lưu ý khi đăng nhập portal

`Student.phone` không unique trong schema (2 anh chị em có thể dùng chung SĐT phụ huynh) — `loginPortal` trong `auth.service.ts` thử `accessCode` với tất cả học sinh khớp SĐT đó thay vì chỉ lấy 1 record đầu tiên, để tránh login sai học sinh khi có SĐT trùng.

### JWT hết hạn sau bao lâu?

`7 ngày` (`TOKEN_EXPIRES_IN` trong `auth.service.ts`), áp dụng cho cả 2 role. Đây KHÔNG phải giá trị đề bài yêu cầu cụ thể — chỉ là default hợp lý cho 1 app quản lý nội bộ 1 giáo viên + phụ huynh tra cứu không thường xuyên, đổi được bất kỳ lúc nào bằng cách sửa hằng số này (vd rút ngắn riêng cho TEACHER nếu muốn giới hạn quyền admin chặt hơn PORTAL).

### Không log password/PIN — xác nhận

Không có middleware log request nào (không cài `morgan`/tương đương). Nơi duy nhất server tự in ra console là:
- `errorHandler.ts`: `console.error(err)` — CHỈ chạy khi gặp lỗi 500 không xác định (nhánh `AppError`/`ZodError` return sớm trước dòng này), và chỉ log đối tượng `Error`, không log `req`/`req.body`.
- `seed.ts`: in PIN demo cố định `123456` (hằng số dev-only, không phải secret thật) và nhắc rằng mật khẩu teacher nằm trong `.env` — KHÔNG in giá trị mật khẩu thật ra console.
- `resetAccessCode()` trả PIN plaintext 1 lần trong response JSON (đúng theo mục 5 đề bài — giáo viên cần thấy để gửi phụ huynh) nhưng không ghi log, không lưu plaintext ở đâu cả — chỉ lưu bcrypt hash.

## Classes & Students API (`/api/classes`, `/api/students`) — teacher-only

Toàn bộ route dưới đây yêu cầu `Authorization: Bearer <TEACHER_TOKEN>` (`requireAuth` + `requireRole('TEACHER')`).

```bash
TEACHER_TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/teacher/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@lighted.local","password":"ChangeMe123!"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).token")

# Classes
curl -s http://localhost:4000/api/classes -H "Authorization: Bearer $TEACHER_TOKEN"

curl -s -X POST http://localhost:4000/api/classes \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{"name":"IELTS Foundation","teacherName":"Co Lan","pricePerSession":350000,"scheduleDays":"Thu 7","targetMonthSessions":4,"daysOfWeek":[6]}'

curl -s -X PUT http://localhost:4000/api/classes/class-ab01 \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{"name":"AB01","teacherName":"Henry","pricePerSession":320000,"scheduleDays":"Thu 2 - Thu 4","targetMonthSessions":8,"daysOfWeek":[1,3]}'
# -> tự động recalc mọi bill (mọi tháng) của class-ab01 đang KHÔNG paid theo giá mới; bill đã paid giữ nguyên

curl -s -X DELETE http://localhost:4000/api/classes/class-ab01 -H "Authorization: Bearer $TEACHER_TOKEN"
# -> 409 CLASS_HAS_STUDENTS vì class-ab01 đang có học sinh

# Students
curl -s "http://localhost:4000/api/students?classId=class-ab01" -H "Authorization: Bearer $TEACHER_TOKEN"

curl -s -X POST http://localhost:4000/api/students \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{"name":"Hoc Sinh Moi","parentName":"Chi Test","phone":"0900000001","classId":"class-ab01"}'
# -> tự tạo TuitionBill tháng hiện tại (0 buổi, 0 đồng, unpaid)

curl -s -X PUT http://localhost:4000/api/students/std-102 \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{"name":"Tran Hoang Nam","parentName":"Anh Tuan","phone":"0912345678","classId":"class-ab02"}'
# -> đổi classId khác classId cũ -> tự recalc bill tháng hiện tại theo lớp mới

curl -s -X POST http://localhost:4000/api/students/std-101/access-code -H "Authorization: Bearer $TEACHER_TOKEN"
# -> { "accessCode": "123456" } — plaintext trả 1 LẦN DUY NHẤT, chỉ lưu bcrypt hash trong DB

curl -s -X POST http://localhost:4000/api/students/std-101/access-code/revoke -H "Authorization: Bearer $TEACHER_TOKEN"
# -> 204, portalAccessEnabled=false

curl -s -X DELETE http://localhost:4000/api/students/std-101 -H "Authorization: Bearer $TEACHER_TOKEN"
# -> 409 STUDENT_HAS_HISTORY vì std-101 đã có AttendanceRecord/TuitionBill
```

### Quyết định thiết kế: DELETE bị chặn khi có lịch sử (khác hành vi frontend hiện tại)

`DELETE /api/classes/:id` và `DELETE /api/students/:id` dựa vào FK `ON DELETE RESTRICT` sẵn có trong schema (không đổi schema) — nếu class đang có học sinh, hoặc student đã có `AttendanceRecord`/`TuitionBill`, API trả `409` thay vì xoá. `App.tsx` hiện tại (`handleDeleteClass`, `handleDeleteStudent`) xoá vô điều kiện khỏi mảng local, không có ràng buộc này — Phase 2 (nối dây frontend) sẽ cần xử lý case 409 này (hiện toast lỗi) thay vì luôn assume xoá thành công. Lý do chọn "chặn" thay vì "cascade xoá lịch sử điểm danh/học phí": đây là hệ thống ghi nhận học phí, xoá âm thầm dữ liệu tài chính là rủi ro cao hơn nhiều so với việc giáo viên phải xử lý thủ công trước khi xoá.

### Lưu ý ngầm khi đổi giá lớp (`PUT /api/classes/:id`)

Recalc dựa theo `TuitionBill.classId` (lớp đã tính phí lúc đó), KHÔNG dựa theo lớp hiện tại của học sinh — nếu 1 học sinh đã chuyển sang lớp khác, bill cũ của họ vẫn thuộc lớp cũ và không bị ảnh hưởng bởi việc đổi giá ở lớp mới.

## Portal API (`/api/portal`) — role PORTAL, scope theo đúng student trong token

Yêu cầu `Authorization: Bearer <PORTAL_TOKEN>` (`requireAuth` + `requirePortalOwnership`). Không route nào nhận `studentId` từ client — luôn lấy từ `req.user.studentId` (token đã verify).

```bash
PORTAL_TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/portal/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"0988123456","accessCode":"123456"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).token")

curl -s http://localhost:4000/api/portal/me -H "Authorization: Bearer $PORTAL_TOKEN"
# -> { student, class, attendanceRecords, bill, bankConfig, month } — bill là THÁNG HIỆN TẠI
# (server date, không phải input), student KHÔNG bao giờ có field portalAccessCodeHash

curl -s -X POST http://localhost:4000/api/portal/confirm-payment \
  -H "Content-Type: application/json" -H "Authorization: Bearer $PORTAL_TOKEN" \
  -d '{"billId":"<id lấy từ bill.id ở GET /me>"}'
# -> set paidStatus='paid'. billId không tồn tại HOẶC không thuộc student trong token -> cùng 1 lỗi
# 404 BILL_NOT_FOUND (cố ý không phân biệt 2 case để không lộ billId có tồn tại hay không)

curl -s http://localhost:4000/api/portal/me -H "Authorization: Bearer $TEACHER_TOKEN"
# -> 403 FORBIDDEN — requirePortalOwnership chặn token role TEACHER
```

### QUAN TRỌNG cho Giai đoạn 4 (module `attendance` + `bills` route thật) — đọc trước khi code

`GET /api/portal/me` tính `totalAttendedSessions`/`totalAmount`/`attendedDates` bằng `computeBillSummary()` ở **`server/src/modules/bills/bills.utils.ts`** — hàm DUY NHẤT tính "điểm danh present trong tháng → số buổi + tiền + danh sách ngày". `bills.service.ts` (`applyBillRecalc`, phần lõi của `recalcCurrentMonthBillForStudent`/`recalcBillsForClassPriceChange` đã dùng ở classes/students) cũng đã refactor để gọi lại đúng hàm này thay vì tự đếm riêng.

**Khi làm Giai đoạn 4** (`GET /api/bills`, `PUT /api/bills/:id/status`, và trigger recalc mới khi điểm danh đổi ở module `attendance`): PHẢI tiếp tục gọi `computeBillSummary()` cho mọi chỗ cần "tính bill từ điểm danh" — tuyệt đối không viết lại 1 bản đếm/tính tiền khác ở `bills.routes.ts`/`attendance.service.ts`. Nếu có logic mới cần thêm (vd định dạng khác cho response), mở rộng `computeBillSummary()`/thêm hàm mới cạnh nó trong `bills.utils.ts`, không tách riêng.

### Thiết kế `GET /api/portal/me`: số liệu bill luôn tính "live", không tin tưởng tuyệt đối cột đã lưu

`totalAttendedSessions`/`totalAmount`/`attendedDates` tính lại real-time từ `AttendanceRecord` mỗi lần gọi (qua `computeBillSummary`), KHÔNG lấy trực tiếp từ cột đã lưu trong `TuitionBill` — để hiển thị luôn đúng ngay cả khi lỡ có 1 trigger recalc nào đó bị bỏ sót. `paidStatus`/`paidDate`/`note`/`receiptUrl` thì lấy từ row `TuitionBill` đã lưu (mặc định `unpaid`/`null` nếu bill tháng này chưa từng được tạo — vd học sinh mới, hoặc điểm danh vừa được thêm nhưng chưa có trigger recalc nào chạy qua để tạo row bill tương ứng — trường hợp này `bill.id` sẽ là 1 chuỗi placeholder `bill-<studentId>-<month>` chứ không phải id thật trong DB, và gọi `confirm-payment` với id đó sẽ trả `404` vì chưa có gì để xác nhận thanh toán).
