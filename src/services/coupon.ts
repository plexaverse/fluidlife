"use client";

import { safePost } from "./api-client";

export interface ValidateCouponResult {
  valid: boolean;
  /** Server-canonicalised coupon code (uppercased) */
  couponCode?: string;
  discountAmount?: number;
  discountType?: "PERCENTAGE" | "FIXED";
  errorMessage?: string;
}

/**
 * Validate a coupon against an order subtotal. Server is the source of truth —
 * the storefront should NEVER compute discounts client-side.
 */
export async function validateCoupon(code: string, orderTotal: number): Promise<ValidateCouponResult> {
  return safePost<ValidateCouponResult>("/coupon/validate", { code, orderTotal });
}
