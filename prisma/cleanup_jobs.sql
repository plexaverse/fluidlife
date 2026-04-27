-- ============================================================================
-- Postgres-side maintenance: full-text search index + scheduled cleanup jobs.
-- Run once against your Supabase database (SQL editor or psql):
--   psql "$DATABASE_URL" -f prisma/cleanup_jobs.sql
--
-- The script is idempotent — safe to re-run after schema migrations.
-- Requires the pg_cron extension, which Supabase ships with.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── Full-text search ──────────────────────────────────────────────────────
-- Backs Prisma's `search` filter (uses to_tsvector('simple', col) under the hood).
CREATE INDEX IF NOT EXISTS "Product_name_fts"
  ON "Product" USING GIN (to_tsvector('simple', "name"));
CREATE INDEX IF NOT EXISTS "Product_description_fts"
  ON "Product" USING GIN (to_tsvector('simple', COALESCE("description", '')));
-- Trigram index for short-query fallback (`contains`).
CREATE INDEX IF NOT EXISTS "Product_name_trgm"
  ON "Product" USING GIN ("name" gin_trgm_ops);

-- ─── Cleanup functions ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION cleanup_otp_sessions()
RETURNS void
LANGUAGE sql
AS $$
  DELETE FROM otp_sessions
   WHERE used = true OR "expiresAt" < (NOW() - INTERVAL '1 day');
$$;

CREATE OR REPLACE FUNCTION cleanup_webhook_events()
RETURNS void
LANGUAGE sql
AS $$
  DELETE FROM "WebhookEvent"
   WHERE "createdAt" < (NOW() - INTERVAL '30 days');
$$;

CREATE OR REPLACE FUNCTION cleanup_notification_logs()
RETURNS void
LANGUAGE sql
AS $$
  DELETE FROM "NotificationLog"
   WHERE "createdAt" < (NOW() - INTERVAL '180 days');
$$;

-- Auto-cancel PAYMENT_PENDING orders past their paymentExpiresAt:
-- restore stock, decrement coupon usage, mark order CANCELLED.
CREATE OR REPLACE FUNCTION release_expired_orders()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  affected integer := 0;
BEGIN
  CREATE TEMP TABLE _expired_orders ON COMMIT DROP AS
  SELECT id, "couponId"
    FROM "Order"
   WHERE status = 'PAYMENT_PENDING'
     AND "paymentExpiresAt" IS NOT NULL
     AND "paymentExpiresAt" < NOW()
     AND "deletedAt" IS NULL
   FOR UPDATE SKIP LOCKED;

  -- Restore stock.
  UPDATE "Product" p
     SET stock = p.stock + oi.quantity
    FROM "OrderItem" oi
    JOIN _expired_orders e ON oi."orderId" = e.id
   WHERE p.id = oi."productId";

  -- Decrement coupon usage.
  UPDATE "Coupon" c
     SET "usedCount" = GREATEST("usedCount" - 1, 0)
    FROM _expired_orders e
   WHERE e."couponId" IS NOT NULL AND c.id = e."couponId";

  -- Mark cancelled (soft-delete). PREPAID never increments creditUsed, so no rollback needed there.
  UPDATE "Order" o
     SET status = 'CANCELLED', "deletedAt" = NOW()
    FROM _expired_orders e
   WHERE o.id = e.id;

  SELECT COUNT(*) INTO affected FROM _expired_orders;
  RETURN affected;
END;
$$;

-- ─── Schedule (idempotent) ─────────────────────────────────────────────────
SELECT cron.unschedule(jobid)
  FROM cron.job
 WHERE jobname IN (
   'fluidlife_cleanup_otp',
   'fluidlife_cleanup_webhooks',
   'fluidlife_cleanup_notifications',
   'fluidlife_release_expired'
 );

SELECT cron.schedule('fluidlife_cleanup_otp',         '0 * * * *',  $$ SELECT cleanup_otp_sessions(); $$);
SELECT cron.schedule('fluidlife_cleanup_webhooks',    '15 3 * * *', $$ SELECT cleanup_webhook_events(); $$);
SELECT cron.schedule('fluidlife_cleanup_notifications','30 3 * * *',$$ SELECT cleanup_notification_logs(); $$);
SELECT cron.schedule('fluidlife_release_expired',     '*/5 * * * *', $$ SELECT release_expired_orders(); $$);

-- Inspect with: SELECT * FROM cron.job;
-- View runs with: SELECT * FROM cron.job_run_details ORDER BY end_time DESC LIMIT 20;
