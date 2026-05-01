import { format } from "date-fns";

import prismadb from "@/lib/prismadb";
import { formatter } from "@/lib/utils";

import { OrderColumn } from "./components/columns";
import { OrderClient } from "./components/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const STATUS_VALUES = new Set([
  "PAYMENT_PENDING",
  "ORDERED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
]);
const PAYMENT_VALUES = new Set(["PREPAID", "COD", "UPI", "BANK_TRANSFER"]);

interface PageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    paymentType?: string;
    from?: string; // YYYY-MM-DD
    to?: string;
    q?: string;   // orderId or customer phone search
  }>;
}

const OrdersPage = async ({ searchParams }: PageProps) => {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;
  const q = sp.q?.trim() ?? "";

  const where: any = { deletedAt: null };
  if (sp.status && STATUS_VALUES.has(sp.status)) where.status = sp.status;
  if (sp.paymentType && PAYMENT_VALUES.has(sp.paymentType)) where.paymentType = sp.paymentType;
  if (sp.from || sp.to) {
    where.createdAt = {};
    if (sp.from) where.createdAt.gte = new Date(`${sp.from}T00:00:00`);
    if (sp.to) where.createdAt.lte = new Date(`${sp.to}T23:59:59`);
  }
  if (q) {
    where.OR = [
      { orderId: { contains: q, mode: "insensitive" } },
      { user: { phone: { contains: q } } },
      { user: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [orders, total] = await Promise.all([
    prismadb.order.findMany({
      where,
      include: {
        orderItems: { include: { product: true } },
        address: true,
        user: true,
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip,
    }),
    prismadb.order.count({ where }),
  ]);

  const formattedOrders: OrderColumn[] = orders.map((item) => ({
    id: item.id,
    publicOrderId: item.orderId,
    phone: item.user?.phone || "Unknown",
    itemAndQuantity: item.orderItems
      .map((oi) => `${oi.product.name} - ${oi.quantity}`)
      .join(", "),
    address: item.address
      ? `${item.address.address1}, ${item.address.address2 || ""}, ${item.address.state}, ${item.address.pincode}`
      : "N/A",
    products: item.orderItems.map((oi) => oi.product.name).join(", "),
    totalPrice: formatter.format(Number(item.amount) || 0),
    isPaid: item.isPaid,
    status: item.status,
    paymentType: item.paymentType,
    refundedAt: item.refundedAt,
    createdAt: format(item.createdAt, "MMMM do, yyyy"),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <OrderClient
          data={formattedOrders}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          filters={{ status: sp.status, paymentType: sp.paymentType, from: sp.from, to: sp.to, q: sp.q }}
        />
      </div>
    </div>
  );
};

export default OrdersPage;
