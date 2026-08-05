import React, { useState } from 'react';
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
import { useTeacherData } from './hooks/useTeacherData';

import { BankConfig } from './types';

// Fallback khi BankConfig chưa từng được cấu hình (GET /api/bank-config trả null — chỉ xảy ra
// nếu DB chưa từng seed/PUT lần nào, xem server/README.md). Truyền object rỗng thay vì null để
// các component con (vốn coi bankConfig là required, không optional) không crash; BankSettings
// sẽ hiện đúng 1 form trống cho giáo viên điền lần đầu.
const EMPTY_BANK_CONFIG: BankConfig = {
  bankId: '',
  bankName: '',
  accountNumber: '',
  accountHolder: '',
  centerName: '',
  teacherName: '',
};

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
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-05');

  // Nguồn dữ liệu thật (Phase 2) — thay toàn bộ localStorage/mockData cũ. Gọi hook KHÔNG điều
  // kiện ở đây (Rules of Hooks), y hệt vị trí state mock cũ, dù đang ở màn login/portal thì hook
  // vẫn tự fetch bình thường — không ảnh hưởng gì, chỉ là dữ liệu chưa dùng tới.
  const teacherData = useTeacherData(
    selectedMonth,
    auth.status === 'authenticated' && auth.profile.role === 'TEACHER'
  );

  // Auth-gate: đặt SAU mọi hook ở trên, chỉ rẽ nhánh phần JSX render ra.
  if (auth.status === 'loading') {
    return <FullScreenStatus message="Đang kiểm tra đăng nhập..." />;
  }

  if (auth.status === 'anonymous') {
    return <LoginScreen onLoginTeacher={auth.loginTeacher} onLoginPortal={auth.loginPortal} />;
  }

  if (auth.profile.role === 'PORTAL') {
    return <PortalGate onLogout={auth.logout} />;
  }

  if (teacherData.loading) {
    return <FullScreenStatus message="Đang tải dữ liệu..." />;
  }

  if (teacherData.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/90 via-sky-50/70 to-slate-100 relative overflow-x-hidden font-sans text-slate-900 flex items-center justify-center px-4">
        <AmbientBackground />
        <div className="relative z-10 liquid-glass rounded-2xl px-6 py-6 max-w-sm w-full text-center space-y-4">
          <p className="text-sm font-semibold text-rose-700">{teacherData.error}</p>
          <button
            onClick={() => teacherData.reload()}
            className="liquid-glass-btn-primary px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const bankConfig = teacherData.bankConfig ?? EMPTY_BANK_CONFIG;

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
            bills={teacherData.bills}
            classes={teacherData.classes}
            students={teacherData.students}
            attendanceRecords={teacherData.attendanceRecords}
            bankConfig={bankConfig}
            selectedMonth={selectedMonth}
            onNavigateTab={setActiveTab}
            onSelectTab={setActiveTab}
            onUpdateBillStatus={teacherData.updateBillStatus}
          />
        )}

        {/* Tab 1: Tuition Calculator & Reminders View */}
        {activeTab === 'tuition' && (
          <TuitionReminders
            students={teacherData.students}
            classes={teacherData.classes}
            bills={teacherData.bills}
            attendanceRecords={teacherData.attendanceRecords}
            bankConfig={bankConfig}
            selectedMonth={selectedMonth}
            onUpdateBillStatus={teacherData.updateBillStatus}
          />
        )}

        {/* Tab 2: Attendance Matrix Excel Layout */}
        {activeTab === 'attendance' && (
          <AttendanceMatrix
            classes={teacherData.classes}
            students={teacherData.students}
            attendanceRecords={teacherData.attendanceRecords}
            bills={teacherData.bills}
            bankConfig={bankConfig}
            selectedMonth={selectedMonth}
            onUpdateAttendance={teacherData.upsertAttendance}
            onAddClassSessionDate={teacherData.addSessionDate}
            onUpdateBillStatus={teacherData.updateBillStatus}
          />
        )}

        {/* Tab 3: Parent Info & Profile Search */}
        {activeTab === 'parent' && (
          <ParentInfo
            students={teacherData.students}
            classes={teacherData.classes}
            bills={teacherData.bills}
            attendanceRecords={teacherData.attendanceRecords}
            bankConfig={bankConfig}
            selectedMonth={selectedMonth}
            onUpdateStudent={teacherData.updateStudent}
            onAddStudent={teacherData.createStudent}
            onUpdateBillStatus={teacherData.updateBillStatus}
          />
        )}

        {/* Tab 4: Class & Student Roster Management */}
        {activeTab === 'classes' && (
          <ClassManagement
            classes={teacherData.classes}
            students={teacherData.students}
            selectedMonth={selectedMonth}
            onAddClass={teacherData.createClass}
            onUpdateClass={teacherData.updateClass}
            onDeleteClass={teacherData.deleteClass}
            onAddStudent={teacherData.createStudent}
            onUpdateStudent={teacherData.updateStudent}
            onDeleteStudent={teacherData.deleteStudent}
            onSyncSchedule={teacherData.syncSchedule}
          />
        )}

        {/* Tab 5: Bank VietQR & Class Schedule Settings */}
        {activeTab === 'settings' && (
          <BankSettings
            bankConfig={bankConfig}
            onSaveBankConfig={teacherData.saveBankConfig}
            classes={teacherData.classes}
            students={teacherData.students}
            selectedMonth={selectedMonth}
            onUpdateClass={teacherData.updateClass}
            onSyncSchedule={teacherData.syncSchedule}
          />
        )}
      </main>
      </div>
    </div>
  );
}
