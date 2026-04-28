"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";

export type UserColumn = {
  id: string;
  phone: string;
  name: string;
  email: string;
  role: string;
  companyName: string;
  isApproved: boolean;
  creditLimit: number | null;
  creditUsed: number;
  createdAt: string;
};

export const columns: ColumnDef<UserColumn>[] = [
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <Link href={`/admin/users/${row.original.id}`} className="font-medium hover:underline">
        {row.original.phone}
      </Link>
    ),
  },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => <Badge variant={row.original.role === "ADMIN" ? "destructive" : "secondary"}>{row.original.role}</Badge>,
  },
  { accessorKey: "companyName", header: "Company" },
  {
    accessorKey: "isApproved",
    header: "Approved",
    cell: ({ row }) =>
      row.original.role === "DISTRIBUTOR" ? (
        <Badge variant={row.original.isApproved ? "default" : "outline"}>
          {row.original.isApproved ? "Yes" : "Pending"}
        </Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: "creditLimit",
    header: "Credit",
    cell: ({ row }) =>
      row.original.creditLimit !== null
        ? `₹${row.original.creditUsed.toFixed(0)} / ₹${row.original.creditLimit.toFixed(0)}`
        : "—",
  },
  { accessorKey: "createdAt", header: "Joined" },
];
