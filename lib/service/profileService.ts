// src/lib/service/profileService.ts
import { httpGet, httpPost, httpPut } from "../http";
import { getStoredAuth } from "../authService";

/** ===================== Types (ให้ตรงกับ backend) ===================== */
export type Profile = {
  id: number;
  uid: string;
  merchant_id: number;
  package_id: number;
  token: string;
  access_token: string;
  user_type: string;
  picture: string;
  name_th: string;
  name_en: string;
  phone: string;
  website: string;
  user_role: string;
  address: string;
  email: string;
  username: string;
  password?: string;
  is_active: number;
  store_name: string;
  store_category_type: string;
  /** อาจมีจาก backend บางเวอร์ชัน */
  store_type?: string;
  /** ที่อยู่ร้านค้า (ถ้า backend ใช้ field นี้) */
  store_address?: string;
  store_phone: string;
  store_email: string;
  quota_usage: number;
  quota_left: number;
  quota_all: number;
  step: number;
  package_change_date?: string; // ISO
  bill_date?: string;           // ISO
  created_date?: string;        // ISO
  updated_date?: string;        // ISO

  // เพิ่มเพื่อโชว์ชื่อแพ็กเกจฝั่งแอป
  package_name?: string;
};

export type Category = {
  cat_id: number;
  iso_code: string;
  category_name_en: string;
  category_name_th: string;
  category_detail_en: string;
  category_detail_th: string;
  logo: string;
  priority: number;
  enable: boolean;
};

export type LoginDto = {
  username: string;
  password: string;
  user_type?: string; // backend ใช้ตอนสร้าง merchant ใหม่
};

export type RegisterDto = {
  username: string;
  password: string;
  name_th?: string;
  name_en?: string;
  email?: string;
  phone?: string;
};

/** ===================== Helpers ===================== */
type ApiWrap<T> = { code?: number; data?: T; message?: string } | T;
const unwrap = <T,>(res: ApiWrap<T>): T => (res as any)?.data ?? (res as any);

const BASE = "/user";

/**
 * แปลง Date เป็น ISO string
 * NOTE: ฝั่งคุณคอมเมนต์ไว้ว่า backend ใช้ TO_CHAR(...'Z') อยู่แล้ว
 * ถ้าต้องการ “เวลาท้องถิ่น + ใส่ Z” ตามของเดิม ให้คงแบบนี้ไว้
 */
