// Next.js instrumentation hook. Loaded once at server start.
// Docs: node_modules/next/dist/docs/01-app/04-glossary.md (instrumentation)

export async function register(): Promise<void> {
  if (!process.env.SENTRY_DSN) return;

  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
      enabled: process.env.NODE_ENV === "production",
    });
  } catch (e) {
    // Sentry not installed yet — leave a hint and continue without it.
    process.stderr.write(
      JSON.stringify({
        severity: "WARNING",
        time: new Date().toISOString(),
        message: "Sentry SDK not installed; install @sentry/nextjs to enable error reporting",
      }) + "\n"
    );
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
