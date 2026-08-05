import React, { useState } from 'react';
import { Target, TrendingUp, AlertCircle, CheckCircle2, BookOpen, Users, ArrowUpRight, QrCode, CalendarCheck, CreditCard, ChevronRight, Eye, Calendar as CalendarIcon, Clock, MapPin, ChevronLeft, Sparkles, Filter, Check } from 'lucide-react';
import { TuitionBill, EnglishClass, Student, BankConfig, AttendanceRecord } from '../types';
import { formatVND } from '../utils/vietqr';
import { QrModal } from './QrModal';
import { AttendedSessionsModal } from './AttendedSessionsModal';

interface DashboardHomeProps {
  bills: TuitionBill[];
  classes: EnglishClass[];
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  bankConfig: BankConfig;
  selectedMonth: string;
  onNavigateTab?: (tab: 'dashboard' | 'tuition' | 'attendance' | 'parent' | 'classes' | 'settings') => void;
  onSelectTab?: (tab: 'dashboard' | 'tuition' | 'attendance' | 'parent' | 'classes' | 'settings') => void;
  onOpenQrModal?: (student: Student, englishClass: EnglishClass, bill: TuitionBill) => void;
  onUpdateBillStatus?: (billId: string, newStatus: 'paid' | 'unpaid') => Promise<void>;
}

