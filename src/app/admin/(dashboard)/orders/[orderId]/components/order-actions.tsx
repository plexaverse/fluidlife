"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Printer,
  RotateCcw,
  Truck,
  CheckCircle,
  CreditCard,
  XCircle,
  Download,
} from "lucide-react";

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
  paymentType: string;
  alreadyRefunded: boolean;
}

export const OrderActions: React.FC<OrderActionsProps> = ({
  orderDbId,
  publicOrderId,
  totalAmount,
  isPaid,
  status,
  paymentType,
  alreadyRefunded,
}) => {
  const router = useRouter();
  const [refundOpen, setRefundOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const canInvoice = status !== "PAYMENT_PENDING" && status !== "CANCELLED";
  const canRefund = isPaid && !alreadyRefunded && REFUNDABLE.has(status);
  const canShip = status === "ORDERED";
  const canDeliver = status === "SHIPPED";
  const canConfirmPayment =
    !isPaid &&
    (paymentType === "COD" || paymentType === "BANK_TRANSFER") &&
    status !== "CANCELLED" &&
    status !== "REFUNDED";
  const canCancel = status === "PAYMENT_PENDING" || status === "ORDERED";

  const post = async (url: string, label: string) => {
    try {
      setLoading(true);
      await axios.post(url);
      toast.success(`${label} successful`);
      router.refresh();
    } catch (error) {
      toast.error(apiErrorMessage(error, `${label} failed`));
    } finally {
      setLoading(false);
    }
  };

  const onInvoiceJson = async () => {
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

  const onCancel = async () => {
    if (!confirm(`Cancel order ${publicOrderId}? This will restore stock and cannot be undone.`)) return;
    try {
      setLoading(true);
      await axios.put(`/api/orders/cancel/${orderDbId}`);
      toast.success("Order cancelled");
      router.refresh();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Cancel failed"));
    } finally {
      setLoading(false);
    }
  };

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
      <div className="flex flex-wrap gap-2">
        {/* Invoice actions */}
        <Button onClick={onInvoiceJson} disabled={!canInvoice || loading} variant="outline" size="sm">
          <FileText className="mr-2 h-4 w-4" /> Invoice JSON
        </Button>
        <Button asChild disabled={!canInvoice} variant="outline" size="sm">
          <Link href={canInvoice ? `/admin/orders/${orderDbId}/invoice` : "#"} target="_blank">
            <Printer className="mr-2 h-4 w-4" /> Print
          </Link>
        </Button>
        <Button asChild disabled={!canInvoice} variant="outline" size="sm">
          <a href={canInvoice ? `/api/orders/${orderDbId}/invoice/pdf` : "#"} download>
            <Download className="mr-2 h-4 w-4" /> PDF
          </a>
        </Button>

        {/* Lifecycle transitions */}
        {canConfirmPayment && (
          <Button
            onClick={() => post(`/api/admin/orders/${orderDbId}/confirm-payment`, "Payment confirmed")}
            disabled={loading}
            variant="secondary"
            size="sm"
          >
            <CreditCard className="mr-2 h-4 w-4" /> Confirm payment
          </Button>
        )}
        {canShip && (
          <Button
            onClick={() => post(`/api/admin/orders/${orderDbId}/ship`, "Order shipped")}
            disabled={loading}
            variant="secondary"
            size="sm"
          >
            <Truck className="mr-2 h-4 w-4" /> Ship
          </Button>
        )}
        {canDeliver && (
          <Button
            onClick={() => post(`/api/admin/orders/${orderDbId}/deliver`, "Order delivered")}
            disabled={loading}
            variant="secondary"
            size="sm"
          >
            <CheckCircle className="mr-2 h-4 w-4" /> Mark delivered
          </Button>
        )}
        {canRefund && (
          <Button
            onClick={() => setRefundOpen(true)}
            disabled={loading}
            variant="destructive"
            size="sm"
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Refund
          </Button>
        )}
        {canCancel && (
          <Button onClick={onCancel} disabled={loading} variant="outline" size="sm">
            <XCircle className="mr-2 h-4 w-4" /> Cancel
          </Button>
        )}
      </div>
    </>
  );
};
