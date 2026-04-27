import "server-only";

type Level = "debug" | "info" | "warn" | "error";
type Fields = Record<string, unknown>;

const LEVEL_RANK: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN_LEVEL: Level = (process.env.LOG_LEVEL as Level) || "info";

function shouldLog(level: Level): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[MIN_LEVEL];
}

function emit(level: Level, message: string, fields?: Fields): void {
  if (!shouldLog(level)) return;
  // Cloud Run / Cloud Logging picks up stdout JSON automatically.
  // `severity` is the GCP-native key.
  const severity = level === "warn" ? "WARNING" : level.toUpperCase();
  const entry: Record<string, unknown> = {
    severity,
    time: new Date().toISOString(),
    message,
    ...fields,
  };
  const sink = level === "error" || level === "warn" ? process.stderr : process.stdout;
  sink.write(JSON.stringify(entry) + "\n");
}

export const logger = {
  debug: (message: string, fields?: Fields) => emit("debug", message, fields),
  info: (message: string, fields?: Fields) => emit("info", message, fields),
  warn: (message: string, fields?: Fields) => emit("warn", message, fields),
  error: (message: string, error?: unknown, fields?: Fields) => {
    const errFields: Fields = {};
    if (error instanceof Error) {
      errFields.error = { name: error.name, message: error.message, stack: error.stack };
    } else if (error !== undefined) {
      errFields.error = error;
    }
    emit("error", message, { ...errFields, ...fields });
    // Forward to Sentry if available.
    captureExceptionSafe(error ?? new Error(message), { message, ...fields });
  },
};

// ── Sentry forwarder (no hard dependency at import time) ───────────────────

type SentryLike = {
  captureException(error: unknown, hint?: { extra?: Record<string, unknown> }): void;
};
let sentryRef: SentryLike | null | undefined;

function getSentry(): SentryLike | null {
  if (sentryRef !== undefined) return sentryRef;
  try {
    // Resolved at runtime so tests / local without Sentry installed still work.
    const mod = require("@sentry/nextjs") as SentryLike;
    sentryRef = mod;
  } catch {
    sentryRef = null;
  }
  return sentryRef;
}

function captureExceptionSafe(err: unknown, extra?: Record<string, unknown>): void {
  if (!process.env.SENTRY_DSN) return;
  const s = getSentry();
  if (!s) return;
  try {
    s.captureException(err, { extra });
  } catch {
    /* never throw from logger */
  }
}
