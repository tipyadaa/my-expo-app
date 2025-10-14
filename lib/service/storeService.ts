// src/lib/service/storeService.ts
import { httpGet, httpPost, httpPut, httpDelete } from "../http";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentUserId } from "../authSession";

/* ───────────────────────────────
 * UI Type ที่จอใช้
 * เพิ่มฟิลด์ตั้งค่าระบบ (minAmount/hide*)
 * ─────────────────────────────── */
export type StoreBranch = {
  id: string; // Room.ID (เก็บเป็น string ใน UI เพื่อความง่าย)
  name: string; // RoomName
  status: "ยังไม่ได้เชื่อมต่อ" | "เชื่อมต่อเรียบร้อย"; // อิงจาก LineGroupID ว่าง/ไม่ว่าง
  code: string; // QRToken
  minAmount?: number;        // map -> MinRecieve
  hideSenderAcc?: boolean;   // map -> !ShowTransferor
  hideReceiverAcc?: boolean; // map -> !ShowRecipient
};

/* ───────────────────────────────
 * helpers
 * ─────────────────────────────── */
type APIWrapped<T> = { code?: number; message?: string; data?: T };
const unwrap = <T,>(x: APIWrapped<T> | T): T =>
  x && typeof x === "object" && "data" in (x as any) ? (x as any).data : (x as T);

/** แปลง backend -> UI */
const toUI = (r: any, i: number): StoreBranch => {
  const lineGroupId = r.line_group_id ?? r.LineGroupID;

  const showTransferorRaw = r.show_transferor ?? r.ShowTransferor ?? false;
  const showRecipientRaw = r.show_recipient ?? r.ShowRecipient ?? false;

  // รองรับทั้ง number|boolean|string ("1"/"0")
  const normalizeBool = (val: any) => {
    if (typeof val === "boolean") return val;
    if (typeof val === "number") return val === 1;
    if (typeof val === "string") return val === "1" || val.toLowerCase() === "true";
    return false;
  };

  const showTransferor = normalizeBool(showTransferorRaw);
  const showRecipient = normalizeBool(showRecipientRaw);
  const min = r.min_receive ?? r.MinRecieve ?? 0;

  return {
    id: String(r.id ?? r.ID ?? i),
    name: r.room_name ?? r.RoomName ?? "-",
    code: r.qr_token ?? r.QRToken ?? "-",
    status: lineGroupId ? "เชื่อมต่อเรียบร้อย" : "ยังไม่ได้เชื่อมต่อ",
    minAmount: Number(min) || 0,
    hideSenderAcc: !showTransferor,
    hideReceiverAcc: !showRecipient,
  };
};

/** แปลง UI -> payload สำหรับสร้าง */
const toApiCreate = (ui: Omit<StoreBranch, "id">, userId: number) => ({
  user_id: userId,
  line_group_id: ui.status === "เชื่อมต่อเรียบร้อย" ? "connected" : "",
  room_name: ui.name,
  qr_token: ui.code,
  quota_used: 0, // คง 0 ตาม repo
  min_receive: Number(ui.minAmount ?? 0), // ต้องเป็น number
  show_transferor: !(ui.hideSenderAcc ?? false), // !ซ่อน
  show_recipient: !(ui.hideReceiverAcc ?? false), // !ซ่อน
  list_bank: "",
});

/** แปลง UI -> payload สำหรับอัปเดต (สำคัญ: id ต้องเป็น number) */
const toApiUpdate = (id: string, uiPatch: Partial<StoreBranch>) => {
  const payload: any = { id: Number(id) }; // backend: ID เป็น int

  if (uiPatch.name !== undefined) payload.room_name = uiPatch.name;
  if (uiPatch.code !== undefined) payload.qr_token = uiPatch.code;

  if (uiPatch.status !== undefined) {
    payload.line_group_id = uiPatch.status === "เชื่อมต่อเรียบร้อย" ? "connected" : "";
  }

  if (uiPatch.minAmount !== undefined) payload.min_receive = Number(uiPatch.minAmount);
  if (uiPatch.hideSenderAcc !== undefined) payload.show_transferor = !uiPatch.hideSenderAcc;
  if (uiPatch.hideReceiverAcc !== undefined) payload.show_recipient = !uiPatch.hideReceiverAcc;

  return payload;
};

/* ───────────────────────────────
 * Endpoints (จาก router)
 * GET    /api/v1/room2/get
 * GET    /api/v1/room2/get/:id         // (หมายถึง UserID)
 * POST   /api/v1/room2/create
 * PUT    /api/v1/room2/update
 * DELETE /api/v1/room2/delete/:id      // id = Room.ID
 * GET    /api/v1/room2/howto/:id/:user_id (not used here)
 * ─────────────────────────────── */

/* ───────────────────────────────
 * Core calls
 * ─────────────────────────────── */

/** ดึงรายการสาขาของ "ผู้ใช้ที่ล็อกอินอยู่" */
export async function getStores(): Promise<StoreBranch[]> {
  const myId = await getCurrentUserId();
  return getStoresByUser(myId);
}

/** ดึงสาขาเฉพาะของ userId ที่ระบุ (กรณี admin หรือมุมมองพิเศษ) */
export async function getStoresByUser(userId: number): Promise<StoreBranch[]> {
  const ep = `/room2/get/${userId}`;
  const raw = await httpGet<any>(ep);
  const rows = unwrap<any[]>(raw) ?? raw ?? [];
  if (!Array.isArray(rows)) return [];
  return rows.map(toUI);
}

/** สร้างสาขาใหม่ (ถ้าไม่ส่ง userId มาก็ใช้ของผู้ใช้ที่ล็อกอิน) */
export async function createStore(
  payload: Omit<StoreBranch, "id">,
  userId?: number
): Promise<{ id: string }> {
  const ep = "/room2/create";
  const uid = typeof userId === "number" ? userId : await getCurrentUserId();
  const body = toApiCreate(payload, uid);
  const res = await httpPost<any>(ep, body);
  const id = String(res?.data?.id ?? res?.id ?? "");
  return { id };
}

/** อัปเดตสาขา (ตาม Room.ID) */
export async function updateStore(id: string, patch: Partial<StoreBranch>): Promise<void> {
  const ep = "/room2/update";
  const body = toApiUpdate(id, patch);
  await httpPut<any>(ep, body);
}

/** ลบสาขา (ตาม Room.ID) */
export async function deleteStore(id: string): Promise<void> {
  const ep = `/room2/delete/${id}`;
  await httpDelete<any>(ep);
}

/* ───────────────────────────────
 * React Query hooks
 * ─────────────────────────────── */
const qk = {
  all: ["stores"] as const,
  one: (id: string) => ["stores", id] as const,
};

export function useStores() {
  return useQuery({ queryKey: qk.all, queryFn: getStores });
}

export function useStoresByUser(userId?: number) {
  return useQuery({
    queryKey: userId ? ["stores", "user", userId] : ["stores", "user", "unknown"],
    queryFn: () => getStoresByUser(userId as number),
    enabled: typeof userId === "number",
  });
}

export function useCreateStore(userId?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<StoreBranch, "id">) => createStore(payload, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.all });
    },
  });
}

export function useUpdateStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<StoreBranch> }) =>
      updateStore(id, patch),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: qk.all });
      qc.invalidateQueries({ queryKey: qk.one(id) });
    },
  });
}

export function useDeleteStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStore(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.all });
    },
  });
}
