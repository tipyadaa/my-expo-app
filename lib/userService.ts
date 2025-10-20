// src/lib/service/userService.ts
import { httpGet, httpPut } from "lib/http";
import { getCurrentUserId } from "lib/authSession";

// ดึงชนิดข้อมูลหลักจาก profileService เพื่อไม่ให้ type แตกต่างกัน
import type { Profile } from "lib/service/profileService";
import {
  // re-export ฟังก์ชันที่ควรอยู่ศูนย์กลางใน profileService เพื่อลดความซ้ำซ้อน
  getMyProfile,
  updateMyStoreInfo,
  updateUserPackage,
} from "lib/service/profileService";

/** ===================== Re-exports ===================== */
// ให้ที่อื่น ๆ ใช้งานฟังก์ชันกลางผ่าน userService ได้ ถ้าต้องการ
export { getMyProfile, updateMyStoreInfo, updateUserPackage };

/** ===================== Types แบบเบา (ยอดนิยมในฝั่ง UI) ===================== */
/**
 * โปรไฟล์ฉบับย่อ (เบา) สำหรับหน้า UI ทั่วไป
 * ถ้าหน้าไหนต้องใช้ข้อมูลเต็ม ๆ ให้ใช้ Profile จาก profileService แทน
 */
export type SureSureUserLite = {
  id: number;
  uid: string;
  username: string;
  name_th?: string;
  name_en?: string;
  store_name?: string;
  store_phone?: string;
  store_email?: string;
  picture?: string;
  quota_usage?: number;
  quota_all?: number;
  package_id?: number;
  package_change_date?: string; // ISO string
  // ข้อมูลอื่น ๆ เพิ่มได้ตามต้องการ
};

/** ===================== Helpers ===================== */
type ApiWrap<T> = { code?: number; data?: T; message?: string } | T;
const unwrap = <T,>(res: ApiWrap<T>): T => (res as any)?.data ?? (res as any);

const BASE = "/user";

/** ===================== Services (lightweight) ===================== */

/**
 * ดึงโปรไฟล์แบบ "ฉบับย่อ" ของผู้ใช้ปัจจุบัน
 * - อ่าน UID/ID จาก auth session (getCurrentUserId)
 * - ใช้ endpoint /user/get/{uid}
 * - ถ้าต้องการข้อมูลเต็ม ให้ไปใช้ getMyProfile() จาก profileService
 */
export async function fetchMyProfile(): Promise<SureSureUserLite> {
  const uid = await getCurrentUserId(); // โปรเจกต์คุณอาจคืน uid (string) หรือ id (number)
  const res = await httpGet<ApiWrap<SureSureUserLite>>(`${BASE}/get/${uid}`);
  return unwrap(res);
}

/**
 * ดึงโปรไฟล์ของ user ใด ๆ ด้วย uid
 * - ใช้กับหน้าแอดมิน/หน้าดูข้อมูลผู้อื่น
 * - ถ้าต้องการชนิดเต็มให้ใช้ Profile แทน SureSureUserLite
 */
export async function fetchUserByUid(uid: string): Promise<SureSureUserLite> {
  const res = await httpGet<ApiWrap<SureSureUserLite>>(`${BASE}/get/${uid}`);
  return unwrap(res);
}

/**
 * อัปเดต user บางฟิลด์ (ต้องมี id)
 * - ใช้กับงานอัปเดตเบา ๆ ที่ UI มี id อยู่แล้ว
 * - ถ้าเป็นการอัปเดตร้าน/แพ็กเกจ ให้ใช้ updateMyStoreInfo / updateUserPackage แทน
 */
export async function updateUserFields(
  payload: Partial<SureSureUserLite> & { id: number }
): Promise<void> {
  await httpPut(`${BASE}/update`, payload);
}

/**
 * อัปเดต user ปัจจุบันแบบสะดวก (อ่าน id ให้เอง)
 * - ใช้กรณีอยากอัปเดตฟิลด์เล็ก ๆ ไม่ใช่ร้าน/แพ็กเกจ
 * - ถ้าจะอัปเดตร้าน (store_name/phone/email) ให้ใช้ updateMyStoreInfo จาก profileService
 * - ถ้าจะอัปเดตแพ็กเกจ ให้ใช้ updateUserPackage จาก profileService
 */
export async function updateCurrentUserLite(
  patch: Partial<Profile>
): Promise<void> {
  const me = await getMyProfile(); // ฟังก์ชันกลางจาก profileService
  if (!me?.id) throw new Error("No profile id for update");
  await httpPut(`${BASE}/update`, { id: me.id, ...patch });
}
