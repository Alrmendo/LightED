import React, { useState, useEffect } from 'react';
import { Loader2, LogOut } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { DashboardHome } from './components/DashboardHome';
import { TuitionReminders } from './components/TuitionReminders';
import { AttendanceMatrix } from './components/AttendanceMatrix';
import { ParentInfo } from './components/ParentInfo';
import { ClassManagement } from './components/ClassManagement';
import { BankSettings } from './components/BankSettings';
import { ParentPortal } from './components/ParentPortal';
import { LoginScreen } from './components/LoginScreen';
import { useAuth } from './hooks/useAuth';
import { usePortalMe } from './hooks/usePortalMe';

import {
  BankConfig,
  EnglishClass,
  Student,
  AttendanceRecord,
  TuitionBill,
} from './types';

import {
  INITIAL_BANK_CONFIG,
  INITIAL_CLASSES,
  INITIAL_STUDENTS,
  generateInitialAttendance,
  generateInitialTuitionBills,
} from './data/mockData';

// Nền gradient + blob động dùng chung cho mọi màn full-screen (login/loading/portal) để không bị
// "giật" phong cách khi chuyển qua lại — copy nguyên từ layout chính của App bên dưới.
function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute -top-24 -left-20 w-[620px] h-[620px] rounded-full bg-gradient-to-tr from-[#103BE6]/35 via-blue-500/25 to-sky-300/35 blur-[100px] animate-liquid-1" />
      <div className="absolute top-1/4 -right-28 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#FF5500]/25 via-amber-400/20 to-[#103BE6]/20 blur-[110px] animate-liquid-2" />
      <div className="absolute -bottom-28 left-1/6 w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-sky-400/30 via-[#103BE6]/30 to-indigo-300/25 blur-[105px] animate-liquid-3" />
      <div className="absolute top-2/3 right-1/3 w-[450px] h-[450px] rounded-full bg-gradient-to-r from-[#FF5500]/20 via-amber-300/20 to-blue-300/25 blur-[95px] animate-liquid-1" />
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage: `radial-gradient(rgba(16, 59, 230, 0.8) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />
    </div>
  );
}

function FullScreenStatus({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/90 via-sky-50/70 to-slate-100 relative overflow-x-hidden font-sans text-slate-900 flex items-center justify-center">
      <AmbientBackground />
      <div className="relative z-10 liquid-glass rounded-2xl px-6 py-5 flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-[#103BE6] animate-spin" />
        <span className="text-sm font-semibold text-slate-700">{message}</span>
      </div>
    </div>
  );
}

// Bọc ParentPortal.tsx (component có sẵn, không sửa) với dữ liệu thật từ GET /api/portal/me +
// 1 thanh header gọn (logo + đăng xuất) — Navbar.tsx đầy đủ tab dành cho giáo viên, không hợp
// cho màn phụ huynh.
function PortalGate({ onLogout }: { onLogout: () => void }) {
  const { data, loading, error, confirmPayment } = usePortalMe();

  if (loading) return <FullScreenStatus message="Đang tải dữ liệu..." />;

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/90 via-sky-50/70 to-slate-100 relative overflow-x-hidden font-sans text-slate-900 flex items-center justify-center px-4">
        <AmbientBackground />
        <div className="relative z-10 liquid-glass rounded-2xl px-6 py-6 max-w-sm w-full text-center space-y-4">
          <p className="text-sm font-semibold text-rose-700">{error || 'Không tải được dữ liệu'}</p>
          <button
            onClick={onLogout}
            className="liquid-glass-btn-primary px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
          >
            Đăng nhập lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/90 via-sky-50/70 to-slate-100 relative overflow-x-hidden font-sans text-slate-900 pb-16 selection:bg-[#FF5500] selection:text-white">
      <AmbientBackground />
      <div className="relative z-10">
        <header className="sticky top-0 z-40 pt-2 sm:pt-3 pb-1">
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <div className="liquid-glass rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 flex items-center justify-between">
              <div className="flex items-center tracking-tighter">
                <span className="text-[#FF5500] font-black text-xs sm:text-sm">Light</span>
                <span className="bg-[#103BE6] text-white px-1 py-0.5 rounded text-[9px] sm:text-[10px] font-black ml-0.5">
                  ED
                </span>
              </div>
              <button
                onClick={onLogout}
                title="Đăng xuất"
                aria-label="Đăng xuất"
                className="flex items-center space-x-1.5 liquid-glass-pill px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-rose-600 cursor-pointer transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-24 sm:pb-8">
          <ParentPortal
            students={[data.student]}
            classes={[data.class]}
            attendanceRecords={data.attendanceRecords}
            bills={[data.bill]}
            bankConfig={data.bankConfig}
            selectedMonth={data.month}
            onConfirmPaymentByParent={confirmPayment}
          />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const auth = useAuth();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'tuition' | 'attendance' | 'parent' | 'classes' | 'settings'>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string>('THÁNG 5');

  // Load state from localStorage or initial mock data
  const [bankConfig, setBankConfig] = useState<BankConfig>(() => {
    const saved = localStorage.getItem('english_center_bank_config');
    return saved ? JSON.parse(saved) : INITIAL_BANK_CONFIG;
  });

  const [classes, setClasses] = useState<EnglishClass[]>(() => {
    const saved = localStorage.getItem('english_center_classes');
    return saved ? JSON.parse(saved) : INITIAL_CLASSES;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('english_center_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('english_center_attendance');
    return saved ? JSON.parse(saved) : generateInitialAttendance();
  });

  const [bills, setBills] = useState<TuitionBill[]>(() => {
    const saved = localStorage.getItem('english_center_bills');
    if (saved) return JSON.parse(saved);
    const initialAtt = generateInitialAttendance();
    return generateInitialTuitionBills(INITIAL_STUDENTS, INITIAL_CLASSES, initialAtt);
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('english_center_bank_config', JSON.stringify(bankConfig));
  }, [bankConfig]);

  useEffect(() => {
    localStorage.setItem('english_center_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('english_center_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('english_center_attendance', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem('english_center_bills', JSON.stringify(bills));
  }, [bills]);

  // Recalculate bills whenever attendance or classes or students change
  const recalculateBills = (
    currentStudents: Student[],
    currentClasses: EnglishClass[],
    currentAttendance: AttendanceRecord[],
    currentBills: TuitionBill[]
  ) => {
    return currentStudents.map((std) => {
      const cls = currentClasses.find((c) => c.id === std.classId);
      const pricePerSession = cls ? cls.pricePerSession : 0;

      const stdAttendance = currentAttendance.filter(
        (a) => a.studentId === std.id && a.status === 'present'
      );

      const attendedDates = stdAttendance
        .map((a) => {
          const parts = a.date.split('-');
          return `${parts[2]}/${parts[1]}`;
        })
        .sort();

      const totalAttendedSessions = stdAttendance.length;
      const totalAmount = totalAttendedSessions * pricePerSession;

      const existingBill = currentBills.find((b) => b.studentId === std.id);

      return {
        id: existingBill ? existingBill.id : `bill-${std.id}-${selectedMonth}`,
        studentId: std.id,
        classId: std.classId,
        month: selectedMonth,
        attendedDates,
        totalAttendedSessions,
        pricePerSession,
        totalAmount,
        paidStatus: existingBill ? existingBill.paidStatus : 'unpaid',
      };
    });
  };

  // Handler: Update student attendance for a date
  const handleUpdateAttendance = (
    studentId: string,
    date: string,
    status: 'present' | 'excused' | 'unexcused' | 'holiday',
    topic?: string
  ) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    let updatedRecords = [...attendanceRecords];
    const existingIndex = updatedRecords.findIndex(
      (r) => r.studentId === studentId && r.date === date
    );

    if (existingIndex >= 0) {
      updatedRecords[existingIndex] = {
        ...updatedRecords[existingIndex],
        status,
        lessonTopic: topic || updatedRecords[existingIndex].lessonTopic,
      };
    } else {
      updatedRecords.push({
        id: `att-${Date.now()}-${Math.random()}`,
        studentId,
        classId: student.classId,
        date,
        status,
        lessonTopic: topic || 'Chủ đề bài học',
      });
    }

    setAttendanceRecords(updatedRecords);

    // Recalculate bills automatically!
    const newBills = recalculateBills(students, classes, updatedRecords, bills);
    setBills(newBills);
  };

  // Handler: Add a new session date for a class
  const handleAddClassSessionDate = (classId: string, date: string) => {
    const classStudents = students.filter((s) => s.classId === classId);
    let updatedRecords = [...attendanceRecords];

    classStudents.forEach((std) => {
      const exists = updatedRecords.some((r) => r.studentId === std.id && r.date === date);
      if (!exists) {
        updatedRecords.push({
          id: `att-${Date.now()}-${std.id}`,
          studentId: std.id,
          classId,
          date,
          status: 'present',
          lessonTopic: 'Bài giảng theo lịch',
        });
      }
    });

    setAttendanceRecords(updatedRecords);

    // Recalculate bills
    const newBills = recalculateBills(students, classes, updatedRecords, bills);
    setBills(newBills);
  };

  // Handler: Sync Class Weekly Schedule to Attendance Matrix
  const handleSyncClassScheduleToAttendance = (classId: string, daysOfWeek: number[], yearMonthStr: string = '2026-05') => {
    let year = 2026;
    let month = 5;

    if (yearMonthStr.includes('-')) {
      const parts = yearMonthStr.split('-');
      year = parseInt(parts[0], 10) || 2026;
      month = parseInt(parts[1], 10) || 5;
    } else {
      const match = yearMonthStr.match(/\d+/);
      if (match) month = parseInt(match[0], 10);
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const generatedDates: string[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month - 1, day);
      const dayOfWeek = dateObj.getDay(); // 0 = Sun, 1 = Mon...
      if (daysOfWeek.includes(dayOfWeek)) {
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        generatedDates.push(`${yyyy}-${mm}-${dd}`);
      }
    }

    const classStudents = students.filter((s) => s.classId === classId);
    let updatedRecords = [...attendanceRecords];
    let createdSessionsCount = 0;

    generatedDates.forEach((date) => {
      classStudents.forEach((std) => {
        const exists = updatedRecords.some((r) => r.studentId === std.id && r.date === date);
        if (!exists) {
          updatedRecords.push({
            id: `att-${Date.now()}-${std.id}-${Math.random()}`,
            studentId: std.id,
            classId,
            date,
            status: 'present',
            lessonTopic: 'Bài giảng theo lịch học',
          });
          createdSessionsCount++;
        }
      });
    });

    setAttendanceRecords(updatedRecords);
    const newBills = recalculateBills(students, classes, updatedRecords, bills);
    setBills(newBills);

    return { generatedDatesCount: generatedDates.length, createdSessionsCount };
  };

  // Handler: Update Tuition Bill Paid Status
  const handleUpdateBillStatus = (billId: string, newStatus: 'paid' | 'unpaid') => {
    setBills((prev) =>
      prev.map((b) => (b.id === billId ? { ...b, paidStatus: newStatus } : b))
    );
  };

  // Handler: Class Management
  const handleAddClass = (newClass: Omit<EnglishClass, 'id'>) => {
    const clsObj: EnglishClass = { ...newClass, id: `class-${Date.now()}` };
    const updated = [...classes, clsObj];
    setClasses(updated);
  };

  const handleUpdateClass = (updatedClass: EnglishClass) => {
    const updated = classes.map((c) => (c.id === updatedClass.id ? updatedClass : c));
    setClasses(updated);
    setBills(recalculateBills(students, updated, attendanceRecords, bills));
  };

  const handleDeleteClass = (classId: string) => {
    const updated = classes.filter((c) => c.id !== classId);
    setClasses(updated);
  };

  // Handler: Student Management
  const handleAddStudent = (newStudent: Omit<Student, 'id'>) => {
    const stdObj: Student = { ...newStudent, id: `std-${Date.now()}` };
    const updated = [...students, stdObj];
    setStudents(updated);

    // Generate initial bills for new student
    const newBills = recalculateBills(updated, classes, attendanceRecords, bills);
    setBills(newBills);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    const updated = students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s));
    setStudents(updated);
    setBills(recalculateBills(updated, classes, attendanceRecords, bills));
  };

  const handleDeleteStudent = (studentId: string) => {
    const updated = students.filter((s) => s.id !== studentId);
    setStudents(updated);
  };

  // Auth-gate: đặt SAU mọi hook ở trên (Rules of Hooks — không được gọi hook có điều kiện),
  // chỉ rẽ nhánh phần JSX render ra. State mock/localStorage phía giáo viên ở trên vẫn khởi tạo
  // bình thường dù đang ở màn login/portal — không ảnh hưởng gì, chỉ là chưa dùng tới.
  if (auth.status === 'loading') {
    return <FullScreenStatus message="Đang kiểm tra đăng nhập..." />;
  }

  if (auth.status === 'anonymous') {
    return <LoginScreen onLoginTeacher={auth.loginTeacher} onLoginPortal={auth.loginPortal} />;
  }

  if (auth.profile.role === 'PORTAL') {
    return <PortalGate onLogout={auth.logout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/90 via-sky-50/70 to-slate-100 relative overflow-x-hidden font-sans text-slate-900 pb-16 selection:bg-[#FF5500] selection:text-white">
      {/* Liquid Glass Background Ambient Glowing Orbs & Refraction Layers */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Glowing Liquid Orb 1 - Top Left LightED Royal Blue */}
        <div className="absolute -top-24 -left-20 w-[620px] h-[620px] rounded-full bg-gradient-to-tr from-[#103BE6]/35 via-blue-500/25 to-sky-300/35 blur-[100px] animate-liquid-1" />
        
        {/* Glowing Liquid Orb 2 - Middle Right LightED Energy Orange Glow */}
        <div className="absolute top-1/4 -right-28 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#FF5500]/25 via-amber-400/20 to-[#103BE6]/20 blur-[110px] animate-liquid-2" />
        
        {/* Glowing Liquid Orb 3 - Bottom Left Royal Blue & Cyan */}
        <div className="absolute -bottom-28 left-1/6 w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-sky-400/30 via-[#103BE6]/30 to-indigo-300/25 blur-[105px] animate-liquid-3" />

        {/* Glowing Liquid Orb 4 - Accent Orange Sparkle */}
        <div className="absolute top-2/3 right-1/3 w-[450px] h-[450px] rounded-full bg-gradient-to-r from-[#FF5500]/20 via-amber-300/20 to-blue-300/25 blur-[95px] animate-liquid-1" />

        {/* Subtle Liquid Glass Mesh Reflection Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
          style={{
            backgroundImage: `radial-gradient(rgba(16, 59, 230, 0.8) 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10">
        {/* Top Header & Navigation Bar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          bankConfig={bankConfig}
          currentUser={{ name: auth.profile.name, role: 'Giáo viên' }}
          onLogout={auth.logout}
        />

        {/* Main Container */}
        <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-24 sm:pb-8">
        {/* Tab 0: Main Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <DashboardHome
            bills={bills}
            classes={classes}
            students={students}
            attendanceRecords={attendanceRecords}
            bankConfig={bankConfig}
            selectedMonth={selectedMonth}
            onNavigateTab={setActiveTab}
            onSelectTab={setActiveTab}
            onUpdateBillStatus={handleUpdateBillStatus}
          />
        )}

        {/* Tab 1: Tuition Calculator & Reminders View */}
        {activeTab === 'tuition' && (
          <TuitionReminders
            students={students}
            classes={classes}
            bills={bills}
            attendanceRecords={attendanceRecords}
            bankConfig={bankConfig}
            selectedMonth={selectedMonth}
            onUpdateBillStatus={handleUpdateBillStatus}
          />
        )}

        {/* Tab 2: Attendance Matrix Excel Layout */}
        {activeTab === 'attendance' && (
          <AttendanceMatrix
            classes={classes}
            students={students}
            attendanceRecords={attendanceRecords}
            bills={bills}
            bankConfig={bankConfig}
            selectedMonth={selectedMonth}
            onUpdateAttendance={handleUpdateAttendance}
            onAddClassSessionDate={handleAddClassSessionDate}
            onUpdateBillStatus={handleUpdateBillStatus}
          />
        )}

        {/* Tab 3: Parent Info & Profile Search */}
        {activeTab === 'parent' && (
          <ParentInfo
            students={students}
            classes={classes}
            bills={bills}
            attendanceRecords={attendanceRecords}
            bankConfig={bankConfig}
            selectedMonth={selectedMonth}
            onUpdateStudent={handleUpdateStudent}
            onAddStudent={handleAddStudent}
            onUpdateBillStatus={handleUpdateBillStatus}
          />
        )}

        {/* Tab 4: Class & Student Roster Management */}
        {activeTab === 'classes' && (
          <ClassManagement
            classes={classes}
            students={students}
            selectedMonth={selectedMonth}
            onAddClass={handleAddClass}
            onUpdateClass={handleUpdateClass}
            onDeleteClass={handleDeleteClass}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onSyncSchedule={handleSyncClassScheduleToAttendance}
          />
        )}

        {/* Tab 5: Bank VietQR & Class Schedule Settings */}
        {activeTab === 'settings' && (
          <BankSettings
            bankConfig={bankConfig}
            onSaveBankConfig={setBankConfig}
            classes={classes}
            students={students}
            selectedMonth={selectedMonth}
            onUpdateClass={handleUpdateClass}
            onSyncSchedule={handleSyncClassScheduleToAttendance}
          />
        )}
      </main>
      </div>
    </div>
  );
}
