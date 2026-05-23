# Pending work

A focused list of what's *not yet done*. Engineering scope is closed against
the original audit — what remains is operational setup, ongoing hardening, and
post-launch features. The git log is the source of truth for what's already in
the codebase; this file is forward-looking.

---

## Engineering status

Backend + storefront in main. Recent sprint ported the storefront UI to match
takekare visually 1:1 — applied directly to `main` (no PRs), staged for the
next commit.

| Phase | Scope | Status |
|-------|-------|--------|
| Backend 1 | Production backend (auth, orders, products, GST, coupons, Razorpay webhook) | ✅ merged to `main` |
| Backend 2 | Health endpoint, boot-time env validation, Shiprocket order creation, SMS scaffolding | ✅ merged to `main` |
| Backend 3 | Server-side PDF invoices, analytics hooks, distributor self-service portal | ✅ merged to `main` |
| Backend 4 | Admin order lifecycle (confirm payment, ship, deliver, cancel), CSV export, order-actions UI | ✅ merged to `main` |
| Storefront 1–4 | Chrome + browse + checkout + account (zustand, OTP, Razorpay client, wishlist, addresses) | ✅ on `main` |
| Storefront polish | Build green, server-side Razorpay order creation, light-mode forced for customer routes | ✅ on `main` |
| Takekare visual port | About / Contact / Explore / Category / Product / Product card / Navbar — assets, Lottie, Swiper gallery, Timeline, marquee reviews, sticky bottom bar | ✅ direct edits on `main`, staged |
| Dummy data seed | `prisma/seed.mjs` — 3 billboards, 4 categories, 6 products (3 featured), 12 images, 6 reviews; broken Unsplash IDs replaced and re-probed | ✅ on `main`, run via `npm run db:seed` |

Test coverage: **135 tests passing** across 16 suites (vitest).
TypeScript: clean (`npx tsc --noEmit` only flags a stale `.next/types/validator.ts` from an old build — wipes itself on next clean build).
ESLint on touched files: clean. Project-wide lint shows ~5.6k pre-existing
`any`-type errors in older code, not introduced by this work.

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
      - Providers: `TWO_FACTOR_AUTH_KEY`, `TWO_FACTOR_BASE_URL`,
        `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`,
        `NEXT_PUBLIC_RAZORPAY_KEY_ID` ✅ now set in local `.env` (same value
        as `RAZORPAY_KEY_ID`; **flip to live `rzp_live_…` together** when going
        live, the secret stays server-only),
        `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, `SHIPROCKET_WEBHOOK_TOKEN`,
        `SHIPROCKET_PICKUP_LOCATION`
      - Rate limiting: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
      - CORS: `ALLOWED_ORIGINS` (comma-separated storefront + admin domains)
      - Storage: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
      - Analytics (optional): `ANALYTICS_WEBHOOK_URL`
- [ ] **Razorpay dashboard**
      - Create live keys → set `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` +
        `NEXT_PUBLIC_RAZORPAY_KEY_ID` (needed by refund + reconcile endpoints;
        webhook only needs the secret)
      - Add webhook: `https://<host>/api/razorpay/webhook` with the configured
        secret, events `payment.captured`, `payment.authorized`, `payment.failed`
- [ ] **Shiprocket dashboard**
      - Add webhook: `https://<host>/api/shiprocket/webhook` with header
        `x-api-key: $SHIPROCKET_WEBHOOK_TOKEN`
      - The admin ship button (`POST /api/admin/orders/:id/ship`) creates the
        Shiprocket order and populates `Order.shiprocketOrderId` automatically.
        The webhook then uses that ID to match incoming status updates.
