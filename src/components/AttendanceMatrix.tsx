import React, { useState } from 'react';
import { CalendarCheck, Plus, Check, X, AlertCircle, Edit2, ChevronRight, ChevronLeft, ChevronDown, MessageSquare, Copy, Sparkles, BookOpen, Clock, CheckCircle2, XCircle, FileText, LayoutGrid, Calendar, Eye } from 'lucide-react';
import { Student, EnglishClass, AttendanceRecord, BankConfig, TuitionBill } from '../types';
import { formatVND, buildReminderMessage, parseDateToDDMM } from '../utils/vietqr';
import { AttendedSessionsModal } from './AttendedSessionsModal';

interface AttendanceMatrixProps {
  classes: EnglishClass[];
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  bills: TuitionBill[];
  bankConfig: BankConfig;
  selectedMonth: string;
  onUpdateAttendance: (studentId: string, date: string, status: 'present' | 'excused' | 'unexcused' | 'holiday', topic?: string) => Promise<void>;
  onAddClassSessionDate: (classId: string, date: string) => Promise<unknown>;
  onUpdateBillStatus: (billId: string, newStatus: 'paid' | 'unpaid') => Promise<void>;
}

export const AttendanceMatrix: React.FC<AttendanceMatrixProps> = ({
  classes = [],
  students = [],
  attendanceRecords = [],
  bills = [],
  bankConfig,
  selectedMonth,
  onUpdateAttendance,
  onAddClassSessionDate,
  onUpdateBillStatus,
}) => {
  const [activeClassId, setActiveClassId] = useState<string>(classes[0]?.id || '');
  const [newSessionDate, setNewSessionDate] = useState<string>('2026-05-30');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // View Mode: Session View vs Matrix Spreadsheet View
  const [viewMode, setViewMode] = useState<'session' | 'matrix'>('session');

  // Selected Session Date for Session View
  const classRecords = attendanceRecords.filter((a) => a.classId === activeClassId);
  const distinctDates: string[] = Array.from(new Set<string>(classRecords.map((r) => r.date))).sort();
  const [selectedSessionDate, setSelectedSessionDate] = useState<string>(distinctDates[distinctDates.length - 1] || '2026-05-05');

  const [sessionModalData, setSessionModalData] = useState<{
    student: Student;
    englishClass: EnglishClass;
  } | null>(null);

  // Lỗi thao tác (điểm danh/thêm buổi/đổi trạng thái thu tiền thất bại) — hiện banner chung 1 chỗ
  // thay vì lặp try/catch riêng ở từng nơi gọi.
  const [actionError, setActionError] = useState<string | null>(null);

  const selectedClass = classes.find((c) => c.id === activeClassId) || classes[0];
  const classStudents = students.filter((s) => s.classId === activeClassId);

  // Tab Dashboard Metrics (Feedback #5)
  const totalClassStudents = classStudents.length;
  const totalSessionsCount = distinctDates.length;

  const totalPresentRecords = classRecords.filter((r) => r.status === 'present').length;
  const totalPossibleRecords = totalClassStudents * totalSessionsCount || 1;
  const attendanceRate = Math.round((totalPresentRecords / totalPossibleRecords) * 100) || 0;

  const handleMarkAttendance = async (
    studentId: string,
    date: string,
    status: 'present' | 'excused' | 'unexcused' | 'holiday'
  ) => {
    setActionError(null);
    try {
      await onUpdateAttendance(studentId, date, status);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không cập nhật được điểm danh.');
    }
  };

  const handleToggleBillStatus = async (billId: string, newStatus: 'paid' | 'unpaid') => {
    setActionError(null);
    try {
      await onUpdateBillStatus(billId, newStatus);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không cập nhật được trạng thái thanh toán.');
    }
  };

  const handleQuickAddSession = async () => {
    if (!newSessionDate) return;
    setActionError(null);
    try {
      await onAddClassSessionDate(activeClassId, newSessionDate);
      setSelectedSessionDate(newSessionDate);
      // Auto increment day for convenience
      const current = new Date(newSessionDate);
      current.setDate(current.getDate() + 2);
      setNewSessionDate(current.toISOString().split('T')[0]);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không thêm được buổi học.');
    }
  };

  const handleCopyMessageRow = (student: Student, bill: TuitionBill, idx: number) => {
    if (!selectedClass) return;
    const msg = buildReminderMessage(student, selectedClass, bill, bankConfig, selectedMonth);
    navigator.clipboard.writeText(msg);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Error Banner — vd ghi điểm danh/thêm buổi/đổi trạng thái thu tiền thất bại */}
      {actionError && (
        <div className="bg-rose-50 text-rose-700 border border-rose-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <span className="text-xs sm:text-sm font-bold">{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="text-xs font-bold underline text-rose-700 hover:text-rose-900 px-2 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Tab Dedicated Dashboard Bar (Feedback #5 & #7) */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-indigo-800/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>DASHBOARD ĐIỂM DANH THEO TỪNG BUỔI HỌC</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-2">
              Quản Lý Buổi Học & Chuyên Cần
            </h2>
            <p className="text-xs text-indigo-200 mt-1">
              Điểm danh từng buổi học (Có mặt / Vắng có phép / Vắng), ghi nhận nội dung bài giảng & bài tập về nhà.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-white/10 p-1 rounded-2xl border border-white/10 text-xs font-bold shrink-0">
            <button
              onClick={() => setViewMode('session')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 cursor-pointer ${
                viewMode === 'session' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-200 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Điểm Danh Theo Buổi</span>
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 cursor-pointer ${
                viewMode === 'matrix' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-200 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Ma Trận Excel Tổng Thể</span>
            </button>
          </div>
        </div>

        {/* Tab Dashboard Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-indigo-200 block font-medium">Sĩ Số Lớp Hiện Tại</span>
            <span className="text-lg sm:text-xl font-extrabold text-white">{totalClassStudents} Học sinh</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-indigo-200 block font-medium">Số Buổi Đã Dạy Tháng</span>
            <span className="text-lg sm:text-xl font-extrabold text-emerald-400">{totalSessionsCount} Buổi</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-indigo-200 block font-medium">Tỷ Lệ Chuyên Cần</span>
            <span className="text-lg sm:text-xl font-extrabold text-amber-300">{attendanceRate}%</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-indigo-200 block font-medium">Đơn Giá Lớp</span>
            <span className="text-lg sm:text-xl font-extrabold text-indigo-200">
              {selectedClass ? formatVND(selectedClass.pricePerSession) : '0đ'} / buổi
            </span>
          </div>
        </div>
      </div>

      {/* Class Switcher Bar */}
      <div className="liquid-glass p-4 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chọn Lớp:</span>
          <div className="flex overflow-x-auto space-x-1.5 p-1 bg-slate-100/80 rounded-2xl no-scrollbar">
            {classes.map((cls) => {
              const clsStudentCount = students.filter((s) => s.classId === cls.id).length;
              const isActive = cls.id === activeClassId;
              return (
                <button
                  key={cls.id}
                  onClick={() => {
                    setActiveClassId(cls.id);
                    const records = attendanceRecords.filter((a) => a.classId === cls.id);
                    const dates = Array.from(new Set<string>(records.map((r) => r.date))).sort();
                    if (dates.length > 0) setSelectedSessionDate(dates[dates.length - 1]);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {cls.name} ({clsStudentCount} HS)
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Add Session Date */}
        <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-600 pl-2">Thêm ngày học:</span>
          <input
            type="date"
            value={newSessionDate}
            onChange={(e) => setNewSessionDate(e.target.value)}
            className="bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-2.5 py-1 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleQuickAddSession}
            className="flex items-center space-x-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: SESSION-BASED ATTENDANCE (Feedback #7) */}
      {viewMode === 'session' && (
        <div className="space-y-6">
          {/* Session Selector & Topic Banner */}
          <div className="liquid-glass rounded-3xl p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                  <span>Điểm Danh Theo Buổi - Lớp {selectedClass.name}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chọn ngày học bên dưới để ghi nhận học sinh có mặt/vắng.
                </p>
              </div>

              {/* Compact Session Selector Bar */}
              <div className="flex items-center space-x-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80">
                {/* Previous session button */}
                <button
                  disabled={distinctDates.indexOf(selectedSessionDate) <= 0}
                  onClick={() => {
                    const idx = distinctDates.indexOf(selectedSessionDate);
                    if (idx > 0) setSelectedSessionDate(distinctDates[idx - 1]);
                  }}
                  className="p-1.5 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl border border-slate-200/80 shadow-2xs transition cursor-pointer"
                  title="Buổi học trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Dropdown Select */}
                <div className="relative">
                  <select
                    value={selectedSessionDate}
                    onChange={(e) => setSelectedSessionDate(e.target.value)}
                    className="appearance-none bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs transition"
                  >
                    {distinctDates.map((date, idx) => (
                      <option key={date} value={date} className="bg-slate-900 text-white font-medium">
                        Buổi {idx + 1} ({parseDateToDDMM(date)})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-indigo-100 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Next session button */}
                <button
                  disabled={distinctDates.indexOf(selectedSessionDate) >= distinctDates.length - 1}
                  onClick={() => {
                    const idx = distinctDates.indexOf(selectedSessionDate);
                    if (idx < distinctDates.length - 1) setSelectedSessionDate(distinctDates[idx + 1]);
                  }}
                  className="p-1.5 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl border border-slate-200/80 shadow-2xs transition cursor-pointer"
                  title="Buổi học kế tiếp"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Compact Horizontal Quick Pills (No Scrollbar) */}
                <div className="hidden sm:flex items-center space-x-1 pl-2 border-l border-slate-300/80 overflow-x-auto max-w-xs md:max-w-md lg:max-w-lg [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                  {distinctDates.map((date, idx) => {
                    const isSelected = selectedSessionDate === date;
                    return (
                      <button
                        key={date}
                        onClick={() => setSelectedSessionDate(date)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                        }`}
                      >
                        B{idx + 1} ({parseDateToDDMM(date)})
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Student List for Selected Session */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-extrabold text-slate-900">
                  Danh Sách Điểm Danh — Buổi Học {parseDateToDDMM(selectedSessionDate)}
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                  {classStudents.length} Học Sinh
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {classStudents.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  Chưa có học sinh trong lớp này.
                </div>
              ) : (
                classStudents.map((std, idx) => {
                  const record = attendanceRecords.find(
                    (r) => r.studentId === std.id && r.date === selectedSessionDate
                  );
                  const status = record?.status || 'unexcused';

                  return (
                    <div
                      key={std.id}
                      className="p-4 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      {/* Student Details */}
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-bold text-slate-400 w-6 text-center">{idx + 1}</span>
                        <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-800 font-extrabold flex items-center justify-center text-sm">
                          {std.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-extrabold text-slate-900">{std.name}</div>
                          <div className="text-[11px] text-slate-500">
                            PH: {std.parentName || 'Chưa cập nhật'} • SĐT: {std.phone}
                          </div>
                        </div>
                      </div>

                      {/* Status Selection Buttons per Student (Page 2 Feedback #7) */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleMarkAttendance(std.id, selectedSessionDate, 'present')}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center space-x-1 cursor-pointer ${
                            status === 'present'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Có Mặt</span>
                        </button>

                        <button
                          onClick={() => handleMarkAttendance(std.id, selectedSessionDate, 'excused')}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center space-x-1 cursor-pointer ${
                            status === 'excused'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Vắng Có Phép</span>
                        </button>

                        <button
                          onClick={() => handleMarkAttendance(std.id, selectedSessionDate, 'unexcused')}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center space-x-1 cursor-pointer ${
                            status === 'unexcused'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Vắng</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: SPREADSHEET MATRIX EXCEL VIEW */}
      {viewMode === 'matrix' && (
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
          {/* Mobile Swipe Hint */}
          <div className="sm:hidden bg-[#103BE6]/10 px-3 py-1.5 text-[11px] font-bold text-[#103BE6] flex items-center justify-between border-b border-[#103BE6]/20">
            <span>👈 Vuốt ngang để xem các ngày điểm danh</span>
            <span className="text-[10px] text-slate-500 font-normal">Tự động tính học phí</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 border border-slate-800 text-center w-10">LỚP</th>
                  <th className="py-3 px-3 border border-slate-800 min-w-[130px] sm:min-w-[150px] sticky left-0 bg-slate-900 z-20 shadow-r">HỌC SINH</th>
                  
                  {distinctDates.map((d, index) => (
                    <th
                      key={d}
                      className="py-2 px-2 border border-slate-800 text-center min-w-[70px] sm:min-w-[75px]"
                    >
                      <div>BUỔI {index + 1}</div>
                      <div className="text-[10px] text-indigo-300 font-semibold font-mono">
                        {parseDateToDDMM(d)}
                      </div>
                    </th>
                  ))}

                  <th className="py-3 px-2 border border-slate-800 text-center w-20">SỐ BUỔI</th>
                  <th className="py-3 px-2 border border-slate-800 text-right min-w-[100px]">ĐƠN GIÁ</th>
                  <th className="py-3 px-2 border border-slate-800 text-right min-w-[120px]">TỔNG HỌC PHÍ</th>
                  <th className="py-3 px-2 border border-slate-800 text-center w-16">ĐÃ THU</th>
                  <th className="py-3 px-3 border border-slate-800 min-w-[280px]">TIN NHẮN TỰ ĐỘNG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {classStudents.map((student, sIdx) => {
                  const studentBill = bills.find((b) => b.studentId === student.id) || {
                    id: `bill-${student.id}`,
                    studentId: student.id,
                    classId: student.classId,
                    month: selectedMonth,
                    attendedDates: [],
                    totalAttendedSessions: 0,
                    pricePerSession: selectedClass?.pricePerSession || 0,
                    totalAmount: 0,
                    paidStatus: 'unpaid' as const,
                  };

                  const isPaid = studentBill.paidStatus === 'paid';
                  const reminderText = selectedClass
                    ? buildReminderMessage(student, selectedClass, studentBill, bankConfig, selectedMonth)
                    : '';

                  return (
                    <tr key={student.id} className="hover:bg-slate-50 transition border-b border-slate-200">
                      <td className="py-3 px-2 sm:px-3 border border-slate-200 text-center font-bold text-slate-700 bg-slate-50">
                        {selectedClass?.name || 'LỚP'}
                      </td>

                      <td className="py-3 px-2 sm:px-3 border border-slate-200 font-bold text-slate-900 sticky left-0 bg-white z-10 shadow-r">
                        <div className="truncate max-w-[120px] sm:max-w-none">{student.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal truncate max-w-[120px] sm:max-w-none">
                          {student.parentName || student.phone || 'Chưa cập nhật PH'}
                        </div>
                      </td>

                      {distinctDates.map((date) => {
                        const record = attendanceRecords.find(
                          (r) => r.studentId === student.id && r.date === date
                        );
                        const status = record?.status || 'unexcused';
                        const isPresent = record?.status === 'present';

                        return (
                          <td
                            key={date}
                            className={`py-2 px-1 border border-slate-200 text-center cursor-pointer transition ${
                              isPresent
                                ? 'bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-100'
                                : record?.status === 'excused'
                                ? 'bg-amber-50 text-amber-800 font-semibold hover:bg-amber-100'
                                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                            }`}
                            onClick={() => {
                              const nextStatus =
                                status === 'present'
                                  ? 'excused'
                                  : status === 'excused'
                                  ? 'unexcused'
                                  : 'present';
                              handleMarkAttendance(student.id, date, nextStatus);
                            }}
                          >
                            <div className="text-xs font-mono">
                              {isPresent ? (
                                <span className="text-emerald-700 font-extrabold">{parseDateToDDMM(date)}</span>
                              ) : status === 'excused' ? (
                                <span className="text-amber-700 text-[10px]">Vắng P</span>
                              ) : (
                                <span className="text-rose-400 text-[10px]">Vắng</span>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      <td className="py-3 px-2 border border-slate-200 text-center font-extrabold text-emerald-800 bg-emerald-50/50">
                        <button
                          onClick={() => {
                            if (selectedClass) {
                              setSessionModalData({ student, englishClass: selectedClass });
                            }
                          }}
                          className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg text-emerald-900 font-extrabold transition text-xs flex items-center space-x-1 mx-auto cursor-pointer"
                          title="Bấm để xem chi tiết danh sách từng buổi học"
                        >
                          <Eye className="w-3 h-3 text-emerald-700" />
                          <span>{studentBill.totalAttendedSessions} buổi</span>
                        </button>
                      </td>

                      <td className="py-3 px-2 border border-slate-200 text-right text-slate-600 font-medium">
                        {(studentBill.pricePerSession / 1000).toLocaleString('vi-VN')}k
                      </td>

                      <td className="py-3 px-2 border border-slate-200 text-right font-extrabold text-slate-900 bg-slate-50">
                        {formatVND(studentBill.totalAmount)}
                      </td>

                      <td className="py-3 px-2 border border-slate-200 text-center">
                        <input
                          type="checkbox"
                          checked={isPaid}
                          onChange={(e) =>
                            handleToggleBillStatus(studentBill.id, e.target.checked ? 'paid' : 'unpaid')
                          }
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      <td className="py-2 px-3 border border-slate-200 text-[11px]">
                        <div className="relative group">
                          <p className="line-clamp-2 text-slate-600 font-mono bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                            {reminderText}
                          </p>
                          <button
                            onClick={() => handleCopyMessageRow(student, studentBill, sIdx)}
                            className="mt-1 flex items-center space-x-1 text-[10px] font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer"
                          >
                            {copiedIndex === sIdx ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Đã sao chép!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Sao chép tin nhắn</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Attended Sessions Popup Modal */}
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
    </div>
  );
};

