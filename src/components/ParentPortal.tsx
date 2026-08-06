import React, { useState } from 'react';
import { UserCheck, Calendar, CheckCircle2, XCircle, Clock, QrCode, BookOpen, MessageSquare, ShieldCheck, Download, Copy, Check, Sparkles, Upload } from 'lucide-react';
import { Student, EnglishClass, AttendanceRecord, TuitionBill, BankConfig } from '../types';
import { formatVND, generateVietQrUrl, parseDateToDDMM, buildReminderMessage } from '../utils/vietqr';

interface ParentPortalProps {
  students: Student[];
  classes: EnglishClass[];
  attendanceRecords: AttendanceRecord[];
  bills: TuitionBill[];
  bankConfig: BankConfig;
  selectedMonth: string;
  onConfirmPaymentByParent: (billId: string) => void;
}

export const ParentPortal: React.FC<ParentPortalProps> = ({
  students,
  classes,
  attendanceRecords,
  bills,
  bankConfig,
  selectedMonth,
  onConfirmPaymentByParent,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [uploadedReceipt, setUploadedReceipt] = useState<string | null>(null);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string | null>(null);

  const student = students.find((s) => s.id === selectedStudentId) || students[0];
  const englishClass = classes.find((c) => c.id === student?.classId);
  
  const studentRecords = attendanceRecords
    .filter((a) => a.studentId === student?.id)
    .sort((a, b) => a.date.localeCompare(b.date));

  const studentBill = bills.find((b) => b.studentId === student?.id) || {
    id: `bill-${student?.id}`,
    studentId: student?.id || '',
    classId: student?.classId || '',
    month: selectedMonth,
    attendedDates: [],
    totalAttendedSessions: 0,
    pricePerSession: englishClass?.pricePerSession || 0,
    totalAmount: 0,
    paidStatus: 'unpaid' as const,
  };

  const presentCount = studentRecords.filter((r) => r.status === 'present').length;
  const excusedCount = studentRecords.filter((r) => r.status === 'excused').length;
  const unexcusedCount = studentRecords.filter((r) => r.status === 'unexcused').length;

  const isPaid = studentBill.paidStatus === 'paid';
  const memo = `HP ${selectedMonth} ${student?.name} ${englishClass?.name}`;
  const qrUrl = bankConfig ? generateVietQrUrl(bankConfig, studentBill.totalAmount, memo) : '';

  const handleSimulateReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setUploadedReceipt(imageUrl);
      onConfirmPaymentByParent(studentBill.id);
      setPaymentSuccessMessage('Đã gửi ảnh chụp màn hình thanh toán thành công tới trung tâm!');
      setTimeout(() => setPaymentSuccessMessage(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Student Lookup Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-indigo-800/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
              <UserCheck className="w-3.5 h-3.5" />
              <span>GÓC TRA CỨU PHỤ HUYNH</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold">
              Theo Dõi Lịch Học & Thanh Toán Học Phí
            </h2>
            <p className="text-xs text-indigo-200 mt-1">
              Phụ huynh có thể kiểm tra chi tiết các buổi con đi học, nội dung bài học và quét mã VietQR đóng học phí.
            </p>
          </div>

          {/* Select Child Dropdown */}
          <div className="bg-indigo-950/80 p-3 rounded-xl border border-indigo-700/60 min-w-[280px]">
            <label className="block text-xs font-medium text-indigo-200 mb-1.5">
              Chọn Học Sinh Tra Cứu:
            </label>
            <select
              id="student-lookup-select"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full bg-slate-900 text-white text-xs font-bold py-2 px-3 rounded-lg border border-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
            >
              {students.map((s) => {
                const cls = classes.find((c) => c.id === s.classId);
                return (
                  <option key={s.id} value={s.id}>
                    {s.name} ({cls?.name || 'Lớp'})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {student && englishClass && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Attendance History & Lesson Log */}
          <div className="lg:col-span-7 space-y-6">
            {/* Student Overview Card */}
            <div className="liquid-glass p-5 rounded-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-lg shadow-inner">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{student.name}</h3>
                    <p className="text-xs text-slate-500">
                      Lớp: <span className="font-semibold text-slate-800">{englishClass.name}</span> • GV: {englishClass.teacherName}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Kỳ học</span>
                  <span className="text-xs font-bold text-slate-800 liquid-glass-pill px-2.5 py-1 rounded-lg">
                    {selectedMonth}
                  </span>
                </div>
              </div>

              {/* Attendance Statistics Summary */}
              <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                  <div className="text-xl font-extrabold text-emerald-700">{presentCount}</div>
                  <div className="text-[11px] font-bold text-emerald-800 mt-0.5">Buổi Có Mặt</div>
                </div>
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                  <div className="text-xl font-extrabold text-amber-700">{excusedCount}</div>
                  <div className="text-[11px] font-bold text-amber-800 mt-0.5">Vắng Có Phép</div>
                </div>
                <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
                  <div className="text-xl font-extrabold text-rose-700">{unexcusedCount}</div>
                  <div className="text-[11px] font-bold text-rose-800 mt-0.5">Vắng Không Phép</div>
                </div>
              </div>
            </div>

            {/* Attendance Timeline & Lesson Log */}
            <div className="liquid-glass rounded-2xl p-5">
              <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Nhật Ký Điểm Danh & Bài Học ({selectedMonth})</span>
              </h4>

              <div className="space-y-3">
                {studentRecords.length === 0 ? (
                  <div className="py-8 text-center text-slate-500">
                    Chưa có nhật ký học tập nào trong tháng này.
                  </div>
                ) : (
                  studentRecords.map((record, index) => {
                    const isPresent = record.status === 'present';
                    const isExcused = record.status === 'excused';

                    return (
                      <div
                        key={record.id}
                        className={`p-3.5 rounded-xl border transition ${
                          isPresent
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : isExcused
                            ? 'bg-amber-50/50 border-amber-200'
                            : 'bg-rose-50/50 border-rose-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs">
                              {parseDateToDDMM(record.date)}
                            </span>
                            <span className="text-xs font-semibold text-slate-700">
                              Buổi {index + 1}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              isPresent
                                ? 'bg-emerald-100 text-emerald-800'
                                : isExcused
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isPresent ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> CÓ MẶT
                              </>
                            ) : isExcused ? (
                              <>
                                <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" /> VẮNG CÓ PHÉP
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" /> VẮNG
                              </>
                            )}
                          </span>
                        </div>

                        {/* Lesson Topic & Homework */}
                        {record.lessonTopic && (
                          <div className="mt-2 pt-2 border-t border-slate-200/60 text-xs space-y-1">
                            <div className="flex items-start space-x-1.5 text-slate-800 font-medium">
                              <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                              <span><strong className="text-slate-900">Bài học:</strong> {record.lessonTopic}</span>
                            </div>
                            {record.homework && (
                              <div className="flex items-start space-x-1.5 text-slate-600 text-[11px] pl-5">
                                <span>• <strong>Bài tập về nhà:</strong> {record.homework}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: VietQR Scan Card & Tuition Breakdown */}
          <div className="lg:col-span-5 space-y-6">
            <div className="liquid-glass rounded-2xl p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>Mã Thanh Toán VietQR</span>
                </h4>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {isPaid ? '✓ ĐÃ THANH TOÁN' : '⏳ CHỜ THANH TOÁN'}
                </span>
              </div>

              {/* Fee breakdown box */}
              <div className="liquid-glass-subtle p-4 rounded-xl text-xs space-y-2 mb-4">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Số buổi con đi học:</span>
                  <span className="font-bold text-slate-900">{presentCount} buổi</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Học phí mỗi buổi:</span>
                  <span className="font-bold text-slate-900">{formatVND(englishClass.pricePerSession)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-900 pt-2 border-t border-slate-200 font-bold text-sm">
                  <span>Tổng học phí tháng:</span>
                  <span className="text-emerald-700 text-lg font-extrabold">{formatVND(studentBill.totalAmount)}</span>
                </div>
              </div>

              {/* VietQR Image Box */}
              <div className="text-center liquid-glass-subtle p-4 rounded-xl mb-4">
                <div className="inline-block bg-white p-2.5 rounded-xl shadow-md border border-slate-200 mb-2">
                  <img
                    src={qrUrl}
                    alt="VietQR Học phí"
                    className="w-48 h-48 object-contain mx-auto"
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Mở ứng dụng Mobile Banking (MBBank, VCB, Techcombank, OCB...) để quét mã
                </p>
              </div>

              {/* Bank Details */}
              <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200 text-xs space-y-1.5 mb-4">
                <div className="flex justify-between">
                  <span className="text-emerald-800">Ngân hàng:</span>
                  <span className="font-bold text-slate-900">{bankConfig.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-800">Số tài khoản:</span>
                  <span className="font-mono font-bold text-slate-900">{bankConfig.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-800">Chủ tài khoản:</span>
                  <span className="font-bold text-slate-900 uppercase">{bankConfig.accountHolder}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-emerald-200/60 font-semibold text-emerald-900">
                  <span>Nội dung CK:</span>
                  <span className="font-mono">{memo}</span>
                </div>
              </div>

              {/* Success Notification */}
              {paymentSuccessMessage && (
                <div className="mb-4 p-3 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{paymentSuccessMessage}</span>
                </div>
              )}

              {/* Submit Payment Proof Option */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Xác nhận hoặc tải ảnh chụp bill chuyển khoản:
                </label>
                <div className="flex gap-2">
                  <label className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 liquid-glass-btn-primary text-white rounded-xl text-xs font-semibold cursor-pointer transition">
                    <Upload className="w-4 h-4" />
                    <span>Gửi Ảnh Chuyển Khoản</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSimulateReceiptUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={() => {
                      onConfirmPaymentByParent(studentBill.id);
                      setPaymentSuccessMessage('Phụ huynh đã xác nhận hoàn tất chuyển khoản!');
                    }}
                    className="py-2 px-3 liquid-glass-btn-primary text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Xác Nhận Đã CK
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
