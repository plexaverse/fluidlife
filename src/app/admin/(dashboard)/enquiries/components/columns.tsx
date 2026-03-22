"use client"

import { ColumnDef } from "@tanstack/react-table"
import { CellAction } from "./cell-action"
import { Badge } from "@/components/ui/badge"

export type EnquiryColumn = {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  status: string;
  createdAt: string;
}

export const columns: ColumnDef<EnquiryColumn>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "companyName",
    header: "Company",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const variant = status === 'RESOLVED' ? "default" : status === 'REVIEWED' ? "secondary" : "destructive";
      return (
        <Badge variant={variant}>
          {status}
        </Badge>
      )
    }
  },
  {
    accessorKey: "createdAt",
    header: "Date",
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />
  },
];
