import { format } from "date-fns";

import prismadb from "@/lib/prismadb";
import { formatter } from "@/lib/utils";

import { OrderColumn } from "./components/columns";
import { OrderClient } from "./components/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

const OrdersPage = async ({ searchParams }: PageProps) => {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [orders, total] = await Promise.all([
    prismadb.order.findMany({
      where: { deletedAt: null },
      include: {
        orderItems: { include: { product: true } },
        address: true,
        user: true,
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip,
    }),
    prismadb.order.count({ where: { deletedAt: null } }),
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
        <OrderClient data={formattedOrders} total={total} page={page} pageSize={PAGE_SIZE} />
      </div>
    </div>
  );
};

export default OrdersPage;
