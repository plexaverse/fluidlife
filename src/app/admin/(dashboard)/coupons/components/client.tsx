"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";

import { CouponColumn, columns } from "./columns";

interface CouponClientProps {
  data: CouponColumn[];
  total: number;
  page: number;
  pageSize: number;
}

export const CouponClient: React.FC<CouponClientProps> = ({
  data,
  total,
  page,
  pageSize,
}) => {
  const router = useRouter();

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Coupons (${total})`}
          description="Manage coupons for your store"
        />
        <Button onClick={() => router.push(`/admin/coupons/new`)}>
          <Plus className="mr-2 h-4 w-4" />
          Add New
        </Button>
      </div>
      <Separator />
      <DataTable searchKey="code" columns={columns} data={data} />
      <Pagination total={total} page={page} pageSize={pageSize} />
    </>
  );
};
