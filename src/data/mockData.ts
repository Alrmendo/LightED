import { BankConfig, EnglishClass, Student, AttendanceRecord, TuitionBill } from '../types';

export const INITIAL_BANK_CONFIG: BankConfig = {
  bankId: 'OCB',
  bankName: 'Ngân hàng Phương Đông (OCB)',
  accountNumber: '0355991851',
  accountHolder: 'NGUYEN ANH DUY',
  centerName: 'Trung Tâm Anh Ngữ LightED',
  teacherName: 'Teacher LightED',
};

export const INITIAL_CLASSES: EnglishClass[] = [
  {
    id: 'class-ab01',
    name: 'AB01',
    teacherName: 'Henry',
    pricePerSession: 300000,
    scheduleDays: 'Thứ 2 - Thứ 4',
    targetMonthSessions: 8,
    daysOfWeek: [1, 3], // Mon, Wed
    scheduleTime: '18:00 - 19:30',
    room: 'Phòng 201',
  },
  {
    id: 'class-toeic450',
    name: 'TOEIC 450 - TRẦN',
    teacherName: 'Henry & Cô Trần',
    pricePerSession: 250000,
    scheduleDays: 'Thứ 3 - Thứ 5',
    targetMonthSessions: 9,
    daysOfWeek: [2, 4], // Tue, Thu
    scheduleTime: '19:30 - 21:00',
    room: 'Phòng 102',
  },
  {
    id: 'class-toeic750',
    name: 'TOEIC 750 - HUY',
    teacherName: 'Henry & Thầy Huy',
    pricePerSession: 250000,
    scheduleDays: 'Thứ 2 - Thứ 4 - Thứ 6',
    targetMonthSessions: 13,
    daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
    scheduleTime: '18:00 - 19:30',
    room: 'Phòng 301',
  },
  {
    id: 'class-ab02',
    name: 'AB02 - BẢO',
    teacherName: 'Henry & Thầy Bảo',
    pricePerSession: 250000,
    scheduleDays: 'Thứ 3 - Thứ 7',
    targetMonthSessions: 8,
    daysOfWeek: [2, 6], // Tue, Sat
    scheduleTime: '17:30 - 19:00',
    room: 'Phòng 202',
  },
];

