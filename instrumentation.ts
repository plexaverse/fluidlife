// Next.js instrumentation hook. Loaded once at server start.
// Docs: node_modules/next/dist/docs/01-app/04-glossary.md (instrumentation)

const REQUIRED_ENV = [
  "DATABASE_URL",
  "JWT_SECRET",
  "ADMIN_USERNAME",
  "ADMIN_PASSWORD",
  "USER_ACCESS_SECRET",
  "USER_REFRESH_SECRET",
  "TWO_FACTOR_BASE_URL",
  "TWO_FACTOR_AUTH_KEY",
  "RAZORPAY_WEBHOOK_SECRET",
  "SHIPROCKET_WEBHOOK_TOKEN",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

export async function register(): Promise<void> {
  // Validate required env vars at boot so misconfigurations surface immediately.
  if (process.env.NODE_ENV === "production") {
    const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
    if (missing.length > 0) {
      console.error(
        `[boot] Missing required environment variables: ${missing.join(", ")}. Server may not function correctly.`
      );
    }
  }

  if (!process.env.SENTRY_DSN) return;

  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
      enabled: process.env.NODE_ENV === "production",
    });
  } catch {
    // Sentry not installed yet — leave a hint and continue without it.
    console.warn("Sentry SDK not installed; install @sentry/nextjs to enable error reporting");
  }
}

export const onRequestError =
  process.env.SENTRY_DSN
    ? async (err: unknown, request: unknown, context: unknown) => {
        try {
          const Sentry = await import("@sentry/nextjs");
          (Sentry as any).captureRequestError?.(err, request, context);
        } catch {
          /* ignore */
        }
      }
    : undefined;
