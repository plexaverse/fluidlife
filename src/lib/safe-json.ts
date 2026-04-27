import { NextResponse } from "next/server";
import { apiError } from "./api-error";

const DEFAULT_MAX_BYTES = 1_000_000; // 1 MB

type ReadOpts = { maxBytes?: number; headers?: HeadersInit };

export type ReadBodyResult =
  | { ok: true; raw: string }
  | { ok: false; response: NextResponse };

export type SafeJsonResult =
  | { ok: true; data: unknown; raw: string }
  | { ok: false; response: NextResponse };

export async function readBody(req: Request, opts?: ReadOpts): Promise<ReadBodyResult> {
  const max = opts?.maxBytes ?? DEFAULT_MAX_BYTES;
  const declared = req.headers.get("content-length");
  if (declared && Number(declared) > max) {
    return { ok: false, response: apiError("BAD_REQUEST", "Request body too large", opts?.headers) };
  }
  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return { ok: false, response: apiError("BAD_REQUEST", "Failed to read body", opts?.headers) };
  }
  if (raw.length > max) {
    return { ok: false, response: apiError("BAD_REQUEST", "Request body too large", opts?.headers) };
  }
  return { ok: true, raw };
}

export async function safeJson(req: Request, opts?: ReadOpts): Promise<SafeJsonResult> {
  const r = await readBody(req, opts);
  if (!r.ok) return r;
  if (r.raw.length === 0) {
    return { ok: false, response: apiError("BAD_REQUEST", "Empty body", opts?.headers) };
  }
  try {
    return { ok: true, data: JSON.parse(r.raw), raw: r.raw };
  } catch {
    return { ok: false, response: apiError("BAD_REQUEST", "Invalid JSON", opts?.headers) };
  }
}
