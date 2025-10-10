// ../../lib/service/historyService.ts
import { httpGet, httpPost, httpPut, httpDelete } from "../../lib/http";

type AnyApiResponse<T> = {
  code?: number;           // บางแบ็กเอนด์ใช้ code
  status_code?: number;    // แบ็กเอนด์ของคุณใช้ status_code
  message?: string;
  data?: T | null;
};

// รวม normalize ให้รับได้ทั้ง code และ status_code
function normalize<T>(res: AnyApiResponse<T>) {
  const code =
    (res && typeof res.code === "number" ? res.code : undefined) ??
    (res && typeof res.status_code === "number" ? res.status_code : undefined);

  return {
    code,
    message: res?.message,
    data: (res as any)?.data ?? null,
  } as { code?: number; message?: string; data: T | null };
}

const BASE = "/transaction";

export async function getTransactionsAll() {
  const raw = await httpGet<AnyApiResponse<any[]>>(`${BASE}/get`);
  const res = normalize<any[]>(raw);
  if (res.code !== 2006) throw new Error(res.message || "Fetch transactions failed");
  return Array.isArray(res.data) ? res.data.map(mapDto) : [];
}

export async function getTransactionsByUserId(userId: number) {
  const raw = await httpGet<AnyApiResponse<any[]>>(`${BASE}/get/${userId}`);
  const res = normalize<any[]>(raw);
  if (res.code !== 2006) throw new Error(res.message || "Fetch user transactions failed");
  return Array.isArray(res.data) ? res.data.map(mapDto) : [];
}

export async function deleteTransaction(id: number) {
  const raw = await httpDelete<AnyApiResponse<null>>(`${BASE}/delete/${id}`);
  const res = normalize<null>(raw);
  if (res.code !== 2006) throw new Error(res.message || "Delete transaction failed");
}

// ====== mapper (ปรับ field ให้ตรง DTO จากแบ็กเอนด์) ======
export type SureSureTransaction = ReturnType<typeof mapDto>;
function mapDto(x: any) {
  return {
    id: x.id,
    userId: x.user_id,
    qrCode: x.qr_code,
    refNo: x.ref_no,
    lineUserId: x.line_user_id,
    lineGroupId: x.line_group_id,
    amount: x.amount,
    cstid: x.cstid,
    rquid: x.rquid,
    txid: x.txid,
    senderBankCode: x.sender_bank_code,
    senderAccountNo: x.sender_account_no,
    senderName: x.sender_name,
    senderName2: x.sender_name2,
    receiveBankCode: x.receive_bank_code,
    receiveAccountNo: x.receive_account_no,
    receiveName: x.receive_name,
    receiveName2: x.receive_name2,
    proxyAccountNo: x.proxy_account_no,
    ref1: x.ref1,
    ref2: x.ref2,
    message: x.message,
    statusCode: x.status_code,
    status: x.status,                 // SUCCESS / FAIL / ฯลฯ
    transDate: x.trans_date,
    transTime: x.trans_time,          // ถ้ามีบางรายการ key เพี้ยน ให้กัน null ไว้ใช้ได้
    createdDate: x.created_date,
    updatedDate: x.updated_date,
  };
}

export function formatTxnDateTime(txn: Pick<SureSureTransaction, "transDate" | "transTime">) {
  const d = (txn.transDate || "").trim();
  const t = (txn.transTime || "").trim();
  return [d, t].filter(Boolean).join(" ");
}

export function getHistoryPill(
  status: string
): { label: string; tone: "success" | "danger" | "warning" | "neutral" } {
  const s = (status || "").trim().toLowerCase();
  if (s.includes("ไม่สำเร็จ") || s.includes("fail")) return { label: "สถานะไม่สำเร็จ", tone: "danger" };
  if (s.includes("สำเร็จ") || s.includes("success")) return { label: "สำเร็จ", tone: "success" };
  if (s.includes("รอดำเนินการ") || s.includes("pending")) return { label: "รอดำเนินการ", tone: "warning" };
  return { label: status || "ไม่ทราบสถานะ", tone: "neutral" };
}
