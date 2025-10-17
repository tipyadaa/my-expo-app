// src/lib/service/transactionService.ts
import { httpGet } from "../http";
import { getCurrentUserId } from "../authSession";

export type SureSureTransaction = {
  id: number;
  user_id: number;
  qr_code?: string;
  ref_no?: string;
  line_user_id?: string;
  line_group_id?: string;
  amount?: number | string;
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
  status: string;          // 'TRANSACTION_SUCCESSFUL' | ...
  status_code?: string;    // '00' ...
  trans_date?: string;
  trans_time?: string;
  created_date: string;    // "YYYY-MM-DDTHH:mm:ssZ"
  updated_date?: string;
};

type ApiWrap<T> = { code?: number; data?: T; message?: string } | T;
const unwrap = <T,>(res: ApiWrap<T>): T => (res as any)?.data ?? (res as any);

export async function listMyTransactions(): Promise<SureSureTransaction[]> {
  const userId = await getCurrentUserId();
  const res = await httpGet<ApiWrap<SureSureTransaction[]>>(`/transaction/get/${userId}`);
  const data = unwrap(res) ?? [];
  // ป้องกัน amount เป็น string
  return data.map((t) => ({ ...t, amount: Number(t.amount ?? 0) }));
}

const transactionService = { listMyTransactions };
export default transactionService;
