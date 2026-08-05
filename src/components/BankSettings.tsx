import React, { useState } from 'react';
import { CreditCard, Save, CheckCircle2, Calendar, Clock, MapPin, RefreshCw, BookOpen, Users, Sparkles, Check } from 'lucide-react';
import { BankConfig, EnglishClass, Student } from '../types';
import { POPULAR_BANKS, generateVietQrUrl } from '../utils/vietqr';

const DAY_OPTIONS = [
  { value: 1, label: 'Thứ 2', short: 'T2' },
  { value: 2, label: 'Thứ 3', short: 'T3' },
  { value: 3, label: 'Thứ 4', short: 'T4' },
  { value: 4, label: 'Thứ 5', short: 'T5' },
  { value: 5, label: 'Thứ 6', short: 'T6' },
  { value: 6, label: 'Thứ 7', short: 'T7' },
  { value: 0, label: 'Chủ Nhật', short: 'CN' },
];

interface BankSettingsProps {
  bankConfig: BankConfig;
  onSaveBankConfig: (config: BankConfig) => Promise<void>;
  classes?: EnglishClass[];
  students?: Student[];
  selectedMonth?: string;
  onUpdateClass?: (updatedClass: EnglishClass) => Promise<void>;
  onSyncSchedule?: (
    classId: string,
    daysOfWeek: number[],
    monthLabel?: string
  ) => Promise<{ generatedDatesCount: number; createdSessionsCount: number }>;
}

