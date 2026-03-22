"use client"

import { ColumnDef } from "@tanstack/react-table"
import { CellAction } from "./cell-action"
import { Badge } from "@/components/ui/badge"

export type CouponColumn = {
  id: string;
  code: string;
  discountType: string;
  discountValue: string;
  usageCount: number;
  usageLimit: number | string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
}

export const columns: ColumnDef<CouponColumn>[] = [
  {
    accessorKey: "code",
    header: "Code",
  },
  {
    accessorKey: "discountType",
    header: "Type",
  },
  {
    accessorKey: "discountValue",
    header: "Value",
  },
  {
    accessorKey: "usageCount",
    header: "Used",
    cell: ({ row }) => `${row.original.usageCount} / ${row.original.usageLimit}`,
  },
  {
    accessorKey: "validUntil",
    header: "Valid Until",
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? "default" : "destructive"}>
        {row.original.isActive ? "Active" : "Inactive"}
      </Badge>
    )
  },
  {
    accessorKey: "createdAt",
    header: "Created Date",
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />
  },
];
