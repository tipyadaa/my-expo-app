// src/lib/service/authSession.ts
import { getStoredAuth } from "./authService";

/** คืน user_id (จาก user.id) เพื่อนำไปผูกกับ CRUD อื่นๆ */
export async function getCurrentUserId(): Promise<number> {
  const auth = await getStoredAuth();
  const id = Number(auth?.user?.id ?? 0);
  if (!id) throw new Error("No user_id found. Please login first.");
  return id;
}

/** ถ้า endpoint ไหนต้องใช้ UID (string) */
export async function getCurrentUID(): Promise<string> {
  const auth = await getStoredAuth();
  const uid = String(auth?.user?.uid ?? "");
  if (!uid) throw new Error("No UID found. Please login first.");
  return uid;
}