export const BankSettings: React.FC<BankSettingsProps> = ({
  bankConfig,
  onSaveBankConfig,
  classes = [],
  students = [],
  selectedMonth = 'THÁNG 5',
  onUpdateClass,
  onSyncSchedule,
}) => {
  const [bankId, setBankId] = useState(bankConfig.bankId);
  const [bankName, setBankName] = useState(bankConfig.bankName);
  const [accountNumber, setAccountNumber] = useState(bankConfig.accountNumber);
  const [accountHolder, setAccountHolder] = useState(bankConfig.accountHolder);
  const [centerName, setCenterName] = useState(bankConfig.centerName);
  const [teacherName, setTeacherName] = useState(bankConfig.teacherName);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Local state for editing class schedule in Settings
  const [classSchedules, setClassSchedules] = useState<{
    [classId: string]: {
      daysOfWeek: number[];
      scheduleTime: string;
      room: string;
    };
  }>(() => {
    const initial: { [key: string]: { daysOfWeek: number[]; scheduleTime: string; room: string } } = {};
    classes.forEach((c) => {
      initial[c.id] = {
        daysOfWeek: c.daysOfWeek && c.daysOfWeek.length > 0 ? c.daysOfWeek : [1, 3, 5],
        scheduleTime: c.scheduleTime || '18:00 - 19:30',
        room: c.room || 'Phòng 201',
      };
    });
    return initial;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    const selectedBankObj = POPULAR_BANKS.find((b) => b.id === bankId);
    try {
      await onSaveBankConfig({
        bankId,
        bankName: selectedBankObj ? selectedBankObj.name : bankName,
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.toUpperCase().trim(),
        centerName: centerName.trim(),
        teacherName: teacherName.trim(),
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không lưu được cấu hình ngân hàng.');
    }
  };

  // Toggle Day Selection for a specific class
  const handleToggleDay = (classId: string, dayVal: number) => {
    const current = classSchedules[classId] || {
      daysOfWeek: [1, 3, 5],
      scheduleTime: '18:00 - 19:30',
      room: 'Phòng 201',
    };

    let updatedDays: number[];
    if (current.daysOfWeek.includes(dayVal)) {
      updatedDays = current.daysOfWeek.filter((d) => d !== dayVal);
    } else {
      updatedDays = [...current.daysOfWeek, dayVal].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b));
    }

    setClassSchedules((prev) => ({
      ...prev,
      [classId]: {
        ...current,
        daysOfWeek: updatedDays,
      },
    }));
  };

  // Handle Input Change for Time / Room
  const handleScheduleInputChange = (classId: string, field: 'scheduleTime' | 'room', val: string) => {
    const current = classSchedules[classId] || {
      daysOfWeek: [1, 3, 5],
      scheduleTime: '18:00 - 19:30',
      room: 'Phòng 201',
    };

    setClassSchedules((prev) => ({
      ...prev,
      [classId]: {
        ...current,
        [field]: val,
      },
    }));
  };

  // Save single class schedule settings
  const handleSaveClassSchedule = async (cls: EnglishClass) => {
    if (!onUpdateClass) return;
    setActionError(null);
    const config = classSchedules[cls.id] || {
      daysOfWeek: cls.daysOfWeek || [1, 3, 5],
      scheduleTime: cls.scheduleTime || '18:00 - 19:30',
      room: cls.room || 'Phòng 201',
    };

    const labels = config.daysOfWeek
      .map((d) => DAY_OPTIONS.find((o) => o.value === d)?.label)
      .filter(Boolean);

    const updatedClass: EnglishClass = {
      ...cls,
      daysOfWeek: config.daysOfWeek,
      scheduleTime: config.scheduleTime,
      room: config.room,
      scheduleDays: labels.length > 0 ? labels.join(' - ') : cls.scheduleDays,
    };

    try {
      await onUpdateClass(updatedClass);
      setSyncNotice(`Đã lưu cấu hình lịch dạy cho lớp ${cls.name} thành công!`);
      setTimeout(() => setSyncNotice(null), 4000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không lưu được lịch dạy.');
    }
  };

  // Trigger sync schedule to attendance matrix for single class
  const handleSyncClass = async (cls: EnglishClass) => {
    if (!onSyncSchedule) return;
    setActionError(null);
    const config = classSchedules[cls.id] || {
      daysOfWeek: cls.daysOfWeek || [1, 3, 5],
    };

    try {
      const res = await onSyncSchedule(cls.id, config.daysOfWeek, selectedMonth);
      setSyncNotice(
        `Đã đồng bộ ${res.generatedDatesCount} ngày dạy (${selectedMonth}) cho lớp ${cls.name} sang Bảng Điểm Danh!`
      );
      setTimeout(() => setSyncNotice(null), 5000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không đồng bộ được lịch học.');
    }
  };

  // Bulk sync all classes at once — tuần tự từng lớp (không Promise.all) để 1 lớp lỗi không làm
  // các lớp còn lại rơi vào trạng thái không xác định, và để totalDates/totalSessions cộng dồn
  // đúng thứ tự.
  const handleSyncAllClasses = async () => {
    if (!onSyncSchedule || classes.length === 0) return;
    setActionError(null);

    let totalDates = 0;
    let totalSessions = 0;

    try {
      for (const cls of classes) {
        const config = classSchedules[cls.id] || {
          daysOfWeek: cls.daysOfWeek || [1, 3, 5],
        };
        const res = await onSyncSchedule(cls.id, config.daysOfWeek, selectedMonth);
        totalDates += res.generatedDatesCount;
        totalSessions += res.createdSessionsCount;
      }

      setSyncNotice(
        `⚡ Đã đồng bộ tất cả ${classes.length} lớp học trong ${selectedMonth} sang Bảng Điểm Danh thành công!`
      );
      setTimeout(() => setSyncNotice(null), 6000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không đồng bộ được toàn bộ lớp học.');
    }
  };

  const sampleQrUrl = generateVietQrUrl(
    { bankId, bankName, accountNumber, accountHolder, centerName, teacherName },
    2400000,
    'HP THANG 5 DEMO'
  );

  return (
    <div className="w-full space-y-6">
      {/* Error Banner */}
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

      {/* Toast Notification Banner */}
      {syncNotice && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg border border-emerald-500 flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
            <span className="text-xs sm:text-sm font-bold">{syncNotice}</span>
          </div>
          <button
            onClick={() => setSyncNotice(null)}
            className="text-xs font-bold underline bg-emerald-700 px-3 py-1 rounded-xl hover:bg-emerald-800 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* SECTION 1: Cài Đặt Ngày Dạy Lớp Học & Đồng Bộ Điểm Danh */}
      <div className="liquid-glass p-4 sm:p-6 rounded-3xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/60">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="p-2.5 sm:p-3 bg-[#103BE6]/10 text-[#103BE6] rounded-2xl shrink-0">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-black text-slate-900 flex flex-wrap items-center gap-1.5">
                <span>Cài Đặt Lịch Dạy & Đồng Bộ Buổi Học Sang Bảng Điểm Danh</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold liquid-glass-pill text-[#103BE6]">
                  {selectedMonth}
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Thiết lập các ngày dạy trong tuần (T2 - CN), ca học, phòng học & cập nhật các buổi dạy vào Bảng Điểm Danh học sinh
              </p>
            </div>
          </div>

          <button
            onClick={handleSyncAllClasses}
            className="w-full sm:w-auto px-4 py-3 sm:py-2.5 liquid-glass-btn-primary font-extrabold text-xs text-white rounded-2xl shrink-0 flex items-center justify-center space-x-2 cursor-pointer shadow-md"
            title="Đồng bộ tất cả lịch dạy của các lớp sang bảng điểm danh học sinh"
          >
            <RefreshCw className="w-4 h-4 text-white animate-spin-slow shrink-0" />
            <span className="text-white font-extrabold">⚡ Đồng Bộ Tất Cả Các Lớp ({selectedMonth})</span>
          </button>
        </div>

        {/* Classes List */}
        <div className="space-y-4">
          {classes.map((cls) => {
            const classStudentsCount = students.filter((s) => s.classId === cls.id).length;
            const config = classSchedules[cls.id] || {
              daysOfWeek: cls.daysOfWeek || [1, 3, 5],
              scheduleTime: cls.scheduleTime || '18:00 - 19:30',
              room: cls.room || 'Phòng 201',
            };

            return (
              <div
                key={cls.id}
                className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3 hover:border-indigo-300 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span className="font-extrabold text-sm text-slate-900">Lớp {cls.name}</span>
                    <span className="text-xs text-slate-500">({cls.teacherName})</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold">
                      <Users className="w-3 h-3 inline mr-1" />
                      {classStudentsCount} học sinh
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="font-medium text-slate-600">Đơn giá: {cls.pricePerSession.toLocaleString('vi-VN')} đ/buổi</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  {/* Day Picker */}
                  <div className="lg:col-span-6 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Chọn Các Ngày Dạy Trong Tuần:
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {DAY_OPTIONS.map((day) => {
                        const isSelected = config.daysOfWeek.includes(day.value);
                        return (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => handleToggleDay(cls.id, day.value)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer border ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {day.short}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time & Room Inputs */}
                  <div className="lg:col-span-3 grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Ca Dạy:</label>
                      <input
                        type="text"
                        value={config.scheduleTime}
                        onChange={(e) => handleScheduleInputChange(cls.id, 'scheduleTime', e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                        placeholder="18:00 - 19:30"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Phòng Học:</label>
                      <input
                        type="text"
                        value={config.room}
                        onChange={(e) => handleScheduleInputChange(cls.id, 'room', e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                        placeholder="Phòng 201"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="lg:col-span-3 flex items-center space-x-2 pt-1 lg:pt-4">
                    <button
                      type="button"
                      onClick={() => handleSaveClassSchedule(cls)}
                      className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 flex items-center justify-center space-x-1 transition cursor-pointer shadow-2xs"
                    >
                      <Save className="w-3.5 h-3.5 text-slate-600" />
                      <span>Lưu Lịch</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSyncClass(cls)}
                      className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 flex items-center justify-center space-x-1 transition cursor-pointer shadow-2xs"
                      title="Cập nhật lịch dạy tháng này sang Bảng Điểm Danh"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Đồng Bộ</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Cấu Hình Tài Khoản Ngân Hàng Tự Động Tạo Mã VietQR */}
      <div className="liquid-glass p-6 rounded-3xl">
        <div className="flex items-center space-x-3 pb-4 border-b border-white/60 mb-6">
          <div className="p-3 bg-emerald-500/15 text-emerald-800 rounded-2xl">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Cấu Hình Tài Khoản Ngân Hàng Tự Động Tạo Mã VietQR
            </h3>
            <p className="text-xs text-slate-500">
              Điền thông tin tài khoản nhận tiền học phí. Mã QR VietQR Napas247 sẽ được tự động xuất chuẩn xác khi gửi phụ huynh.
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="mb-6 p-4 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold flex items-center space-x-2 border border-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Đã lưu cấu hình tài khoản VietQR thành công!</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Settings Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tên Trung Tâm Anh Ngữ:</label>
              <input
                type="text"
                required
                value={centerName}
                onChange={(e) => setCenterName(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Xưng Xung Trong Tin Nhắn (e.g. Henry, Thầy Duy, Cô Thảo):</label>
              <input
                type="text"
                required
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Chọn Ngân Hàng (Napas247):</label>
                <select
                  value={bankId}
                  onChange={(e) => {
                    setBankId(e.target.value);
                    const b = POPULAR_BANKS.find((x) => x.id === e.target.value);
                    if (b) setBankName(b.name);
                  }}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {POPULAR_BANKS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.shortName} - {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số Tài Khoản (STK):</label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tên Chủ Tài Khoản (In Hoa Không Dấu):</label>
              <input
                type="text"
                required
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono uppercase font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="mt-4 w-full flex items-center justify-center space-x-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Cấu Hình VietQR</span>
            </button>
          </form>

          {/* Live VietQR Preview Box */}
          <div className="lg:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Xem Trước Mã VietQR Mẫu</span>
            
            <div className="bg-white p-3 rounded-xl shadow border border-slate-200 mb-3">
              <img
                src={sampleQrUrl}
                alt="VietQR Sample"
                className="w-44 h-44 object-contain"
              />
            </div>

            <div className="text-xs font-semibold text-slate-800 space-y-1">
              <div>STK: <span className="font-mono text-emerald-700 font-bold">{accountNumber}</span></div>
              <div>Ngân hàng: {bankId}</div>
              <div className="uppercase text-slate-500 text-[11px]">{accountHolder}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

