"use client";

import { useState } from "react";
import { Check, Loader2, Tag, X } from "lucide-react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiError } from "@/services/api-client";
import { validateCoupon } from "@/services/coupon";
import { useCheckoutStore } from "@/stores/checkout-store";

interface CouponInputProps {
  orderTotal: number;
}

export function CouponInput({ orderTotal }: CouponInputProps) {
  const couponApplied = useCheckoutStore((s) => s.couponApplied);
  const couponCode = useCheckoutStore((s) => s.couponCode);
  const discountAmount = useCheckoutStore((s) => s.discountAmount);
  const apply = useCheckoutStore((s) => s.applyCoupon);
  const remove = useCheckoutStore((s) => s.removeCoupon);

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const onApply = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const res = await validateCoupon(trimmed, orderTotal);
      if (res.valid && res.discountAmount !== undefined) {
        apply(res.couponCode ?? trimmed.toUpperCase(), res.discountAmount);
        toast.success(`Saved ${res.discountAmount.toFixed(2)}`);
        setCode("");
      } else {
        toast.error(res.errorMessage ?? "Invalid coupon");
      }
    } catch (e) {
      toast.error(apiError(e, "Could not validate coupon").message);
    } finally {
      setLoading(false);
    }
  };

  if (couponApplied && couponCode) {
    return (
      <div className="flex items-center justify-between rounded-xl border bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 p-3">
        <div className="flex items-center gap-2 text-sm">
          <Check className="h-4 w-4 text-emerald-600" />
          <span>
            <strong>{couponCode}</strong> applied — saving ₹{discountAmount.toFixed(2)}
          </span>
        </div>
        <button
          type="button"
          onClick={remove}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Remove coupon"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Coupon code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && onApply()}
          disabled={loading}
          className="pl-9"
        />
      </div>
      <Button variant="outline" onClick={onApply} disabled={loading || !code.trim()}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
      </Button>
    </div>
  );
}
