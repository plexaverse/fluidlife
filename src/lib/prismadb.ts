import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var pgPool: pg.Pool | undefined;
}

// Cloud Run scales horizontally; with Supabase transaction-mode pooler each
// instance only needs a tiny local pool. A single connection is enough for the
// in-instance concurrency of route handlers; 3 leaves headroom for bursts.
const POOL_MAX = Number(process.env.PG_POOL_MAX ?? 3);
const STATEMENT_TIMEOUT_MS = Number(process.env.PG_STATEMENT_TIMEOUT_MS ?? 10_000);

function makePool(): pg.Pool {
  return new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: POOL_MAX,
    idleTimeoutMillis: 30_000,
    statement_timeout: STATEMENT_TIMEOUT_MS,
  });
}

const pool = globalThis.pgPool ?? makePool();
const adapter = new PrismaPg(pool as any);
const prismadb = globalThis.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prismadb;
  globalThis.pgPool = pool;
}

export default prismadb;
