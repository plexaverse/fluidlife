"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { columns, OrderColumn } from "./columns";

interface OrderClientProps {
  data: OrderColumn[];
  total: number;
  page: number;
  pageSize: number;
  filters: { status?: string; paymentType?: string; from?: string; to?: string };
}

export const OrderClient: React.FC<OrderClientProps> = ({
  data,
  total,
  page,
  pageSize,
  filters,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [from, setFrom] = useState(filters.from ?? "");
  const [to, setTo] = useState(filters.to ?? "");

  const update = (next: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === "" || v === "all") params.delete(k);
      else params.set(k, v);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const filtersActive = !!(filters.status || filters.paymentType || filters.from || filters.to);

  return (
    <>
      <Heading title={`Orders (${total})`} description="Manage orders for your store" />
      <Separator />

      <div className="flex flex-wrap items-end gap-2">
        <Select value={filters.status ?? "all"} onValueChange={(v) => update({ status: v })}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="PAYMENT_PENDING">Payment pending</SelectItem>
            <SelectItem value="ORDERED">Ordered</SelectItem>
            <SelectItem value="SHIPPED">Shipped</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.paymentType ?? "all"}
          onValueChange={(v) => update({ paymentType: v })}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payments</SelectItem>
            <SelectItem value="PREPAID">Prepaid</SelectItem>
            <SelectItem value="COD">COD</SelectItem>
            <SelectItem value="UPI">UPI</SelectItem>
            <SelectItem value="BANK_TRANSFER">Bank transfer</SelectItem>
          </SelectContent>
        </Select>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">From</label>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">To</label>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-40"
          />
        </div>

        <Button
          variant="outline"
          onClick={() => update({ from: from || undefined, to: to || undefined })}
        >
          Apply dates
        </Button>
        {filtersActive && (
          <Button
            variant="ghost"
            onClick={() => {
              setFrom("");
              setTo("");
              router.push(pathname);
            }}
          >
            Clear all
          </Button>
        )}
      </div>

      <DataTable columns={columns} data={data} hidePagination />
      <Pagination total={total} page={page} pageSize={pageSize} />
    </>
  );
};
