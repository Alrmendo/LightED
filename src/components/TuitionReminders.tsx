import React, { useState } from 'react';
import { Search, Filter, QrCode, Send, CheckCircle2, Clock, Copy, Download, Sparkles, MessageSquare, Check, ExternalLink, Calendar, Eye } from 'lucide-react';
import { Student, EnglishClass, TuitionBill, BankConfig, AttendanceRecord } from '../types';
import { formatVND, buildReminderMessage } from '../utils/vietqr';
import { QrModal } from './QrModal';
import { AttendedSessionsModal } from './AttendedSessionsModal';

interface TuitionRemindersProps {
  students: Student[];
  classes: EnglishClass[];
  bills: TuitionBill[];
  attendanceRecords: AttendanceRecord[];
  bankConfig: BankConfig;
  selectedMonth: string;
  onUpdateBillStatus: (billId: string, newStatus: 'paid' | 'unpaid') => Promise<void>;
}

export const TuitionReminders: React.FC<TuitionRemindersProps> = ({
  students = [],
  classes = [],
  bills = [],
  attendanceRecords = [],
  bankConfig,
  selectedMonth,
  onUpdateBillStatus,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

  // Modal State for QR
  const [activeModalStudent, setActiveModalStudent] = useState<{
    student: Student;
    englishClass: EnglishClass;
    bill: TuitionBill;
  } | null>(null);

  // Modal State for Session Breakdown (Feedback #4)
  const [sessionModalData, setSessionModalData] = useState<{
    student: Student;
    englishClass: EnglishClass;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleBillStatus = async (billId: string, newStatus: 'paid' | 'unpaid') => {
    try {
      await onUpdateBillStatus(billId, newStatus);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không cập nhật được trạng thái thanh toán.');
    }
  };

  // Filter logic
  const filteredBills = bills.filter((bill) => {
    const student = students.find((s) => s.id === bill.studentId);
    if (!student) return false;

    const matchesClass = selectedClassId === 'all' || student.classId === selectedClassId;
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.parentName && student.parentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (student.phone && student.phone.includes(searchQuery));
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'paid' && bill.paidStatus === 'paid') ||
      (statusFilter === 'unpaid' && bill.paidStatus === 'unpaid');

    return matchesClass && matchesSearch && matchesStatus;
  });

  // Batch copy all unpaid reminder messages
  const handleCopyAllUnpaidReminders = () => {
    const unpaidBills = filteredBills.filter((b) => b.paidStatus === 'unpaid');
    if (unpaidBills.length === 0) {
      showToast('Không có học sinh nào chưa đóng học phí trong danh sách!');
      return;
    }

    const compiledText = unpaidBills
      .map((b) => {
        const std = students.find((s) => s.id === b.studentId);
        const cls = classes.find((c) => c.id === b.classId);
        if (!std || !cls) return '';
        return buildReminderMessage(std, cls, b, bankConfig, selectedMonth);
      })
      .filter(Boolean)
      .join('\n\n========================================\n\n');

    navigator.clipboard.writeText(compiledText);
    showToast(`Đã sao chép ${unpaidBills.length} tin nhắn nhắc học phí!`);
  };

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-indigo-500/30 animate-bounce">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Filter Header & Quick Actions */}
      <div className="bg-white/90 backdrop-blur-md p-4 sm:p-5 rounded-3xl shadow-xs border border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
          {/* Search Input */}
          <div className="relative min-w-[200px] w-full sm:w-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên HS, PH, SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#103BE6] focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
            {/* Class Filter */}
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="class-filter"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả lớp học ({classes.length})</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({formatVND(cls.pricePerSession)}/buổi)
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium shrink-0">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setStatusFilter('unpaid')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  statusFilter === 'unpaid'
                    ? 'bg-[#FF5500] text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chưa đóng
              </button>
              <button
                onClick={() => setStatusFilter('paid')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  statusFilter === 'paid'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Đã đóng
              </button>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center w-full sm:w-auto">
          <button
            onClick={handleCopyAllUnpaidReminders}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 liquid-glass-btn-primary text-white rounded-xl text-xs font-extrabold shadow-xs transition cursor-pointer"
          >
            <Copy className="w-4 h-4 shrink-0 text-white" />
            <span className="text-white">Sao Chép Tất Cả Tin Nhắc Phí Chưa Thu</span>
          </button>
        </div>
      </div>

      {/* Main Table View matching Excel Layout with Condensed Session Popup */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
              <span>Bảng Tổng Kết Học Phí Tự Động ({selectedMonth})</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-800 font-bold">
                {filteredBills.length} Học Sinh
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Học phí tự động tính = Số buổi đã học x Đơn giá từng lớp. Nhấp vào <strong>Số buổi (Popup)</strong> để xem chi tiết từng ngày học.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3.5 px-4 w-12 text-center">STT</th>
                <th className="py-3.5 px-4 min-w-[170px]">HỌC SINH & PHỤ HUYNH</th>
                <th className="py-3.5 px-4 min-w-[130px]">LỚP HỌC</th>
                <th className="py-3.5 px-4 text-center min-w-[150px]">SỐ BUỔI ĐÃ HỌC (POPUP)</th>
                <th className="py-3.5 px-4 text-right min-w-[110px]">HỌC PHÍ / BUỔI</th>
                <th className="py-3.5 px-4 text-right min-w-[140px]">TỔNG HỌC PHÍ</th>
                <th className="py-3.5 px-4 text-center min-w-[110px]">ĐÃ THU</th>
                <th className="py-3.5 px-4 text-center min-w-[210px]">HÀNH ĐỘNG NHẮC PHÍ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold">Không tìm thấy dữ liệu học phí phù hợp.</p>
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill, index) => {
                  const student = students.find((s) => s.id === bill.studentId);
                  const englishClass = classes.find((c) => c.id === bill.classId);

                  if (!student || !englishClass) return null;

                  const isPaid = bill.paidStatus === 'paid';

                  return (
                    <tr
                      key={bill.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isPaid ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center text-slate-400 font-semibold">
                        {index + 1}
                      </td>

                      {/* Student & Parent Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {student.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {student.parentName || 'Chưa cập nhật tên PH'}
                          {student.phone && ` • ${student.phone}`}
                        </div>
                      </td>

                      {/* Class Name */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {englishClass.name}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          GV: {englishClass.teacherName}
                        </div>
                      </td>

                      {/* Attendance Count Pill (Page 1 Feedback: "Các buổi đã học gộp vào trong Số buổi popup") */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSessionModalData({ student, englishClass })}
                          className="px-3 py-1.5 rounded-xl font-extrabold text-xs bg-emerald-100 text-emerald-900 hover:bg-emerald-200 transition flex items-center space-x-1.5 mx-auto border border-emerald-300 cursor-pointer shadow-2xs"
                          title="Bấm để mở popup chi tiết từng ngày học"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{bill.totalAttendedSessions} buổi</span>
                        </button>
                      </td>

                      {/* Price per session */}
                      <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                        {formatVND(bill.pricePerSession)}
                      </td>

                      {/* Total Calculated Tuition */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="text-sm font-extrabold text-slate-900">
                          {formatVND(bill.totalAmount)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {bill.totalAttendedSessions} buổi x {(bill.pricePerSession / 1000).toLocaleString('vi-VN')}k
                        </div>
                      </td>

                      {/* Paid Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <label className="inline-flex items-center justify-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isPaid}
                            onChange={(e) =>
                              handleToggleBillStatus(bill.id, e.target.checked ? 'paid' : 'unpaid')
                            }
                            className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          />
                        </label>
                        <div className="mt-1">
                          {isPaid ? (
                            <span className="text-[10px] font-extrabold text-emerald-600 uppercase">
                              Đã thu
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold text-amber-600 uppercase">
                              Chưa thu
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* VietQR Trigger */}
                          <button
                            onClick={() =>
                              setActiveModalStudent({
                                student,
                                englishClass,
                                bill,
                              })
                            }
                            className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer"
                            title="Tạo mã VietQR & Xem tin nhắn"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Mã VietQR</span>
                          </button>

                          {/* Quick Message Copy */}
                          <button
                            onClick={() => {
                              const msg = buildReminderMessage(
                                student,
                                englishClass,
                                bill,
                                bankConfig,
                                selectedMonth
                              );
                              navigator.clipboard.writeText(msg);
                              showToast(`Đã sao chép tin nhắn học phí cho ${student.name}!`);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                            title="Sao chép nhanh tin nhắn nhắc"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Zalo redirect */}
                          {student.phone && (
                            <button
                              onClick={() => {
                                window.open(
                                  `https://zalo.me/${student.phone?.replace(/[^0-9]/g, '')}`,
                                  '_blank'
                                );
                              }}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition cursor-pointer"
                              title={`Mở Zalo (${student.phone})`}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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

      {/* QR Modal Popup */}
      {activeModalStudent && (
        <QrModal
          isOpen={!!activeModalStudent}
          onClose={() => setActiveModalStudent(null)}
          student={activeModalStudent.student}
          englishClass={activeModalStudent.englishClass}
          bill={activeModalStudent.bill}
          bankConfig={bankConfig}
          selectedMonth={selectedMonth}
          onTogglePaidStatus={async (billId, newStatus) => {
            try {
              await onUpdateBillStatus(billId, newStatus);
              setActiveModalStudent((prev) =>
                prev ? { ...prev, bill: { ...prev.bill, paidStatus: newStatus } } : null
              );
              showToast(newStatus === 'paid' ? 'Đã xác nhận THU HỌC PHÍ thành công!' : 'Đã chuyển thành chưa thu học phí');
            } catch (err) {
              showToast(err instanceof Error ? err.message : 'Không cập nhật được trạng thái thanh toán.');
            }
          }}
        />
      )}
    </div>
  );
};

