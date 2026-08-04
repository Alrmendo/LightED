import { useCallback, useEffect, useState } from 'react';
import { apiFetch, getStoredToken, setStoredToken, clearStoredToken, registerUnauthorizedHandler } from '../lib/apiFetch';

export interface TeacherProfile {
  role: 'TEACHER';
  id: string;
  email: string;
  name: string;
}

export interface PortalProfile {
  role: 'PORTAL';
  studentId: string;
  name: string;
  parentName: string;
  phone: string;
  classId: string;
  className: string;
}

export type AuthProfile = TeacherProfile | PortalProfile;

type AuthState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; profile: AuthProfile };

// Nguồn sự thật duy nhất cho trạng thái đăng nhập trong app — App.tsx dùng hook này để quyết
// định hiện LoginScreen / dashboard giáo viên / ParentPortal.
export function useAuth() {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  const logout = useCallback(() => {
    clearStoredToken();
    setState({ status: 'anonymous' });
  }, []);

  const loadProfile = useCallback(async () => {
    if (!getStoredToken()) {
      setState({ status: 'anonymous' });
      return;
    }
    try {
      const profile = await apiFetch<AuthProfile>('/api/auth/me');
      setState({ status: 'authenticated', profile });
    } catch {
      // apiFetch đã tự clearStoredToken() khi gặp 401; ở đây chỉ cần đồng bộ lại state.
      setState({ status: 'anonymous' });
    }
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(logout);
    loadProfile();
  }, [loadProfile, logout]);

  const loginTeacher = useCallback(
    async (email: string, password: string) => {
      const { token } = await apiFetch<{ token: string }>('/api/auth/teacher/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setStoredToken(token);
      await loadProfile();
    },
    [loadProfile]
  );

  const loginPortal = useCallback(
    async (phone: string, accessCode: string) => {
      const { token } = await apiFetch<{ token: string }>('/api/auth/portal/login', {
        method: 'POST',
        body: JSON.stringify({ phone, accessCode }),
      });
      setStoredToken(token);
      await loadProfile();
    },
    [loadProfile]
  );

  return { ...state, loginTeacher, loginPortal, logout };
}