- [ ] **Resend** (transactional email)
      - Set `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `STORE_URL`
      - Verify the sender domain in Resend (DKIM/SPF DNS records)
      - Emails fire for: ORDER_CONFIRMED, ORDER_SHIPPED, ORDER_DELIVERED,
        ORDER_REFUNDED, ORDER_CANCELLED
      - Currently the API logs `RESEND not configured` and no-ops — orders
        confirm cleanly but the customer doesn't get an email.
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
      approved, set env vars: `SMS_TEMPLATE_ORDER_CONFIRMED`, etc. per
      `OrderNotificationType`. Email-only is acceptable at launch.
- [ ] **Cloud Scheduler → reconcile**
      Create a Cloud Scheduler job that hits `GET /api/admin/reconcile`
      hourly with admin auth. Without this the reconciliation viewer is
      manual-only — fine to start with, automate within the first week.
- [ ] **Smoke tests on staging**
      Place a real prepaid order end-to-end (storefront → Razorpay test mode
      → webhook → admin ship → Shiprocket webhook status update → delivered).
      The 135 vitest tests cover correctness but don't exercise live integrations.

---

## Placeholder content to swap out (from the takekare visual port)

Visual/copy carry-overs from `takekare-frontend` that need real Fluidlife
content before launch. The code paths are wired — just data + assets.

- [ ] **Contact page — Google Maps iframe**
      `src/app/(storefront)/contact/page.tsx` still embeds takekare's Latur
      pin (`TakeKare Health and Hygiene`). Replace the iframe `src=` `pb=`
      parameter with the Fluidlife registered-office embed URL from
      [google.com/maps](https://www.google.com/maps).
- [ ] **Contact page — address & phone**
      Currently shows placeholder address/phone copied from takekare's tone.
      Update the `Visit Us.` block + `mailto:` / `tel:` links to real
      Fluidlife details.
- [ ] **About-us — Our Clients logos**
      `src/app/(storefront)/about-us/page.tsx` lists 8 client logos
      (`/img/clients/01.png` … `08.png`) labelled with takekare's clients
      (ONGC / Baikakaji / etc.). Replace with Fluidlife's actual retail / B2B
      partner logos and labels.
- [ ] **About-us — `fluidlife-icon.svg`**
      `public/img/fluidlife-icon.svg` is a copy of `takekare-icon.svg`.
      Replace with the real Fluidlife mark.
- [ ] **Explore — draggable product cards**
      `src/app/(storefront)/explore/components/product-draggable-cards.tsx`
      shows 4 takekare product webps (`/img/products/FC_5.webp`,
      `HW_6.webp`, `IIW_5.webp`, `LD_6.webp`) with takekare's product names
      ("Inner-wear Wash" etc.). Swap for Fluidlife product photography +
      names once the lineup is finalised.
- [ ] **Catalogue imagery — Unsplash placeholders**
      `prisma/seed.mjs` populates billboards + product images from
      `images.unsplash.com`. Replace with real product photography hosted on
      Supabase Storage (or Cloudinary), then **remove `images.unsplash.com`
      from `next.config.ts` `remotePatterns`**. Until then, every Unsplash
      photo ID we use should stay alive — broken IDs already surface as
      visible 404s in the gallery.
- [ ] **WhatsApp number**
      `NEXT_PUBLIC_WHATSAPP_NUMBER` env var drives the floating WhatsApp
      button in the bottom-left of every storefront page. Already set per
      your earlier note — verify the live value is the support number
      before launch.
- [ ] **Social links**
      `src/components/storefront/social-icons.tsx` still points at generic
      `amazon.in` / `instagram.com` URLs. Update with the real Fluidlife
      profile URLs when they exist.
- [ ] **Hero illustration — `landing-picture-transparent.webp`**
      The home page hero still uses this file (the only one not from
      takekare). Verify it represents the Fluidlife brand correctly.
- [ ] **Default seller info for invoices**
      See the seller-env section above — until set, invoice PDFs show blank
      header blocks.

---

## Should-do within the first sprint

Not blockers, but you'll feel the pain quickly without them.

- [ ] **Backups**
      Supabase paid plans do automated backups; verify the schedule and
      practice a restore. If on free tier, set up `pg_dump` to GCS.
- [ ] **Monitoring dashboards**
      Cloud Logging + Cloud Monitoring uptime checks on `/api/health` (canary),
      checkout p95 latency, Razorpay webhook success rate.
      Sentry catches errors but not "everything is slow."
- [ ] **Storefront-side route updates**
      The `/api/orders/[userId]` → `/api/users/[userId]/orders` move and the
      structured `{ error: { code, message, issues } }` envelope require any
      external storefront callers to update.
- [ ] **Distributor approval flow**
      New distributors register normally but start with `isApproved: false`.
      Admin must set `isApproved: true` before they can place orders. Wire a
      UI or notification so pending approvals don't go unnoticed.
      Check: `GET /api/users?role=DISTRIBUTOR&isApproved=false`
- [ ] **`npm audit` triage**
      `npm install` reports 12 vulns (10 moderate, 2 high) post the recent
      `swiper` + `lottie-react` + `@tabler/icons-react` adds. Most look like
      transitive dev-dep stuff; worth a one-shot review with `npm audit fix`
      before launch.

---

## Post-launch / scale-driven

Defer until traffic or product strategy demands it.

- [ ] **Advanced order workflow**
      Partial shipments (one order → multiple Shiprocket consignments), returns
      workflow (customer initiates return → admin approves → refund), RMA tracking.
- [ ] **Read replicas + caching layer**
      When you cross ~10k orders/day, point storefront read traffic
      (products, categories, billboards) at a Supabase read replica and add
      a 60s edge cache (`Cache-Control: s-maxage=60, stale-while-revalidate`).
- [ ] **Search engine**
      Postgres FTS (now in place) will be fine up to ~50k products. Past
      that, evaluate Meilisearch or Typesense (self-hosted) or Algolia.
- [ ] **Customer support tooling**
      Helpdesk integration (e.g. Zendesk webhook from order/refund events)
      so support agents can act on a ticket without admin access.
- [ ] **Marketing analytics**
      The `trackEvent()` hook is wired (Phase 3); connect `ANALYTICS_WEBHOOK_URL`
      to GA4 / Mixpanel / Segment to consume the event stream.
- [ ] **Bulk order operations**
      Admin bulk-cancel, bulk status change across a filtered set.
- [ ] **Cache storefront reads (`unstable_cache`)**
      The four DB-touching storefront pages (home, explore, category, product)
      are currently `dynamic = "force-dynamic"` so the build doesn't require a
      DB connection. Per-request Prisma is fine for early traffic; wrapping
      `getPublicProducts` / `getPublicCategories` / `getPublicProduct` in
      `unstable_cache` with a 60–300s revalidate gets the ISR-equivalent perf
      back without re-introducing the build-time DB dependency.
- [ ] **Default-address exclusivity**
      Setting an address as default (`PATCH /api/addresses/[id]` with
      `isDefault: true`) doesn't auto-clear the previous default. The
      storefront's `/account?tab=addresses` UI shows the latest "Default"
      badge correctly, but if you need strict single-default invariant,
      wrap the PATCH in a transaction that first clears `isDefault` on the
      user's other addresses.

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
npm test                   # vitest run (135 tests)
npm run test:watch         # interactive
npm run build              # full Next build (compile + type check + page gen)
```

### Helpful endpoints (admin-only)
- `GET  /api/health`                                  — liveness + DB ping
- `GET  /api/admin/reconcile?from=<iso>&to=<iso>`     — Razorpay vs local
- `GET  /api/admin/orders/export?status=ORDERED`      — CSV download
- `GET  /api/admin/notifications?status=failed`       — failed emails/SMS
- `GET  /api/admin/webhook-events?source=razorpay`    — idempotency cache
- `GET  /api/users?role=DISTRIBUTOR&isApproved=false` — pending distributor approvals

### Admin order lifecycle (quick reference)
```
PAYMENT_PENDING  →  [Razorpay webhook]  →  ORDERED
ORDERED          →  POST .../ship       →  SHIPPED   (+ Shiprocket order created)
ORDERED          →  POST .../cancel     →  CANCELLED (stock/coupon/credit restored)
SHIPPED          →  POST .../deliver    →  DELIVERED (manual or Shiprocket webhook)
ORDERED/SHIPPED/DELIVERED  →  POST .../refund  →  REFUNDED
COD/BANK_TRANSFER  →  POST .../confirm-payment  →  isPaid = true
```
