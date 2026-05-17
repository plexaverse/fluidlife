"use client";

import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";

import { useAuthStore } from "@/stores/auth-store";

/**
 * Storefront-side axios client.
 *
 *  - Injects `Authorization: Bearer <token>` from the persisted auth store
 *  - On 401, attempts a single concurrent refresh via /api/auth/refresh,
 *    queues any in-flight requests behind it, retries on success,
 *    or logs the user out on failure.
 *  - Unwraps the structured `{ error: { code, message, issues? } }` envelope
 *    so callers can `catch (e)` and read e.message / e.code / e.issues.
 */
export const api = axios.create({
  baseURL: "/api",
  // We send the bearer token in the Authorization header, not a cookie,
  // so withCredentials isn't needed.
});

// ── Request: attach Authorization ──────────────────────────────────────

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Skip auth header on the refresh endpoint itself — it expects refreshToken in the body.
  if (config.url?.includes("/auth/refresh")) return config;

  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response: refresh-on-401 with single-flight + structured errors ────

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;

  refreshInFlight = (async () => {
    try {
      const res = await axios.post("/api/auth/refresh", { refreshToken });
      const { token, expiry } = res.data as { token: string; expiry: number };
      useAuthStore.getState().setAccessToken(token, expiry);
      return token;
    } catch {
      useAuthStore.getState().logout();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined;

    // Single retry per request to avoid infinite refresh loops.
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes("/auth/refresh") &&
      !original.url?.includes("/auth/verifyotp") &&
      !original.url?.includes("/auth/sendotp")
    ) {
      original._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }

    return Promise.reject(error);
  }
);

// ── Tiny convenience wrappers ──────────────────────────────────────────

export type ApiError = {
  code: string;
  message: string;
  issues?: { path: string; message: string }[];
};

/** Extracts the structured error envelope; falls back to a generic message. */
export function apiError(e: unknown, fallback = "Something went wrong"): ApiError {
  const data = (e as AxiosError<{ error?: ApiError }> | undefined)?.response?.data;
  if (data?.error?.message) return data.error;
  return { code: "UNKNOWN", message: fallback };
}

export async function safeGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.get<T>(url, config);
  return res.data;
}

export async function safePost<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.post<T>(url, body, config);
  return res.data;
}

export async function safePatch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.patch<T>(url, body, config);
  return res.data;
}

export async function safeDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.delete<T>(url, config);
  return res.data;
}
