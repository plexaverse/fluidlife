import { format } from "date-fns";

import prismadb from "@/lib/prismadb";
import { formatter } from "@/lib/utils";

import { OrderColumn } from "./components/columns"
import { OrderClient } from "./components/client";

export const dynamic = 'force-dynamic';


const OrdersPage = async () => {
  const orders = await prismadb.order.findMany({
    include: {
      orderItems: {
        include: {
          product: true
        }
      },
      address: true,
      user: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const formattedOrders: OrderColumn[] = orders.map((item) => ({
    id: item.id,
    phone: item.user?.phone || 'Unknown',
    itemAndQuantity: item.orderItems.map((orderItem) => `${orderItem.product.name} - ${orderItem.quantity}`).join(', '),
    address: item.address ? `${item.address.address1}, ${item.address.address2 || ''}, ${item.address.state}, ${item.address.pincode}` : 'N/A',
    products: item.orderItems.map((orderItem) => orderItem.product.name).join(', '),
    totalPrice: formatter.format(Number(item.amount) || item.orderItems.reduce((total, item) => {
      return total + Number(item.product.price)
    }, 0)),
    isPaid: item.isPaid,
    status: item.status,
    paymentType: item.paymentType,
    createdAt: format(item.createdAt, 'MMMM do, yyyy'),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <OrderClient data={formattedOrders} />
      </div>
    </div>
  );
};

export default OrdersPage;