const DAYS_OF_WEEK_CONFIG = [
  { val: 1, name: 'Thứ 2', short: 'T2' },
  { val: 2, name: 'Thứ 3', short: 'T3' },
  { val: 3, name: 'Thứ 4', short: 'T4' },
  { val: 4, name: 'Thứ 5', short: 'T5' },
  { val: 5, name: 'Thứ 6', short: 'T6' },
  { val: 6, name: 'Thứ 7', short: 'T7' },
  { val: 0, name: 'Chủ Nhật', short: 'CN' },
];

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  bills = [],
  classes = [],
  students = [],
  attendanceRecords = [],
  bankConfig,
  selectedMonth,
  onNavigateTab,
  onSelectTab,
  onOpenQrModal,
  onUpdateBillStatus,
}) => {
  const [scheduleViewMode, setScheduleViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  const [qrModalStudent, setQrModalStudent] = useState<{
    student: Student;
    englishClass: EnglishClass;
    bill: TuitionBill;
  } | null>(null);

  const [sessionModalData, setSessionModalData] = useState<{
    student: Student;
    englishClass: EnglishClass;
  } | null>(null);

  const handleNavigate = (tab: 'dashboard' | 'tuition' | 'attendance' | 'parent' | 'classes' | 'settings') => {
    if (onNavigateTab) onNavigateTab(tab);
    else if (onSelectTab) onSelectTab(tab);
  };

  const totalTargetRevenue = bills.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalCollected = bills
    .filter((b) => b.paidStatus === 'paid')
    .reduce((sum, b) => sum + b.totalAmount, 0);
  const outstandingDebt = totalTargetRevenue - totalCollected;

  const paidCount = bills.filter((b) => b.paidStatus === 'paid').length;
  const unpaidBills = bills.filter((b) => b.paidStatus === 'unpaid');

  const totalSessionsTaught = attendanceRecords.filter((a) => a.status === 'present').length;
  const collectionRate = totalTargetRevenue > 0 ? Math.round((totalCollected / totalTargetRevenue) * 100) : 0;

  const handleQrClick = (student: Student, englishClass: EnglishClass, bill: TuitionBill) => {
    if (onOpenQrModal) {
      onOpenQrModal(student, englishClass, bill);
    } else {
      setQrModalStudent({ student, englishClass, bill });
    }
  };

  // Determine current day of week (0=Sun, 1=Mon, ..., 6=Sat)
  const currentDayOfWeek = new Date().getDay();

  // Month Parsing for Calendar View (e.g., "THÁNG 5" or "2026-05")
  let currentYear = 2026;
  let currentMonthNum = 5; // 1-indexed
  if (selectedMonth.includes('-')) {
    const parts = selectedMonth.split('-');
    currentYear = parseInt(parts[0], 10) || 2026;
    currentMonthNum = parseInt(parts[1], 10) || 5;
  } else {
    const match = selectedMonth.match(/\d+/);
    if (match) currentMonthNum = parseInt(match[0], 10);
  }

  // Days in selected month
  const daysInMonthCount = new Date(currentYear, currentMonthNum, 0).getDate();
  const firstDayOfMonthObj = new Date(currentYear, currentMonthNum - 1, 1);
  const firstDayOfWeek = firstDayOfMonthObj.getDay(); // 0 = Sun
  const monthStartOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Mon = 0 offset

  return (
    <div className="space-y-6">
      {/* Welcome & System Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#09185B] via-[#0E2480] to-[#06103D] text-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-blue-500/30">
        {/* Glow ambient background effects */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-[#FF5500]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-[#103BE6]/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2 sm:space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-1.5 sm:space-x-2 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-[#103BE6]/40 text-white border border-blue-400/40 backdrop-blur">
              <span className="w-2 h-2 rounded-full bg-[#FF5500] animate-pulse" />
              <span className="text-white font-bold tracking-wide truncate">LIGHTED SYSTEM DASHBOARD ({selectedMonth})</span>
            </div>
            
            <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white flex items-center flex-wrap gap-x-1.5 sm:gap-x-2 leading-tight">
              <span>Tổng Quan Trung Tâm Anh Ngữ</span>
              <span className="text-[#FF5500] font-black">Light</span>
              <span className="bg-[#103BE6] text-white px-1.5 sm:px-2 py-0.5 rounded-lg text-lg sm:text-2xl font-black border border-white/20">ED</span>
            </h2>

            <p className="text-[11px] sm:text-sm text-blue-100 font-medium leading-relaxed">
              Theo dõi lịch dạy giáo viên, điểm danh tự động theo buổi và khởi tạo mã VietQR Napas247 gửi phụ huynh nhanh chóng.
            </p>
          </div>

          {/* Quick Stat Pill */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0 space-y-2 min-w-full sm:min-w-[230px] shadow-lg">
            <div className="flex justify-between items-center text-xs text-blue-100">
              <span className="font-semibold">Tỷ lệ hoàn thành thu</span>
              <span className="text-[#FF5500] font-black text-sm">{collectionRate}%</span>
            </div>
            <div className="w-full bg-slate-900/80 h-2.5 sm:h-3 rounded-full overflow-hidden p-0.5 border border-white/15">
              <div
                className="bg-gradient-to-r from-[#FF5500] to-amber-400 h-full rounded-full transition-all duration-700 shadow-xs"
                style={{ width: `${Math.min(100, collectionRate)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] sm:text-[11px] text-blue-200 font-medium">
              <span>Đã thu: <strong className="text-white">{paidCount}/{bills.length} HS</strong></span>
              <span>Còn nợ: <strong className="text-rose-300">{unpaidBills.length} HS</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {/* Metric 1 */}
        <div className="liquid-glass liquid-glass-interactive p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl flex flex-col justify-between">
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-[#103BE6] mb-1.5 sm:mb-2">
            <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#103BE6]" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Mục Tiêu Thu</span>
          </div>
          <div>
            <div className="text-sm sm:text-2xl font-black text-slate-900 tracking-tight">
              {formatVND(totalTargetRevenue)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 font-medium truncate">Dự kiến từ {students.length} học sinh</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="liquid-glass-accent liquid-glass-interactive p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl flex flex-col justify-between">
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-emerald-700 mb-1.5 sm:mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-800">Thực Thu</span>
          </div>
          <div>
            <div className="text-sm sm:text-2xl font-black text-emerald-700 tracking-tight">
              {formatVND(totalCollected)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-emerald-800/80 mt-0.5 font-medium truncate">Đã nhận chuyển khoản</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="liquid-glass liquid-glass-interactive p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-rose-50/50 border-rose-200/80 flex flex-col justify-between">
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-rose-700 mb-1.5 sm:mb-2">
            <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-800">Nợ Đọng</span>
          </div>
          <div>
            <div className="text-sm sm:text-2xl font-black text-rose-700 tracking-tight">
              {formatVND(outstandingDebt)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-rose-800/80 mt-0.5 font-medium truncate">Cần nhắc đóng học phí</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="liquid-glass liquid-glass-interactive p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl flex flex-col justify-between">
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-[#103BE6] mb-1.5 sm:mb-2">
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#103BE6]" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Lớp Học</span>
          </div>
          <div>
            <div className="text-sm sm:text-2xl font-black text-slate-900 tracking-tight">
              {classes.length} Lớp
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 font-medium truncate">{students.length} học sinh đang học</p>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="liquid-glass-accent liquid-glass-interactive p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-[#103BE6] mb-1.5 sm:mb-2">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#103BE6]" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-900">Buổi Đã Dạy</span>
          </div>
          <div>
            <div className="text-sm sm:text-2xl font-black text-indigo-900 tracking-tight">
              {totalSessionsTaught} Buổi
            </div>
            <p className="text-[10px] sm:text-[11px] text-indigo-700 mt-0.5 font-medium truncate">Tích lũy điểm danh kỳ này</p>
          </div>
        </div>
      </div>

      {/* Feature Section 2: Teacher's Schedule Calendar (Lịch Dạy Giáo Viên) */}
      <div className="liquid-glass rounded-3xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>Lịch Dạy Học Giáo Viên</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-100 text-indigo-800">
                  {selectedMonth}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Thời khóa biểu tuần & lịch tháng gọn gàng, bấm ngày để xem chi tiết
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setScheduleViewMode('weekly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                scheduleViewMode === 'weekly'
                  ? 'bg-white text-indigo-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🗓️ Lịch Tuần
            </button>
            <button
              onClick={() => setScheduleViewMode('monthly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                scheduleViewMode === 'monthly'
                  ? 'bg-white text-indigo-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📆 Lịch Tháng
            </button>
          </div>
        </div>

        {/* View 1: Compact Weekly Timetable View */}
        {scheduleViewMode === 'weekly' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5">
            {DAYS_OF_WEEK_CONFIG.map((dayObj) => {
              const isToday = currentDayOfWeek === dayObj.val;
              const scheduledClasses = classes.filter((c) => {
                const days = c.daysOfWeek && c.daysOfWeek.length > 0 ? c.daysOfWeek : [1, 3, 5];
                return days.includes(dayObj.val);
              });

              return (
                <div
                  key={dayObj.val}
                  className={`rounded-xl border p-2.5 flex flex-col justify-between transition ${
                    isToday
                      ? 'bg-indigo-50/90 border-indigo-400 ring-2 ring-indigo-400/20 shadow-2xs'
                      : 'bg-slate-50/50 border-slate-200/90 hover:bg-white hover:shadow-2xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-200/60">
                      <span className={`text-xs font-extrabold ${isToday ? 'text-indigo-950' : 'text-slate-800'}`}>
                        {dayObj.name}
                      </span>
                      {isToday && (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-indigo-600 text-white shadow-2xs">
                          HÔM NAY
                        </span>
                      )}
                    </div>

                    {scheduledClasses.length === 0 ? (
                      <div className="text-[11px] text-slate-400 italic py-3 text-center">
                        Nghỉ
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {scheduledClasses.map((cls) => {
                          const classStudentCount = students.filter((s) => s.classId === cls.id).length;

                          return (
                            <div
                              key={cls.id}
                              className="bg-white p-2 rounded-lg border border-slate-200/90 shadow-2xs text-xs space-y-1 hover:border-indigo-300 transition"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-slate-900 text-[11px] truncate max-w-[90px]">
                                  {cls.name}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1 py-0.2 rounded">
                                  {classStudentCount} HS
                                </span>
                              </div>

                              <div className="text-[10px] text-indigo-700 font-bold flex items-center space-x-1">
                                <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                                <span className="truncate">{cls.scheduleTime || '18:00 - 19:30'}</span>
                              </div>

                              <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                                <MapPin className="w-3 h-3 text-purple-500 shrink-0" />
                                <span className="truncate">{cls.room || 'P.201'}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {scheduledClasses.length > 0 && (
                    <button
                      onClick={() => handleNavigate('attendance')}
                      className="mt-2.5 w-full py-1 text-[10px] font-bold text-indigo-700 bg-indigo-100/70 hover:bg-indigo-600 hover:text-white rounded-md transition flex items-center justify-center space-x-0.5 cursor-pointer"
                    >
                      <span>Điểm danh</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* View 2: Compact Monthly Calendar View */}
        {scheduleViewMode === 'monthly' && (
          <div className="space-y-2.5">
            {/* Header Days */}
            <div className="grid grid-cols-7 gap-1 text-center font-extrabold text-[11px] text-slate-600 bg-slate-100/80 p-1.5 rounded-xl">
              <div>T2</div>
              <div>T3</div>
              <div>T4</div>
              <div>T5</div>
              <div>T6</div>
              <div>T7</div>
              <div>CN</div>
            </div>

            {/* Grid Days */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {/* Offset blank cells */}
              {Array.from({ length: monthStartOffset }).map((_, idx) => (
                <div key={`empty-${idx}`} className="bg-slate-50/20 rounded-xl min-h-[62px] sm:min-h-[68px] border border-dashed border-slate-200/50" />
              ))}

              {/* Day cells for month */}
              {Array.from({ length: daysInMonthCount }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateObj = new Date(currentYear, currentMonthNum - 1, dayNum);
                const dayOfWeek = dateObj.getDay();

                const yyyy = dateObj.getFullYear();
                const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                const dd = String(dateObj.getDate()).padStart(2, '0');
                const fullDateStr = `${yyyy}-${mm}-${dd}`;

                // Check if this day is today
                const now = new Date();
                const isRealToday =
                  now.getDate() === dayNum &&
                  now.getMonth() + 1 === currentMonthNum &&
                  now.getFullYear() === currentYear;

                const dayClasses = classes.filter((c) => {
                  const days = c.daysOfWeek && c.daysOfWeek.length > 0 ? c.daysOfWeek : [1, 3, 5];
                  return days.includes(dayOfWeek);
                });

                const isSelected = selectedCalendarDate === fullDateStr;

                return (
                  <div
                    key={dayNum}
                    onClick={() => setSelectedCalendarDate(fullDateStr)}
                    className={`p-1.5 sm:p-2 rounded-xl border min-h-[62px] sm:min-h-[68px] transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-400/30 shadow-2xs'
                        : isRealToday
                        ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/30 shadow-2xs'
                        : dayClasses.length > 0
                        ? 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-2xs'
                        : 'bg-slate-50/50 border-slate-100'
                    }`}
                  >
                    {/* Header line inside card */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs ${
                          isRealToday
                            ? 'w-5 h-5 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center text-[10px] shadow-2xs'
                            : dayClasses.length > 0
                            ? 'font-bold text-slate-900'
                            : 'font-medium text-slate-400'
                        }`}
                      >
                        {dayNum}
                      </span>

                      {isRealToday && (
                        <span className="text-[9px] font-extrabold text-amber-800 bg-amber-200/90 px-1 rounded-sm shadow-2xs">
                          H.NAY
                        </span>
                      )}
                    </div>

                    {/* Class Info Content */}
                    <div className="mt-1 space-y-0.5">
                      {dayClasses.length === 1 && (
                        <div
                          className="text-[10px] font-bold text-indigo-900 bg-indigo-50 border border-indigo-200/70 px-1.5 py-0.5 rounded-md truncate"
                          title={dayClasses[0].name}
                        >
                          {dayClasses[0].name}
                        </div>
                      )}

                      {dayClasses.length === 2 && (
                        <>
                          <div
                            className="text-[9px] font-extrabold text-indigo-900 bg-indigo-50 border border-indigo-200/60 px-1 py-0.2 rounded truncate"
                            title={dayClasses[0].name}
                          >
                            {dayClasses[0].name}
                          </div>
                          <div
                            className="text-[9px] font-extrabold text-indigo-800 bg-slate-100/80 border border-slate-200/60 px-1 py-0.2 rounded truncate"
                            title={dayClasses[1].name}
                          >
                            {dayClasses[1].name}
                          </div>
                        </>
                      )}

                      {dayClasses.length > 2 && (
                        <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200/80 rounded-md p-0.5 px-1.5">
                          <span className="text-[10px] font-bold text-indigo-950 truncate max-w-[50px] sm:max-w-[70px]">
                            {dayClasses[0].name}
                          </span>
                          <span className="text-[9px] font-black text-indigo-700 bg-indigo-200/80 px-1 rounded-sm shrink-0">
                            +{dayClasses.length - 1}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Date Detail Drawer */}
            {selectedCalendarDate && (
              <div className="p-3.5 bg-indigo-50/90 rounded-2xl border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-indigo-950 flex items-center space-x-2">
                    <CalendarIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Chi Tiết Lịch Dạy Ngày <strong className="text-indigo-700">{selectedCalendarDate}</strong>:</span>
                  </div>
                  <div className="text-xs text-indigo-800 font-medium">
                    {classes.filter((c) => {
                      const dayOfWeek = new Date(selectedCalendarDate).getDay();
                      const days = c.daysOfWeek && c.daysOfWeek.length > 0 ? c.daysOfWeek : [1, 3, 5];
                      return days.includes(dayOfWeek);
                    }).length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {classes
                          .filter((c) => {
                            const dayOfWeek = new Date(selectedCalendarDate).getDay();
                            const days = c.daysOfWeek && c.daysOfWeek.length > 0 ? c.daysOfWeek : [1, 3, 5];
                            return days.includes(dayOfWeek);
                          })
                          .map((c) => (
                            <span key={c.id} className="px-2.5 py-1 bg-white rounded-lg border border-indigo-200 font-extrabold text-indigo-900 text-[11px] shadow-2xs">
                              Lớp {c.name} • {c.scheduleTime || '18:00 - 19:30'} • {c.room || 'Phòng 201'}
                            </span>
                          ))}
                      </div>
                    ) : (
                      <span className="italic text-slate-500">Không có ca dạy nào trong ngày này.</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleNavigate('attendance')}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-2xs shrink-0 flex items-center space-x-1.5 cursor-pointer"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>Điểm danh ngay</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => handleNavigate('tuition')}
          className="p-5 liquid-glass liquid-glass-interactive rounded-3xl flex items-center justify-between text-left group cursor-pointer"
        >
          <div className="space-y-1">
            <div className="p-2.5 w-fit rounded-2xl bg-indigo-500/15 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition">
              <CreditCard className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 pt-2">Tính Học Phí & VietQR</h4>
            <p className="text-[11px] text-slate-500">Tự động tính theo buổi & tạo mã QR</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition" />
        </button>

        <button
          onClick={() => handleNavigate('attendance')}
          className="p-5 liquid-glass liquid-glass-interactive rounded-3xl flex items-center justify-between text-left group cursor-pointer"
        >
          <div className="space-y-1">
            <div className="p-2.5 w-fit rounded-2xl bg-emerald-500/15 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 pt-2">Bảng Điểm Danh</h4>
            <p className="text-[11px] text-slate-500">Điểm danh từng buổi & theo dõi sĩ số</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition" />
        </button>

        <button
          onClick={() => handleNavigate('parent')}
          className="p-5 liquid-glass liquid-glass-interactive rounded-3xl flex items-center justify-between text-left group cursor-pointer"
        >
          <div className="space-y-1">
            <div className="p-2.5 w-fit rounded-2xl bg-blue-500/15 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 pt-2">Thông Tin Phụ Huynh</h4>
            <p className="text-[11px] text-slate-500">Quản lý hồ sơ, SĐT & định hướng</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition" />
        </button>

        <button
          onClick={() => handleNavigate('classes')}
          className="p-5 liquid-glass liquid-glass-interactive rounded-3xl flex items-center justify-between text-left group cursor-pointer"
        >
          <div className="space-y-1">
            <div className="p-2.5 w-fit rounded-2xl bg-purple-500/15 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition">
              <BookOpen className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 pt-2">Quản Lý Lớp & Học Sinh</h4>
            <p className="text-[11px] text-slate-500">Xem nhật ký bài học & lịch sử</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 transition" />
        </button>
      </div>

      {/* Unpaid Tuition Action Section */}
      <div className="liquid-glass rounded-3xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <span>Cần Đóng Học Phí Ngay ({unpaidBills.length} Học Sinh)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tạo nhanh mã VietQR Napas247 kèm tin nhắn tự động để gửi phụ huynh qua Zalo.
            </p>
          </div>

          <button
            onClick={() => handleNavigate('tuition')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
          >
            <span>Xem tất cả ({bills.length})</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3 px-4">HỌC SINH</th>
                <th className="py-3 px-4">LỚP HỌC</th>
                <th className="py-3 px-4">PHỤ HUYNH & SĐT</th>
                <th className="py-3 px-4 text-center">SỐ BUỔI</th>
                <th className="py-3 px-4 text-right">TỔNG HỌC PHÍ</th>
                <th className="py-3 px-4 text-center">THAO TÁC VIETQR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {unpaidBills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    🎉 Tất cả học sinh đã hoàn thành đóng học phí tháng này!
                  </td>
                </tr>
              ) : (
                unpaidBills.map((bill) => {
                  const student = students.find((s) => s.id === bill.studentId);
                  const englishClass = classes.find((c) => c.id === bill.classId);
                  if (!student || !englishClass) return null;

                  return (
                    <tr key={bill.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{student.name}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800">
                          {englishClass.name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div>{student.parentName || '—'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{student.phone || '—'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSessionModalData({ student, englishClass })}
                          className="px-3 py-1.5 rounded-xl font-extrabold text-xs bg-emerald-100 text-emerald-900 hover:bg-emerald-200 transition flex items-center space-x-1.5 mx-auto border border-emerald-300 cursor-pointer shadow-2xs"
                          title="Bấm để xem chi tiết danh sách từng ngày học"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{bill.totalAttendedSessions} buổi</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                        {formatVND(bill.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleQrClick(student, englishClass, bill)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 mx-auto cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Xuất VietQR & Nhắc Phí</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attended Sessions Modal */}
      {sessionModalData && (
        <AttendedSessionsModal
          isOpen={!!sessionModalData}
          onClose={() => setSessionModalData(null)}
          student={sessionModalData.student}
          englishClass={sessionModalData.englishClass}
          attendanceRecords={attendanceRecords}
          selectedMonth={selectedMonth}
        />
      )}

      {/* VietQR Modal */}
      {qrModalStudent && (
        <QrModal
          isOpen={!!qrModalStudent}
          onClose={() => setQrModalStudent(null)}
          student={qrModalStudent.student}
          englishClass={qrModalStudent.englishClass}
          bill={qrModalStudent.bill}
          bankConfig={bankConfig}
          selectedMonth={selectedMonth}
          onTogglePaidStatus={async (billId, newStatus) => {
            if (onUpdateBillStatus) {
              await onUpdateBillStatus(billId, newStatus);
            }
            setQrModalStudent((prev) =>
              prev ? { ...prev, bill: { ...prev.bill, paidStatus: newStatus } } : null
            );
          }}
        />
      )}
    </div>
  );
};