export const INITIAL_STUDENTS: Student[] = [
  // Class AB01
  {
    id: 'std-101',
    name: 'Lê Minh Anh',
    parentName: 'Chị Mai (Mẹ Minh Anh)',
    phone: '0988123456',
    classId: 'class-ab01',
    email: 'chimai.parent@gmail.com',
    dob: '12/04/2014',
    parentDob: '15/05/1986',
    parentOccupation: 'Kế toán trưởng (Công ty Dược)',
    futureOrientation: 'Định hướng thi Chuyên Anh THPT & Thi IELTS 7.5',
    notes: 'Học sinh hăng hái, từ vựng tốt, hay nghỉ thứ 7 nếu trùng lịch thi năng khiếu.',
  },
  {
    id: 'std-102',
    name: 'Trần Hoàng Nam',
    parentName: 'Anh Tuấn (Bố Hoàng Nam)',
    phone: '0912345678',
    classId: 'class-ab01',
    dob: '28/09/2013',
    parentDob: '22/11/1983',
    parentOccupation: 'Kỹ sư phần mềm (Viettel)',
    futureOrientation: 'Rèn phản xạ giao tiếp tự tin, săn học bổng du học Singapore',
    notes: 'Tiếp thu nhanh bài giảng, phụ huynh rất quan tâm cập nhật điểm số hằng tuần.',
  },
  
  // Class TOEIC 450
  {
    id: 'std-201',
    name: 'Nguyễn Thu Trang',
    parentName: 'Chị Lan (Mẹ Thu Trang)',
    phone: '0977889900',
    classId: 'class-toeic450',
    dob: '05/11/2011',
    parentDob: '10/08/1985',
    parentOccupation: 'Bác sĩ nha khoa',
    futureOrientation: 'Đạt 550+ TOEIC để đủ điều kiện xét tuyển đại học',
    notes: 'Cần nâng cao kỹ năng Listening, hay quên bài tập phần Part 3-4.',
  },
  {
    id: 'std-202',
    name: 'Phạm Việt Trần',
    parentName: 'Anh Hùng (Bố Việt Trần)',
    phone: '0933445566',
    classId: 'class-toeic450',
    dob: '18/02/2012',
    parentDob: '03/04/1982',
    parentOccupation: 'Kinh doanh tự do',
    futureOrientation: 'Giao tiếp công việc & Thi chứng chỉ quốc tế',
    notes: 'Tính tình hòa đồng, đi học rất đúng giờ.',
  },

  // Class TOEIC 750
  {
    id: 'std-301',
    name: 'Vũ Gia Huy',
    parentName: 'Chị Bích (Mẹ Gia Huy)',
    phone: '0909112233',
    classId: 'class-toeic750',
    dob: '22/06/2010',
    parentDob: '19/09/1984',
    parentOccupation: 'Giảng viên Đại Học',
    futureOrientation: 'Thi TOEIC 800+ để làm hồ sơ du học Mỹ',
    notes: 'Ngữ pháp chắc chắn, phản xạ Speaking rất nhanh.',
  },
  {
    id: 'std-302',
    name: 'Đặng Nhật Minh',
    parentName: 'Chị Hương (Mẹ Nhật Minh)',
    phone: '0944556677',
    classId: 'class-toeic750',
    dob: '10/01/2011',
    parentDob: '28/02/1986',
    parentOccupation: 'Cán bộ ngân hàng',
    futureOrientation: 'Định hướng học Chuyên Ngoại Ngữ & Thi lấy bằng C1',
    notes: 'Cần rèn luyện kĩ năng viết Task 2.',
  },

  // Class AB02
  {
    id: 'std-401',
    name: 'Đỗ Quốc Bảo',
    parentName: 'Anh Dũng (Bố Quốc Bảo)',
    phone: '0966778899',
    classId: 'class-ab02',
    dob: '14/07/2014',
    parentDob: '12/10/1987',
    parentOccupation: 'Kinh doanh Khách sạn',
    futureOrientation: 'Phát triển toàn diện 4 kỹ năng Nghe - Nói - Đọc - Viết',
    notes: 'Rất ngoan, tương tác tốt với giáo viên bản ngữ.',
  },
  {
    id: 'std-402',
    name: 'Hoàng Tuấn Kiệt',
    parentName: 'Chị Linh (Mẹ Tuấn Kiệt)',
    phone: '0922334455',
    classId: 'class-ab02',
    dob: '03/03/2013',
    parentDob: '07/06/1985',
    parentOccupation: 'Kiến trúc sư',
    futureOrientation: 'Thi chứng chỉ Cambridge Movers & Flyers',
    notes: 'Cần động viên thêm ở bài tập đọc hiểu.',
  },
];

// Session Dates per class matching the screenshot (May / Current Month)
export const MOCK_CLASS_DATES: Record<string, string[]> = {
  'class-ab01': ['2026-05-05', '2026-05-06', '2026-05-12', '2026-05-13', '2026-05-19', '2026-05-20', '2026-05-26', '2026-05-27'],
  'class-toeic450': ['2026-05-01', '2026-05-07', '2026-05-08', '2026-05-14', '2026-05-15', '2026-05-21', '2026-05-22', '2026-05-28', '2026-05-29'],
  'class-toeic750': ['2026-05-01', '2026-05-04', '2026-05-07', '2026-05-08', '2026-05-11', '2026-05-14', '2026-05-15', '2026-05-18', '2026-05-21', '2026-05-22', '2026-05-25', '2026-05-28', '2026-05-29'],
  'class-ab02': ['2026-05-04', '2026-05-07', '2026-05-11', '2026-05-14', '2026-05-18', '2026-05-21', '2026-05-25', '2026-05-28'],
};

