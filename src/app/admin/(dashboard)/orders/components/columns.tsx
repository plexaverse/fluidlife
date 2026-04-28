"use client";

import { ColumnDef } from "@tanstack/react-table";

import { CellAction } from "./cell-action";

export type OrderColumn = {
  id: string;
  publicOrderId: string;
  phone: string;
  itemAndQuantity: string;
  address: string;
  isPaid: boolean;
  status: string;
  paymentType: string;
  totalPrice: string;
  products: string;
  refundedAt: Date | null;
  createdAt: string;
};

export const columns: ColumnDef<OrderColumn>[] = [
  { accessorKey: "publicOrderId", header: "Order #" },
  { accessorKey: "itemAndQuantity", header: "Products & Quantity" },
  { accessorKey: "phone", header: "Phone" },
  { accessorKey: "address", header: "Address" },
  { accessorKey: "totalPrice", header: "Total" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "paymentType", header: "Payment" },
  { accessorKey: "isPaid", header: "Paid" },
  { accessorKey: "createdAt", header: "Date" },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
