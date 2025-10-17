// src/lib/service/bankService.ts
import { httpDelete, httpGet, httpPost, httpPut } from "../http";
import { getCurrentUserId } from "../authSession";

/* ───────── Types ───────── */
export type SureSureBank = {
  id: number;
  user_id: number;
  bank_code: string;        // "002" | "PROMPTPAY" | อื่น ๆ ตามที่บันทึก
  prompt_pay_type: string;  // "MSISDN" | "NATID" | "EWALLETID" | "" (สำหรับ bank ธรรมดา)
  account_no: string;
  account_type: string;     // "BANK" | "PROMPTPAY"
  name_th: string;
  name_en: string;
  is_active: number;        // 0 | 1
  created_date: string;     // ISO (TO_CHAR ใน SQL)
  updated_date: string;     // ISO
};

export type CreateBankDto = Partial<
  Omit<SureSureBank, "id" | "created_date" | "updated_date">
>;

export type UpdateBankDto = Partial<
  Omit<SureSureBank, "created_date" | "updated_date" | "user_id">
> & { id: number };

/* ───────── Helpers ───────── */
type ApiWrap<T> = { code?: number; data?: T; message?: string } | T;
const unwrap = <T,>(res: ApiWrap<T>): T => (res as any)?.data ?? (res as any);

const BASE = "/bank2";

/* ───────── Service functions ───────── */

/**
 * ดึงบัญชีทั้งหมด (ทั้งระบบ)
 * GET /api/v1/bank2/get
 */
export async function listAllBanks(): Promise<SureSureBank[]> {
  const res = await httpGet<ApiWrap<SureSureBank[]>>(`${BASE}/get`);
  return unwrap(res) ?? [];
}

/**
 * ดึงบัญชีของ "ผู้ใช้ที่ล็อกอิน"
 * หมายเหตุ: backend ใช้ /bank2/get/:id โดย :id คือ UserID (WHERE UserID = $1)
 * GET /api/v1/bank2/get/{userId}
 */
export async function listMyBanks(): Promise<SureSureBank[]> {
  const userId = await getCurrentUserId();
  const res = await httpGet<ApiWrap<SureSureBank[]>>(`${BASE}/get/${userId}`);
  return unwrap(res) ?? [];
}

/**
 * ดึง 1 รายการตาม "id ของบัญชี" (ฝั่ง backend ไม่มี endpoint นี้ตรง ๆ)
 * วิธีแก้ชั่วคราว: โหลด list ของตัวเองแล้ว filter เอา
 */
export async function getBankByRecordId(id: number): Promise<SureSureBank | null> {
  const mine = await listMyBanks();
  return mine.find((x) => Number(x.id) === Number(id)) ?? null;
}

/**
 * สร้างบัญชีใหม่
 * POST /api/v1/bank2/create
 * ส่ง user_id แนบไปด้วยเพื่อความชัดเจน
 */
export async function createBank(payload: CreateBankDto): Promise<{ id: number }> {
  const user_id = await getCurrentUserId();
  const res = await httpPost<ApiWrap<{ id: number }>>(`${BASE}/create`, {
    ...payload,
    user_id,
  });
  return unwrap(res);
}

/**
 * อัปเดตบัญชีตาม id
 * PUT /api/v1/bank2/update
 * ต้องมี { id } ใน payload
 */
export async function updateBank(payload: UpdateBankDto): Promise<void> {
  const user_id = await getCurrentUserId();
  await httpPut<ApiWrap<unknown>>(`${BASE}/update`, { ...payload, user_id });
}

/**
 * ลบบัญชีตาม id (id = id ของบัญชี ไม่ใช่ user_id)
 * DELETE /api/v1/bank2/delete/:id
 */
export async function deleteBank(id: number): Promise<void> {
  await httpDelete<ApiWrap<unknown>>(`${BASE}/delete/${id}`);
}

/* ───────── Default export (ถ้าชอบเรียกแบบ object) ───────── */
const bankService = {
  listAllBanks,
  listMyBanks,
  getBankByRecordId,
  createBank,
  updateBank,
  deleteBank,
};

export default bankService;
