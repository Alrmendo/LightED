import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';
import type {
  AttendanceRecord,
  AttendanceStatus,
  BankConfig,
  EnglishClass,
  Student,
  TuitionBill,
} from '../types';

// GET /api/bills không trả attendedDates (chỉ lưu totalAttendedSessions/totalAmount đã tính sẵn —
// xem server/README.md "Thiết kế GET /api/bills") — derive lại DD/MM list ở đây từ
// attendanceRecords ĐÃ fetch cùng lúc, y hệt định dạng computeBillSummary() phía server dùng cho
// GET /api/portal/me, để không phải thêm round-trip / đổi backend chỉ vì thiếu 1 field hiển thị.
type BillFromApi = Omit<TuitionBill, 'attendedDates'>;

function withAttendedDates(bills: BillFromApi[], attendanceRecords: AttendanceRecord[]): TuitionBill[] {
  return bills.map((bill) => ({
    ...bill,
    attendedDates: attendanceRecords
      .filter(
        (r) => r.studentId === bill.studentId && r.status === 'present' && r.date.slice(0, 7) === bill.month
      )
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((r) => {
        const [, m, d] = r.date.split('-');
        return `${d}/${m}`;
      }),
  }));
}

// Data-adapter cho toàn bộ dashboard giáo viên (classes/students/attendance/bills/bankConfig) —
// theo đúng pattern usePortalMe.ts: apiFetch cho mọi request, refetch-after-mutation (không
// optimistic update — nhiều mutation ảnh hưởng bill mà bill được BACKEND tính lại, patch phía
// client dễ sai công thức thật). `month` scope riêng cho bills (GET /api/bills?month=) để mỗi học
// sinh chỉ có ĐÚNG 1 bill khớp tháng đang chọn — attendanceRecords fetch toàn bộ (không lọc theo
// tháng), khớp cách AttendanceMatrix.tsx cần xem lịch sử nhiều tháng cùng lúc.
// `enabled` — App.tsx gọi hook này KHÔNG điều kiện ngay từ đầu (Rules of Hooks, giống vị trí
// state cũ), kể cả lúc chưa đăng nhập xong / đang ở màn portal. Nếu tự fetch ngay khi mount thì
// request đầu tiên chắc chắn 401 (chưa có token) — lỗi đó set vào `error` và KHÔNG tự xoá sau khi
// đăng nhập thành công, vì effect chỉ phụ thuộc `month` chứ không biết auth vừa đổi. `enabled`
// (App.tsx truyền `auth.status === 'authenticated' && auth.profile.role === 'TEACHER'`) chặn hẳn
// việc fetch cho tới khi thật sự cần, rồi tự fetch lại ngay khi enabled chuyển sang true.
export function useTeacherData(month: string, enabled: boolean) {
  const [classes, setClasses] = useState<EnglishClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [bills, setBills] = useState<TuitionBill[]>([]);
  const [bankConfig, setBankConfig] = useState<BankConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const [c, s, a, b, bc] = await Promise.all([
        apiFetch<EnglishClass[]>('/api/classes'),
        apiFetch<Student[]>('/api/students'),
        apiFetch<AttendanceRecord[]>('/api/attendance'),
        apiFetch<BillFromApi[]>(`/api/bills?month=${encodeURIComponent(month)}`),
        apiFetch<BankConfig | null>('/api/bank-config'),
      ]);
      setClasses(c);
      setStudents(s);
      setAttendanceRecords(a);
      setBills(withAttendedDates(b, a));
      setBankConfig(bc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [month, enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  const createClass = useCallback(
    async (data: Omit<EnglishClass, 'id'>) => {
      await apiFetch('/api/classes', { method: 'POST', body: JSON.stringify(data) });
      await reload();
    },
    [reload]
  );

  const updateClass = useCallback(
    async (updated: EnglishClass) => {
      await apiFetch(`/api/classes/${updated.id}`, { method: 'PUT', body: JSON.stringify(updated) });
      await reload();
    },
    [reload]
  );

  // KHÔNG gọi reload() nếu fail (kể cả 409) — lỗi ném thẳng ra ngoài cho component gọi tự
  // try/catch (xem ClassManagement.tsx), giữ nguyên state hiện tại khi xoá không thành công.
  const deleteClass = useCallback(async (classId: string) => {
    await apiFetch(`/api/classes/${classId}`, { method: 'DELETE' });
    await reload();
  }, [reload]);

  const createStudent = useCallback(
    async (data: Omit<Student, 'id'>) => {
      await apiFetch('/api/students', { method: 'POST', body: JSON.stringify(data) });
      await reload();
    },
    [reload]
  );

  const updateStudent = useCallback(
    async (updated: Student) => {
      await apiFetch(`/api/students/${updated.id}`, { method: 'PUT', body: JSON.stringify(updated) });
      await reload();
    },
    [reload]
  );

  const deleteStudent = useCallback(async (studentId: string) => {
    await apiFetch(`/api/students/${studentId}`, { method: 'DELETE' });
    await reload();
  }, [reload]);

  const upsertAttendance = useCallback(
    async (studentId: string, date: string, status: AttendanceStatus, topic?: string) => {
      await apiFetch('/api/attendance', {
        method: 'PUT',
        body: JSON.stringify({ studentId, date, status, lessonTopic: topic }),
      });
      await reload();
    },
    [reload]
  );

  const addSessionDate = useCallback(
    async (classId: string, date: string) => {
      const res = await apiFetch<{ studentsCount: number; createdSessionsCount: number }>(
        '/api/attendance/session-date',
        { method: 'POST', body: JSON.stringify({ classId, date }) }
      );
      await reload();
      return res;
    },
    [reload]
  );

  // Chữ ký giữ nguyên (classId, daysOfWeek, month?) để khớp onSyncSchedule đã có ở
  // ClassManagement.tsx/BankSettings.tsx — daysOfWeek KHÔNG gửi lên server vì
  // POST /api/attendance/sync-schedule tự lấy EnglishClass.daysOfWeek theo classId, không nhận
  // qua client.
  const syncSchedule = useCallback(
    async (classId: string, _daysOfWeek: number[], syncMonth: string = month) => {
      const res = await apiFetch<{ generatedDatesCount: number; createdSessionsCount: number }>(
        '/api/attendance/sync-schedule',
        { method: 'POST', body: JSON.stringify({ classId, month: syncMonth }) }
      );
      await reload();
      return res;
    },
    [reload, month]
  );

  const updateBillStatus = useCallback(
    async (billId: string, newStatus: 'paid' | 'unpaid') => {
      await apiFetch(`/api/bills/${billId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ paidStatus: newStatus }),
      });
      await reload();
    },
    [reload]
  );

  const saveBankConfig = useCallback(
    async (config: BankConfig) => {
      await apiFetch('/api/bank-config', { method: 'PUT', body: JSON.stringify(config) });
      await reload();
    },
    [reload]
  );

  return {
    classes,
    students,
    attendanceRecords,
    bills,
    bankConfig,
    loading,
    error,
    reload,
    createClass,
    updateClass,
    deleteClass,
    createStudent,
    updateStudent,
    deleteStudent,
    upsertAttendance,
    addSessionDate,
    syncSchedule,
    updateBillStatus,
    saveBankConfig,
  };
}