function toLocalISO(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${y}-${m}-${day}T${hh}:${mm}:${ss}Z`;
}
function addDaysISO(isoOrNow: string | Date, days: number): string {
  const base = typeof isoOrNow === "string" ? new Date(isoOrNow) : new Date(isoOrNow);
  base.setDate(base.getDate() + days);
  return toLocalISO(base);
}

/** อ่าน uid จาก local auth */
async function getCurrentUid(): Promise<string> {
  const auth = await getStoredAuth();
  // map ให้ครอบคลุมกรณีที่เก็บต่างกัน
  const uid = auth?.user?.uid ?? auth?.user?.id ?? auth?.uid ?? "";
  if (!uid) throw new Error("Missing UID in auth");
  return String(uid);
}

/** ===================== Services ===================== */

/** ดึงโปรไฟล์ด้วย UID (string) */
export async function getProfileByUid(uid: string): Promise<Profile> {
  const res = await httpGet<ApiWrap<Profile>>(`${BASE}/get/${uid}`);
  return unwrap(res);
}

/** ดึงโปรไฟล์ของผู้ใช้ที่ล็อกอิน (อ่าน UID จาก local) */
export async function getMyProfile(): Promise<Profile> {
  const uid = await getCurrentUid();
  return getProfileByUid(uid);
}

/** อัปเดตโปรไฟล์ (ต้องมี id ใน payload) */
export async function updateProfile(payload: Partial<Profile> & { id: number }): Promise<void> {
  await httpPut(`${BASE}/update`, payload);
}

/** อัปเดตโปรไฟล์ของฉันแบบสะดวก: จะอ่าน id จากโปรไฟล์ปัจจุบันให้ */
export async function updateMyProfile(patch: Partial<Profile>): Promise<void> {
  const me = await getMyProfile();
  if (!me?.id) throw new Error("No profile id for update");
  await updateProfile({ id: me.id, ...patch });
}

/** รายการหมวดหมู่ร้านค้า */
export async function listCategories(): Promise<Category[]> {
  const res = await httpGet<ApiWrap<Category[]>>(`${BASE}/category/get`);
  return unwrap(res) ?? [];
}

/** ล็อกอิน (หรือสร้างถ้ายังไม่มี) */
export async function loginOrCreate(dto: LoginDto): Promise<Profile> {
  const body = {
    username: dto.username,
    password: dto.password,
    user_type: dto.user_type ?? "merchant", // ให้ตรงกับ backend
  };
  const res = await httpPost<ApiWrap<Profile>>(`/login`, body);
  return unwrap(res);
}

/** สมัครสมาชิกใหม่ (ใช้ endpoint /register) */
export async function registerUser(dto: RegisterDto): Promise<Profile> {
  const res = await httpPost<ApiWrap<Profile>>(`/register`, {
    username: dto.username,
    password: dto.password,
    name_th: dto.name_th ?? "",
    name_en: dto.name_en ?? "",
    email: dto.email ?? "",
    phone: dto.phone ?? "",
    user_type: "merchant-register",
  });
  return unwrap(res);
}

/** ตัวช่วยแสดงชื่อสั้น ๆ */
export function getDisplayName(p?: Partial<Profile>): string {
  return p?.name_th || p?.name_en || p?.store_name || p?.username || "User";
}

/**
 * อัปเดตแพ็กเกจของผู้ใช้ที่ล็อกอิน + รีเซ็ตยอดการใช้งานใหม่ทันที
 * - package_id = packageId ใหม่
 * - quota_all = quotaAll ใหม่
 * - quota_left = quotaAll (เริ่มใหม่)
 * - quota_usage = 0 (เริ่มใหม่)
 * - package_change_date = วันนี้ (local ISO)
 * - bill_date = วันนี้ + days (local ISO)
 */
export async function updateUserPackage(input: {
  packageId: number;
  quotaAll: number;
  days: number;
}): Promise<void> {
  const me = await getMyProfile();
  if (!me?.id) throw new Error("No profile id for update");

  const startISO = toLocalISO();
  const endISO = addDaysISO(startISO, input.days);

  await updateProfile({
    id: me.id,
    package_id: input.packageId,
    quota_all: input.quotaAll,
    quota_left: input.quotaAll, // เริ่มใหม่
    quota_usage: 0,             // รีเซ็ตการใช้งาน
    package_change_date: startISO,
    bill_date: endISO,
  });
}

/** อัปเดตข้อมูลร้านของ "ฉัน" (แบบสะดวก) */
export type UpdateStoreInput = {
  store_name: string;
  store_phone: string;
  store_email: string;
  /** เพิ่มเติม: ประเภทของร้านค้า */
  store_type?: string;
  /** เพิ่มเติม: ที่อยู่ร้านค้า */
  store_address?: string;
};
export async function updateMyStoreInfo(input: UpdateStoreInput): Promise<void> {
  // ส่งทั้งคีย์ที่ UI ใช้และคีย์ที่ backend เดิมใช้ เพื่อความเข้ากันได้
  await updateMyProfile({
    store_name: input.store_name,
    store_phone: input.store_phone,
    store_email: input.store_email,
    // address fields
    store_address: input.store_address,
    address: input.store_address, // เผื่อ backend ใช้ address แทน store_address
    // type fields
    store_type: input.store_type,
    store_category_type: input.store_type ?? (undefined as any),
  });
}
