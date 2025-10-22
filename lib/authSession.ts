// src/lib/service/authSession.ts
import { getStoredAuth, setStoredAuth } from "./authService";
import { getUserByUID } from "./service/loginService";

/** คืน user_id (จาก user.id) เพื่อนำไปผูกกับ CRUD อื่นๆ */
export async function getCurrentUserId(): Promise<number> {
  const auth = await getStoredAuth();
  const id = Number(auth?.user?.id ?? 0);
  if (id) return id;

  // Fallback: บางเคส register คืน token/uid แต่ไม่มี id ให้
  const uid = String((auth as any)?.user?.uid ?? (auth as any)?.uid ?? "");
  if (uid) {
    try {
      const me = await getUserByUID(uid);
      const resolvedId = Number((me as any)?.id ?? 0);
      if (resolvedId) {
        // อัปเดต local auth ให้มี id ไว้ใช้ครั้งต่อไป
        await setStoredAuth({
          token: String((auth as any)?.token ?? ""),
          user: { ...(auth as any)?.user, id: resolvedId, uid: (me as any)?.uid ?? uid },
        });
        return resolvedId;
      }
    } catch {
      // ignore and fallthrough
    }
  }
  throw new Error("No user_id found. Please login first.");
}

/** ถ้า endpoint ไหนต้องใช้ UID (string) */
export async function getCurrentUID(): Promise<string> {
  const auth = await getStoredAuth();
  const uid = String((auth as any)?.user?.uid ?? (auth as any)?.uid ?? "");
  if (uid) return uid;
  // Fallback: ใช้ id เป็น uid ถ้า backend รองรับ (route รับ string อยู่แล้ว)
  const id = Number((auth as any)?.user?.id ?? 0);
  if (id) return String(id);
  throw new Error("No UID found. Please login first.");
}
