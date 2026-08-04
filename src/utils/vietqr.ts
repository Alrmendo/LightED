import { BankConfig, PopularBank, TuitionBill, Student, EnglishClass } from '../types';

export const POPULAR_BANKS: PopularBank[] = [
  { id: 'OCB', name: 'Ngân hàng Phương Đông', shortName: 'OCB' },
  { id: 'MB', name: 'Ngân hàng Quân Đội', shortName: 'MBBank' },
  { id: 'VCB', name: 'Ngân hàng Ngoại Thương Việt Nam', shortName: 'Vietcombank' },
  { id: 'TCB', name: 'Ngân hàng Kỹ Thương', shortName: 'Techcombank' },
  { id: 'VPB', name: 'Ngân hàng Thịnh Vượng', shortName: 'VPBank' },
  { id: 'TPB', name: 'Ngân hàng Tiên Phong', shortName: 'TPBank' },
  { id: 'ICB', name: 'Ngân hàng Công Thương Việt Nam', shortName: 'VietinBank' },
  { id: 'BIDV', name: 'Ngân hàng Đầu tư và Phát triển', shortName: 'BIDV' },
  { id: 'ACB', name: 'Ngân hàng Á Châu', shortName: 'ACB' },
  { id: 'STB', name: 'Ngân hàng Sài Gòn Thương Tín', shortName: 'Sacombank' },
];

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount).replace('₫', 'VNĐ');
}

export function generateVietQrUrl(
  bankConfig: BankConfig,
  amount: number,
  addInfo: string
): string {
  const bankId = bankConfig.bankId.toLowerCase();
  const accNum = bankConfig.accountNumber.trim();
  const holder = encodeURIComponent(bankConfig.accountHolder.toUpperCase());
  const info = encodeURIComponent(addInfo);
  return `https://img.vietqr.io/image/${bankId}-${accNum}-compact2.png?amount=${amount}&addInfo=${info}&accountName=${holder}`;
}

export function buildReminderMessage(
  student: Student,
  englishClass: EnglishClass,
  bill: TuitionBill,
  bankConfig: BankConfig,
  monthLabel: string = 'THÁNG 5'
): string {
  const datesText = bill.attendedDates && bill.attendedDates.length > 0
    ? bill.attendedDates.join(', ')
    : 'Chưa ghi nhận buổi học';
    
  const priceFormatted = bill.pricePerSession.toLocaleString('vi-VN');
  const totalFormatted = bill.totalAmount.toLocaleString('vi-VN');
  const studentDisplayName = student.parentName ? `Phụ huynh ${student.name}` : student.name;
  const teacher = bankConfig.teacherName || 'Trung tâm';

  return `Xin chào 🌸, ${teacher} gửi bạn thông tin học phí (${monthLabel.toUpperCase()}) của lớp ${englishClass.name}:
- Chi tiết các buổi đã học: ${datesText}
- Tổng số: ${bill.totalAttendedSessions} buổi
- Học phí: ${bill.totalAttendedSessions} x ${priceFormatted} = ${totalFormatted} VNĐ
- STK ${bankConfig.bankId.toUpperCase()}: ${bankConfig.accountNumber} (${bankConfig.accountHolder.toUpperCase()})
- Nội dung CK: HP ${monthLabel} ${student.name} ${englishClass.name}
Sau khi thanh toán học phí, cho ${teacher} xin ảnh chụp màn hình chuyển khoản nhé! SĐT hỗ trợ: ${student.phone || '0901234567'}`;
}

export function parseDateToDDMM(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
}
