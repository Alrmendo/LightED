import React, { useState } from 'react';
import { Search, Filter, Phone, User, Users, Calendar, Briefcase, Compass, FileText, Plus, Edit2, MessageSquare, CheckCircle2, QrCode, Sparkles, X, ChevronRight } from 'lucide-react';
import { Student, EnglishClass, TuitionBill, BankConfig, AttendanceRecord } from '../types';
import { formatVND } from '../utils/vietqr';
import { QrModal } from './QrModal';

interface ParentInfoProps {
  students: Student[];
  classes: EnglishClass[];
  bills: TuitionBill[];
  attendanceRecords: AttendanceRecord[];
  bankConfig: BankConfig;
  selectedMonth: string;
  onUpdateStudent: (updatedStudent: Student) => Promise<void>;
  onAddStudent: (newStudent: Omit<Student, 'id'>) => Promise<void>;
  onUpdateBillStatus: (billId: string, newStatus: 'paid' | 'unpaid') => Promise<void>;
}

export const ParentInfo: React.FC<ParentInfoProps> = ({
  students = [],
  classes = [],
  bills = [],
  attendanceRecords = [],
  bankConfig,
  selectedMonth,
  onUpdateStudent,
  onAddStudent,
  onUpdateBillStatus,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Edit Modal state
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  // QR Modal
  const [qrModalStudent, setQrModalStudent] = useState<{
    student: Student;
    englishClass: EnglishClass;
    bill: TuitionBill;
  } | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Student>>({
    name: '',
    parentName: '',
    phone: '',
    studentPhone: '',
    classId: classes[0]?.id || '',
    email: '',
    dob: '',
    parentDob: '',
    parentOccupation: '',
    futureOrientation: '',
    notes: '',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredStudents = students.filter((std) => {
    const matchesClass = selectedClassId === 'all' || std.classId === selectedClassId;
    const matchesSearch =
      std.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (std.parentName && std.parentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (std.phone || '').includes(searchQuery) ||
      (std.parentDob && std.parentDob.includes(searchQuery)) ||
      (std.futureOrientation && std.futureOrientation.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesClass && matchesSearch;
  });

  // Open Edit Modal
  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({ ...student });
    setIsAddingNew(false);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingStudent(null);
    // KHÔNG tự sinh id ở client — server sinh id thật khi tạo (POST /api/students). formData khi
    // thêm mới vì vậy không có field `id`.
    setFormData({
      name: '',
      parentName: '',
      phone: '',
      studentPhone: '',
      classId: selectedClassId !== 'all' ? selectedClassId : classes[0]?.id || '',
      email: '',
      dob: '',
      parentOccupation: '',
      futureOrientation: '',
      notes: '',
    });
    setIsAddingNew(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      showToast('Vui lòng điền Tên học sinh!');
      return;
    }

    try {
      if (isAddingNew) {
        await onAddStudent(formData as Omit<Student, 'id'>);
        showToast('Đã thêm hồ sơ phụ huynh & học sinh mới!');
      } else if (editingStudent) {
        await onUpdateStudent(formData as Student);
        showToast('Đã cập nhật thông tin hồ sơ thành công!');
      }
      setEditingStudent(null);
      setIsAddingNew(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không lưu được hồ sơ, vui lòng thử lại.');
    }
  };

  // Specific Tab Dashboard Metrics (Feedback #5)
  const totalParents = students.length;
  const withOccupationCount = students.filter((s) => s.parentOccupation).length;
  const withOrientationCount = students.filter((s) => s.futureOrientation).length;
  const withDobCount = students.filter((s) => s.dob).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-indigo-500/30 animate-bounce">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Dedicated Tab Dashboard for "Thông Tin Phụ Huynh" (Feedback #5 & #6) */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-indigo-800/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Users className="w-3.5 h-3.5" />
              <span>DASHBOARD QUẢN LÝ THÔNG TIN PHỤ HUYNH</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-2">
              Hồ Sơ & Định Hướng Phụ Huynh Học Sinh
            </h2>
            <p className="text-xs text-indigo-200 mt-1">
              Quản lý chi tiết tên học sinh, tên phụ huynh, sinh nhật, SĐT, nghề nghiệp, định hướng học tập & ghi chú cá nhân.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs rounded-2xl shadow-lg transition flex items-center space-x-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Hồ Sơ Phụ Huynh Mới</span>
          </button>
        </div>

        {/* Tab Dashboard Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-indigo-200 block font-medium">Tổng Phụ Huynh</span>
            <span className="text-lg sm:text-xl font-extrabold text-white">{totalParents} Phụ huynh</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-indigo-200 block font-medium">Đã Đăng Ký Định Hướng</span>
            <span className="text-lg sm:text-xl font-extrabold text-emerald-400">{withOrientationCount} Hồ sơ</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-indigo-200 block font-medium">Đã Cập Nhật Sinh Nhật</span>
            <span className="text-lg sm:text-xl font-extrabold text-amber-300">{withDobCount} Học sinh</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-indigo-200 block font-medium">Đã Lưu Nghề Nghiệp</span>
            <span className="text-lg sm:text-xl font-extrabold text-indigo-200">{withOccupationCount} Phụ huynh</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="liquid-glass p-4 rounded-3xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm tên HS, PH, SĐT, Định hướng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 liquid-glass-input rounded-xl text-xs font-medium"
            />
          </div>

          {/* Class Filter */}
          <div className="flex items-center space-x-1.5 liquid-glass-pill rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="parent-class-filter"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">Tất cả lớp ({classes.length})</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Hiển thị <strong>{filteredStudents.length}</strong> / {students.length} hồ sơ phụ huynh
        </div>
      </div>

      {/* Main Grid View of Parent & Student Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStudents.map((std) => {
          const englishClass = classes.find((c) => c.id === std.classId);
          const studentBill = bills.find((b) => b.studentId === std.id);

          return (
            <div
              key={std.id}
              className="liquid-glass liquid-glass-interactive rounded-3xl p-5 transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Header Header Info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-indigo-100">
                      {std.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">{std.name}</h3>
                      <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-100">
                        Lớp: {englishClass?.name || '—'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenEdit(std)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    title="Chỉnh sửa hồ sơ"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Main Detailed Fields Requested in Feedback #6 */}
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700">
                  {/* Tên Phụ Huynh */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium flex items-center space-x-1">
                      <User className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Tên phụ huynh:</span>
                    </span>
                    <span className="font-bold text-slate-900">{std.parentName || 'Chưa cập nhật'}</span>
                  </div>

                  {/* Ngày Sinh Học Sinh */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      <span>Sinh nhật học sinh:</span>
                    </span>
                    <span className="font-semibold text-slate-800">{std.dob || 'Chưa cập nhật'}</span>
                  </div>

                  {/* Ngày Sinh Phụ Huynh */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-purple-500" />
                      <span>Sinh nhật phụ huynh:</span>
                    </span>
                    <span className="font-semibold text-slate-800">{std.parentDob || 'Chưa cập nhật'}</span>
                  </div>

                  {/* SĐT / Zalo */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium flex items-center space-x-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      <span>SĐT Phụ Huynh (Zalo):</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-700">{std.phone || '—'}</span>
                  </div>

                  {/* SĐT Học Sinh */}
                  {std.studentPhone && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium flex items-center space-x-1">
                        <Phone className="w-3.5 h-3.5 text-blue-400" />
                        <span>SĐT học sinh:</span>
                      </span>
                      <span className="font-mono font-bold text-slate-700">{std.studentPhone}</span>
                    </div>
                  )}

                  {/* Nghề Nghiệp */}
                  <div className="flex items-start justify-between pt-1">
                    <span className="text-slate-500 font-medium flex items-center space-x-1 shrink-0">
                      <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                      <span>Nghề nghiệp PH:</span>
                    </span>
                    <span className="font-medium text-slate-800 text-right">{std.parentOccupation || '—'}</span>
                  </div>

                  {/* Định Hướng Cho Con */}
                  <div className="bg-indigo-50/60 p-2.5 rounded-2xl border border-indigo-100 space-y-1 mt-2">
                    <div className="text-[11px] font-bold text-indigo-900 flex items-center space-x-1">
                      <Compass className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Định hướng mục tiêu học tập:</span>
                    </div>
                    <p className="text-[11px] text-indigo-950 font-medium leading-relaxed">
                      {std.futureOrientation || 'Chưa có thông tin định hướng riêng.'}
                    </p>
                  </div>

                  {/* Ghi Chú Thêm */}
                  {std.notes && (
                    <div className="liquid-glass-subtle p-2.5 rounded-2xl text-[11px] space-y-0.5">
                      <div className="font-bold text-slate-700 flex items-center space-x-1">
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>Ghi chú thêm từ giáo viên:</span>
                      </div>
                      <p className="text-slate-600">{std.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    if (std.phone) {
                      window.open(`https://zalo.me/${std.phone.replace(/[^0-9]/g, '')}`, '_blank');
                    }
                  }}
                  disabled={!std.phone}
                  title={std.phone ? undefined : 'Chưa có SĐT phụ huynh'}
                  className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-50"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Mở Zalo PH</span>
                </button>

                {studentBill && englishClass && (
                  <button
                    onClick={() =>
                      setQrModalStudent({
                        student: std,
                        englishClass,
                        bill: studentBill,
                      })
                    }
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Mã VietQR</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Add Student Modal */}
      {(editingStudent || isAddingNew) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="liquid-glass rounded-3xl max-w-lg w-full overflow-hidden my-8">
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white">
                {isAddingNew ? 'Thêm Hồ Sơ Phụ Huynh Mới' : 'Cập Nhật Hồ Sơ Phụ Huynh & Học Sinh'}
              </h3>
              <button
                onClick={() => {
                  setEditingStudent(null);
                  setIsAddingNew(false);
                }}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên Học Sinh *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 liquid-glass-input rounded-xl text-xs font-semibold"
                    placeholder="VD: Lê Minh Anh"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lớp Học *</label>
                  <select
                    value={formData.classId || ''}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-3 py-2 liquid-glass-input rounded-xl text-xs font-semibold"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên Phụ Huynh</label>
                  <input
                    type="text"
                    value={formData.parentName || ''}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full px-3 py-2 liquid-glass-input rounded-xl text-xs font-semibold"
                    placeholder="VD: Chị Mai (Mẹ Minh Anh)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SĐT Phụ Huynh (Zalo)</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 liquid-glass-input rounded-xl text-xs font-semibold"
                    placeholder="VD: 0988123456"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SĐT Học Sinh (nếu có)</label>
                  <input
                    type="text"
                    value={formData.studentPhone || ''}
                    onChange={(e) => setFormData({ ...formData, studentPhone: e.target.value })}
                    className="w-full px-3 py-2 liquid-glass-input rounded-xl text-xs font-semibold"
                    placeholder="VD: 0912345678"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sinh Nhật Học Sinh</label>
                  <input
                    type="text"
                    value={formData.dob || ''}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 liquid-glass-input rounded-xl text-xs font-semibold"
                    placeholder="VD: 15/08/2012"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sinh Nhật Phụ Huynh</label>
                  <input
                    type="text"
                    value={formData.parentDob || ''}
                    onChange={(e) => setFormData({ ...formData, parentDob: e.target.value })}
                    className="w-full px-3 py-2 liquid-glass-input rounded-xl text-xs font-semibold"
                    placeholder="VD: 15/05/1986"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nghề Nghiệp Phụ Huynh</label>
                <input
                  type="text"
                  value={formData.parentOccupation || ''}
                  onChange={(e) => setFormData({ ...formData, parentOccupation: e.target.value })}
                  className="w-full px-3 py-2 liquid-glass-input rounded-xl text-xs font-semibold"
                  placeholder="VD: Kế toán trưởng"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Định Hướng Cho Con</label>
                <textarea
                  rows={2}
                  value={formData.futureOrientation || ''}
                  onChange={(e) => setFormData({ ...formData, futureOrientation: e.target.value })}
                  className="w-full px-3 py-2 liquid-glass-input rounded-xl text-xs font-semibold"
                  placeholder="VD: Định hướng thi Chuyên Anh THPT & Thi IELTS 7.5..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ghi Chú Thêm</label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 liquid-glass-input rounded-xl text-xs font-semibold"
                  placeholder="VD: Học lực tốt, cần rèn luyện kĩ năng làm bài đọc..."
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingStudent(null);
                    setIsAddingNew(false);
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="liquid-glass-btn-primary px-5 py-2 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Lưu Hồ Sơ
                </button>
              </div>
            </form>
          </div>
        </div>
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
            try {
              await onUpdateBillStatus(billId, newStatus);
              setQrModalStudent((prev) =>
                prev ? { ...prev, bill: { ...prev.bill, paidStatus: newStatus } } : null
              );
              showToast(newStatus === 'paid' ? 'Đã thu học phí thành công!' : 'Đã chuyển thành chưa thu');
            } catch (err) {
              showToast(err instanceof Error ? err.message : 'Không cập nhật được trạng thái thanh toán.');
            }
          }}
        />
      )}
    </div>
  );
};
