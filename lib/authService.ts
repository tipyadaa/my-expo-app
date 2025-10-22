// src/lib/service/authService.ts
import { httpGet, httpPost } from "./http";
import { getJSON, setJSON, removeItem } from "./storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/* ───────────────── Types ───────────────── */

export type SureSureUser = {
  id?: number;
  uid?: string;
  username?: string;
  name_th?: string;
  name_en?: string;
  email?: string;
  phone?: string;
  user_type?: string;
  userrole?: string;    // บาง backend ใช้ userrole
  user_role?: string;   // หรือ user_role
  is_active?: number;

  token?: string;       // backend อาจคืน token มาพร้อม user
  Token?: string;
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
  code?: number;   // backend ฝั่งคุณใช้ 2000 เมื่อ success
  data?: T;
  msg?: string;
  message?: string; // เผื่อบางที่ใช้ message
  err?: string;     // เผื่อส่ง error แยกมา
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

/* ───────────────── Utils ───────────────── */

function pickString(obj: any, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return undefined;
}

function assertBackendOK<T>(res: ApiResponse<T> | T): T {
  // รองรับทั้งรูปแบบ {code,data,...} และเคสดาต้าล้วน
  const hasEnvelope = res && typeof (res as any) === "object" && ("code" in (res as any) || "data" in (res as any));
  if (!hasEnvelope) return res as T;

  const r = res as ApiResponse<T>;
  if (typeof r.code === "number" && r.code !== 2000) {
    const m = r.msg || r.message || r.err || "Request failed";
    throw new Error(m);
  }
  return (r.data ?? (r as any)) as T;
}

/* ───────────────── Normalizer ─────────────────
   รองรับ:
   1) { token, user }
   2) user object ที่มี Token/token ฝังอยู่
   3) { code,msg,data } ที่ data เป็น user และมี token ข้างใน
*/
function normalizeAuthPayload(payload: any): StoredAuth {
  // เคส 1
  if (payload && typeof payload === "object" && "token" in payload && "user" in payload) {
    const token = String((payload as any).token ?? "");
    const user = (payload as any).user as SureSureUser;
    if (!token || !user) throw new Error("Malformed auth response");
    return { token, user };
  }

  // เคส 2/3: โยน payload (หรือ data) เข้ามา แล้วหาค่า token ใน object เดียวกัน
  const user = payload as SureSureUser;
  const token = pickString(user, "token", "Token", "access_token", "accessToken");
  if (!token) throw new Error("Token not found in response");
  return { token, user };
}

/* ───────────────── Core calls ───────────────── */

/** Login: POST /api/v1/login */
export async function login(req: LoginRequest, opts?: { debug?: boolean }): Promise<StoredAuth> {
  // ใช้ path relative กับ API_BASE เพื่อไม่ซ้ำ /api/v1
  const res = await httpPost<ApiResponse<any>>("/login", req, { debug: !!opts?.debug });
  const data = assertBackendOK<any>(res);
  const auth = normalizeAuthPayload(data);
  await setStoredAuth(auth);
  return auth;
}

/** Register: POST /api/v1/register */
export async function register(req: RegisterRequest, opts?: { debug?: boolean }): Promise<StoredAuth> {
  const res = await httpPost<ApiResponse<any>>("/register", req, { debug: !!opts?.debug });
  const data = assertBackendOK<any>(res);
  const auth = normalizeAuthPayload(data);
  await setStoredAuth(auth);
  return auth;
}

/** ดึง user โดย UID (backend map เส้นทางเป็น /api/v1/user/get/:id ซึ่งฝั่ง repo ใช้ uid) */
export async function getUserByUID(uid: string, opts?: { debug?: boolean }) {
  const res = await httpGet<ApiResponse<SureSureUser>>(`/user/get/${encodeURIComponent(uid)}`, {
    debug: !!opts?.debug,
  });
  return assertBackendOK<SureSureUser>(res);
}

/** Logout: ล้างสถานะในเครื่อง */
export async function logout(): Promise<void> {
  await clearAuth();
}

/* ───────────────── authFetch helper ─────────────────
   ใช้ยิง API อื่น ๆ โดยแนบ Bearer token ให้อัตโนมัติ
*/
export async function authFetch<T>(
  input: string,
  init?: RequestInit & { debug?: boolean }
): Promise<T> {
  const stored = await getStoredAuth();
  const headers = new Headers(init?.headers ?? {});
  headers.set("Content-Type", "application/json");
  if (stored?.token) headers.set("Authorization", `Bearer ${stored.token}`);

  const res = await fetch(input, { ...init, headers });
  const json = (await res.json()) as ApiResponse<T> | T;
  return assertBackendOK<T>(json);
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
