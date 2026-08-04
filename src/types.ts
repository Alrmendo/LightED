export type AttendanceStatus = 'present' | 'excused' | 'unexcused' | 'holiday';

export interface Student {
  id: string;
  name: string;
  parentName: string;
  phone: string;
  classId: string;
  email?: string;
  avatar?: string;
  dob?: string; // Sinh nhật học sinh (e.g. "15/08/2012")
  parentDob?: string; // Sinh nhật phụ huynh (e.g. "15/05/1986")
  parentOccupation?: string; // Nghề nghiệp phụ huynh
  futureOrientation?: string; // Định hướng cho con nếu có
  notes?: string; // Ghi chú thêm
}

export interface EnglishClass {
  id: string;
  name: string;
  teacherName: string;
  pricePerSession: number; // e.g. 250000 or 300000 (VND)
  scheduleDays: string; // e.g. "Thứ 2 - Thứ 4 - Thứ 6"
  targetMonthSessions: number; // Target number of sessions in month
  daysOfWeek?: number[]; // [1, 3, 5] where 1 = Mon (T2), 2 = Tue (T3), 3 = Wed (T4), 4 = Thu (T5), 5 = Fri (T6), 6 = Sat (T7), 0 = Sun (CN)
  scheduleTime?: string; // e.g. "18:00 - 19:30"
  room?: string; // e.g. "Phòng 201"
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  note?: string;
  lessonTopic?: string;
  homework?: string;
}

export interface BankConfig {
  bankId: string; // e.g. 'ocb', 'mbbank', 'vcb', 'tcb', 'tpbank'
  bankName: string; // e.g. "Ngân hàng OCB"
  accountNumber: string; // e.g. "0355991851"
  accountHolder: string; // e.g. "NGUYEN ANH DUY"
  centerName: string; // e.g. "Trung Tâm Anh Ngữ Henry English"
  teacherName: string; // e.g. "Henry"
}

export interface TuitionBill {
  id: string;
  studentId: string;
  classId: string;
  month: string; // e.g. "2026-05" or "Tháng 5/2026"
  attendedDates: string[]; // DD/MM list
  totalAttendedSessions: number;
  pricePerSession: number;
  totalAmount: number;
  paidStatus: 'unpaid' | 'paid' | 'partially_paid';
  paidDate?: string;
  note?: string;
}

export interface PopularBank {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
}
