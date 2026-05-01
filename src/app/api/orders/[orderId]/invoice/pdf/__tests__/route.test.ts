import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/pdf-invoice", () => ({
  renderInvoicePdf: vi.fn(),
}));
vi.mock("@/lib/invoice", () => ({
  ensureInvoiceNumber: vi.fn().mockResolvedValue("INV-2026-05-0001"),
  buildInvoicePayload: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({
  requireAdminOrSelf: vi.fn().mockResolvedValue({ kind: "admin" }),
  isResponse: (x: unknown) =>
    !!x && typeof x === "object" && "status" in (x as any) && typeof (x as any).status === "number",
}));
vi.mock("@/lib/prismadb", () => ({
  default: { order: { findUnique: vi.fn() } },
}));

import prismadb from "@/lib/prismadb";
import { renderInvoicePdf } from "@/lib/pdf-invoice";
import { buildInvoicePayload } from "@/lib/invoice";
import { requireAdminOrSelf } from "@/lib/auth";
import { GET } from "@/app/api/orders/[orderId]/invoice/pdf/route";

const db = prismadb as any;
const mockRender = renderInvoicePdf as ReturnType<typeof vi.fn>;
const mockBuildPayload = buildInvoicePayload as ReturnType<typeof vi.fn>;
const mockRequireAdminOrSelf = requireAdminOrSelf as ReturnType<typeof vi.fn>;

const mockOrder = {
  id: "order-db-1",
  orderId: "ORD-TEST1",
  userId: "user-1",
  status: "DELIVERED",
  isPaid: true,
  paymentType: "PREPAID",
};

const mockPayload = {
  invoice: { number: "INV-2026-05-0001", issuedAt: new Date(), orderId: "ORD-TEST1", paymentType: "PREPAID" },
  seller: {},
  buyer: { name: "Test", email: "t@t.com", phone: "9999999999", address: {} },
  items: [],
  totals: { subtotal: "100", discount: "0", delivery: "0", tax: "0", grandTotal: "100", coupon: null },
  taxBreakup: null,
};

const params = { params: Promise.resolve({ orderId: "order-db-1" }) };

function makeReq() {
  return new Request("http://localhost/api/orders/order-db-1/invoice/pdf");
}

beforeEach(() => {
  vi.clearAllMocks();
  db.order.findUnique.mockResolvedValue(mockOrder);
  mockBuildPayload.mockResolvedValue(mockPayload);
  mockRender.mockResolvedValue(Buffer.from("fake-pdf-bytes"));
  process.env.TWO_FACTOR_AUTH_KEY = "key";
  process.env.TWO_FACTOR_BASE_URL = "https://2factor.in";
});

describe("GET /api/orders/[orderId]/invoice/pdf", () => {
  it("returns 401 when not authorized", async () => {
    mockRequireAdminOrSelf.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { code: "UNAUTHORIZED" } }), { status: 401 })
    );
    const res = await GET(makeReq(), params);
    expect(res.status).toBe(401);
  });

  it("returns 404 when order not found", async () => {
    db.order.findUnique.mockResolvedValue(null);
    const res = await GET(makeReq(), params);
    expect(res.status).toBe(404);
  });

  it("returns 409 when order status is not invoiceable", async () => {
    db.order.findUnique.mockResolvedValue({ ...mockOrder, status: "PAYMENT_PENDING" });
    const res = await GET(makeReq(), params);
    expect(res.status).toBe(409);
  });

  it("returns 409 for unpaid PREPAID order", async () => {
    db.order.findUnique.mockResolvedValue({ ...mockOrder, isPaid: false });
    const res = await GET(makeReq(), params);
    expect(res.status).toBe(409);
  });

  it("happy path: returns PDF with correct headers", async () => {
    const res = await GET(makeReq(), params);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toContain("ORD-TEST1.pdf");
    expect(mockRender).toHaveBeenCalledWith(mockPayload);
  });

  it("COD order does not require isPaid", async () => {
    db.order.findUnique.mockResolvedValue({ ...mockOrder, paymentType: "COD", isPaid: false });
    const res = await GET(makeReq(), params);
    expect(res.status).toBe(200);
  });
});
