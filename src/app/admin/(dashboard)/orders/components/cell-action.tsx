"use client";

import axios from "axios";
import { useState } from "react";
import { Copy, Eye, FileText, MoreHorizontal, RotateCcw } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiErrorMessage } from "@/lib/utils";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RefundModal } from "@/components/models/refund-modal";
import { downloadJson } from "@/lib/download";

import { OrderColumn } from "./columns";

const REFUNDABLE = new Set(["ORDERED", "SHIPPED", "DELIVERED"]);

interface CellActionProps {
  data: OrderColumn;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const [refundOpen, setRefundOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const onCopyId = () => {
    navigator.clipboard.writeText(data.publicOrderId);
    toast.success("Order # copied");
  };

  const onView = () => router.push(`/admin/orders/${data.id}`);

  const onInvoice = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/orders/${data.id}/invoice`);
      downloadJson(`invoice-${data.publicOrderId}`, res.data);
      toast.success("Invoice downloaded");
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not generate invoice"));
    } finally {
      setLoading(false);
    }
  };

  const onRefund = async (params: { amount?: number; reason?: string }) => {
    try {
      setLoading(true);
      const res = await axios.post(`/api/orders/${data.id}/refund`, params);
      toast.success(`Refund issued: ${res.data.refundId}`);
      setRefundOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Refund failed"));
    } finally {
      setLoading(false);
    }
  };

  // Pull a numeric amount out of the formatted total like "₹1,234.56" / "$1,234.56".
  const numericAmount = Number(data.totalPrice.replace(/[^0-9.-]/g, "")) || 0;
  const canRefund = data.isPaid && !data.refundedAt && REFUNDABLE.has(data.status);
  const canInvoice = data.status !== "PAYMENT_PENDING" && data.status !== "CANCELLED";

  return (
    <>
      <RefundModal
        isOpen={refundOpen}
        onClose={() => setRefundOpen(false)}
        onConfirm={onRefund}
        loading={loading}
        orderAmount={numericAmount}
        publicOrderId={data.publicOrderId}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={onView}>
            <Eye className="mr-2 h-4 w-4" /> View detail
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onCopyId}>
            <Copy className="mr-2 h-4 w-4" /> Copy order #
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onInvoice}
            disabled={!canInvoice || loading}
          >
            <FileText className="mr-2 h-4 w-4" /> Download invoice
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setRefundOpen(true)}
            disabled={!canRefund || loading}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Refund
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
