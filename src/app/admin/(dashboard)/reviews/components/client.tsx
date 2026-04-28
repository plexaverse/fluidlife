"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

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

import { columns, ReviewColumn } from "./columns";

interface ReviewsClientProps {
  data: ReviewColumn[];
  total: number;
  page: number;
  pageSize: number;
  filters: { productId?: string; rating?: string };
}

export const ReviewsClient: React.FC<ReviewsClientProps> = ({
  data,
  total,
  page,
  pageSize,
  filters,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [productId, setProductId] = useState(filters.productId ?? "");

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

  const filtersActive = !!(filters.productId || filters.rating);

  return (
    <>
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Product ID</label>
          <Input
            placeholder="paste product id…"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") update({ productId: productId || undefined });
            }}
            className="w-72"
          />
        </div>
        <Select value={filters.rating ?? "all"} onValueChange={(v) => update({ rating: v })}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ratings</SelectItem>
            <SelectItem value="5">5 stars</SelectItem>
            <SelectItem value="4">4 stars</SelectItem>
            <SelectItem value="3">3 stars</SelectItem>
            <SelectItem value="2">2 stars</SelectItem>
            <SelectItem value="1">1 star</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => update({ productId: productId || undefined })}>
          Apply
        </Button>
        {filtersActive && (
          <Button
            variant="ghost"
            onClick={() => {
              setProductId("");
              router.push(pathname);
            }}
          >
            Clear
          </Button>
        )}
      </div>

      <DataTable searchKey="comment" columns={columns} data={data} />
      <Pagination total={total} page={page} pageSize={pageSize} />
    </>
  );
};
