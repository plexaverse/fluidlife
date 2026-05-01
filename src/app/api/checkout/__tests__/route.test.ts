import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/ratelimit", () => ({
  enforceRateLimit: vi.fn().mockResolvedValue(null),
  rateLimits: { checkout: vi.fn().mockReturnValue(null) },
}));

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn().mockResolvedValue({
    userId: "user-1",
    phone: "9999999999",
    role: "CUSTOMER",
  }),
  isResponse: (x: unknown) =>
    !!x && typeof x === "object" && "status" in (x as any) && typeof (x as any).status === "number",
}));

vi.mock("@/lib/prismadb", () => {
  const order = { findUnique: vi.fn(), create: vi.fn() };
  const address = { findUnique: vi.fn() };
  const product = { findMany: vi.fn(), updateMany: vi.fn() };
  const coupon = { findUnique: vi.fn(), updateMany: vi.fn(), update: vi.fn() };
  const user = { findUnique: vi.fn(), update: vi.fn() };
  return {
    default: {
      order,
      address,
      product,
      coupon,
      user,
      $transaction: vi.fn(async (cb: any) => cb({ order, address, product, coupon, user })),
    },
  };
});

import prismadb from "@/lib/prismadb";
import { POST } from "@/app/api/checkout/route";

const mocked = prismadb as unknown as {
  order: { findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  address: { findUnique: ReturnType<typeof vi.fn> };
  product: { findMany: ReturnType<typeof vi.fn>; updateMany: ReturnType<typeof vi.fn> };
  coupon: {
    findUnique: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  user: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  $transaction: ReturnType<typeof vi.fn>;
};

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/checkout", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer fake-token" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  addressId: "addr-1",
  paymentType: "PREPAID",
  items: [{ productId: "prod-1", quantity: 2 }],
};

const approvedCustomer = {
  role: "CUSTOMER",
  isApproved: true,
  creditLimit: null,
  creditUsed: "0",
};

const productRow = {
  id: "prod-1",
  price: "100",
  b2bPrice: null,
  moq: 1,
  stock: 10,
  gstRate: "18",
  hsnCode: "1234",
  deliveryPrice: "0",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/checkout", () => {
  it("happy path: creates an order with stock decrement + tax breakup", async () => {
    mocked.order.findUnique.mockResolvedValue(null);
    mocked.user.findUnique.mockResolvedValue(approvedCustomer);
    mocked.address.findUnique.mockResolvedValue({ userId: "user-1", state: "Karnataka" });
    mocked.product.findMany.mockResolvedValue([productRow]);
    mocked.product.updateMany.mockResolvedValue({ count: 1 });
    mocked.order.create.mockImplementation(async (args: any) => ({
      id: "order-1",
      userId: "user-1",
      orderId: "ORD-XXX",
      ...args.data,
      orderItems: [{ productId: "prod-1", quantity: 2, priceAtPurchase: "100" }],
    }));

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe("order-1");

    expect(mocked.product.updateMany).toHaveBeenCalledWith({
      where: { id: "prod-1", stock: { gte: 2 } },
      data: { stock: { decrement: 2 } },
    });
    expect(mocked.order.create).toHaveBeenCalledOnce();
    const createArgs = mocked.order.create.mock.calls[0][0];
    expect(createArgs.data).toMatchObject({
      paymentType: "PREPAID",
      status: "PAYMENT_PENDING",
    });
    expect(createArgs.data.taxBreakup).toBeDefined();
    expect(createArgs.data.subtotalAmount).toBeDefined();
    expect(createArgs.data.taxAmount).toBeDefined();
    expect(createArgs.data.paymentExpiresAt).toBeInstanceOf(Date);
  });

  it("idempotency replay: existing order returned without re-creating", async () => {
    const existing = {
      id: "order-1",
      userId: "user-1",
      orderId: "ORD-EXISTING",
      orderItems: [],
    };
    mocked.order.findUnique.mockResolvedValueOnce(existing);

    const res = await POST(makeRequest({ ...validBody, idempotencyKey: "abcdef1234567890" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe("order-1");

    expect(mocked.$transaction).not.toHaveBeenCalled();
    expect(mocked.product.updateMany).not.toHaveBeenCalled();
    expect(mocked.order.create).not.toHaveBeenCalled();
  });

  it("insufficient stock: 409 + no order created", async () => {
    mocked.order.findUnique.mockResolvedValue(null);
    mocked.user.findUnique.mockResolvedValue(approvedCustomer);
    mocked.address.findUnique.mockResolvedValue({ userId: "user-1", state: "Karnataka" });
    mocked.product.findMany.mockResolvedValue([{ ...productRow, stock: 1 }]);
    mocked.product.updateMany.mockResolvedValue({ count: 0 });

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error.code).toBe("CONFLICT");
    expect(mocked.order.create).not.toHaveBeenCalled();
  });

  it("unapproved distributor: 403 + no transaction", async () => {
    const { requireUser } = await import("@/lib/auth");
    (requireUser as any).mockResolvedValueOnce({
      userId: "user-1",
      phone: "9999999999",
      role: "DISTRIBUTOR",
    });
    mocked.order.findUnique.mockResolvedValue(null);
    mocked.user.findUnique.mockResolvedValue({
      role: "DISTRIBUTOR",
      isApproved: false,
      creditLimit: null,
      creditUsed: "0",
    });

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error.code).toBe("FORBIDDEN");
    expect(mocked.order.create).not.toHaveBeenCalled();
  });
});
