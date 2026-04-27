import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "BAD_REQUEST"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL";

const STATUS: Record<ApiErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  BAD_REQUEST: 400,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

export type ApiIssue = { path: string; message: string };

export function apiError(
  code: ApiErrorCode,
  message: string,
  headers?: HeadersInit,
  issues?: ApiIssue[]
): NextResponse {
  return NextResponse.json(
    { error: { code, message, ...(issues && issues.length ? { issues } : {}) } },
    { status: STATUS[code], headers }
  );
}

export function apiValidationError(error: ZodError, headers?: HeadersInit): NextResponse {
  const issues: ApiIssue[] = error.issues.map((i) => ({
    path: i.path.map(String).join("."),
    message: i.message,
  }));
  return apiError("BAD_REQUEST", "Validation failed", headers, issues);
}
