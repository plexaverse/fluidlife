"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { ApiList } from "@/components/ui/api-list";
import { Pagination } from "@/components/ui/pagination";

import { columns, ProductColumn } from "./columns";

interface ProductsClientProps {
  data: ProductColumn[];
  total: number;
  page: number;
  pageSize: number;
}

export const ProductsClient: React.FC<ProductsClientProps> = ({
  data,
  total,
  page,
  pageSize,
}) => {
  const router = useRouter();

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading title={`Products (${total})`} description="Manage products for your store" />
        <Button onClick={() => router.push(`/admin/products/new`)}>
          <Plus className="mr-2 h-4 w-4" /> Add New
        </Button>
      </div>
      <Separator />
      <DataTable searchKey="name" columns={columns} data={data} />
      <Pagination total={total} page={page} pageSize={pageSize} />
      <Heading title="API" description="API Calls for Products" />
      <Separator />
      <ApiList entityName="products" entityIdName="productId" />
    </>
  );
};
