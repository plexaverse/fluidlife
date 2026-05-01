import { defineConfig } from "prisma/config";

/**
 * Prisma 7 + driver-adapter setup.
 *
 * The runtime client in src/lib/prismadb.ts opens its own pg.Pool via
 * @prisma/adapter-pg, so the schema's datasource block doesn't need (and
 * Prisma 7 actively forbids) a `url`. Migration commands (db push, migrate
 * dev/deploy) bypass the adapter, so we surface the connection string here.
 *
 * Prisma 7's CLI no longer auto-loads .env before evaluating this file, so
 * we do it explicitly. process.loadEnvFile() is built into Node >= 20.6 and
 * silently does nothing if .env is absent.
 *
 * For Supabase: point DATABASE_URL at the direct connection (port 5432) for
 * migrations — the transaction-mode pooler on :6543 doesn't accept DDL.
 * If you want runtime on the pooler and migrations on the direct URL,
 * set DIRECT_URL alongside DATABASE_URL; it takes precedence here.
 */

try {
  process.loadEnvFile?.();
} catch {
  /* .env absent — fall through to inline env vars */
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
