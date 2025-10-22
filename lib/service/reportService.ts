// src/lib/service/reportService.ts
import { httpGet } from "../http";
import { getCurrentUID, getCurrentUserId } from "../authSession";

/* ───────── Types ───────── */
export type SureSureTransaction = {
  id: number;
  user_id: number;
  qr_code?: string;
  ref_no?: string;
  line_user_id?: string;
  line_group_id?: string;
  amount?: number;
  cstid?: string;
  rquid?: string;
  txid?: string;
  sender_bank_code?: string;
  sender_account_no?: string;
  sender_name?: string;
  sender_name2?: string;
  receive_bank_code?: string;
  receive_account_no?: string;
  proxy_account_no?: string;
  ref1?: string;
  ref2?: string;
  receive_name?: string;
  receive_name2?: string;
  message?: string;
  status: string; // e.g. TRANSACTION_SUCCESSFUL, TRANSACTION_UNSUCCESSFUL, RECEIVER_NOT_MATCH, ERROR
  trans_date?: string; // from DB (optional)
  trans_time?: string; // from DB (optional)
  created_date: string; // ISO
  updated_date?: string;
};

export type SureSureProfile = {
  id: number;
  uid: string;
  package_id?: number;
  quota_usage?: number;
  quota_all?: number;
  package_name?: string;
  package_change_date?: string;
};

export type SureSurePackage = {
  id: number;
  package_name: string;
};

type ApiWrap<T> = { code?: number; data?: T; message?: string } | T;
const unwrap = <T,>(res: ApiWrap<T>): T => (res as any)?.data ?? (res as any);

/* ───────── Fetchers ───────── */

export async function fetchProfileMe(): Promise<SureSureProfile> {
  const uid = await getCurrentUID(); // backend /user/get/:id = uid (string)
  const res = await httpGet<ApiWrap<SureSureProfile>>(`/user/get/${encodeURIComponent(uid)}`);
  return unwrap(res);
}

export async function fetchPackages(): Promise<SureSurePackage[]> {
  const res = await httpGet<ApiWrap<SureSurePackage[]>>(`/package/get`);
  return unwrap(res) ?? [];
}

/** ดึงรายการธุรกรรมของ user ปัจจุบันทั้งหมดจาก /transaction/get/:userId */
export async function fetchTransactionsMine(): Promise<SureSureTransaction[]> {
  try {
    const userId = await getCurrentUserId(); // backend /transaction/get/:id = user_id (number)
    const res = await httpGet<ApiWrap<SureSureTransaction[]>>(`/transaction/get/${userId}`);
    const list = unwrap(res) ?? [];
    // ปรับรูปแบบค่าบางตัวเป็น number/trim ป้องกัน front ล้ม
    return list.map((t) => ({
      ...t,
      amount: t.amount !== undefined ? Number(t.amount) : undefined,
      status: String(t.status || ""),
    }));
  } catch (_err) {
    // ถ้า endpoint ตอบว่าง/ไม่พร้อม ให้ถือว่าไม่มีข้อมูล (แสดง 0) แทนการ throw
    return [];
  }
}

/* ───────── Helpers สำหรับคำนวณบน client ───────── */

export function yyyymmToDateRange(yyyymm: string) {
  // "2025-02" -> {start: "2025-02-01", end: "2025-02-28"}
  const [y, m] = yyyymm.split("-").map(Number);
  const start = new Date(y, (m ?? 1) - 1, 1);
  const end = new Date(y, (m ?? 1), 0);
  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  return { start: toISO(start), end: toISO(end) };
}

export function enumerateDatesInMonth(yyyymm: string): string[] {
  const [y, m] = yyyymm.split("-").map(Number);
  const d = new Date(y, (m ?? 1) - 1, 1);
  const end = new Date(y, (m ?? 1), 0);
  const arr: string[] = [];
  while (d <= end) {
    arr.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return arr;
}

export function isSuccessStatus(s: string) {
  return s === "TRANSACTION_SUCCESSFUL";
}
export function isErrorRow(s: string) {
  return s === "ERROR";
}

/** กรองข้อมูลด้วยช่วงวัน (YYYY-MM-DD) */
export function filterByDateRange<T extends { created_date?: string; trans_date?: string }>(
  rows: T[],
  startISO?: string,
  endISO?: string
) {
  if (!startISO && !endISO) return rows;
  const start = startISO ? new Date(startISO) : undefined;
  const end = endISO ? new Date(endISO) : undefined;

  return rows.filter((r) => {
    const iso = (r.created_date || r.trans_date || "").slice(0, 10);
    if (!iso) return false;
    const d = new Date(iso);
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  });
}

/** สร้างข้อมูลกราฟรายวัน (สีน้ำเงิน success / สีแดง fail) */
export function buildDailySeriesInMonth(
  rows: SureSureTransaction[],
  monthYYYYMM: string
) {
  const days = enumerateDatesInMonth(monthYYYYMM);
  const okData = days.map((d) =>
    rows.filter(
      (t) =>
        (t.created_date || "").slice(0, 10) === d &&
        isSuccessStatus(t.status)
    ).length
  );
  const failData = days.map((d) =>
    rows.filter(
      (t) =>
        (t.created_date || "").slice(0, 10) === d &&
        !isSuccessStatus(t.status)
    ).length
  );
  const labels = days.map((d) => d.slice(8, 10)); // "01".."31"
  return { labels, okData, failData };
}

/** สรุปผลรวม + เปอร์เซ็นต์ */
export function buildOverview(rows: SureSureTransaction[]) {
  const valid = rows.filter((r) => isSuccessStatus(r.status)).length;
  const invalid = rows.filter((r) => !isSuccessStatus(r.status)).length;
  const all = rows.length;
  const successPct = all ? (valid / all) * 100 : 0;
  const failPct = all ? (invalid / all) * 100 : 0;
  return {
    totalAll: all,
    totalValid: valid,
    totalInvalid: invalid,
    successPct,
    failPct,
  };
}
