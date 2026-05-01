import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";

const REQUIRED_ENV = [
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

const startTime = Date.now();

export const dynamic = "force-dynamic";

export async function GET() {
  const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);

  let db: "ok" | "error" = "ok";
  try {
    await prismadb.$queryRaw`SELECT 1`;
  } catch {
    db = "error";
  }

  const ok = db === "ok" && missingEnv.length === 0;
  const status = ok ? 200 : 503;

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      db,
      ...(missingEnv.length > 0 && { missingEnv }),
      uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    },
    { status }
  );
}
