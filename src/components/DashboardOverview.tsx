import React from 'react';
import { Target, TrendingUp, AlertCircle, CheckCircle2, BookOpen, Users } from 'lucide-react';
import { TuitionBill, EnglishClass, Student } from '../types';
import { formatVND } from '../utils/vietqr';

interface DashboardOverviewProps {
  bills: TuitionBill[];
  classes: EnglishClass[];
  students: Student[];
  selectedMonth: string;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  bills,
  classes,
  students,
  selectedMonth,
}) => {
  const totalTargetRevenue = bills.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalCollected = bills
    .filter((b) => b.paidStatus === 'paid')
    .reduce((sum, b) => sum + b.totalAmount, 0);
  const outstandingDebt = totalTargetRevenue - totalCollected;
  
  const paidCount = bills.filter((b) => b.paidStatus === 'paid').length;
  const unpaidCount = bills.length - paidCount;

  const totalSessionsTaught = bills.reduce((sum, b) => sum + b.totalAttendedSessions, 0);

  return (
    <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-5 md:p-6 shadow-lg mb-6 border border-emerald-800/40">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-emerald-800/60 mb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              BÁO CÁO TỔNG QUAN {selectedMonth.toUpperCase()}
            </span>
            <span className="text-xs text-slate-400">Cập nhật tự động</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold mt-1 text-white">
            Thống Kê Học Phí & Tiến Độ Lớp Học
          </h2>
        </div>
        
        {/* Quick Progress Bar */}
        <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60 min-w-[240px]">
          <div className="flex justify-between items-center text-xs text-slate-300 mb-1.5 font-medium">
            <span>Tỷ lệ thu học phí</span>
            <span className="text-emerald-400 font-bold">
              {totalTargetRevenue > 0
                ? Math.round((totalCollected / totalTargetRevenue) * 100)
                : 0}%
            </span>
          </div>
          <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full transition-all duration-500"
              style={{
                width: `${
                  totalTargetRevenue > 0
                    ? Math.min(100, Math.round((totalCollected / totalTargetRevenue) * 100))
                    : 0
                }%`,
              }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1.5">
            <span>Đã thu: {paidCount}/{bills.length} HS</span>
            <span>Còn nợ: {unpaidCount} HS</span>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid matching the Excel Header */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Metric 1: Target Revenue */}
        <div className="bg-emerald-950/50 backdrop-blur border border-emerald-500/20 p-3.5 sm:p-4 rounded-xl">
          <div className="flex items-center space-x-2 text-emerald-300 mb-1">
            <Target className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
              Mục Tiêu Thu
            </span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-white">
            {formatVND(totalTargetRevenue)}
          </div>
          <p className="text-[11px] text-emerald-400/80 mt-0.5">
            Dự kiến thu từ {students.length} học sinh
          </p>
        </div>

        {/* Metric 2: Collected */}
        <div className="bg-teal-950/50 backdrop-blur border border-teal-500/20 p-3.5 sm:p-4 rounded-xl">
          <div className="flex items-center space-x-2 text-teal-300 mb-1">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-200">
              Thực Thu
            </span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-emerald-300">
            {formatVND(totalCollected)}
          </div>
          <p className="text-[11px] text-teal-400/80 mt-0.5">
            Đã nhận chuyển khoản
          </p>
        </div>

        {/* Metric 3: Debt */}
        <div className="bg-rose-950/40 backdrop-blur border border-rose-500/20 p-3.5 sm:p-4 rounded-xl">
          <div className="flex items-center space-x-2 text-rose-300 mb-1">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-200">
              Nợ Đọng
            </span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-rose-300">
            {formatVND(outstandingDebt)}
          </div>
          <p className="text-[11px] text-rose-400/80 mt-0.5">
            Cần gửi QR nhắc đóng
          </p>
        </div>

        {/* Metric 4: Classes & Students */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 p-3.5 sm:p-4 rounded-xl">
          <div className="flex items-center space-x-2 text-slate-300 mb-1">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Số Lớp Học
            </span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-white">
            {classes.length} Lớp
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {students.length} học sinh theo học
          </p>
        </div>

        {/* Metric 5: Total Sessions Taught */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 p-3.5 sm:p-4 rounded-xl col-span-2 lg:col-span-1">
          <div className="flex items-center space-x-2 text-slate-300 mb-1">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Buổi Đã Dạy
            </span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-amber-300">
            {totalSessionsTaught} Buổi
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Tổng tích lũy cả trung tâm
          </p>
        </div>
      </div>
    </div>
  );
};
