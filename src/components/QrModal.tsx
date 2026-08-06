import React, { useState } from 'react';
import { X, Copy, Check, QrCode, Download, ExternalLink, Send, CheckCircle2, ShieldCheck, PhoneCall } from 'lucide-react';
import { BankConfig, Student, EnglishClass, TuitionBill } from '../types';
import { generateVietQrUrl, buildReminderMessage, formatVND } from '../utils/vietqr';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  englishClass: EnglishClass;
  bill: TuitionBill;
  bankConfig: BankConfig;
  selectedMonth: string;
  onTogglePaidStatus: (billId: string, newStatus: 'paid' | 'unpaid') => Promise<void>;
}

export const QrModal: React.FC<QrModalProps> = ({
  isOpen,
  onClose,
  student,
  englishClass,
  bill,
  bankConfig,
  selectedMonth,
  onTogglePaidStatus,
}) => {
  const [copiedText, setCopiedText] = useState(false);
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  if (!isOpen) return null;

  const memo = `HP ${selectedMonth} ${student.name} ${englishClass.name}`;
  const qrUrl = generateVietQrUrl(bankConfig, bill.totalAmount, memo);
  const reminderMessage = buildReminderMessage(student, englishClass, bill, bankConfig, selectedMonth);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(reminderMessage);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleCopyAcc = () => {
    navigator.clipboard.writeText(bankConfig.accountNumber);
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 2500);
  };

  const handleToggle = async () => {
    setToggleError(null);
    setToggling(true);
    try {
      await onTogglePaidStatus(bill.id, bill.paidStatus === 'paid' ? 'unpaid' : 'paid');
    } catch (err) {
      setToggleError(err instanceof Error ? err.message : 'Không cập nhật được trạng thái thanh toán.');
    } finally {
      setToggling(false);
    }
  };

  const handleOpenZalo = () => {
    // If student has phone number
    if (student.phone) {
      window.open(`https://zalo.me/${student.phone.replace(/[^0-9]/g, '')}`, '_blank');
    } else {
      window.open('https://zalo.me', '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="liquid-glass rounded-2xl max-w-3xl w-full overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur">
              <QrCode className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Mã QR & Tin Nhắn Nhắc Học Phí ({selectedMonth})
              </h3>
              <p className="text-xs text-emerald-200 font-medium">
                Học sinh: <span className="font-bold text-white">{student.name}</span> • Lớp: {englishClass.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: VietQR Code Card */}
          <div className="lg:col-span-5 flex flex-col items-center justify-between liquid-glass-subtle p-5 rounded-2xl text-center">
            <div className="w-full">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-3">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> VietQR Nhanh Qua Napas247
              </div>

              {/* VietQR Image */}
              <div className="relative bg-white p-3 rounded-xl shadow-md border border-slate-200 inline-block mb-3">
                <img
                  src={qrUrl}
                  alt={`VietQR ${student.name}`}
                  className="w-52 h-52 object-contain mx-auto rounded-lg"
                  onError={(e) => {
                    // Fallback visual if API image takes time
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Amount Display */}
              <div className="mb-3">
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Số tiền cần thanh toán</div>
                <div className="text-2xl font-extrabold text-emerald-700">
                  {formatVND(bill.totalAmount)}
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  ({bill.totalAttendedSessions} buổi x {formatVND(bill.pricePerSession)})
                </div>
              </div>

              {/* Bank Details Box */}
              <div className="liquid-glass-subtle p-3 rounded-xl text-left text-xs space-y-1.5 w-full">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Ngân hàng:</span>
                  <span className="font-bold text-slate-800">{bankConfig.bankName || bankConfig.bankId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Số tài khoản:</span>
                  <div className="flex items-center space-x-1">
                    <span className="font-mono font-bold text-slate-900">{bankConfig.accountNumber}</span>
                    <button
                      onClick={handleCopyAcc}
                      title="Sao chép STK"
                      className="text-emerald-600 hover:text-emerald-800 p-0.5 rounded cursor-pointer"
                    >
                      {copiedAcc ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Chủ tài khoản:</span>
                  <span className="font-semibold text-slate-800 uppercase">{bankConfig.accountHolder}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Nội dung CK:</span>
                  <span className="font-mono text-emerald-700 font-bold text-[11px] truncate max-w-[150px]">{memo}</span>
                </div>
              </div>
            </div>

            {/* Direct Image Download */}
            <a
              href={qrUrl}
              download={`VietQR_HocPhi_${student.name}_${selectedMonth}.png`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 w-full flex items-center justify-center space-x-2 py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Tải Mã VietQR Về Máy</span>
            </a>
          </div>

          {/* Right Column: Reminder Message Preview & Actions */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center">
                  <Send className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Tin Nhắn Nhắc Học Phí (Tự Động Tạo)
                </label>
                {student.phone && (
                  <span className="text-xs text-slate-500 flex items-center">
                    <PhoneCall className="w-3 h-3 mr-1 text-slate-400" /> SĐT PH: {student.phone}
                  </span>
                )}
              </div>

              {/* Message Box */}
              <div className="relative">
                <textarea
                  readOnly
                  rows={10}
                  value={reminderMessage}
                  className="w-full p-4 rounded-xl liquid-glass-input text-slate-800 font-mono text-xs leading-relaxed resize-none"
                />
                <button
                  onClick={handleCopyMessage}
                  className="absolute top-3 right-3 flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-sm transition cursor-pointer"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Đã chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép tin nhắn</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleOpenZalo}
                  className="flex items-center justify-center space-x-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow transition cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Gửi Qua Zalo Phụ Huynh</span>
                </button>

                <button
                  onClick={handleCopyMessage}
                  className="flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow transition cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>Chép Nội Dung Nhắc</span>
                </button>
              </div>

              {/* Status Toggle Box */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-700 block">Trạng thái thanh toán:</span>
                  <span className={`text-xs font-bold ${bill.paidStatus === 'paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {bill.paidStatus === 'paid' ? '✓ Đã thu học phí' : '⏳ Chưa thu học phí'}
                  </span>
                </div>

                <button
                  onClick={handleToggle}
                  disabled={toggling}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                    bill.paidStatus === 'paid'
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {toggling
                      ? 'Đang cập nhật...'
                      : bill.paidStatus === 'paid'
                      ? 'Đánh dấu CHƯA THU'
                      : 'Xác nhận ĐÃ THU'}
                  </span>
                </button>
              </div>

              {toggleError && (
                <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                  {toggleError}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="liquid-glass-subtle px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
