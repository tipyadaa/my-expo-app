// lib/service/userService.ts
import { httpPost } from "../http";

export type RegisterRequest = {
  username: string;
  password: string;
  email?: string;
  name_th?: string;
  name_en?: string;
  store_name?: string;
  store_phone?: string;
  store_email?: string;
  address?: string;
};

export type BackendRegisterResponse = {
  code: number;
  msg?: string;
  data?: any; // โครงสร้างจาก backend
  err?: string;
};

export type RegisteredUser = {
  id: number;
  uid: string;
  username: string;
  email?: string | null;
  token?: string | null;
  user_type?: string | null;
  user_role?: string | null;
  is_active?: number | null;
  quota_all?: number | null;
  quota_left?: number | null;
  step?: number | null;
  raw?: unknown; // สำรองข้อมูลดิบ
};

function extractString(obj: any, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return undefined;
}

function extractNumber(obj: any, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "number") return v;
  }
  return undefined;
}

function normalizeRegisteredUser(input: any): RegisteredUser {
  const data = input?.data ?? input ?? {};
  return {
    id: extractNumber(data, "id") ?? 0,
    uid: extractString(data, "uid") ?? "",
    username: extractString(data, "username") ?? "",
    email: extractString(data, "email") ?? null,
    token: extractString(data, "token", "access_token", "accessToken") ?? null,
    user_type: extractString(data, "user_type") ?? null,
    user_role: extractString(data, "user_role") ?? null,
    is_active: extractNumber(data, "is_active") ?? null,
    quota_all: extractNumber(data, "quota_all") ?? null,
    quota_left: extractNumber(data, "quota_left") ?? null,
    step: extractNumber(data, "step") ?? null,
    raw: input,
  };
}

/**
 * เรียกสมัครสมาชิก
 * โยน error ที่อ่านง่ายเมื่อ backend ส่ง code != 2000
 */
export async function registerUser(payload: RegisterRequest): Promise<RegisteredUser> {
  const res = await httpPost<BackendRegisterResponse>("/api/v1/register", payload);

  if (!res) {
    throw new Error("No response from server");
  }
  if (typeof res.code !== "number") {
    throw new Error("Malformed response");
  }
  if (res.code !== 2000) {
    const msg = res.msg || res.err || "Register failed";
    const details = typeof res.data === "string" ? res.data : "";
    throw new Error(details ? `${msg}: ${details}` : msg);
  }

  return normalizeRegisteredUser(res);
}
