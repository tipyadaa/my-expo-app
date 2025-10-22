// src/lib/service/userScoped.ts
import { httpGet, httpPost, httpPut, httpDelete } from "./http";
import { getCurrentUserId } from "./authSession";

/** ต่อ query string แบบง่าย */
function withQuery(path: string, query: Record<string, string | number | boolean | undefined>) {
  // ใช้ URL ช่วย encode แล้วคืนเฉพาะ pathname+search
  const u = new URL(path, "http://placeholder");
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      u.searchParams.set(k, String(v));
    }
  });
  return u.pathname + (u.search ? u.search : "");
}

type IdLike = string | number;

/**
 * สร้าง service CRUD ที่ผูกทุกคำขอกับ user_id ปัจจุบันแบบอัตโนมัติ
 * @param basePath เช่น "/bank2", "/transaction", "/stores"
 */
export function createUserScopedService<
  TItem,
  TCreate = Partial<TItem>,
  TUpdate = Partial<TItem>
>(basePath: string) {
  const normalize = (p: string) => (p.startsWith("/") ? p : `/${p}`);

  return {
    /** GET /{base}/get?user_id=... */
    async list(params?: Record<string, any>): Promise<TItem[]> {
      const user_id = await getCurrentUserId();
      const path = normalize(`${basePath}/get`);
      const url = withQuery(path, { ...params, user_id });
      const res = await httpGet<{ code?: number; data?: TItem[] } | TItem[]>(url);
      const data = (res as any)?.data ?? res;
      return Array.isArray(data) ? data : [];
    },

    /** GET /{base}/get/:id?user_id=... */
    async getById(id: IdLike): Promise<TItem> {
      const user_id = await getCurrentUserId();
      const path = normalize(`${basePath}/get/${encodeURIComponent(String(id))}`);
      const url = withQuery(path, { user_id });
      const res = await httpGet<{ code?: number; data?: TItem } | TItem>(url);
      return (res as any)?.data ?? (res as any);
    },

    /** POST /{base}/create  { ...payload, user_id } */
    async create(payload: TCreate): Promise<TItem> {
      const user_id = await getCurrentUserId();
      const path = normalize(`${basePath}/create`);
      const res = await httpPost<{ code?: number; data?: TItem } | TItem>(path, {
        ...payload,
        user_id,
      });
      return (res as any)?.data ?? (res as any);
    },

    /** PUT /{base}/update  { ...payload, user_id } */
    async update(payload: TUpdate): Promise<TItem> {
      const user_id = await getCurrentUserId();
      const path = normalize(`${basePath}/update`);
      const res = await httpPut<{ code?: number; data?: TItem } | TItem>(path, {
        ...payload,
        user_id,
      });
      return (res as any)?.data ?? (res as any);
    },

    /** DELETE /{base}/delete/:id?user_id=... */
    async remove(id: IdLike): Promise<void> {
      const user_id = await getCurrentUserId();
      const path = normalize(`${basePath}/delete/${encodeURIComponent(String(id))}`);
      const url = withQuery(path, { user_id });
      await httpDelete(url);
    },
  };
}