const LESSON_TOPICS = [
  { topic: 'Present Simple vs Present Continuous & Vocabulary Unit 1', hw: 'Workbook page 12-14 & 10 flashcards' },
  { topic: 'Listening Practice: IELTS Part 1 / Basic Conversations', hw: 'Record 1 minute audio introducing yourself' },
  { topic: 'Grammar Focus: Past Simple & Regular/Irregular Verbs', hw: 'Complete Exercise 3 & write 5 sentences' },
  { topic: 'Speaking Club: Ordering Food & Asking Directions', hw: 'Practice dialogue with study buddy' },
  { topic: 'Reading Comprehension: Scanning & Skimming Techniques', hw: 'Read passage A & answer 8 questions' },
  { topic: 'Pronunciation & Phonics: /θ/ vs /ð/ sounds', hw: 'Shadowing recording video link' },
  { topic: 'TOEIC Part 5 Grammar & Vocabulary Mini Test', hw: 'Review incorrect answers on portal' },
  { topic: 'Writing Skills: Task 1 Chart Description Basics', hw: 'Draft 150 words introduction and overview' },
  { topic: 'Monthly Review & Interactive Vocabulary Game', hw: 'Prepare for mid-term mini assessment' },
];

export function generateInitialAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  let idCounter = 1;

  INITIAL_STUDENTS.forEach((student) => {
    const classDates = MOCK_CLASS_DATES[student.classId] || [];
    classDates.forEach((date, index) => {
      // Simulate attendance (mostly present, occasionally excused or absent)
      let status: 'present' | 'excused' | 'unexcused' | 'holiday' = 'present';
      let note = 'Có mặt đúng giờ, phát biểu hăng hái';
      
      if (student.id === 'std-102' && index === 3) {
        status = 'excused';
        note = 'Phụ huynh xin nghỉ do bị ốm nhẹ';
      } else if (student.id === 'std-202' && index === 5) {
        status = 'excused';
        note = 'Sốt nhẹ, có xin phép giáo viên';
      } else if (student.id === 'std-302' && index === 8) {
        status = 'unexcused';
        note = 'Vắng không báo trước';
      }

      const lessonInfo = LESSON_TOPICS[index % LESSON_TOPICS.length];

      records.push({
        id: `att-${idCounter++}`,
        studentId: student.id,
        classId: student.classId,
        date,
        status,
        note: status === 'present' ? note : note,
        lessonTopic: lessonInfo.topic,
        homework: lessonInfo.hw,
      });
    });
  });

  return records;
}

export function generateInitialTuitionBills(
  students: Student[],
  classes: EnglishClass[],
  attendance: AttendanceRecord[]
): TuitionBill[] {
  return students.map((std) => {
    const cls = classes.find((c) => c.id === std.classId)!;
    const stdAttendance = attendance.filter(
      (a) => a.studentId === std.id && a.status === 'present'
    );
    
    // Sort dates
    const attendedDates = stdAttendance
      .map((a) => {
        const parts = a.date.split('-');
        return `${parts[2]}/${parts[1]}`;
      })
      .sort();

    const totalAttendedSessions = stdAttendance.length;
    const totalAmount = totalAttendedSessions * (cls ? cls.pricePerSession : 0);

    // Initial paid state matching table (some unpaid, some paid)
    const paidStatus = std.id === 'std-101' || std.id === 'std-301' ? 'paid' : 'unpaid';

    return {
      id: `bill-${std.id}-2026-05`,
      studentId: std.id,
      classId: std.classId,
      month: 'THÁNG 5',
      attendedDates,
      totalAttendedSessions,
      pricePerSession: cls ? cls.pricePerSession : 0,
      totalAmount,
      paidStatus,
      paidDate: paidStatus === 'paid' ? '2026-05-28' : undefined,
    };
  });
}
