// src/lib/http.ts
import { Platform } from 'react-native';
import { getItem } from './storage';

function guessHost(): string {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return window.location.hostname;
  }
  if (Platform.OS === 'android') return '10.0.2.2';
  return '127.0.0.1';
}

const API_PROTO = process.env.EXPO_PUBLIC_API_PROTO ?? 'http';
const API_HOST = process.env.EXPO_PUBLIC_API_HOST ?? guessHost();
const apiPortEnv = process.env.EXPO_PUBLIC_API_PORT;
const API_PORT = apiPortEnv !== undefined ? apiPortEnv : '4567';
const API_PATH = process.env.EXPO_PUBLIC_API_BASE_PATH ?? '/api/v1';

const portSegment = API_PORT && API_PORT.length > 0 ? `:${API_PORT}` : '';
const normalizedPath = API_PATH.startsWith('/') ? API_PATH : `/${API_PATH}`;

export const API_BASE = `${API_PROTO}://${API_HOST}${portSegment}${normalizedPath}`;

type HttpMethod = 'GET' | 'PUT' | 'POST' | 'DELETE';

function buildUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}

function buildHeaders(extra?: Record<string, string>, token?: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(extra || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

type RequestOptions = {
  token?: string;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  /** default 30000 ms */
  timeoutMs?: number;
  /** set true เพื่อ log method/URL/สถานะเวลา dev */
  debug?: boolean;
};

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  const url = buildUrl(path);

  // token: ใช้ที่ส่งมา > จาก storage > undefined
  const effectiveToken =
    options?.token !== undefined
      ? options.token
      : await (async () => {
          try {
            const raw = await getItem('app.auth');
            if (!raw) return undefined;
            const data = JSON.parse(raw) as { token?: string | null };
            return data?.token || undefined;
          } catch {
            return undefined;
          }
        })();

  // timeout safety
  const timeout = options?.timeoutMs ?? 30000;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeout);
  const signal = options?.signal
    ? mergeSignals(options.signal, ac.signal)
    : ac.signal;

  options?.debug && console.log('[HTTP]', method, url);

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: buildHeaders(options?.headers, effectiveToken),
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (e) {
    clearTimeout(timer);
    // ช่วยแยกสาเหตุ network เช่น host/port/ssl
    console.warn('[HTTP] fetch error:', e);
    throw e;
  }
  clearTimeout(timer);

  const text = await res.text();

  // พยายาม parse JSON ถ้า header บอกว่าเป็น JSON
  const ct = res.headers.get('content-type') || '';
  let data: unknown = null;
  try {
    if (text && ct.includes('application/json')) {
      data = JSON.parse(text);
    } else {
      data = text || null;
    }
  } catch {
    data = text || null; // ปล่อยเป็นข้อความดิบ
  }

  if (!res.ok) {
    const message =
      typeof data === 'object' && data && 'message' in (data as any)
        ? (data as any).message
        : res.statusText || `HTTP ${res.status}`;
    const err = new Error(
      typeof message === 'string' && message.length ? message : `HTTP ${res.status}`
    );
    // แนบข้อมูลช่วยดีบัก
    (err as any).status = res.status;
    (err as any).url = url;
    (err as any).body = data;
    throw err;
  }

  return data as T;
}

// รวมหลาย AbortSignal ให้หยุดพร้อมกันได้
function mergeSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
  if (a.aborted) return a;
  if (b.aborted) return b;
  const ctrl = new AbortController();
  const onAbortA = () => ctrl.abort(a.reason);
  const onAbortB = () => ctrl.abort(b.reason);
  a.addEventListener('abort', onAbortA);
  b.addEventListener('abort', onAbortB);
  // @ts-ignore – ไม่จำเป็นต้องถอด event ในวงจรสั้น ๆ (dev fetch)
  return ctrl.signal;
}

// ---- Public APIs ----
export async function httpGet<T>(
  path: string,
  options?: RequestOptions
): Promise<T> {
  return await request<T>('GET', path, undefined, options);
}

export async function httpPut<TResponse = unknown, TBody = unknown>(
  path: string,
  body: TBody,
  options?: RequestOptions
): Promise<TResponse> {
  return await request<TResponse>('PUT', path, body, options);
}

export async function httpPost<TResponse = unknown, TBody = unknown>(
  path: string,
  body: TBody,
  options?: RequestOptions
): Promise<TResponse> {
  return await request<TResponse>('POST', path, body, options);
}

export async function httpDelete<TResponse = unknown>(
  path: string,
  options?: RequestOptions
): Promise<TResponse> {
  return await request<TResponse>('DELETE', path, undefined, options);
}
