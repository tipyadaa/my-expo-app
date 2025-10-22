// src/lib/service/authService.ts
import { httpGet, httpPost } from "../http";
import { getJSON, setJSON, removeItem } from "../storage";
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
  userrole?: string;     // เผื่อ backend ใช้ userrole
  user_role?: string;    // หรือ user_role
  is_active?: number;
  store_name?: string;
  store_category_type?: string;
  // ... ฟิลด์อื่น ๆ ตามที่ต้องใช้จริง
  token?: string; // บาง API ฝัง token มาใน user.Token
  Token?: string;
};

export type LoginRequest = {
  username: string;
  password: string;
  // เสริมได้ตามที่ backend ต้องการ เช่น user_type: "merchant"
};

export type RegisterRequest = {
  username: string;
  password: string;
  email?: string;
  name_th?: string;
  name_en?: string;
  phone?: string;
  user_type?: string;
  // เพิ่มฟิลด์ตาม model.SureSureUser ที่จำเป็น
};

export type ApiResponse<T = unknown> = {
  code?: number;     // util.APIResponse น่าจะมี code
  data?: T;
  message?: string;
};

export type StoredAuth = {
  token: string;
  user: SureSureUser;
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
   รองรับได้ทั้ง 2 รูปแบบ:
   1) { token, user }
   2) { ...userFields, Token: "xxx" } หรือ token ใน user.Token
*/
function normalizeLoginResult(payload: any): StoredAuth {
  // case 1: { token, user }
  if (payload && typeof payload === "object" && "token" in payload && "user" in payload) {
    const token = String((payload as any).token ?? "");
    const user = (payload as any).user as SureSureUser;
    if (!token || !user) throw new Error("Malformed login response");
    return { token, user };
  }

  // case 2: payload เป็น user object โดยตรง และมี Token/ token
  const user = payload as SureSureUser;
  const token = (user?.Token as any) ?? (user?.token as any) ?? "";
  if (!token) throw new Error("Token not found in response");
  return { token: String(token), user };
}

/* ───────────────── Core calls ───────────────── */

/** Login: POST /api/v1/login */
export async function login(req: LoginRequest, opts?: { debug?: boolean }): Promise<StoredAuth> {
  // backend route ตอนนี้ map ไปที่ controller.GetOrCreateUser
  const res = await httpPost<ApiResponse<any>>("/login", req, { debug: !!opts?.debug });

  const data = res?.data ?? res; // กันกรณี backend ส่ง raw object ไม่ห่อ APIResponse
  const auth = normalizeLoginResult(data);
  await setStoredAuth(auth);
  return auth;
}

/** Register: POST /api/v1/register */
export async function register(req: RegisterRequest, opts?: { debug?: boolean }): Promise<StoredAuth> {
  const payload = {
    ...req,
    user_type: req.user_type ?? "merchant-register",
  };
  const res = await httpPost<ApiResponse<any>>("/register", payload, { debug: !!opts?.debug });
  const data = res?.data ?? res;
  const auth = normalizeLoginResult(data);
  await setStoredAuth(auth);
  return auth;
}

/** Me (ดึง user ล่าสุดจาก backend) – ถ้าต้องการ */
export async function getUserByUID(uid: string, opts?: { debug?: boolean }) {
  // NOTE: backend ใช้ path param เป็น uid
  const res = await httpGet<ApiResponse<SureSureUser>>(`/user/get/${encodeURIComponent(uid)}`, {
    debug: !!opts?.debug,
  });
  return (res?.data ?? res) as SureSureUser;
}

/** Logout */
export async function logout(): Promise<void> {
  await clearAuth();
}

/* ───────────────── React Query Hooks (optional) ───────────────── */

export function useLoginMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["auth", "login"],
    mutationFn: (req: LoginRequest) => login(req),
    onSuccess: async (auth) => {
      // อัปเดต cache me
      qc.setQueryData(["auth", "me"], auth.user);
    },
  });
}

export function useRegisterMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["auth", "register"],
    mutationFn: (req: RegisterRequest) => register(req),
    onSuccess: async (auth) => {
      qc.setQueryData(["auth", "me"], auth.user);
    },
  });
}

/** Hook สำหรับโหลด user ที่เก็บไว้ในเครื่อง (ไม่เรียก server) */
export function useLocalAuthQuery() {
  return useQuery({
    queryKey: ["auth", "local"],
    queryFn: () => getStoredAuth(),
  });
}

/** Hook สำหรับดึงข้อมูลตัวเองจาก server (ต้องมี uid) */
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
