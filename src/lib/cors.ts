import { env } from "./env";

const STATIC_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key, x-razorpay-signature",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
} as const;

export function corsHeaders(req: Request, opts?: { credentials?: boolean }): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const allowed = env.ALLOWED_ORIGINS;

  const headers: Record<string, string> = { ...STATIC_HEADERS };
  if (origin && allowed.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    if (opts?.credentials) {
      headers["Access-Control-Allow-Credentials"] = "true";
    }
  }
  return headers;
}
