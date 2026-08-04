import React from 'react';
import { BookOpen, CalendarCheck, CreditCard, Users, Settings, UserCheck, QrCode, LayoutDashboard, User, LogOut } from 'lucide-react';
import { BankConfig } from '../types';

interface NavbarProps {
  activeTab: 'dashboard' | 'tuition' | 'attendance' | 'parent' | 'classes' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'tuition' | 'attendance' | 'parent' | 'classes' | 'settings') => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  bankConfig: BankConfig;
  currentUser?: { name: string; role: string };
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedMonth,
  setSelectedMonth,
  bankConfig,
  currentUser = { name: 'GV. Nguyễn Văn Minh', role: 'Quản trị viên' },
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 pt-2 sm:pt-3 pb-1">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="liquid-glass rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 transition-all">
        <div className="flex items-center justify-between gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#103BE6] via-[#1236D6] to-[#2B56FF] flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-[0_8px_20px_rgba(16,59,230,0.35),inset_0_1px_1.5px_rgba(255,255,255,0.6)] relative overflow-hidden shrink-0">
              <div className="flex items-center tracking-tighter">
                <span className="text-[#FF5500] font-black text-[11px] sm:text-xs drop-shadow-xs">Light</span>
                <span className="bg-[#103BE6] text-white px-1 py-0.5 rounded text-[9px] sm:text-[10px] font-black ml-0.5 border border-white/30">ED</span>
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <h1 className="text-xs sm:text-lg font-black tracking-tight leading-tight flex items-center truncate">
                  <span className="text-slate-900 hidden xs:inline">Trung Tâm </span>
                  <span className="text-[#FF5500] font-black mr-0.5 ml-1">Light</span>
                  <span className="bg-[#103BE6] text-white px-1 sm:px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-black shadow-xs">ED</span>
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold liquid-glass-pill text-[#103BE6] border border-[#103BE6]/20 shrink-0">
                  <QrCode className="w-3 h-3 mr-1 text-[#FF5500]" /> VietQR Auto
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">
                Hệ thống Quản lý Học phí & Điểm danh Tự động
              </p>
            </div>
          </div>

          {/* Month Selector & Logged In User Profile Pill */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            <div className="flex items-center space-x-1 liquid-glass-pill px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs">
              <span className="font-bold text-slate-500 uppercase text-[9px] sm:text-[10px] tracking-wider hidden sm:inline">Kỳ học:</span>
              <select
                id="month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent font-extrabold text-[#103BE6] focus:outline-none cursor-pointer text-[11px] sm:text-xs py-0.5"
              >
                <option value="THÁNG 5">Tháng 5/2026</option>
                <option value="THÁNG 6">Tháng 6/2026</option>
                <option value="THÁNG 7">Tháng 7/2026</option>
                <option value="THÁNG 8">Tháng 8/2026</option>
              </select>
            </div>

            {/* User Profile Pill */}
            <div
              className="hidden sm:flex items-center space-x-2.5 liquid-glass-pill text-indigo-950 px-3.5 py-1.5 rounded-2xl text-xs font-semibold"
              title="Tài khoản đang đăng nhập"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#103BE6] to-blue-500 text-white flex items-center justify-center text-[10px] font-extrabold shadow-xs shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-extrabold leading-none">{currentUser.name}</div>
                <div className="text-[10px] text-[#103BE6] font-bold mt-0.5">{currentUser.role}</div>
              </div>
            </div>

            {onLogout && (
              <button
                id="nav-logout"
                onClick={onLogout}
                title="Đăng xuất"
                aria-label="Đăng xuất"
                className="flex items-center justify-center liquid-glass-pill hover:bg-rose-50 hover:text-rose-600 text-slate-600 w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50 shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs (Desktop & Tablet horizontal scroll) */}
        <div className="hidden sm:flex overflow-x-auto space-x-1 sm:space-x-1.5 pt-2 sm:pt-3 mt-2 border-t border-white/60 no-scrollbar touch-pan-x">
          <button
            id="nav-tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer shrink-0 min-h-[38px] ${
              activeTab === 'dashboard'
                ? 'liquid-glass-btn-primary text-white scale-[1.01] shadow-md'
                : 'text-slate-700 hover:bg-white/80 hover:text-[#103BE6]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Trang Chủ</span>
          </button>

          <button
            id="nav-tab-tuition"
            onClick={() => setActiveTab('tuition')}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer shrink-0 min-h-[38px] ${
              activeTab === 'tuition'
                ? 'liquid-glass-btn-primary text-white scale-[1.01] shadow-md'
                : 'text-slate-700 hover:bg-white/80 hover:text-[#103BE6]'
            }`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>Tính Học Phí & Nhắc Đóng</span>
          </button>

          <button
            id="nav-tab-attendance"
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer shrink-0 min-h-[38px] ${
              activeTab === 'attendance'
                ? 'liquid-glass-btn-primary text-white scale-[1.01] shadow-md'
                : 'text-slate-700 hover:bg-white/80 hover:text-[#103BE6]'
            }`}
          >
            <CalendarCheck className="w-4 h-4 shrink-0" />
            <span>Bảng Điểm Danh</span>
          </button>

          <button
            id="nav-tab-parent"
            onClick={() => setActiveTab('parent')}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer shrink-0 min-h-[38px] ${
              activeTab === 'parent'
                ? 'liquid-glass-btn-primary text-white scale-[1.01] shadow-md'
                : 'text-slate-700 hover:bg-white/80 hover:text-[#103BE6]'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Thông Tin Phụ Huynh</span>
          </button>

          <button
            id="nav-tab-classes"
            onClick={() => setActiveTab('classes')}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer shrink-0 min-h-[38px] ${
              activeTab === 'classes'
                ? 'liquid-glass-btn-primary text-white scale-[1.01] shadow-md'
                : 'text-slate-700 hover:bg-white/80 hover:text-[#103BE6]'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Quản Lý Lớp & Học Sinh</span>
          </button>

          <button
            id="nav-tab-settings"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer shrink-0 min-h-[38px] ${
              activeTab === 'settings'
                ? 'liquid-glass-btn-primary text-white scale-[1.01] shadow-md'
                : 'text-slate-700 hover:bg-white/80 hover:text-[#103BE6]'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Cài Đặt</span>
          </button>
        </div>
      </div>
    </div>

    {/* Mobile Fixed Bottom Navigation Bar */}
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 px-2 pb-2 pt-1 bg-white/90 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-8px_20px_rgba(0,0,0,0.08)]">
      <div className="grid grid-cols-6 gap-0.5 max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-[#103BE6] bg-[#103BE6]/10 font-black'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] leading-tight truncate w-full text-center">Trang Chủ</span>
        </button>

        <button
          onClick={() => setActiveTab('tuition')}
          className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition cursor-pointer ${
            activeTab === 'tuition'
              ? 'text-[#103BE6] bg-[#103BE6]/10 font-black'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] leading-tight truncate w-full text-center">Học Phí</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition cursor-pointer ${
            activeTab === 'attendance'
              ? 'text-[#103BE6] bg-[#103BE6]/10 font-black'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarCheck className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] leading-tight truncate w-full text-center">Điểm Danh</span>
        </button>

        <button
          onClick={() => setActiveTab('parent')}
          className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition cursor-pointer ${
            activeTab === 'parent'
              ? 'text-[#103BE6] bg-[#103BE6]/10 font-black'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] leading-tight truncate w-full text-center">Phụ Huynh</span>
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition cursor-pointer ${
            activeTab === 'classes'
              ? 'text-[#103BE6] bg-[#103BE6]/10 font-black'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] leading-tight truncate w-full text-center">Lớp Học</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition cursor-pointer ${
            activeTab === 'settings'
              ? 'text-[#103BE6] bg-[#103BE6]/10 font-black'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] leading-tight truncate w-full text-center">Cài Đặt</span>
        </button>
      </div>
    </div>
  </header>
  );
};

