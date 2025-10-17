// src/lib/service/userService.ts
import { httpPut, httpGet } from "../http";
import { getCurrentUserId } from "../authSession";

// รูปแบบ user minimal ที่พอสำหรับ client
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
};

type ApiWrap<T> = { code?: number; data?: T; message?: string } | T;
const unwrap = <T,>(res: ApiWrap<T>): T => (res as any)?.data ?? (res as any);

const BASE = "/user";

/** ดึงโปรไฟล์ปัจจุบัน (โดย uid หรือ id ตามที่คุณทำใน getCurrentUserId) */
export async function fetchMyProfile(): Promise<SureSureUserLite> {
  const uid = await getCurrentUserId(); // ในโปรเจกต์ของคุณอาจคืน uid (string) หรือ id (number)
  // ถ้า backend ของคุณ route เป็น /user/get/{uid}
  const res = await httpGet<ApiWrap<SureSureUserLite>>(`${BASE}/get/${uid}`);
  return unwrap(res);
}

/** อัปเดตแพ็กเกจของผู้ใช้ปัจจุบัน */
export async function updateUserPackage(params: {
  packageId: number;
  quotaAll: number;
  days: number;
}): Promise<void> {
  const my = await fetchMyProfile();

  // วันหมดอายุ = วันนี้ + days
  const expire = new Date();
  expire.setDate(expire.getDate() + (params.days || 30));
  const expireISO = expire.toISOString();

  await httpPut<ApiWrap<unknown>>(`${BASE}/update`, {
    id: my.id,                     // ใช้ ID ใน WHERE ID = $...
    package_id: params.packageId,  // เปลี่ยนแพ็กเกจ
    quota_all: params.quotaAll,    // โควตารวมของแพ็กเกจ
    quota_usage: 0,                // รีเซ็ตการใช้งาน
    package_change_date: expireISO // วันหมดอายุ/วันเริ่มแพ็กเกจใหม่
  });
}
