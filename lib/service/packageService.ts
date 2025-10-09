// services/packagePlans.ts
import { httpGet, httpPost, httpPut, httpDelete } from "../http";

/** ตรงกับ model.SureSurePackage ของ Go (ใช้ snake case) */
export type DbPackage = {
  id: number | string;
  packagename?: string | null;
  package_name?: string | null;
  packageprice?: number | string | null;
  package_price?: number | string | null;
  quotalimit?: number | string | null;
  quota_limit?: number | string | null;
  amount?: number | string | null;
  ordered?: number | string | null;
  duration?: number | string | null;
  isactive?: number | boolean | null;     // backend returns 0/1 or bool
  is_active?: number | boolean | null;
  createddate?: string;
  created_date?: string;
  updateddate?: string;
  updated_date?: string;
};

/** โครง enveloped จาก util.JSONResponse */
type ApiEnvelope<T> = {
  status_code?: number;
  message?: string;
  data?: T;
};

/** ชนิดที่หน้า UI ใช้ */
export type Plan = {
  id: string;
  name: string;          // ใช้ชื่อจริงจาก DB (packagename)
  price: number;         // packageprice
  quota: number;         // quotalimit
  perSlip: number;       // price/quota (2 ตำแหน่ง)
  days: number;          // duration (fallback 30)
  cta?: "Buy now" | "Active"; // derived from isActive flag
};

function toNum(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function pick<T>(...values: (T | null | undefined)[]): T | undefined {
  for (const value of values) {
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return undefined;
}

function mapDbToPlan(p: DbPackage): Plan {
  const price = toNum(pick(p.packageprice, p.package_price), 0);
  const quota = toNum(pick(p.quotalimit, p.quota_limit), 0);
  const perSlip = quota > 0 ? +(price / quota).toFixed(2) : 0;
  const days = toNum(pick(p.duration), 30);
  const activeRaw = pick(p.isactive, p.is_active);
  const active = typeof activeRaw === "boolean" ? activeRaw : toNum(activeRaw, 0) === 1;
  const rawNameValue = pick(p.packagename, p.package_name);
  const rawName = rawNameValue == null ? "" : String(rawNameValue);
  const name = rawName.trim();

  return {
    id: String(p.id ?? ""),
    name,
    price,
    quota,
    perSlip,
    days,
    cta: active ? "Active" : "Buy now",
  };
}

/** GET /package/get */
export async function fetchPlans(): Promise<Plan[]> {
  const res = await httpGet<ApiEnvelope<DbPackage[]>>("/package/get");
  const rows = res?.data ?? []; // util.JSONResponse(c, ..., packages)
  return rows.map(mapDbToPlan);
}

/** GET /package/get/:id */
export async function fetchPlanById(id: number | string): Promise<Plan | undefined> {
  const res = await httpGet<ApiEnvelope<DbPackage>>(`/package/get/${id}`);
  const row = res?.data;
  return row ? mapDbToPlan(row) : undefined;
}

/** ADMIN: ตัวอย่าง create/update/delete ให้ครบ (ถ้า UI คุณใช้ด้วย) */
export async function createPackage(payload: Partial<DbPackage>): Promise<number> {
  // Go controller รับ body เป็น model.SureSurePackage ทั้งก้อน
  // ส่ง field เท่าที่ backend ต้องการก็พอ (ชื่อ field ต้อง snake case)
  const res = await httpPost<ApiEnvelope<{ id: number }>>("/package/create", payload);
  return res?.data?.id ?? 0;
}

export async function updatePackage(payload: Partial<DbPackage> & { id: number }): Promise<void> {
  await httpPut<ApiEnvelope<null>>("/package/update", payload);
}

export async function deletePackage(id: number): Promise<void> {
  await httpDelete<ApiEnvelope<null>>(`/package/delete/${id}`);
}
