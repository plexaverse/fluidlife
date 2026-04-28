# Pending work

A focused list of what's *not yet done*. Engineering scope is closed against
the original audit — what remains is operational setup, ongoing hardening, and
post-launch features. The git log is the source of truth for what's already in
the codebase; this file is forward-looking.

---

## Pre-launch checklist (must do before real traffic)

These are blockers, not "nice to have." Each one is operational, not code.

- [ ] **Database migration on prod**
      `npx prisma migrate deploy && npx prisma generate` against the production
      DATABASE_URL.
- [ ] **Postgres setup script**
      `psql "$DATABASE_URL" -f prisma/cleanup_jobs.sql` — installs pg_cron jobs
      (OTP cleanup, webhook event cleanup, expired-order release every 5 min)
      plus the GIN indexes that back product search.
- [ ] **Connection pooler**
      Point `DATABASE_URL` at the Supabase pooled endpoint (port 6543,
      transaction mode). The code is sized for it (`PG_POOL_MAX=3`); without
      the pooler, Cloud Run will exhaust Postgres connections under load.
- [ ] **Required env vars** (see `.env.example` for the full list)
      - Auth: `JWT_SECRET`, `USER_ACCESS_SECRET`, `USER_REFRESH_SECRET`,
        `ADMIN_USERNAME`, `ADMIN_PASSWORD`
      - Providers: `TWO_FACTOR_*`, `RAZORPAY_WEBHOOK_SECRET`,
        `SHIPROCKET_WEBHOOK_TOKEN`
      - Rate limiting: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
      - CORS: `ALLOWED_ORIGINS` (comma-separated storefront + admin domains)
- [ ] **Razorpay dashboard**
      - Create live keys → set `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET`
        (needed by refund + reconcile endpoints; webhook only needs the secret)
      - Add webhook: `https://<host>/api/razorpay/webhook` with the configured
        secret, events `payment.captured`, `payment.authorized`, `payment.failed`
- [ ] **Shiprocket dashboard**
      - Add webhook: `https://<host>/api/shiprocket/webhook` with header
        `x-api-key: $SHIPROCKET_WEBHOOK_TOKEN`
      - The Shiprocket order-creation flow (which we have *not* built; lives
        either in storefront or a future server task) **must populate**
        `Order.shiprocketOrderId` via `recordShiprocketOrder()` in
        `src/lib/shiprocket.ts` — without it the status webhook can't find
        the local order.
- [ ] **Resend** (transactional email)
      - Set `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `STORE_URL`
      - Verify the sender domain in Resend (DKIM/SPF DNS records)
- [ ] **Seller info for invoices**
      Set `SELLER_NAME`, `SELLER_GSTIN`, `SELLER_PAN`, `SELLER_ADDRESS`,
      `SELLER_STATE`, `SELLER_PINCODE`, `SELLER_EMAIL`, `SELLER_PHONE`.
      Without these the invoice PDF renders blank header blocks.
- [ ] **Sentry** (recommended)
      Set `SENTRY_DSN` (and optionally `SENTRY_TRACES_SAMPLE_RATE`). Logger
      auto-forwards on errors when this is set.
- [ ] **DLT-approved SMS templates** (Indian regulatory)
      The `notify.ts` SMS path is scaffolded but no-op until you register
      transactional templates with your TRAI-approved DLT entity. Once
      approved, wire template names via env vars and uncomment the SMS
      branch in `src/lib/notify.ts`. Email-only is acceptable at launch.
- [ ] **Cloud Scheduler → reconcile**
      Create a Cloud Scheduler job that hits `GET /api/admin/reconcile`
      hourly with admin auth. Without this the reconciliation viewer is
      manual-only — fine to start with, automate within the first week.
- [ ] **Smoke tests on staging**
      Place a real prepaid order end-to-end (storefront → Razorpay test mode
      → webhook → Shiprocket test → fulfillment status). The 4 vitest
      checkout tests cover correctness but don't exercise the integrations.

---

## Should-do within the first sprint

Not blockers, but you'll feel the pain quickly without them.

- [ ] **Test coverage growth**
      Currently 4 checkout tests. Add: OTP send/verify happy + reuse paths;
      Razorpay webhook signature + idempotency; Shiprocket status mapping;
      `requireAdminOrSelf` matrix; refund happy path + restore-stock path.
      Target: ~20 tests covering the money paths.
- [ ] **Backups**
      Supabase paid plans do automated backups; verify the schedule and
      practice a restore. If on free tier, set up `pg_dump` to GCS.
- [ ] **Monitoring dashboards**
      Cloud Logging + Cloud Monitoring uptime checks on `/api/admin/login`
      (canary), checkout p95 latency, Razorpay webhook success rate.
      Sentry catches errors but not "everything is slow."
- [ ] **Storefront-side route updates**
      The `/api/orders/[userId]` → `/api/users/[userId]/orders` move and the
      structured `{ error: { code, message, issues } }` envelope require any
      external storefront callers to update.

---

## Post-launch / scale-driven

Defer until traffic or product strategy demands it.

- [ ] **PDF rendering of invoices server-side**
      Currently relies on the admin opening `/admin/orders/[id]/invoice` and
      printing. For programmatic batch generation (emailing PDFs, signed
      archives), pick a service: puppeteer-core on a worker, react-pdf,
      or external like DocRaptor / PDFShift.
- [ ] **Read replicas + caching layer**
      When you cross ~10k orders/day, point storefront read traffic
      (products, categories, billboards) at a Supabase read replica and add
      a 60s edge cache (`Cache-Control: s-maxage=60, stale-while-revalidate`).
- [ ] **Search engine**
      Postgres FTS (now in place) will be fine up to ~50k products. Past
      that, evaluate Meilisearch or Typesense (self-hosted) or Algolia.
- [ ] **Advanced order workflow**
      Partial shipments, returns workflow (currently only direct refund),
      RMA tracking.
- [ ] **Distributor self-service**
      Distributors currently have no UI. Their /admin equivalent (orders,
      addresses, credit usage) would unlock B2B without admin intervention.
- [ ] **Customer support tooling**
      Helpdesk integration (e.g. Zendesk webhook from order/refund events)
      so support agents can act on a ticket without admin access.
- [ ] **Marketing analytics**
      Stripe-level event stream (order.created, order.paid, refund.issued)
      feeding GA4 / Mixpanel / Segment.

---

## Reference

### Run-once commands
```bash
npx prisma migrate deploy
npx prisma generate
psql "$DATABASE_URL" -f prisma/cleanup_jobs.sql
```

### Test
```bash
npm test                   # vitest run
npm run test:watch         # interactive
```

### Helpful endpoints (admin-only)
- `GET  /api/admin/reconcile?from=<unix>&to=<unix>` — Razorpay vs local
- `GET  /api/admin/notifications?status=failed`     — failed emails
- `GET  /api/admin/webhook-events?source=razorpay`  — idempotency cache
- `GET  /api/users?role=DISTRIBUTOR&isApproved=false` — pending approvals
