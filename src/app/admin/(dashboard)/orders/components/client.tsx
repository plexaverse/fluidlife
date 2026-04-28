"use client";

import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";

import { columns, OrderColumn } from "./columns";

interface OrderClientProps {
  data: OrderColumn[];
  total: number;
  page: number;
  pageSize: number;
}

export const OrderClient: React.FC<OrderClientProps> = ({
  data,
  total,
  page,
  pageSize,
}) => {
  return (
    <>
      <Heading title={`Orders (${total})`} description="Manage orders for your store" />
      <Separator />
      <DataTable searchKey="products" columns={columns} data={data} />
      <Pagination total={total} page={page} pageSize={pageSize} />
    </>
  );
};
