import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "INR"
});

/**
 * Extract a user-facing message from an axios/fetch error. Understands the
 * structured `{ error: { code, message, issues } }` envelope returned by every
 * route in this app, falling back to the supplied default for network errors
 * or unexpected shapes.
 */
export function apiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  const data = (error as any)?.response?.data;
  const e = data?.error;
  if (e && typeof e === "object") {
    if (Array.isArray(e.issues) && e.issues.length > 0) {
      return e.issues.map((i: any) => `${i.path || "field"}: ${i.message}`).join("; ");
    }
    if (typeof e.message === "string") return e.message;
  }
  if (typeof data === "string" && data.length > 0 && data.length < 200) return data;
  return fallback;
}
