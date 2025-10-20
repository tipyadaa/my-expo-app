// src/lib/service/roomService.ts
import { httpGet, httpPut } from "../http";
import { getCurrentUserId } from "../authSession";

type ApiWrap<T> = { code?: number; message?: string; data?: T } | T;
const unwrap = <T,>(input: ApiWrap<T>): T => {
  if (input && typeof input === "object" && "data" in (input as any)) {
    return (input as any).data as T;
  }
  return input as T;
};

const normalizeBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const lower = value.trim().toLowerCase();
    return lower === "1" || lower === "true";
  }
  return false;
};

const normalizeNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export type Room = {
  id: number;
  user_id: number;
  line_group_id: string;
  room_name: string;
  qr_token: string;
  quota_used: number;
  min_receive: number;
  show_transferor: boolean;
  show_recipient: boolean;
  list_bank: string;
  created_date?: string;
  updated_date?: string;
};

const BASE = "/room2";

const toRoom = (row: any): Room => ({
  id: normalizeNumber(row?.id),
  user_id: normalizeNumber(row?.user_id),
  line_group_id: row?.line_group_id ?? "",
  room_name: row?.room_name ?? "",
  qr_token: row?.qr_token ?? "",
  quota_used: normalizeNumber(row?.quota_used),
  min_receive: normalizeNumber(row?.min_receive),
  show_transferor: normalizeBoolean(row?.show_transferor),
  show_recipient: normalizeBoolean(row?.show_recipient),
  list_bank: row?.list_bank ?? "",
  created_date: row?.created_date ?? row?.CreatedDate,
  updated_date: row?.updated_date ?? row?.UpdatedDate,
});

export async function getRooms(): Promise<Room[]> {
  const raw = await httpGet<ApiWrap<Room[] | Room>>(`${BASE}/get`);
  const data = unwrap(raw);
  if (Array.isArray(data)) {
    return data.map(toRoom);
  }
  if (data && typeof data === "object") {
    return [toRoom(data)];
  }
  return [];
}

export async function getFirstRoom(): Promise<Room | null> {
  const rooms = await getRooms();
  return rooms.length > 0 ? rooms[0] : null;
}

/** Update a room (PUT /room2/update)
 * - Requires: id
 * - Optional: room fields to update (room_name, min_receive, show_transferor, show_recipient, list_bank, qr_token, etc.)
 * - Automatically attaches user_id of current session
 */
export type UpdateRoomDto = Partial<
  Pick<
    Room,
    | "room_name"
    | "min_receive"
    | "show_transferor"
    | "show_recipient"
    | "list_bank"
    | "qr_token"
    | "line_group_id"
    | "quota_used"
  >
> & { id: number };

export async function updateRoom(payload: UpdateRoomDto): Promise<Room> {
  const user_id = await getCurrentUserId();
  const raw = await httpPut<ApiWrap<Room> | Room>(`${BASE}/update`, {
    ...payload,
    user_id,
  });
  const data = unwrap(raw);
  return toRoom(data);
}
