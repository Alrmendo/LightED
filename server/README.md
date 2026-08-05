# LightED Backend

Trạng thái hiện tại: **Phase 2 — schema/migration/seed (Phase 1) + module `auth`, `classes`, `students`, `portal`, `attendance`, `bills`, `bankConfig`** — toàn bộ mục 5/6 kế hoạch đã có route thật.

## Setup — chạy từ đầu (clone mới hoàn toàn)

### Yêu cầu môi trường

- Node.js 20+ (dự án dùng Node v24 khi phát triển; `tsx` chạy trực tiếp TypeScript, không cần build tay).
- Postgres chạy sẵn — local (vd Postgres cài trên máy, port mặc định 5432) hoặc cloud (vd [Neon](https://neon.tech), free tier là đủ cho dev). Chỉ cần 1 connection string.

### Các bước

1. **Clone + cài dependencies** (chạy ở thư mục gốc repo, KHÔNG phải trong `server/`):
   ```bash
   npm install
   ```
   `npm install` KHÔNG tự generate Prisma Client (không có `postinstall` hook) — Client sẽ được generate tự động ở bước 3 (`prisma migrate dev` luôn generate lại sau khi migrate xong). Nếu chỉ cần generate lại Client mà không đổi schema (vd sau khi checkout branch khác), chạy riêng `npm run db:generate`.

2. **Tạo file `.env` ở thư mục gốc repo** (cùng cấp `package.json`, KHÔNG phải trong `server/`) với đúng các biến sau:
   ```bash
   # Bắt buộc — connection string Postgres, phải có quyền tạo/sửa bảng để chạy migration
   DATABASE_URL="postgresql://user:pass@host:5432/dbname?schema=public"

   # Bắt buộc — tài khoản giáo viên duy nhất, seed.ts dùng để tạo/upsert TeacherAccount
   SEED_TEACHER_EMAIL="teacher@lighted.local"
   SEED_TEACHER_PASSWORD="ChangeMe123!"

   # Bắt buộc — bí mật ký JWT, PHẢI là chuỗi dài ngẫu nhiên, không dùng giá trị mẫu ở prod
   JWT_SECRET="<chuỗi random dài, vd: openssl rand -hex 48>"

   # Tuỳ chọn — có default hợp lý nếu bỏ trống (xem server/src/config/env.ts)
   PORT=4000                                # default: 4000
   FRONTEND_ORIGIN="http://localhost:3000"  # default: http://localhost:3000 — phải khớp origin FE thật để CORS không chặn
   ```
   Thiếu `DATABASE_URL`/`JWT_SECRET` sẽ làm server crash ngay lúc khởi động với message rõ ràng (`config/env.ts`/`config/prisma.ts`) — không fail âm thầm.

3. **Migrate** (tạo toàn bộ bảng theo `server/prisma/schema.prisma`, đồng thời tự generate Prisma Client):
   ```bash
   npm run db:migrate
   ```
   Lần đầu chạy trên DB trống sẽ apply toàn bộ migration có sẵn trong `server/prisma/migrations/`. Nếu chỉ muốn kiểm tra trạng thái migration mà không apply gì, dùng `npx prisma migrate status`.

4. **Seed dữ liệu mẫu** (idempotent — chạy lại nhiều lần không tạo trùng bản ghi, dùng `upsert` theo ID cố định):
   ```bash
   npm run db:seed
   ```
   Tạo sẵn: 1 `TeacherAccount` (email/password lấy từ `.env` ở bước 2), 4 `EnglishClass`, 8 `Student` (mỗi HS có PIN portal demo `123456`), ~76 `AttendanceRecord`, 8 `TuitionBill`, 1 `BankConfig`. Xem chi tiết ở mục "Seed data" bên dưới.

5. **Chạy server**:
   ```bash
   npm run dev:server
   ```
   `tsx watch server.ts` — tự restart khi sửa code. Thấy log `LightED server đang chạy tại http://localhost:4000` nghĩa là đã chạy đúng. Nếu gặp lỗi `EADDRINUSE: address already in use :::4000`, nghĩa là đã có 1 instance server khác (vd từ lần chạy trước chưa tắt) đang giữ port 4000 — tắt process đó trước (hoặc đổi `PORT` trong `.env`).

6. **Kiểm tra nhanh (smoke test)** — login teacher bằng đúng email/password vừa set ở bước 2:
   ```bash
   curl -s -X POST http://localhost:4000/api/auth/teacher/login \
     -H "Content-Type: application/json" \
     -d '{"email":"teacher@lighted.local","password":"ChangeMe123!"}'
   # -> { "token": "..." } nghĩa là DB + migrate + seed + server đều đã đúng
   ```
   Nếu muốn chạy song song cả frontend (Vite, không bắt buộc để test riêng backend), ở 1 terminal khác chạy `npm run dev` (thư mục gốc) — mặc định lắng nghe `http://localhost:3000`, phải khớp `FRONTEND_ORIGIN` ở bước 2 để CORS không chặn.

### Reset lại DB dev về trạng thái sạch

Nếu DB dev bị lệch dữ liệu do tự test API (vd đổi giá lớp, đổi trạng thái bill...) và muốn quay lại đúng seed ban đầu — **destructive, chỉ dùng cho DB dev local, KHÔNG chạy trên DB có dữ liệu thật**:
```bash
npx prisma migrate reset
```
Drop toàn bộ bảng, apply lại migration từ đầu, rồi tự động chạy lại seed.

### Kiến trúc Prisma 7 — vì sao có 2 chỗ cấu hình DB riêng biệt

Schema nằm ở `server/prisma/schema.prisma`. Cấu hình Prisma CLI (đường dẫn schema, migrations, seed command) nằm ở `prisma.config.ts` tại root — **Prisma 7 không cho khai báo `url` ngay trong `schema.prisma` nữa**, và `PrismaClient` runtime bắt buộc phải nhận driver adapter tường minh (không tự đọc `DATABASE_URL` như bản cũ). Do đó:
- `prisma.config.ts` cung cấp `datasource.url` cho riêng CLI (migrate/seed/studio).
- Runtime code (seed script, và mọi route API) phải import `prisma` từ `server/src/config/prisma.ts` — nơi duy nhất khởi tạo `PrismaClient` với `@prisma/adapter-pg`. Không tạo `new PrismaClient()` trực tiếp ở nơi khác.

## Validate zod + format lỗi đồng nhất — kết quả rà soát toàn repo

Đã rà lại toàn bộ route hiện có (`auth`, `classes`, `students`, `portal`, `attendance`, `bills`, `bankConfig`). Kết luận + những chỗ đã sửa:

**Validate zod — đã đủ cho mọi input nhận từ client:**
- Mọi route có `req.body` đều có `validateBody(schema)` — không route nào đọc `req.body` trực tiếp mà bỏ qua validate.
- 2 route list có query filter (`GET /api/students?classId=`, `GET /api/bills?classId=&month=&studentId=`) TRƯỚC ĐÂY tự đọc `req.query` bằng `typeof x === 'string' ? x : undefined` — im lặng bỏ qua filter nếu sai kiểu (vd lặp param `?classId=a&classId=b` khiến Express parse thành mảng) thay vì báo lỗi. Đã thêm `validateQuery()` (`middleware/validate.ts`, sinh đôi với `validateBody()`) + schema riêng (`listStudentsQuerySchema`, `listBillsQuerySchema`) cho 2 route này — giờ query sai kiểu/rỗng/sai định dạng (`month` không phải `YYYY-MM`) đều trả `400 VALIDATION_ERROR` rõ ràng thay vì âm thầm bỏ qua filter.
- Route không nhận input nào ngoài `:id`/token (`DELETE`, `POST .../access-code`, `POST .../revoke`) không cần schema — `:id` rỗng không thể match route Express nên không có gì để validate thêm; id sai/không tồn tại được service layer bắt và trả `404` đúng chuẩn.

**Format lỗi — đồng nhất `{ error: { code, message, details? } }` cho MỌI lỗi, kể cả lỗi hạ tầng trước đây bị bỏ sót:**
- `ZodError` (từ `validateBody`/`validateQuery`) → `400 VALIDATION_ERROR` kèm `details` (field nào sai, sai gì).
- `AppError` (throw tay ở service layer) → đúng `statusCode`/`code`/`message` đã set.
- **Đã phát hiện + sửa 1 lỗi thật:** body JSON không hợp lệ (vd client gửi `Content-Type: application/json` nhưng body không parse được) trước đây KHÔNG được `errorHandler.ts` nhận diện, rơi xuống nhánh generic → trả nhầm `500 INTERNAL_ERROR` (và log ra console dù đây là lỗi CLIENT, không phải lỗi server thật). Đã thêm nhánh riêng nhận diện `SyntaxError` từ `express.json()`/body-parser (`err.status === 400 && err.type === 'entity.parse.failed'`) → trả đúng `400 VALIDATION_ERROR`.
- **Đã phát hiện + sửa 1 bug liên quan:** `cors()` trước đây mount SAU `express.json()` trong `app.ts`. Vì middleware lỗi (như JSON-parse-fail ở trên) bỏ qua mọi middleware thường còn lại, response 400 đó không bao giờ có header `Access-Control-Allow-Origin` — browser ở đúng `FRONTEND_ORIGIN` sẽ thấy đây là lỗi CORS (network error mù mờ) thay vì đọc được message 400. Đã đổi thứ tự: `cors()` mount TRƯỚC `express.json()`.
- Route không khớp path/method nào → `404 NOT_FOUND` (catch-all cuối `app.ts`), cùng format.
- Cùng 1 `code` (vd `CLASS_NOT_FOUND`, `STUDENT_NOT_FOUND`) được dùng ở CẢ 2 tình huống khác `statusCode` tuỳ ngữ cảnh — đây là chủ đích, không phải lỗi: `400` khi field FK trong body (vd `classId` gửi lên trong `POST /api/students`) không trỏ tới bản ghi tồn tại (lỗi request), `404` khi chính `:id` trên URL không tồn tại (lỗi resource). Format bao lỗi vẫn y hệt nhau ở cả 2 case, chỉ khác `statusCode`.

## Rate limit 2 endpoint login — đã có sẵn, đã verify lại

`POST /api/auth/teacher/login` và `POST /api/auth/portal/login` đều gắn `createLoginRateLimiter()` (`middleware/loginRateLimiter.ts`, factory tạo `express-rate-limit` — gọi 1 lần riêng cho mỗi route nên 2 endpoint có bộ đếm độc lập, brute-force PIN portal không ăn chung quota với login giáo viên). Giới hạn: **10 request / 15 phút / IP**, vượt quá trả `429 RATE_LIMITED` đúng format lỗi chung. Đã verify lại bằng cách gọi `POST /api/auth/teacher/login` sai password 11 lần liên tiếp: 10 lần đầu trả `401 INVALID_CREDENTIALS`, lần thứ 11 trả `429 RATE_LIMITED` — đúng như thiết kế, không cần sửa gì thêm.

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

### `computeBillSummary()` — nguồn tính bill DUY NHẤT, dùng lại ở khắp nơi

`GET /api/portal/me` tính `totalAttendedSessions`/`totalAmount`/`attendedDates` bằng `computeBillSummary()` ở **`server/src/modules/bills/bills.utils.ts`** — hàm DUY NHẤT tính "điểm danh present trong tháng → số buổi + tiền + danh sách ngày". `bills.service.ts` (`recalcBillsForStudent()` — hàm DUY NHẤT ghi lại kết quả đó vào `TuitionBill`, dùng ở cả module `classes`, `students`, `attendance`) cũng gọi lại đúng hàm này thay vì tự đếm riêng. Không viết thêm 1 bản đếm/tính tiền nào khác ở nơi khác — nếu có logic mới cần thêm (vd định dạng khác cho response), mở rộng `computeBillSummary()`/`recalcBillsForStudent()`, không tách riêng.

### Thiết kế `GET /api/portal/me`: số liệu bill luôn tính "live", không tin tưởng tuyệt đối cột đã lưu

`totalAttendedSessions`/`totalAmount`/`attendedDates` tính lại real-time từ `AttendanceRecord` mỗi lần gọi (qua `computeBillSummary`), KHÔNG lấy trực tiếp từ cột đã lưu trong `TuitionBill` — để hiển thị luôn đúng ngay cả khi lỡ có 1 trigger recalc nào đó bị bỏ sót. `paidStatus`/`paidDate`/`note`/`receiptUrl` thì lấy từ row `TuitionBill` đã lưu (mặc định `unpaid`/`null` nếu bill tháng này chưa từng được tạo — vd học sinh mới, hoặc điểm danh vừa được thêm nhưng chưa có trigger recalc nào chạy qua để tạo row bill tương ứng — trường hợp này `bill.id` sẽ là 1 chuỗi placeholder `bill-<studentId>-<month>` chứ không phải id thật trong DB, và gọi `confirm-payment` với id đó sẽ trả `404` vì chưa có gì để xác nhận thanh toán).

`GET /api/bills` (route giáo viên, phần dưới) thì KHÔNG tính live như trên — nó trả thẳng row đã lưu trong `TuitionBill`, vì mọi đường ghi (`PUT /api/attendance`, `POST /api/attendance/session-date`, `POST /api/attendance/sync-schedule`, `PUT /api/classes/:id`, `POST`/`PUT /api/students`) đều đã trigger `recalcBillsForStudent()` đồng bộ trong transaction ngay khi ghi — nên cột đã lưu luôn đúng, không cần tính lại lần nữa khi đọc.

### `bankConfig` trong `GET /api/portal/me`: đã sửa để query đúng row cố định

Trước khi có module `bankConfig` (route thật), `getPortalMe()` lấy cấu hình ngân hàng bằng `prisma.bankConfig.findFirst()` — dựa vào giả định "chỉ nên có đúng 1 row" nhưng không có gì đảm bảo `findFirst()` luôn trả về đúng row đó nếu lỡ có ai tạo thêm 1 row thứ 2 bằng tay. Đã đổi sang `prisma.bankConfig.findUnique({ where: { id: BANK_CONFIG_ID } })`, import `BANK_CONFIG_ID` từ `bankConfig.service.ts` (hằng số cố định `"bank-config-default"`, cũng là id mà `server/prisma/seed.ts` dùng để seed). `PUT /api/bank-config` (mục dưới) cũng `upsert` theo đúng id này — nên: (1) không bao giờ có row thứ 2 được tạo qua route hợp lệ, (2) `GET /api/portal/me` luôn thấy dữ liệu mới nhất ngay sau khi giáo viên `PUT`, đã verify thủ công (`PUT /api/bank-config` đổi bankName → gọi lại `GET /api/portal/me` ngay sau đó → `bankConfig.bankName` khớp giá trị vừa PUT).

## Bank Config API (`/api/bank-config`) — teacher-only

```bash
curl -s http://localhost:4000/api/bank-config -H "Authorization: Bearer $TEACHER_TOKEN"
# -> row cấu hình ngân hàng hiện tại, hoặc null nếu chưa từng cấu hình (chưa seed/chưa PUT lần nào)

curl -s -X PUT http://localhost:4000/api/bank-config \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{"bankId":"vcb","bankName":"Ngân hàng Vietcombank","accountNumber":"9999888877","accountHolder":"NGUYEN VAN A","centerName":"Trung Tâm LightED","teacherName":"Henry"}'
# -> upsert theo đúng 1 row cố định (id="bank-config-default") — gọi PUT nhiều lần không tạo thêm row nào,
# và GET /api/portal/me gọi ngay sau đó sẽ thấy dữ liệu mới này.
```

## Bill tự tính lại: `recalcBillsForStudent()` — 1 hàm dùng chung, gọi ở đúng 4 nơi

`server/src/modules/bills/bills.service.ts` export `recalcBillsForStudent(tx, { studentId, classId, month, pricePerSession })` — hàm DUY NHẤT ghi lại 1 `TuitionBill` (unique theo `(studentId, month)`, xem `@@unique([studentId, month])` trong schema). Luôn chạy trong `prisma.$transaction` cùng với thao tác ghi vừa kích hoạt nó (không bao giờ recalc "sau" trong 1 request riêng — tránh race giữa 2 request ghi đè lẫn nhau). Tôn trọng quy tắc #1 (bill `paid` bất biến): nếu bill hiện có `paidStatus === 'paid'`, hàm return ngay, không sửa gì.

4 nơi gọi trực tiếp hàm này:

1. **`PUT /api/classes/:id`** (`classes.service.ts#updateClass`) — khi `pricePerSession` đổi: loop mọi `TuitionBill` đang gắn `classId` đó với `paidStatus !== 'paid'`, gọi `recalcBillsForStudent` cho từng `(studentId, month)` với giá mới. Dựa theo `classId` **đã lưu trên bill** (lớp lúc tính phí), không dựa lớp hiện tại của học sinh — xem mục "Lưu ý ngầm khi đổi giá lớp" ở trên.
2. **`POST /api/students`** / **`PUT /api/students/:id`** (`students.service.ts`) — tạo mới hoặc đổi `classId`: gọi 1 lần cho bill **tháng hiện tại** (`currentYearMonth()`, theo ngày thực server) với lớp mới nhất.
3. **`PUT /api/attendance`** (`attendance.service.ts#upsertAttendance`) — 1 bản ghi điểm danh đổi: gọi 1 lần cho bill của **đúng tháng chứa `date`** đó (`date.slice(0, 7)`).
4. **`POST /api/attendance/session-date`** / **`POST /api/attendance/sync-schedule`** (`attendance.service.ts`) — nhiều bản ghi điểm danh đổi cùng lúc: gọi cho từng học sinh trong lớp, với tháng chứa các ngày vừa sinh ra.

## Attendance API (`/api/attendance`) — teacher-only

Toàn bộ route yêu cầu `Authorization: Bearer <TEACHER_TOKEN>`. `date` luôn dạng `"YYYY-MM-DD"`, `month` luôn dạng `"YYYY-MM"`.

```bash
# 1. Điểm danh 1 học sinh 1 ngày (upsert theo unique (studentId, date))
curl -s -X PUT http://localhost:4000/api/attendance \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{"studentId":"std-101","date":"2026-08-05","status":"present"}'
# -> tạo/ghi đè bản ghi điểm danh, classId tự lấy theo lớp HIỆN TẠI của std-101 (không nhận
# classId từ client) + tự recalc bill của đúng tháng "2026-08"

# 2. Thêm 1 buổi học mới cho CẢ LỚP (mặc định status='present' cho HS chưa điểm danh ngày đó)
curl -s -X POST http://localhost:4000/api/attendance/session-date \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{"classId":"class-ab01","date":"2026-08-10"}'
# -> { classId, date, studentsCount } — không ghi đè điểm danh học sinh nào đã có sẵn ở ngày đó

# 3. Đồng bộ lịch học (EnglishClass.daysOfWeek) thành điểm danh cho CẢ THÁNG
curl -s -X POST http://localhost:4000/api/attendance/sync-schedule \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{"classId":"class-ab01","month":"2026-08"}'
# -> { classId, month, generatedDatesCount, studentsCount } — chỉ tạo bản ghi cho (student, date)
# CHƯA tồn tại, gọi lại nhiều lần với cùng classId+month KHÔNG tạo bản ghi trùng (idempotent)
```

## Bills API (`/api/bills`) — teacher-only

```bash
# 1. Danh sách bill — lọc tuỳ ý theo classId/month/studentId (bỏ trống query nào thì không lọc theo field đó)
curl -s "http://localhost:4000/api/bills?classId=class-ab01&month=2026-08" -H "Authorization: Bearer $TEACHER_TOKEN"

# 2. Đổi trạng thái thanh toán (giáo viên chủ động đánh dấu đã thu / thu lại tiền mặt)
curl -s -X PUT http://localhost:4000/api/bills/<billId>/status \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{"paidStatus":"paid"}'
# -> paidDate tự set = thời điểm hiện tại; đổi ngược lại "unpaid" thì paidDate tự set về null
```

## Test 4 case quan trọng nhất (bill + attendance)

Chuẩn bị: lấy `TEACHER_TOKEN` như hướng dẫn ở đầu README, dữ liệu seed có sẵn `class-ab01` (`pricePerSession=300000`) với 2 học sinh `std-101`, `std-102`.

```bash
TEACHER_TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/teacher/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@lighted.local","password":"ChangeMe123!"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).token")
```

**Case 1 — điểm danh `present` → bill tăng đúng số tiền:**

```bash
curl -s "http://localhost:4000/api/bills?studentId=std-101&month=2026-08" -H "Authorization: Bearer $TEACHER_TOKEN"
# -> [] (chưa có bill tháng này)

curl -s -X PUT http://localhost:4000/api/attendance -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" -d '{"studentId":"std-101","date":"2026-08-05","status":"present"}'

curl -s "http://localhost:4000/api/bills?studentId=std-101&month=2026-08" -H "Authorization: Bearer $TEACHER_TOKEN"
# -> totalAttendedSessions=1, totalAmount=300000 (= pricePerSession * 1)

curl -s -X PUT http://localhost:4000/api/attendance -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" -d '{"studentId":"std-101","date":"2026-08-06","status":"present"}'

curl -s "http://localhost:4000/api/bills?studentId=std-101&month=2026-08" -H "Authorization: Bearer $TEACHER_TOKEN"
# -> totalAttendedSessions=2, totalAmount=600000. Đổi status khác 'present' (vd 'excused') ở 1
# trong 2 ngày trên rồi gọi lại PUT /api/attendance -> totalAttendedSessions giảm về 1, totalAmount về 300000.
```

**Case 2 — chạy `sync-schedule` 2 lần liên tiếp không tạo bản ghi trùng:**

```bash
curl -s -X POST http://localhost:4000/api/attendance/sync-schedule -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" -d '{"classId":"class-ab01","month":"2026-08"}'
# -> vd { generatedDatesCount: 9, studentsCount: 2 }

curl -s "http://localhost:4000/api/bills?studentId=std-101&month=2026-08" -H "Authorization: Bearer $TEACHER_TOKEN"
# -> ghi lại totalAttendedSessions sau lần chạy #1 (gọi là N)

curl -s -X POST http://localhost:4000/api/attendance/sync-schedule -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" -d '{"classId":"class-ab01","month":"2026-08"}'
# -> generatedDatesCount vẫn báo tổng số ngày khớp lịch trong tháng (không đổi), NHƯNG không tạo
# thêm bản ghi điểm danh nào mới

curl -s "http://localhost:4000/api/bills?studentId=std-101&month=2026-08" -H "Authorization: Bearer $TEACHER_TOKEN"
# -> totalAttendedSessions PHẢI giữ nguyên = N (không tăng thêm) sau lần chạy #2 -> xác nhận
# @@unique([studentId, date]) + skipDuplicates chặn tạo trùng
```

**Case 3 — đổi giá lớp KHÔNG được đổi số tiền của bill đã `paid`:**

```bash
BILL_ID=$(curl -s "http://localhost:4000/api/bills?studentId=std-101&month=2026-08" \
  -H "Authorization: Bearer $TEACHER_TOKEN" | node -pe "JSON.parse(require('fs').readFileSync(0))[0].id")

curl -s -X PUT "http://localhost:4000/api/bills/$BILL_ID/status" -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" -d '{"paidStatus":"paid"}'
# -> paidStatus="paid", ghi nhớ totalAmount hiện tại (gọi là A)

curl -s -X PUT http://localhost:4000/api/classes/class-ab01 -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{"name":"AB01","teacherName":"Henry","pricePerSession":350000,"scheduleDays":"Thứ 2 - Thứ 4","targetMonthSessions":8,"daysOfWeek":[1,3],"scheduleTime":"18:00 - 19:30","room":"Phòng 201"}'

curl -s "http://localhost:4000/api/bills?studentId=std-101&month=2026-08" -H "Authorization: Bearer $TEACHER_TOKEN"
# -> bill của std-101 PHẢI giữ nguyên pricePerSession=300000, totalAmount=A (không đổi thành 350000)
```

**Case 4 — đổi giá lớp CÓ đổi đúng số tiền của bill `unpaid`:**

```bash
# std-102 (cùng lớp class-ab01) đang unpaid — nếu chưa có bill tháng này thì điểm danh/sync trước
curl -s "http://localhost:4000/api/bills?studentId=std-102&month=2026-08" -H "Authorization: Bearer $TEACHER_TOKEN"
# -> ghi nhớ totalAttendedSessions (gọi là S, không đổi bởi bước đổi giá) và pricePerSession cũ (300000)

# (lặp lại đúng lệnh PUT /api/classes/class-ab01 với pricePerSession=350000 ở Case 3, nếu chưa chạy)

curl -s "http://localhost:4000/api/bills?studentId=std-102&month=2026-08" -H "Authorization: Bearer $TEACHER_TOKEN"
# -> pricePerSession=350000, totalAmount = S * 350000 (đúng công thức, totalAttendedSessions S giữ nguyên)
```

Đã verify thủ công cả 4 case ở trên trên DB dev local (`npm run db:seed` sau đó chạy tuần tự các lệnh) — kết quả đúng như mô tả. Nếu bạn (người đọc README) muốn state DB sạch lại như seed ban đầu sau khi tự chạy các lệnh test này, chạy `npx prisma migrate reset` (drop + migrate + seed lại từ đầu — destructive, chỉ dùng cho DB dev local).
