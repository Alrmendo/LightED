import React, { useState } from 'react';
import { BookOpen, Users, Plus, Edit2, Trash2, UserPlus, Phone, DollarSign, Calendar, Check, Save, Clock, MapPin, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { EnglishClass, Student, SyncRangeResult } from '../types';
import { formatVND } from '../utils/vietqr';

const DAY_OPTIONS = [
  { value: 1, label: 'Thứ 2' },
  { value: 2, label: 'Thứ 3' },
  { value: 3, label: 'Thứ 4' },
  { value: 4, label: 'Thứ 5' },
  { value: 5, label: 'Thứ 6' },
  { value: 6, label: 'Thứ 7' },
  { value: 0, label: 'Chủ Nhật' },
];

// "YYYY-MM-DD" -> "DD/MM/YYYY" — chỉ dùng hiển thị card lớp học (khác parseDateToDDMM ở
// vietqr.ts vốn bỏ năm, không hợp cho khoảng ngày trải nhiều năm).
function formatDateVN(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

// Preview client-side của server/src/utils/date.ts#calculateEndDateFromSessions — duplicate CÓ
// CHỦ ĐÍCH để phản hồi UI tức thời (không gọi API chỉ để preview). Giá trị THẬT lưu vào DB vẫn do
// backend tự tính lúc lưu (xem classes.service.ts#toPrismaData) — hàm này chỉ để hiển thị gợi ý.
// Cap 3660 vòng lặp (~10 năm) để tránh treo UI nếu lỡ nhập số buổi/daysOfWeek bất thường.
function previewEndDate(startDateStr: string, daysOfWeek: number[], totalSessions: number): string | null {
  if (!startDateStr || daysOfWeek.length === 0 || !Number.isInteger(totalSessions) || totalSessions <= 0) {
    return null;
  }
  const [y, m, d] = startDateStr.split('-').map(Number);
  const cursor = new Date(Date.UTC(y, m - 1, d));
  let count = 0;
  for (let i = 0; i < 3660 && count < totalSessions; i++) {
    if (daysOfWeek.includes(cursor.getUTCDay())) {
      count++;
      if (count === totalSessions) {
        const yyyy = cursor.getUTCFullYear();
        const mm = String(cursor.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(cursor.getUTCDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return null;
}

interface ClassManagementProps {
  classes: EnglishClass[];
  students: Student[];
  selectedMonth?: string;
  onAddClass: (newClass: Omit<EnglishClass, 'id'>) => Promise<EnglishClass & { syncResult?: SyncRangeResult }>;
  onUpdateClass: (updatedClass: EnglishClass) => Promise<EnglishClass & { syncResult?: SyncRangeResult }>;
  onDeleteClass: (classId: string) => Promise<void>;
  onAddStudent: (newStudent: Omit<Student, 'id'>) => Promise<void>;
  onUpdateStudent: (updatedStudent: Student) => Promise<void>;
  onDeleteStudent: (studentId: string) => Promise<void>;
  onSyncSchedule?: (
    classId: string,
    daysOfWeek: number[],
    monthLabel?: string
  ) => Promise<{ generatedDatesCount: number; createdSessionsCount: number }>;
}

export const ClassManagement: React.FC<ClassManagementProps> = ({
  classes = [],
  students = [],
  selectedMonth = 'THÁNG 5',
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onSyncSchedule,
}) => {
  const [selectedClassIdForLog, setSelectedClassIdForLog] = useState<string>(classes[0]?.id || '');

  // Form Modal States for Class
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<EnglishClass | null>(null);
  const [classNameInput, setClassNameInput] = useState('');
  const [teacherInput, setTeacherInput] = useState('');
  const [priceInput, setPriceInput] = useState<number>(250000);
  const [scheduleInput, setScheduleInput] = useState('Thứ 2 - Thứ 4 - Thứ 6');
  const [daysOfWeekInput, setDaysOfWeekInput] = useState<number[]>([1, 3, 5]);
  const [timeInput, setTimeInput] = useState('18:00 - 19:30');
  const [roomInput, setRoomInput] = useState('Phòng 201');
  const [startDateInput, setStartDateInput] = useState('');
  // 'ongoing' = lớp dạy dài hạn (endDate/totalSessions gửi rỗng, backend tự null hoá).
  // 'sessions' = kết thúc tính theo tổng số buổi (totalSessionsInput) — backend tự tính endDate.
  const [endDateMode, setEndDateMode] = useState<'sessions' | 'ongoing'>('ongoing');
  const [totalSessionsInput, setTotalSessionsInput] = useState('');

  // Sync Notification Banner State
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Banner lỗi cho các thao tác gọi API (đặc biệt case xoá bị chặn 409 do còn học sinh/lịch sử
  // điểm danh — xem server/README.md). Message đã là câu tiếng Việt rõ ràng từ backend.
  const [actionError, setActionError] = useState<string | null>(null);

  // Form Modal States for Student
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentNameInput, setStudentNameInput] = useState('');
  const [parentNameInput, setParentNameInput] = useState('');
  const [parentDobInput, setParentDobInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [studentPhoneInput, setStudentPhoneInput] = useState('');
  const [studentClassIdInput, setStudentClassIdInput] = useState(classes[0]?.id || '');

  // Tab Dashboard Metrics
  const totalClassesCount = classes.length;
  const totalStudentsCount = students.length;
  const avgPricePerSession = classes.length
    ? Math.round(classes.reduce((acc, c) => acc + c.pricePerSession, 0) / classes.length)
    : 0;
  const totalSessionRevenueEst = classes.reduce((acc, c) => {
    const classStudentCount = students.filter((s) => s.classId === c.id).length;
    return acc + classStudentCount * c.pricePerSession;
  }, 0);

  // Toggle Day Selection
  const toggleDaySelection = (dayVal: number) => {
    let updated: number[];
    if (daysOfWeekInput.includes(dayVal)) {
      updated = daysOfWeekInput.filter((d) => d !== dayVal);
    } else {
      updated = [...daysOfWeekInput, dayVal].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b));
    }
    setDaysOfWeekInput(updated);

    // Auto update readable schedule text
    const labels = updated.map((d) => DAY_OPTIONS.find((o) => o.value === d)?.label).filter(Boolean);
    if (labels.length > 0) {
      setScheduleInput(labels.join(' - '));
    }
  };

  // Open Class Modal
  const handleOpenClassModal = (cls?: EnglishClass) => {
    if (cls) {
      setEditingClass(cls);
      setClassNameInput(cls.name);
      setTeacherInput(cls.teacherName);
      setPriceInput(cls.pricePerSession);
      setScheduleInput(cls.scheduleDays || 'Thứ 2 - Thứ 4');
      setDaysOfWeekInput(cls.daysOfWeek || [1, 3]);
      setTimeInput(cls.scheduleTime || '18:00 - 19:30');
      setRoomInput(cls.room || 'Phòng 201');
      setStartDateInput(cls.startDate || '');
      // Không có totalSessions -> mặc định "Dài hạn", KỂ CẢ khi cls.endDate có giá trị (vd lớp cũ
      // từng nhập tay endDate trước khi có tính năng này) — không có totalSessions để suy ngược
      // lại, và bấm Lưu sẽ null hoá endDate cũ đó (đã xác nhận chấp nhận được).
      setEndDateMode(cls.totalSessions ? 'sessions' : 'ongoing');
      setTotalSessionsInput(cls.totalSessions ? String(cls.totalSessions) : '');
    } else {
      setEditingClass(null);
      setClassNameInput('');
      setTeacherInput('Henry');
      setPriceInput(250000);
      setScheduleInput('Thứ 2 - Thứ 4 - Thứ 6');
      setDaysOfWeekInput([1, 3, 5]);
      setTimeInput('18:00 - 19:30');
      setRoomInput('Phòng 201');
      setStartDateInput('');
      setEndDateMode('ongoing');
      setTotalSessionsInput('');
    }
    setIsClassModalOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classNameInput) return;

    setActionError(null);
    // Input type="date" trả '' khi bỏ trống — đổi thành undefined để không gửi lên server (schema
    // startDate yêu cầu đúng regex "YYYY-MM-DD" nếu có, không chấp nhận chuỗi rỗng).
    const startDate = startDateInput || undefined;
    // Mode "Dài hạn" -> không gửi totalSessions (backend tự null hoá endDate/totalSessions cũ nếu
    // có). Mode "Số buổi học" -> gửi số buổi, KHÔNG gửi endDate — backend tự tính.
    const totalSessions =
      endDateMode === 'sessions' && totalSessionsInput ? Number(totalSessionsInput) : undefined;
    try {
      let res: EnglishClass & { syncResult?: SyncRangeResult };
      if (editingClass) {
        res = await onUpdateClass({
          ...editingClass,
          name: classNameInput,
          teacherName: teacherInput,
          pricePerSession: Number(priceInput),
          scheduleDays: scheduleInput,
          daysOfWeek: daysOfWeekInput,
          scheduleTime: timeInput,
          room: roomInput,
          startDate,
          totalSessions,
        });
      } else {
        res = await onAddClass({
          name: classNameInput,
          teacherName: teacherInput,
          pricePerSession: Number(priceInput),
          scheduleDays: scheduleInput,
          targetMonthSessions: 8,
          daysOfWeek: daysOfWeekInput,
          scheduleTime: timeInput,
          room: roomInput,
          startDate,
          totalSessions,
        });
      }
      setIsClassModalOpen(false);

      if (res.syncResult) {
        setSyncNotice(
          `Đã tự động đồng bộ ${res.syncResult.generatedDatesCount} ngày dạy vào Bảng Điểm Danh cho lớp ${res.name}!`
        );
        setTimeout(() => setSyncNotice(null), 6000);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không lưu được thông tin lớp học.');
    }
  };

  // Trigger sync schedule to attendance matrix
  const handleTriggerSync = async (cls: EnglishClass) => {
    if (!onSyncSchedule) return;
    setActionError(null);
    const days = cls.daysOfWeek && cls.daysOfWeek.length > 0 ? cls.daysOfWeek : [1, 3, 5];
    try {
      const res = await onSyncSchedule(cls.id, days, selectedMonth);
      setSyncNotice(
        `Đã đồng bộ thành công ${res.generatedDatesCount} ngày dạy trong ${selectedMonth} cho lớp ${cls.name} sang Bảng Điểm Danh!`
      );
      setTimeout(() => setSyncNotice(null), 6000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không đồng bộ được lịch học.');
    }
  };

  const handleDeleteClassClick = async (classId: string) => {
    setActionError(null);
    try {
      await onDeleteClass(classId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không xoá được lớp học.');
    }
  };

  const handleDeleteStudentClick = async (studentId: string) => {
    setActionError(null);
    try {
      await onDeleteStudent(studentId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không xoá được học sinh.');
    }
  };

  // Open Student Modal
  const handleOpenStudentModal = (std?: Student) => {
    if (std) {
      setEditingStudent(std);
      setStudentNameInput(std.name);
      setParentNameInput(std.parentName || '');
      setParentDobInput(std.parentDob || '');
      setPhoneInput(std.phone || '');
      setStudentPhoneInput(std.studentPhone || '');
      setStudentClassIdInput(std.classId);
    } else {
      setEditingStudent(null);
      setStudentNameInput('');
      setParentNameInput('');
      setParentDobInput('');
      setPhoneInput('0901234567');
      setStudentPhoneInput('');
      setStudentClassIdInput(classes[0]?.id || '');
    }
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentNameInput || !studentClassIdInput) return;

    setActionError(null);
    try {
      if (editingStudent) {
        await onUpdateStudent({
          ...editingStudent,
          name: studentNameInput,
          parentName: parentNameInput,
          parentDob: parentDobInput,
          phone: phoneInput,
          studentPhone: studentPhoneInput,
          classId: studentClassIdInput,
        });
      } else {
        await onAddStudent({
          name: studentNameInput,
          parentName: parentNameInput,
          parentDob: parentDobInput,
          phone: phoneInput,
          studentPhone: studentPhoneInput,
          classId: studentClassIdInput,
        });
      }
      setIsStudentModalOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không lưu được thông tin học sinh.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Dedicated Tab Dashboard for "Quản Lý Lớp & Học Sinh" (Feedback #5) */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-indigo-800/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <BookOpen className="w-3.5 h-3.5" />
              <span>DASHBOARD QUẢN LÝ LỚP & HỌC SINH</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-2">
              Quản Lý Cấu Trúc Lớp & Học Viên Trung Tâm
            </h2>
            <p className="text-xs text-indigo-200 mt-1">
              Theo dõi danh sách lớp học, giáo viên phụ trách, đơn giá từng lớp và phân bổ học sinh.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => handleOpenClassModal()}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs rounded-2xl shadow-lg transition flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Lớp Mới</span>
            </button>

            <button
              onClick={() => handleOpenStudentModal()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg transition flex items-center space-x-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Thêm Học Sinh</span>
            </button>
          </div>
        </div>

        {/* Tab Dashboard Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-indigo-200 block font-medium">Tổng Số Lớp Học</span>
            <span className="text-lg sm:text-xl font-extrabold text-white">{totalClassesCount} Lớp</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-indigo-200 block font-medium">Tổng Số Học Sinh</span>
            <span className="text-lg sm:text-xl font-extrabold text-emerald-400">{totalStudentsCount} Học sinh</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-indigo-200 block font-medium">Đơn Giá Trung Bình</span>
            <span className="text-lg sm:text-xl font-extrabold text-amber-300">
              {formatVND(avgPricePerSession)}/buổi
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-indigo-200 block font-medium">Doanh Thu 1 Buổi Toàn Trung Tâm</span>
            <span className="text-lg sm:text-xl font-extrabold text-indigo-200">
              {formatVND(totalSessionRevenueEst)}
            </span>
          </div>
        </div>
      </div>

      {/* Error Banner — vd 409 khi xoá lớp còn học sinh / học sinh còn lịch sử điểm danh */}
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

      {/* Sync Banner Notification */}
      {syncNotice && (
        <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-lg border border-emerald-400 flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
            <span className="text-xs sm:text-sm font-bold">{syncNotice}</span>
          </div>
          <button
            onClick={() => setSyncNotice(null)}
            className="text-xs font-bold underline bg-emerald-600 px-3 py-1 rounded-xl hover:bg-emerald-700 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Grid of Classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {classes.map((cls) => {
          const classStudents = students.filter((s) => s.classId === cls.id);

          return (
            <div
              key={cls.id}
              className="liquid-glass liquid-glass-interactive rounded-2xl p-5 flex flex-col justify-between transition"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-100 text-emerald-900">
                    {cls.name}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenClassModal(cls)}
                      className="p-1 text-slate-400 hover:text-emerald-600 transition cursor-pointer"
                      title="Sửa lớp"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClassClick(cls.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      title="Xóa lớp"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-xl font-extrabold text-slate-900 mb-1">
                  {formatVND(cls.pricePerSession)}{' '}
                  <span className="text-xs font-medium text-slate-400">/ buổi</span>
                </div>

                <div className="text-xs text-slate-600 space-y-1.5 mt-3 liquid-glass-subtle p-3 rounded-xl">
                  <div className="flex items-center space-x-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Sĩ số: <strong>{classStudents.length} học sinh</strong></span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Ngày dạy: <strong className="text-slate-800">{cls.scheduleDays}</strong></span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Ca dạy: <strong className="text-slate-800">{cls.scheduleTime || '18:00 - 19:30'}</strong></span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span>Phòng: <strong className="text-slate-800">{cls.room || 'Phòng 201'}</strong></span>
                  </div>
                  {cls.startDate && (
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>
                        Thời gian:{' '}
                        <strong className="text-slate-800">
                          {formatDateVN(cls.startDate)}
                          {' → '}
                          {cls.totalSessions
                            ? `${cls.totalSessions} buổi${
                                cls.endDate ? ` (dự kiến hết ${formatDateVN(cls.endDate)})` : ''
                              }`
                            : 'đang dạy dài hạn'}
                        </strong>
                      </span>
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                    GV phụ trách: {cls.teacherName}
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <button
                  onClick={() => handleTriggerSync(cls)}
                  className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 font-bold text-[11px] rounded-xl border border-indigo-200 flex items-center justify-center space-x-1.5 transition cursor-pointer"
                  title="Cập nhật các buổi dạy trong tuần sang bảng điểm danh học sinh"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin-slow" />
                  <span>Đồng bộ buổi dạy sang Điểm danh ({selectedMonth})</span>
                </button>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
                  <span>Doanh thu/buổi:</span>
                  <span>{formatVND(classStudents.length * cls.pricePerSession)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Roster Table of All Students */}
      <div className="liquid-glass rounded-2xl overflow-hidden">
        <div className="px-6 py-4 liquid-glass-subtle border-b border-slate-200/60 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-800">
            Danh Sách Học Sinh Cả Trung Tâm ({students.length} Học Sinh)
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4">TÊN HỌC SINH</th>
                <th className="py-3 px-4">LỚP ĐANG HỌC</th>
                <th className="py-3 px-4">PHỤ HUYNH BẢO LÃNH</th>
                <th className="py-3 px-4">SINH NHẬT PH</th>
                <th className="py-3 px-4">SĐT PHỤ HUYNH (ZALO)</th>
                <th className="py-3 px-4 text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {students.map((std, idx) => {
                const cls = classes.find((c) => c.id === std.classId);

                return (
                  <tr key={std.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-center text-slate-400 font-semibold">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{std.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {cls?.name || 'Chưa gán lớp'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{std.parentName || '—'}</td>
                    <td className="py-3 px-4 text-indigo-900 font-medium">{std.parentDob || '—'}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{std.phone || '—'}</td>
                    <td className="py-3 px-4 text-center space-x-2">
                      <button
                        onClick={() => handleOpenStudentModal(std)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                        title="Sửa học sinh"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteStudentClick(std.id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                        title="Xóa học sinh"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Class Edit/Create */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="liquid-glass rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingClass ? 'Sửa Thông Tin Lớp Học' : 'Thêm Lớp Học Mới'}
            </h3>

            <form onSubmit={handleSaveClass} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Tên Lớp (e.g. AB01, TOEIC 450):</label>
                <input
                  type="text"
                  required
                  value={classNameInput}
                  onChange={(e) => setClassNameInput(e.target.value)}
                  className="w-full p-2.5 liquid-glass-input rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Giáo Viên Giảng Dạy:</label>
                <input
                  type="text"
                  value={teacherInput}
                  onChange={(e) => setTeacherInput(e.target.value)}
                  className="w-full p-2.5 liquid-glass-input rounded-xl"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Học Phí / Buổi (VNĐ):</label>
                <input
                  type="number"
                  step="10000"
                  required
                  value={priceInput}
                  onChange={(e) => setPriceInput(Number(e.target.value))}
                  className="w-full p-2.5 liquid-glass-input rounded-xl font-bold text-emerald-800"
                />
              </div>

              {/* Days of Week Selector */}
              <div>
                <label className="block font-medium text-slate-700 mb-1.5">
                  Chọn Các Ngày Dạy Trong Tuần:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DAY_OPTIONS.map((day) => {
                    const isSelected = daysOfWeekInput.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDaySelection(day.value)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer border ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'liquid-glass-pill text-slate-600 hover:bg-white/90'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Start Date + chế độ kết thúc — điểm danh tự sinh khi lưu, xem handleSaveClass */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">Ngày Bắt Đầu:</label>
                <input
                  type="date"
                  value={startDateInput}
                  onChange={(e) => setStartDateInput(e.target.value)}
                  className="w-full p-2.5 liquid-glass-input rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1.5">Kết Thúc:</label>
                <div className="flex gap-1.5 mb-2">
                  <button
                    type="button"
                    onClick={() => setEndDateMode('sessions')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer border ${
                      endDateMode === 'sessions'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'liquid-glass-pill text-slate-600 hover:bg-white/90'
                    }`}
                  >
                    Số Buổi Học
                  </button>
                  <button
                    type="button"
                    onClick={() => setEndDateMode('ongoing')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer border ${
                      endDateMode === 'ongoing'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'liquid-glass-pill text-slate-600 hover:bg-white/90'
                    }`}
                  >
                    Dài Hạn
                  </button>
                </div>

                {endDateMode === 'sessions' && (
                  <div>
                    <input
                      type="number"
                      min={1}
                      max={2000}
                      value={totalSessionsInput}
                      onChange={(e) => setTotalSessionsInput(e.target.value)}
                      placeholder="VD: 24"
                      className="w-full p-2.5 liquid-glass-input rounded-xl font-semibold"
                    />
                    {(() => {
                      const preview = previewEndDate(
                        startDateInput,
                        daysOfWeekInput,
                        Number(totalSessionsInput)
                      );
                      return preview ? (
                        <p className="text-[11px] text-indigo-700 font-semibold mt-1">
                          → Dự kiến kết thúc: {formatDateVN(preview)}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 mt-1">
                          Cần Ngày Bắt Đầu + Ngày Dạy Trong Tuần + Số Buổi hợp lệ để xem trước.
                        </p>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Time Slot & Room */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Ca Dạy (Khung Giờ):</label>
                  <input
                    type="text"
                    value={timeInput}
                    onChange={(e) => setTimeInput(e.target.value)}
                    className="w-full p-2.5 liquid-glass-input rounded-xl font-semibold"
                    placeholder="e.g. 18:00 - 19:30"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Phòng Học:</label>
                  <input
                    type="text"
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value)}
                    className="w-full p-2.5 liquid-glass-input rounded-xl font-semibold"
                    placeholder="e.g. Phòng 201"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Mô Tả Lịch Học (Chuỗi):</label>
                <input
                  type="text"
                  value={scheduleInput}
                  onChange={(e) => setScheduleInput(e.target.value)}
                  className="w-full p-2.5 liquid-glass-input rounded-xl"
                  placeholder="Thứ 2 - Thứ 4 - Thứ 6"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="liquid-glass-btn-primary px-4 py-2 text-white font-semibold rounded-xl"
                >
                  Lưu Thông Tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Student Edit/Create */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="liquid-glass rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingStudent ? 'Sửa Học Sinh' : 'Thêm Học Sinh Mới'}
            </h3>

            <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Họ và Tên Học Sinh:</label>
                <input
                  type="text"
                  required
                  value={studentNameInput}
                  onChange={(e) => setStudentNameInput(e.target.value)}
                  className="w-full p-2.5 liquid-glass-input rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Tên Phụ Huynh Bảo Lãnh:</label>
                <input
                  type="text"
                  value={parentNameInput}
                  onChange={(e) => setParentNameInput(e.target.value)}
                  className="w-full p-2.5 liquid-glass-input rounded-xl"
                  placeholder="e.g. Chị Mai (Mẹ Minh Anh)"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Sinh Nhật Phụ Huynh:</label>
                <input
                  type="text"
                  value={parentDobInput}
                  onChange={(e) => setParentDobInput(e.target.value)}
                  className="w-full p-2.5 liquid-glass-input rounded-xl font-medium"
                  placeholder="e.g. 15/05/1986"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">SĐT Phụ Huynh (Zalo):</label>
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full p-2.5 liquid-glass-input rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">SĐT Học Sinh (nếu có):</label>
                <input
                  type="text"
                  value={studentPhoneInput}
                  onChange={(e) => setStudentPhoneInput(e.target.value)}
                  className="w-full p-2.5 liquid-glass-input rounded-xl font-mono"
                  placeholder="VD: 0912345678"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Lớp Học Đăng Ký:</label>
                <select
                  value={studentClassIdInput}
                  onChange={(e) => setStudentClassIdInput(e.target.value)}
                  className="w-full p-2.5 liquid-glass-input rounded-xl font-bold"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({formatVND(c.pricePerSession)}/buổi)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="liquid-glass-btn-primary px-4 py-2 text-white font-semibold rounded-xl"
                >
                  Lưu Học Sinh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
