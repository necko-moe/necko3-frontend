const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) ?? "";

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
      "x-api-key": apiKey,
      ...init?.headers,
    },
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (typeof body?.message === "string") message = body.message;
    } catch {
      // body wasn't JSON — keep the HTTP status fallback
    }
    throw new Error(message);
  }

  return res.json() as Promise<ApiResponse<T>>;
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
