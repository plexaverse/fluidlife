import { redirect } from "next/navigation";
import Link from "next/link";
import { getDistributorSession } from "@/lib/distributor-auth";
import prismadb from "@/lib/prismadb";
import { formatter } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const STATUS_LABEL: Record<string, string> = {
  PAYMENT_PENDING: "Pending payment",
  ORDERED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PAYMENT_PENDING: "secondary",
  ORDERED: "default",
  SHIPPED: "default",
  DELIVERED: "outline",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
};

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

const PAGE_SIZE = 20;

export default async function DistributorOrders({ searchParams }: PageProps) {
  const session = await getDistributorSession();
  if (!session) redirect("/distributor/login");

  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);

  const [orders, total] = await Promise.all([
    prismadb.order.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        orderId: true,
        status: true,
        amount: true,
        paymentType: true,
        createdAt: true,
        isPaid: true,
      },
    }),
    prismadb.order.count({ where: { userId: session.userId } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Orders</h1>

      {orders.length === 0 ? (
        <p className="text-gray-500">No orders yet.</p>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 dark:bg-neutral-800">
              <tr>
                {["Order ID", "Date", "Status", "Payment", "Total"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600 dark:text-neutral-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/distributor/orders/${o.id}`}
                      className="font-mono text-blue-600 hover:underline"
                    >
                      {o.orderId}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(o.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[o.status] ?? "secondary"}>
                      {STATUS_LABEL[o.status] ?? o.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{o.paymentType}</td>
                  <td className="px-4 py-3 font-medium tabular-nums">{formatter.format(Number(o.amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/distributor/orders?page=${page - 1}`}
                className="px-3 py-1 border rounded hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/distributor/orders?page=${page + 1}`}
                className="px-3 py-1 border rounded hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
