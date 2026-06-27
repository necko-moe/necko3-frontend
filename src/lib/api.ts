const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) ?? "";

let unauthorizedHandler: (() => void) | null = null;

/** Called from AuthProvider so 401 responses clear the session key and reopen the login dialog. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export interface ApiResponse<T> {
  status: "success" | "error";
  data?: T;
  message?: string | null;
}

export async function apiFetch<T>(
  path: string,
  apiKey: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + apiKey,
      ...init?.headers,
    },
  });

  if (res.status === 401) {
    unauthorizedHandler?.();
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (typeof body?.error?.message === "string") {
        message = body.error.message;
      } else if (typeof body?.message === "string") {
        message = body.message;
      }
    } catch {
      // body wasn't JSON — keep the HTTP status fallback
    }
    throw new Error(message);
  }

  // Handle potentially empty success responses
  const text = await res.text();
  let data: any = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // Keep it as undefined/unparsed if not JSON
    }
  }

  return {
    status: "success",
    data,
  };
}

/**
 * Same as apiFetch but returns null on any error instead of throwing.
 * Use for secondary / metadata fetches where failure should be silent.
 */
export async function apiFetchSilent<T>(
  path: string,
  apiKey: string,
  init?: RequestInit,
): Promise<ApiResponse<T> | null> {
  try {
    return await apiFetch<T>(path, apiKey, init);
  } catch {
    return null;
  }
}
