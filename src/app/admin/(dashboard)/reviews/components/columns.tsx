"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { Star } from "lucide-react";

import { CellAction } from "./cell-action";

export type ReviewColumn = {
  id: string;
  productId: string;
  productName: string;
  rating: number;
  comment: string;
  customerName: string;
  customerPhone: string;
  userId: string | null;
  createdAt: string;
};

const Stars = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        className={`h-4 w-4 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`}
      />
    ))}
    <span className="text-xs text-muted-foreground ml-1 tabular-nums">{rating}/5</span>
  </div>
);

export const columns: ColumnDef<ReviewColumn>[] = [
  {
    accessorKey: "productName",
    header: "Product",
    cell: ({ row }) => (
      <Link href={`/admin/products/${row.original.productId}`} className="font-medium hover:underline">
        {row.original.productName}
      </Link>
    ),
  },
  {
    accessorKey: "rating",
    header: "Rating",
    cell: ({ row }) => <Stars rating={row.original.rating} />,
  },
  {
    accessorKey: "comment",
    header: "Comment",
    cell: ({ row }) => (
      <p className="max-w-md truncate" title={row.original.comment}>
        {row.original.comment || <span className="text-muted-foreground italic">no text</span>}
      </p>
    ),
  },
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) =>
      row.original.userId ? (
        <Link href={`/admin/users/${row.original.userId}`} className="hover:underline">
          {row.original.customerName}
        </Link>
      ) : (
        <span className="text-muted-foreground">{row.original.customerName}</span>
      ),
  },
  { accessorKey: "createdAt", header: "Date" },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
