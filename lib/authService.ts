// src/lib/service/authService.ts
import { httpGet, httpPost } from "../lib/http";
import { getJSON, setJSON, removeItem } from "../lib/storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/* ───────────────── Types ───────────────── */

export type SureSureUser = {
  id?: number;          // <- ใช้เป็น user_id ของ resource อื่น
  uid?: string;
  username?: string;
  name_th?: string;
  name_en?: string;
  email?: string;
  phone?: string;
  user_type?: string;
  userrole?: string;    // เผื่อ backend ใช้ชื่อแบบนี้
  user_role?: string;   // หรือแบบนี้
  is_active?: number;

  // token บางกรณี backend อาจคืนมาในตัว user
  token?: string;
  Token?: string;
  // ...เพิ่ม field ที่ต้องใช้จริงได้ตามต้องการ
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type RegisterRequest = {
  username: string;
  password: string;
  email?: string;
  name_th?: string;
  phone?: string;
  // เพิ่ม field ตามที่ backend ต้องการ
};

export type StoredAuth = {
  token: string;
  user: SureSureUser;
};

export type ApiResponse<T = unknown> = {
  code?: number;
  data?: T;
  message?: string;
};

/* ───────────────── Storage helpers ───────────────── */

const AUTH_KEY = "app.auth";

export async function getStoredAuth(): Promise<StoredAuth | null> {
  return await getJSON<StoredAuth | null>(AUTH_KEY, null);
}

export async function setStoredAuth(auth: StoredAuth): Promise<void> {
  await setJSON(AUTH_KEY, auth);
}

export async function clearAuth(): Promise<void> {
  await removeItem(AUTH_KEY);
}

/* ───────────────── Normalizer ─────────────────
   รองรับได้ทั้ง:
   1) { token, user }
   2) user object ที่มี Token/token ฝังอยู่
*/
function normalizeLoginResult(payload: any): StoredAuth {
  // case 1
  if (payload && typeof payload === "object" && "token" in payload && "user" in payload) {
    const token = String((payload as any).token ?? "");
    const user = (payload as any).user as SureSureUser;
    if (!token || !user) throw new Error("Malformed login response");
    return { token, user };
  }

  // case 2
  const user = payload as SureSureUser;
  const token = (user?.Token as any) ?? (user?.token as any) ?? "";
  if (!token) throw new Error("Token not found in response");
  return { token: String(token), user };
}

/* ───────────────── Core calls ───────────────── */

/** Login: POST /api/v1/login */
export async function login(req: LoginRequest, opts?: { debug?: boolean }): Promise<StoredAuth> {
  const res = await httpPost<ApiResponse<any>>("/login", req, { debug: !!opts?.debug });
  const data = res?.data ?? res;
  const auth = normalizeLoginResult(data);
  await setStoredAuth(auth);
  return auth;
}

/** Register: POST /api/v1/register */
export async function register(req: RegisterRequest, opts?: { debug?: boolean }): Promise<StoredAuth> {
  const res = await httpPost<ApiResponse<any>>("/register", req, { debug: !!opts?.debug });
  const data = res?.data ?? res;
  const auth = normalizeLoginResult(data);
  await setStoredAuth(auth);
  return auth;
}

/** (optional) ดึง user โดย UID ถ้าต้องรีเฟรชข้อมูลตัวเองจาก server */
export async function getUserByUID(uid: string, opts?: { debug?: boolean }) {
  const res = await httpGet<ApiResponse<SureSureUser>>(`/user/get/${encodeURIComponent(uid)}`, {
    debug: !!opts?.debug,
  });
  return (res?.data ?? res) as SureSureUser;
}

/** Logout: ล้างสถานะในเครื่อง */
export async function logout(): Promise<void> {
  await clearAuth();
}

/* ───────────────── React Query Hooks ───────────────── */

export function useLoginMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["auth", "login"],
    mutationFn: (req: LoginRequest) => login(req),
    onSuccess: (auth) => {
      qc.setQueryData(["auth", "me"], auth.user);
    },
  });
}

export function useRegisterMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["auth", "register"],
    mutationFn: (req: RegisterRequest) => register(req),
    onSuccess: (auth) => {
      qc.setQueryData(["auth", "me"], auth.user);
    },
  });
}

/** โหลด auth ที่เก็บไว้ในเครื่อง (ไม่เรียก server) */
export function useLocalAuthQuery() {
  return useQuery({
    queryKey: ["auth", "local"],
    queryFn: () => getStoredAuth(),
  });
}

/** ดึงข้อมูลตัวเองจาก server (ต้องมี uid) */
export function useMeQuery(uid?: string, enabled = !!uid) {
  return useQuery({
    enabled,
    queryKey: ["auth", "me", uid],
    queryFn: async () => {
      if (!uid) return null;
      const me = await getUserByUID(uid);
      return me;
    },
  });
}
