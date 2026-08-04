import React, { useState } from 'react';
import { Mail, Lock, Phone, Eye, EyeOff, Loader2, GraduationCap, Users } from 'lucide-react';

interface LoginScreenProps {
  onLoginTeacher: (email: string, password: string) => Promise<void>;
  onLoginPortal: (phone: string, accessCode: string) => Promise<void>;
}

type Tab = 'teacher' | 'portal';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginTeacher, onLoginPortal }) => {
  const [tab, setTab] = useState<Tab>('teacher');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchTab = (next: Tab) => {
    if (next === tab) return;
    setTab(next);
    setError(null);
  };

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onLoginTeacher(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handlePortalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onLoginPortal(phone, accessCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/90 via-sky-50/70 to-slate-100 relative overflow-x-hidden font-sans text-slate-900 selection:bg-[#FF5500] selection:text-white flex items-center justify-center px-4 py-10">
      {/* Ambient background — giống hệt App.tsx để chuyển từ login sang dashboard không bị "giật" phong cách */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-24 -left-20 w-[620px] h-[620px] rounded-full bg-gradient-to-tr from-[#103BE6]/35 via-blue-500/25 to-sky-300/35 blur-[100px] animate-liquid-1" />
        <div className="absolute top-1/4 -right-28 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#FF5500]/25 via-amber-400/20 to-[#103BE6]/20 blur-[110px] animate-liquid-2" />
        <div className="absolute -bottom-28 left-1/6 w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-sky-400/30 via-[#103BE6]/30 to-indigo-300/25 blur-[105px] animate-liquid-3" />
        <div className="absolute top-2/3 right-1/3 w-[450px] h-[450px] rounded-full bg-gradient-to-r from-[#FF5500]/20 via-amber-300/20 to-blue-300/25 blur-[95px] animate-liquid-1" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center tracking-tighter">
            <span className="text-[#FF5500] font-black text-2xl drop-shadow-xs">Light</span>
            <span className="bg-[#103BE6] text-white px-2 py-1 rounded-lg text-xl font-black ml-1 border border-white/30 shadow-[0_8px_20px_rgba(16,59,230,0.35)]">
              ED
            </span>
          </div>
        </div>
        <p className="text-center text-xs font-semibold text-slate-500 mb-8 tracking-wide">
          Hệ thống Quản lý Học phí &amp; Điểm danh Tự động
        </p>

        <div className="liquid-glass rounded-3xl p-2 sm:p-2.5">
          {/* Tab switcher */}
          <div className="grid grid-cols-2 gap-1.5 p-1.5" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'teacher'}
              onClick={() => switchTab('teacher')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#103BE6]/50 ${
                tab === 'teacher' ? 'liquid-glass-btn-primary text-white shadow-md' : 'text-slate-600 hover:bg-white/70'
              }`}
            >
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span>Giáo viên</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'portal'}
              onClick={() => switchTab('portal')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#103BE6]/50 ${
                tab === 'portal' ? 'liquid-glass-btn-primary text-white shadow-md' : 'text-slate-600 hover:bg-white/70'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Phụ huynh &amp; Học sinh</span>
            </button>
          </div>

          <div className="p-5 sm:p-6 pt-3">
            {tab === 'teacher' ? (
              <form onSubmit={handleTeacherSubmit} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="login-email" className="block text-xs font-bold text-slate-600 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="teacher@lighted.local"
                      className="liquid-glass-input w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-xs font-bold text-slate-600 mb-1.5">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="liquid-glass-input w-full pl-10 pr-10 py-2.5 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#103BE6]/50 rounded"
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div role="alert" className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="liquid-glass-btn-primary w-full py-3 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#103BE6]/50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handlePortalSubmit} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="login-phone" className="block text-xs font-bold text-slate-600 mb-1.5">
                    Số điện thoại phụ huynh
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-phone"
                      type="tel"
                      inputMode="numeric"
                      required
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="09xxxxxxxx"
                      className="liquid-glass-input w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-pin" className="block text-xs font-bold text-slate-600 mb-1.5">
                    Mã PIN (6 số) — do giáo viên cấp
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-pin"
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      autoComplete="one-time-code"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      className="liquid-glass-input w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none tracking-[0.3em]"
                    />
                  </div>
                </div>

                {error && (
                  <div role="alert" className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="liquid-glass-btn-orange w-full py-3 rounded-xl text-sm font-extrabold text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5500]/50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6 px-4">
          Tài khoản do giáo viên cấp sẵn — liên hệ trung tâm nếu bạn chưa có thông tin đăng nhập.
        </p>
      </div>
    </div>
  );
};
