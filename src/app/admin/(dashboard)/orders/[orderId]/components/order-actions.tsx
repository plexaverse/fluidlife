"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { FileText, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RefundModal } from "@/components/models/refund-modal";
import { downloadJson } from "@/lib/download";
import { apiErrorMessage } from "@/lib/utils";

const REFUNDABLE = new Set(["ORDERED", "SHIPPED", "DELIVERED"]);

interface OrderActionsProps {
  orderDbId: string;
  publicOrderId: string;
  totalAmount: number;
  isPaid: boolean;
  status: string;
  alreadyRefunded: boolean;
}

export const OrderActions: React.FC<OrderActionsProps> = ({
  orderDbId,
  publicOrderId,
  totalAmount,
  isPaid,
  status,
  alreadyRefunded,
}) => {
  const router = useRouter();
  const [refundOpen, setRefundOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const onInvoice = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/orders/${orderDbId}/invoice`);
      downloadJson(`invoice-${publicOrderId}`, res.data);
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
      const res = await axios.post(`/api/orders/${orderDbId}/refund`, params);
      toast.success(`Refund issued: ${res.data.refundId}`);
      setRefundOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Refund failed"));
    } finally {
      setLoading(false);
    }
  };

  const canRefund = isPaid && !alreadyRefunded && REFUNDABLE.has(status);
  const canInvoice = status !== "PAYMENT_PENDING" && status !== "CANCELLED";

  return (
    <>
      <RefundModal
        isOpen={refundOpen}
        onClose={() => setRefundOpen(false)}
        onConfirm={onRefund}
        loading={loading}
        orderAmount={totalAmount}
        publicOrderId={publicOrderId}
      />
      <div className="flex gap-2">
        <Button onClick={onInvoice} disabled={!canInvoice || loading} variant="outline">
          <FileText className="mr-2 h-4 w-4" /> Download invoice
        </Button>
        <Button
          onClick={() => setRefundOpen(true)}
          disabled={!canRefund || loading}
          variant="destructive"
        >
          <RotateCcw className="mr-2 h-4 w-4" /> Refund
        </Button>
      </div>
    </>
  );
};
