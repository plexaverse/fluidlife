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

import { columns, UserColumn } from "./columns";

interface UsersClientProps {
  data: UserColumn[];
  total: number;
  page: number;
  pageSize: number;
  filters: { role?: string; isApproved?: string; q?: string };
}

export const UsersClient: React.FC<UsersClientProps> = ({
  data,
  total,
  page,
  pageSize,
  filters,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(filters.q ?? "");

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

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading title={`Users (${total})`} description="Manage customers, distributors, and admins" />
      </div>
      <Separator />

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search phone, name, email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") update({ q: q || undefined });
          }}
          className="max-w-xs"
        />
        <Select value={filters.role ?? "all"} onValueChange={(v) => update({ role: v })}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="CUSTOMER">Customer</SelectItem>
            <SelectItem value="DISTRIBUTOR">Distributor</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.isApproved ?? "all"} onValueChange={(v) => update({ isApproved: v })}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Approval" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All approvals</SelectItem>
            <SelectItem value="true">Approved</SelectItem>
            <SelectItem value="false">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => update({ q: q || undefined })}>
          Apply
        </Button>
        {(filters.role || filters.isApproved || filters.q) && (
          <Button
            variant="ghost"
            onClick={() => {
              setQ("");
              router.push(pathname);
            }}
          >
            Clear
          </Button>
        )}
      </div>

      <DataTable searchKey="email" columns={columns} data={data} />
      <Pagination total={total} page={page} pageSize={pageSize} />
    </>
  );
};
