// src/lib/service/historyService.ts
import { httpGet, httpPost, httpPut, httpDelete } from "../http";
import { getCurrentUserId } from "../authSession";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/* ───────────────────────────────── Types ───────────────────────────────── */

type AnyApiResponse<T> = {
  code?: number;        // บาง backend ใช้ code
  status_code?: number; // ของคุณใช้ status_code
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

/* ─────────────────────────────── Core Calls ─────────────────────────────── */

export async function getTransactionsAll() {
  const raw = await httpGet<AnyApiResponse<any[]>>(`${BASE}/get`);
  const res = normalize<any[]>(raw as AnyApiResponse<any[]>);
  if (res.code !== 2006) throw new Error(res.message || "Fetch transactions failed");
  const rows = Array.isArray(res.data) ? res.data : [];
  return rows.map(mapDto);
}

export async function getTransactionsByUserId(userId: number) {
  const raw = await httpGet<AnyApiResponse<any[]>>(`${BASE}/get/${userId}`);
  const res = normalize<any[]>(raw as AnyApiResponse<any[]>);
  if (res.code !== 2006) throw new Error(res.message || "Fetch user transactions failed");
  const rows = Array.isArray(res.data) ? res.data : [];
  return rows.map(mapDto);
}

/** ดึงประวัติของ “ผู้ใช้ที่ล็อกอินอยู่” โดยอัตโนมัติ */
export async function getMyTransactions() {
  const userId = await getCurrentUserId();
  return getTransactionsByUserId(userId);
}

export async function deleteTransaction(id: number) {
  const raw = await httpDelete<AnyApiResponse<null>>(`${BASE}/delete/${id}`);
  const res = normalize<null>(raw as AnyApiResponse<null>);
  if (res.code !== 2006) throw new Error(res.message || "Delete transaction failed");
}

/* ─────────────────────────────── Mapper & Utils ─────────────────────────────── */

export type SureSureTransaction = ReturnType<typeof mapDto>;
function mapDto(x: any) {
  // เผื่อกรณี key เพี้ยน/ตัวพิมพ์ใหญ่เล็กไม่ตรง
  const pick = (obj: any, keys: string[], fallback: any = null) => {
    for (const k of keys) {
      if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k];
    }
    return fallback;
  };

  return {
    id: pick(x, ["id", "ID"]),
    userId: pick(x, ["user_id", "UserID"]),
    qrCode: pick(x, ["qr_code", "QRCode"]),
    refNo: pick(x, ["ref_no", "RefNo"]),
    lineUserId: pick(x, ["line_user_id", "LineUserID"]),
    lineGroupId: pick(x, ["line_group_id", "LineGroupID"]),
    amount: Number(pick(x, ["amount", "Amount"], 0)) || 0,
    cstid: pick(x, ["cstid", "CSTID"]),
    rquid: pick(x, ["rquid", "RQUID"]),
    txid: pick(x, ["txid", "TXID"]),
    senderBankCode: pick(x, ["sender_bank_code", "SenderBankCode"]),
    senderAccountNo: pick(x, ["sender_account_no", "SenderAccountNo"]),
    senderName: pick(x, ["sender_name", "SenderName"]),
    senderName2: pick(x, ["sender_name2", "SenderName2"]),
    receiveBankCode: pick(x, ["receive_bank_code", "ReceiveBankCode"]),
    receiveAccountNo: pick(x, ["receive_account_no", "ReceiveAccountNo"]),
    receiveName: pick(x, ["receive_name", "ReceiveName"]),
    receiveName2: pick(x, ["receive_name2", "ReceiveName2"]),
    proxyAccountNo: pick(x, ["proxy_account_no", "ProxyAccountNo"]),
    ref1: pick(x, ["ref1", "Ref1"]),
    ref2: pick(x, ["ref2", "Ref2"]),
    message: pick(x, ["message", "Message"]),
    statusCode: pick(x, ["status_code", "StatusCode"]),
    status: pick(x, ["status", "Status"]), // SUCCESS / FAIL / ฯลฯ
    transDate: pick(x, ["trans_date", "TransDate"]),
    transTime: pick(x, ["trans_time", "TransTime"]),
    createdDate: pick(x, ["created_date", "CreatedDate"]),
    updatedDate: pick(x, ["updated_date", "UpdatedDate"]),
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

/* ─────────────────────────────── React Query Hooks ─────────────────────────────── */

const qk = {
  all: ["transactions"] as const,
  byUser: (uid: number) => ["transactions", "user", uid] as const,
};

export function useTransactions() {
  return useQuery({
    queryKey: qk.all,
    queryFn: getTransactionsAll,
  });
}

/** ดึงของ “ฉัน” (อ่าน user_id จาก session) */
export function useMyTransactions() {
  return useQuery({
    queryKey: ["transactions", "me"],
    queryFn: getMyTransactions,
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTransaction(id),
    onSuccess: () => {
      // ล้างแคชทั้งของทั้งหมดและของฉัน
      qc.invalidateQueries({ queryKey: qk.all });
      qc.invalidateQueries({ queryKey: ["transactions", "me"] });
    },
  });
}
