"use client";

import { useEffect, useState } from "react";

import { Modal } from "@/components/ui/model";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (params: { amount?: number; reason?: string }) => void;
  loading: boolean;
  orderAmount: number;
  publicOrderId: string;
}

export const RefundModal: React.FC<RefundModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  orderAmount,
  publicOrderId,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [mode, setMode] = useState<"full" | "partial">("full");
  const [amount, setAmount] = useState<string>(String(orderAmount));
  const [reason, setReason] = useState<string>("");

  useEffect(() => setIsMounted(true), []);
  useEffect(() => {
    if (isOpen) {
      setMode("full");
      setAmount(String(orderAmount));
      setReason("");
    }
  }, [isOpen, orderAmount]);

  if (!isMounted) return null;

  const submit = () => {
    if (mode === "full") {
      onConfirm({ reason: reason || undefined });
    } else {
      const n = Number(amount);
      if (!Number.isFinite(n) || n <= 0 || n > orderAmount) return;
      onConfirm({ amount: n, reason: reason || undefined });
    }
  };

  const partialInvalid = mode === "partial" && (() => {
    const n = Number(amount);
    return !Number.isFinite(n) || n <= 0 || n > orderAmount;
  })();

  return (
    <Modal
      title={`Refund order ${publicOrderId}`}
      description="Issues a Razorpay refund and restores stock atomically. Cannot be reversed."
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="space-y-4 pt-2">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === "full" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("full")}
            disabled={loading}
          >
            Full refund (₹{orderAmount.toFixed(2)})
          </Button>
          <Button
            type="button"
            variant={mode === "partial" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("partial")}
            disabled={loading}
          >
            Partial
          </Button>
        </div>

        {mode === "partial" && (
          <div className="space-y-1">
            <Label htmlFor="refund-amount">Amount (₹)</Label>
            <Input
              id="refund-amount"
              type="number"
              step="0.01"
              min={0.01}
              max={orderAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
            />
            {partialInvalid && (
              <p className="text-xs text-destructive">Must be between 0.01 and {orderAmount.toFixed(2)}</p>
            )}
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="refund-reason">Reason (optional)</Label>
          <Input
            id="refund-reason"
            placeholder="e.g. customer request, defective item"
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 200))}
            disabled={loading}
          />
        </div>
      </div>

      <div className="pt-6 space-x-2 flex items-center justify-end w-full">
        <Button disabled={loading} variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={loading || partialInvalid} variant="destructive" onClick={submit}>
          Issue refund
        </Button>
      </div>
    </Modal>
  );
};
