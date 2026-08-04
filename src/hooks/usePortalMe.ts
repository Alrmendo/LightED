import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';
import type { Student, EnglishClass, AttendanceRecord, TuitionBill, BankConfig } from '../types';

interface PortalMeResponse {
  student: Student;
  class: EnglishClass;
  attendanceRecords: AttendanceRecord[];
  bill: TuitionBill;
  bankConfig: BankConfig;
  month: string;
}

// Data-adapter cho GET/POST /api/portal/* — ParentPortal.tsx (component có sẵn) không đổi,
// hook này chỉ lấy dữ liệu về đúng shape props nó cần.
export function usePortalMe() {
  const [data, setData] = useState<PortalMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await apiFetch<PortalMeResponse>('/api/portal/me'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const confirmPayment = useCallback(
    async (billId: string) => {
      await apiFetch('/api/portal/confirm-payment', {
        method: 'POST',
        body: JSON.stringify({ billId }),
      });
      await reload();
    },
    [reload]
  );

  return { data, loading, error, confirmPayment, reload };
}
