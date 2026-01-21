import { API_BASE_URL as ENV_API_BASE_URL } from '@env';

export const API_BASE_URL = (ENV_API_BASE_URL || 'https://farm-connect.amritagrotech.com').replace(/\/+$/, '');

if (__DEV__) {
  // Helps verify which host the app is actually calling.
  console.log('[api] API_BASE_URL =', API_BASE_URL);
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

function parsePossiblyJson<T>(text: string): T {
  const trimmed = text.trim();
  if (!trimmed) return undefined as T;

  // Some endpoints return a quoted JSON string, e.g. "..."
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return JSON.parse(trimmed) as T;
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return trimmed as unknown as T;
  }
}

function formatHttpError(res: Response, text: string) {
  const trimmed = (text ?? '').trim();
  // If server returns an HTML error page (nginx), show a short message.
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
    return `Request failed (${res.status} ${res.statusText})`;
  }
  return trimmed || `Request failed (${res.status} ${res.statusText})`;
}

function toFormUrlEncoded(body: unknown) {
  const params = new URLSearchParams();
  if (body && typeof body === 'object') {
    for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
      if (v === undefined || v === null) continue;
      params.append(k, String(v));
    }
  }
  return params.toString();
}

export async function postJson<T>(
  path: string,
  body: unknown,
  opts?: { headers?: Record<string, string> },
): Promise<ApiResult<T>> {
  try {
    const url = `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;

    // Attempt #1: JSON POST (preferred)
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(opts?.headers ?? {}),
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();

    // Some backends behind nginx reject JSON with 405/415 and are configured for form-encoded bodies.
    if (!res.ok && (res.status === 405 || res.status === 415)) {
      const retry = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          ...(opts?.headers ?? {}),
        },
        body: toFormUrlEncoded(body),
      });

      const retryText = await retry.text();
      if (!retry.ok) {
        return { ok: false, error: formatHttpError(retry, retryText) };
      }

      return { ok: true, data: parsePossiblyJson<T>(retryText) };
    }

    if (!res.ok) {
      return { ok: false, error: formatHttpError(res, text) };
    }

    return { ok: true, data: parsePossiblyJson<T>(text) };
  } catch (e: any) {
    // If this is an IP + HTTPS with a self-signed/invalid cert, RN often throws a generic network error.
    const msg = String(e?.message ?? e);
    return { ok: false, error: msg };
  }
}

export async function getJson<T>(
  path: string,
  opts?: { headers?: Record<string, string> },
): Promise<ApiResult<T>> {
  try {
    const url = `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(opts?.headers ?? {}),
      },
    });

    const text = await res.text();

    if (!res.ok) {
      return { ok: false, error: formatHttpError(res, text) };
    }

    return { ok: true, data: parsePossiblyJson<T>(text) };
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    return { ok: false, error: msg };
  }
}
