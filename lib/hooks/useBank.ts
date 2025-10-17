// src/lib/hooks/useBank.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import bankService, {
  SureSureBank,
  CreateBankDto,
  UpdateBankDto,
} from "../service/bankService";

const keys = {
  all: ["banks"] as const,
  mine: () => [...keys.all, "mine"] as const,
  byId: (id: number) => [...keys.all, "byId", id] as const,
};

/** ดึงบัญชีของ user ปัจจุบัน */
export function useBanksMine() {
  return useQuery({
    queryKey: keys.mine(),
    queryFn: () => bankService.listMyBanks(),
  });
}

/** ดึงบัญชี “ตาม id ของบัญชี” (ฝั่ง service ใช้วิธีโหลด list แล้ว filter เอา) */
export function useBankById(id?: number) {
  return useQuery({
    enabled: !!id,
    queryKey: keys.byId(id ?? 0),
    queryFn: () => bankService.getBankByRecordId(id!),
  });
}

/** สร้างบัญชีใหม่ */
export function useCreateBank() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBankDto) => bankService.createBank(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.mine() });
    },
  });
}

/** อัปเดตบัญชี */
export function useUpdateBank() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateBankDto) => bankService.updateBank(payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: keys.mine() });
      if (vars?.id) qc.invalidateQueries({ queryKey: keys.byId(Number(vars.id)) });
    },
  });
}

/** ลบบัญชี */
export function useDeleteBank() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bankService.deleteBank(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.mine() });
    },
  });
}

/** export type สะดวกใช้ในหน้าต่าง ๆ */
export type BankItem = SureSureBank;
