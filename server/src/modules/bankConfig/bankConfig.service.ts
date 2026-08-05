import { prisma } from '../../config/prisma';

// Đúng 1 row cấu hình ngân hàng cho toàn trung tâm — id CỐ ĐỊNH, PHẢI khớp với hằng số cùng tên
// trong server/prisma/seed.ts (seed import lại đúng hằng số này, không hardcode riêng nữa).
// GET và PUT (kể cả GET /api/portal/me) đều query/upsert theo đúng id này thay vì
// `findFirst()`/tạo id ngẫu nhiên — đảm bảo luôn thao tác trên đúng 1 row xác định, không phụ
// thuộc thứ tự trả về không đảm bảo của findFirst() khi (giả sử do thao tác tay ngoài ý muốn)
// có nhiều hơn 1 row.
export const BANK_CONFIG_ID = 'bank-config-default';

export interface BankConfigInput {
  bankId: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  centerName: string;
  teacherName: string;
}

// GET /api/bank-config — trả null nếu chưa từng được cấu hình (chưa seed/chưa PUT lần nào),
// KHÔNG throw 404 — để client tự hiển thị form trống thay vì coi là lỗi.
export function getBankConfig() {
  return prisma.bankConfig.findUnique({ where: { id: BANK_CONFIG_ID } });
}

// PUT /api/bank-config — upsert theo đúng BANK_CONFIG_ID cố định ở trên, không bao giờ tạo ra
// row thứ 2 dù gọi trước hay sau khi đã seed.
export function updateBankConfig(data: BankConfigInput) {
  return prisma.bankConfig.upsert({
    where: { id: BANK_CONFIG_ID },
    update: data,
    create: { id: BANK_CONFIG_ID, ...data },
  });
}
