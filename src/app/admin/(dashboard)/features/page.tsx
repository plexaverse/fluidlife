import {
  ShoppingCart,
  ClipboardList,
  FileText,
  Bell,
  Building2,
  Package,
  Tag,
  CreditCard,
  ShieldCheck,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ── Data ─────────────────────────────────────────────────────────

const features = [
  {
    icon: ShoppingCart,
    title: "Shopping & Ordering",
    color: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    badge: "Customer-facing",
    badgeVariant: "secondary" as const,
    summary: "Everything your customers experience from browsing to checkout.",
    items: [
      "Auto GST calculation — CGST+SGST for same state, IGST cross-state",
      "Coupon codes — percentage or flat discount, with expiry & usage limits",
      "Free shipping above a configurable order value",
      "Payment options: online (card/UPI), COD, Bank Transfer",
      "Instant order confirmation email on payment",
      "Customers can cancel before dispatch; stock restored automatically",
    ],
  },
  {
    icon: ClipboardList,
    title: "Order Management",
    color: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
    badge: "Admin",
    badgeVariant: "default" as const,
    summary: "Full control over every order from placement to fulfilment.",
    items: [
      "Search by order ID, customer name, or phone number",
      "Filter by status, payment type, or date range",
      "One-click Export CSV for any filtered view",
      "Confirm Payment — mark COD/bank transfer orders as paid",
      "Ship — push order to Shiprocket, tracking set up automatically",
      "Mark Delivered, Refund, or Cancel — all with automatic rollbacks",
      "Live status updates from courier arrive automatically",
    ],
  },
  {
    icon: FileText,
    title: "Invoices & Billing",
    color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    badge: "Auto-generated",
    badgeVariant: "secondary" as const,
    summary: "GST-compliant tax invoices, ready to print or download.",
    items: [
      "Sequential invoice numbers (INV-0001, INV-0002…) assigned automatically",
      "Print-ready A4 invoice in the browser",
      "One-click PDF download",
      "Full GST breakup: CGST, SGST, IGST per product line",
      "Seller GSTIN/PAN and buyer GSTIN on every invoice",
    ],
  },
  {
    icon: Bell,
    title: "Notifications",
    color: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    badge: "Automated",
    badgeVariant: "secondary" as const,
    summary: "Customers are informed at every step — no manual action needed.",
    items: [
      "Email on: Order confirmed, Shipped, Delivered, Refunded, Cancelled",
      "SMS ready — activate once DLT templates are approved",
      "All sent notifications logged with delivery status",
      "Retry failed notifications from the Notifications page",
    ],
  },
  {
    icon: Building2,
    title: "Distributor (B2B) Portal",
    color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400",
    badge: "B2B",
    badgeVariant: "default" as const,
    summary: "A self-service portal exclusively for wholesale partners.",
    items: [
      "OTP login via mobile — no password to forget",
      "Credit usage bar (green/yellow/red) on dashboard",
      "Automatically sees wholesale prices, not retail",
      "Minimum order quantity (MOQ) enforced per product",
      "Credit limit tracked in real time; released on cancel/refund",
      "Admin approval required before first order",
    ],
  },
  {
    icon: Package,
    title: "Product Catalogue",
    color: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400",
    badge: "Catalogue",
    badgeVariant: "secondary" as const,
    summary: "Manage inventory, pricing, and product details in one place.",
    items: [
      "Separate retail and B2B price per product",
      "Stock auto-deducted on order, auto-restored on cancel/refund",
      "Archive products without deleting them",
      "HSN codes and GST rates stored per product",
      "Dimensions and weight used for courier shipping quotes",
    ],
  },
  {
    icon: Tag,
    title: "Promotions & Coupons",
    color: "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
    badge: "Marketing",
    badgeVariant: "secondary" as const,
    summary: "Run targeted discounts with full control and zero risk of abuse.",
    items: [
      "Percentage or flat-rupee discount codes",
      "Minimum cart value, max discount cap, valid date range, usage limit",
      "Expired or exhausted coupons rejected automatically",
      "Usage count restored if order is cancelled or refunded",
    ],
  },
  {
    icon: CreditCard,
    title: "Payments & Reconciliation",
    color: "bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400",
    badge: "Finance",
    badgeVariant: "secondary" as const,
    summary: "Payments handled end-to-end with a built-in reconciliation check.",
    items: [
      "Razorpay for card, UPI, and netbanking payments",
      "Payment status syncs automatically — no manual checking",
      "Reconciliation report: compare Razorpay vs your orders to spot gaps",
      "Refunds issued from within the platform directly to the customer",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Security & Reliability",
    color: "bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400",
    badge: "Infrastructure",
    badgeVariant: "outline" as const,
    summary: "Built safe and resilient from the ground up.",
    items: [
      "Secure, auto-expiring sessions for all portals",
      "Admin, distributor, and customer portals fully separated",
      "Rate limiting on login and checkout to prevent abuse",
      "Each payment/courier event processed exactly once — no duplicates",
      "Live health check for monitoring tools",
      "All errors auto-reported to Sentry",
    ],
  },
  {
    icon: BarChart3,
    title: "Analytics",
    color: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
    badge: "Insights",
    badgeVariant: "secondary" as const,
    summary: "Every key event logged and ready to pipe into any analytics tool.",
    items: [
      "Events fired for: order placed, paid, shipped, refunded",
      "Connect to Google Analytics, Mixpanel, Segment — one setting, no code",
      "Start measuring conversion and fulfilment from day one",
    ],
  },
];

// ── Order lifecycle steps ─────────────────────────────────────────
const lifecycle = [
  { label: "Payment Pending", desc: "Order placed, awaiting payment", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  { label: "Ordered", desc: "Payment confirmed", color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  { label: "Shipped", desc: "Dispatched via Shiprocket", color: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300" },
  { label: "Delivered", desc: "Received by customer", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  { label: "Refunded", desc: "Money returned", color: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" },
  { label: "Cancelled", desc: "Stock & credit restored", color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
];

// ── Admin actions quick-ref ────────────────────────────────────────
const actions = [
  { action: "Confirm Payment", when: "COD or bank transfer received", result: "Marks order as paid" },
  { action: "Ship", when: "Order is in ORDERED state", result: "Creates Shiprocket shipment" },
  { action: "Mark Delivered", when: "Order is Shipped", result: "Closes fulfilment loop" },
  { action: "Refund", when: "Paid, not yet refunded", result: "Issues refund via Razorpay; restores stock" },
  { action: "Cancel", when: "Before shipping", result: "Restores stock, coupon usage & credit" },
  { action: "Export CSV", when: "Any filtered view", result: "Downloads spreadsheet instantly" },
];

// ── Page ──────────────────────────────────────────────────────────
export default function FeaturesPage() {
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-10 p-8 pt-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Features</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Everything FluidLife can do — at a glance.
          </p>
        </div>

        {/* ── Order lifecycle ─────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Order Lifecycle</h2>
          <div className="flex flex-wrap items-center gap-2">
            {lifecycle.map((step, i) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className={`rounded-lg px-4 py-2 text-center min-w-[120px] ${step.color}`}>
                  <p className="text-sm font-semibold">{step.label}</p>
                  <p className="text-xs opacity-75 mt-0.5">{step.desc}</p>
                </div>
                {i < lifecycle.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* ── Admin quick-ref table ────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Admin Actions — Quick Reference</h2>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Action</th>
                  <th className="text-left px-4 py-2 font-medium">When to use</th>
                  <th className="text-left px-4 py-2 font-medium">What happens</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((row, i) => (
                  <tr key={row.action} className={i % 2 === 0 ? "" : "bg-muted/40"}>
                    <td className="px-4 py-2 font-medium">{row.action}</td>
                    <td className="px-4 py-2 text-muted-foreground">{row.when}</td>
                    <td className="px-4 py-2 text-muted-foreground">{row.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <Separator />

        {/* ── Feature cards grid ──────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold mb-4">All Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <Card key={f.title} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className={`rounded-lg p-2 ${f.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant={f.badgeVariant}>{f.badge}</Badge>
                    </div>
                    <CardTitle className="text-base mt-3">{f.title}</CardTitle>
                    <p className="text-sm text-muted-foreground leading-snug">{f.summary}</p>
                  </CardHeader>
                  <CardContent className="pt-0 flex-1">
                    <ul className="space-y-1.5">
                      {f.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                          <span className="text-muted-foreground leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Footer note */}
        <p className="text-xs text-muted-foreground text-center pb-4">
          FluidLife — production-ready, 134 tests passing. All features are live on this instance.
        </p>

      </div>
    </div>
  );
}
