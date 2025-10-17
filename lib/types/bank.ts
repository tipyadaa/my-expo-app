// src/lib/types/bank.ts
export type SureSureBank = {
  id: number;
  user_id: number;
  bank_code: string;
  prompt_pay_type: string;
  account_no: string;
  account_type: string;
  name_th: string;
  name_en: string;
  is_active: number;      // 0 | 1
  created_date: string;   // ISO string จาก SQL TO_CHAR
  updated_date: string;   // ISO string จาก SQL TO_CHAR
};

export type CreateBankDto = Partial<
  Omit<SureSureBank, "id" | "created_date" | "updated_date">
> & {
  // ส่งเท่าที่ต้องใช้จริง พาร์เชียลได้
};

export type UpdateBankDto = Partial<
  Omit<SureSureBank, "created_date" | "updated_date" | "user_id">
> & { id: number };
