// ─── api.ts ────────────────────────────────────────────────────────────────
// WHY: Centralised fetch wrapper that:
//  1. Attaches Bearer token on every request
//  2. On 401 → tries ONE silent refresh using the stored refresh token
//  3. On refresh failure → wipes storage so the user is cleanly logged out
//     instead of looping "session expired" forever
//  4. Extracts human-readable error messages from Django's varied error shapes
// ─────────────────────────────────────────────────────────────────────────────

export const API_URL = "http://127.0.0.1:8000";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// Django can return errors in several shapes — we normalise them all
type BackendError = {
  message?: string | Record<string, string[]>;
  error?: string;
  detail?: string;
  [key: string]: unknown;
};

// ── Token helpers ────────────────────────────────────────────────────────────
// WHY: Keeping token I/O in one place makes it trivial to swap to cookies later

export function getAccessToken(): string | null {
  return localStorage.getItem("access");
}

export function setTokens(access: string, refresh?: string): void {
  localStorage.setItem("access", access);
  if (refresh) localStorage.setItem("refresh", refresh);
}

export function clearTokens(): void {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

// ── Error normaliser ─────────────────────────────────────────────────────────
// WHY: Django DRF returns errors in at least 3 different shapes.
//      We flatten them into a single human-readable string so toast always
//      gets something useful.

export function extractErrorMessage(data: BackendError): string {
  if (typeof data.detail === "string") return data.detail;
  if (typeof data.error === "string") return data.error;
  if (typeof data.message === "string") return data.message;

  // Nested field errors: { user: { username: ["already taken"] } }
  // or flat field errors: { email: ["Enter a valid email"] }
  const flatten = (obj: Record<string, unknown>): string[] => {
    const msgs: string[] = [];
    for (const [key, val] of Object.entries(obj)) {
      if (Array.isArray(val)) {
        msgs.push(`${key}: ${val.join(", ")}`);
      } else if (val && typeof val === "object") {
        msgs.push(...flatten(val as Record<string, unknown>));
      }
    }
    return msgs;
  };
  const messages = flatten(data as Record<string, unknown>);
  if (messages.length) return messages.join(" · ");
  return "An unexpected error occurred.";
}

async function handleErrorResponse(res: Response): Promise<never> {
  let data: BackendError = {};
  try {
    data = await res.json();
  } catch {
    // non-JSON body (e.g. 502 nginx HTML page)
  }
  throw {
    status: res.status,
    message: extractErrorMessage(data),
  };
}

// ── Token refresh ────────────────────────────────────────────────────────────
// WHY: Called automatically when the server returns 401.
//      If the refresh token itself is expired, we clear everything so the
//      user hits the login page cleanly — no more manual localStorage wipe.
async function refreshAccessToken(): Promise<string> {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) {
    clearTokens();
    throw new Error("No refresh token — please log in again.");
  }
  const res = await fetch(`${API_URL}/api/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) {
    // Refresh token is expired or invalid — force re-login
    clearTokens();
    // Redirect to login (works in both app/ and pages/ routers)
    if (typeof window !== "undefined") {
      window.location.href = "/citizen/login";
    }
    throw new Error("Session expired — please log in again.");
  }

  const data = await res.json();
  // Django Simple JWT returns a new access token (and optionally a new refresh)
  setTokens(data.access, data.refresh);
  return data.access;
}

// ── Core request function ────────────────────────────────────────────────────
// WHY: Single entry-point for all API calls.
//      The `retried` flag prevents infinite 401 loops —
//      we attempt the refresh exactly once.

export async function REQUEST<T = unknown>(
  method: HttpMethod,
  url: string,
  body?: unknown,
  options?: { isMultipart?: boolean; retried?: boolean }
): Promise<T> {
  const buildRequest = async (): Promise<Response> => {
    const headers: Record<string, string> = {};
    if (!options?.isMultipart) {
      headers["Content-Type"] = "application/json";
    }

    const access = getAccessToken();
    if (access) {
      headers["Authorization"] = `Bearer ${access}`;
    }

    return fetch(`${API_URL}/api/${url}`, {
      method,
      headers,
      body: options?.isMultipart
        ? (body as BodyInit)
        : body != null
          ? JSON.stringify(body)
          : null,
    });
  };

  let res = await buildRequest();

  // ── Auto-refresh on 401 ──────────────────────────────────────────────────
  if (res.status === 401 && !options?.retried) {
    try {
      await refreshAccessToken();
      // Retry the original request once with the new access token
      res = await buildRequest();
    } catch (err) {
      // refreshAccessToken already redirected; just re-throw for callers
      throw err;
    }
  }

  if (!res.ok) {
    await handleErrorResponse(res);
  }
  // 204 No Content has no body
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}