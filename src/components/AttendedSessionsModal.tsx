import React, { useState } from 'react';
import { X, Calendar, CheckCircle2, Clock, XCircle, BookOpen, FileText, Filter, Eye, Sparkles } from 'lucide-react';
import { Student, EnglishClass, AttendanceRecord } from '../types';
import { parseDateToDDMM, formatVND } from '../utils/vietqr';

interface AttendedSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  englishClass: EnglishClass;
  attendanceRecords: AttendanceRecord[];
  selectedMonth: string;
}

export const AttendedSessionsModal: React.FC<AttendedSessionsModalProps> = ({
  isOpen,
  onClose,
  student,
  englishClass,
  attendanceRecords = [],
  selectedMonth,
}) => {
  const [filter, setFilter] = useState<'all' | 'present' | 'absent'>('all');

  if (!isOpen) return null;

  const safeRecords = attendanceRecords || [];
  const studentRecords = safeRecords
    .filter((a) => a && a.studentId === student?.id)
    .sort((a, b) => (a?.date || '').localeCompare(b?.date || ''));

  const presentRecords = studentRecords.filter((r) => r.status === 'present');
  const excusedRecords = studentRecords.filter((r) => r.status === 'excused');
  const unexcusedRecords = studentRecords.filter((r) => r.status === 'unexcused');

  const filteredRecords = studentRecords.filter((r) => {
    if (filter === 'present') return r.status === 'present';
    if (filter === 'absent') return r.status === 'excused' || r.status === 'unexcused';
    return true;
  });

  const totalTuition = presentRecords.length * (englishClass?.pricePerSession || 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="liquid-glass rounded-3xl max-w-lg w-full overflow-hidden my-8 animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl">
              <Calendar className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>CHI TIẾT BUỔI HỌC - {selectedMonth}</span>
              </div>
              <h3 className="text-base font-extrabold text-white mt-1">
                {student.name}
              </h3>
              <p className="text-xs text-indigo-200">
                Lớp: <span className="font-bold text-white">{englishClass.name}</span> • GV: {englishClass.teacherName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Summary Dashboard Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200/80 text-center">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">Đã Tham Gia</span>
              <span className="text-base font-extrabold text-emerald-900">
                {presentRecords.length} buổi
              </span>
            </div>

            <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200/80 text-center">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">Vắng Có Phép</span>
              <span className="text-base font-extrabold text-amber-900">
                {excusedRecords.length} buổi
              </span>
            </div>

            <div className="liquid-glass-subtle p-3 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-slate-700 uppercase block">Thành Tiền</span>
              <span className="text-base font-extrabold text-indigo-900">
                {formatVND(totalTuition)}
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span>Danh sách ngày học ({studentRecords.length})</span>
            </span>

            <div className="flex items-center liquid-glass-pill p-1 rounded-xl text-[11px] font-bold space-x-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  filter === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả ({studentRecords.length})
              </button>
              <button
                onClick={() => setFilter('present')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  filter === 'present' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Có mặt ({presentRecords.length})
              </button>
              <button
                onClick={() => setFilter('absent')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  filter === 'absent' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Vắng ({excusedRecords.length + unexcusedRecords.length})
              </button>
            </div>
          </div>

          {/* Detailed Cards List */}
          <div className="space-y-3">
            {filteredRecords.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 font-medium liquid-glass-subtle rounded-2xl">
                Không tìm thấy buổi học nào phù hợp với bộ lọc.
              </div>
            ) : (
              filteredRecords.map((record, idx) => {
                const isPresent = record.status === 'present';
                const isExcused = record.status === 'excused';

                return (
                  <div
                    key={record.id}
                    className={`p-3.5 rounded-2xl border text-xs transition space-y-2 ${
                      isPresent
                        ? 'bg-emerald-50/50 border-emerald-200/80 hover:bg-emerald-50'
                        : isExcused
                        ? 'bg-amber-50/50 border-amber-200/80 hover:bg-amber-50'
                        : 'bg-rose-50/50 border-rose-200/80 hover:bg-rose-50'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-mono text-slate-800 text-[11px] shadow-2xs">
                          {parseDateToDDMM(record.date)}
                        </span>
                        <span className="text-slate-900 font-extrabold">Buổi {idx + 1}</span>
                      </div>

                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold shadow-2xs ${
                          isPresent
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : isExcused
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {isPresent ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Có Mặt
                          </>
                        ) : isExcused ? (
                          <>
                            <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" /> Vắng Có Phép
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" /> Vắng
                          </>
                        )}
                      </span>
                    </div>

                    {/* Teacher note if present */}
                    {record.note && (
                      <div className="text-[11px] text-slate-600 font-medium pl-1">
                        📌 Ghi chú: <span className="text-slate-800">{record.note}</span>
                      </div>
                    )}

                    {/* Lesson Topic & Homework */}
                    {(record.lessonTopic || record.homework) && (
                      <div className="pt-2 border-t border-slate-200/60 text-[11px] space-y-1">
                        {record.lessonTopic && (
                          <div className="flex items-start space-x-1.5 text-slate-800">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                            <span><strong>Bài học:</strong> {record.lessonTopic}</span>
                          </div>
                        )}
                        {record.homework && (
                          <div className="flex items-start space-x-1.5 text-slate-600 pl-5">
                            <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                            <span><strong>BTVN:</strong> {record.homework}</span>
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

        {/* Modal Footer */}
        <div className="liquid-glass-subtle px-6 py-3 flex items-center justify-between">
          <span className="text-xs text-slate-600 font-medium">
            Đơn giá: <strong>{formatVND(englishClass.pricePerSession)}</strong> / buổi
          </span>
          <button
            onClick={onClose}
            className="liquid-glass-btn-primary px-5 py-2 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

