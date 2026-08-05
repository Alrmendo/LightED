// Vite thay `import.meta.env.VITE_API_URL` bằng literal string NGAY LÚC BUILD (không phải lúc
// chạy) — nếu fallback ở đây là 1 URL cụ thể (vd 'http://localhost:4000'), giá trị đó bị bake
// cứng vào bundle production bất cứ khi nào build mà thiếu biến này (đúng tình huống Render: build
// từ git clone sạch, không có .env/.env.local nào cả). Fallback PHẢI là '' (relative path, cùng
// origin với chính trang đang serve) — dev local cần base URL riêng (frontend :3000, backend
// :4000 khác origin) thì set qua `.env.local` (không commit), KHÔNG sửa fallback này.
const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
const TOKEN_STORAGE_KEY = 'lighted_auth_token';

// localStorage + Bearer header (không phải httpOnly cookie): backend đã build theo JWT Bearer
// (requireAuth đọc header Authorization), và cookie SameSite=None+Secure không chạy được trên
// HTTP localhost (frontend :3000, backend :4000 khác origin, dev không có HTTPS). Đánh đổi: token
// lộ nếu bị XSS — chấp nhận được ở scope local hiện tại (app không dùng dangerouslySetInnerHTML).
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// useAuth.ts đăng ký hàm này để tự logout + về màn login bất kỳ khi nào 1 API call trả 401
// (token hết hạn hoặc bị revoke) — server là nguồn sự thật duy nhất, không tự đoán hết hạn.
let onUnauthorized: (() => void) | null = null;
export function registerUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearStoredToken();
    onUnauthorized?.();
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.error?.code ?? 'UNKNOWN_ERROR', body?.error?.message ?? 'Đã có lỗi xảy ra');
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
