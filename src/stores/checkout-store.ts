"use client";

import { create } from "zustand";

import type {
  CheckoutAddressInput,
  CheckoutInfo,
  CheckoutStep,
  PaymentMethod,
} from "@/types/storefront";

interface CheckoutState {
  step: CheckoutStep;
  info: CheckoutInfo;
  address: CheckoutAddressInput;
  paymentMethod: PaymentMethod | null;
  loading: boolean;

  /** Server-validated coupon. Set via /api/coupon/validate before checkout submit. */
  couponCode: string | null;
  couponApplied: boolean;
  couponError: string | null;
  discountAmount: number;
  couponLoading: boolean;

  setStep: (s: CheckoutStep) => void;
  setInfo: (info: CheckoutInfo) => void;
  setAddress: (a: CheckoutAddressInput) => void;
  setPaymentMethod: (p: PaymentMethod) => void;
  setLoading: (l: boolean) => void;
  applyCoupon: (code: string, discountAmount: number) => void;
  removeCoupon: () => void;
  setCouponError: (msg: string) => void;
  setCouponLoading: (l: boolean) => void;
  reset: () => void;
}

const empty: Omit<
  CheckoutState,
  | "setStep"
  | "setInfo"
  | "setAddress"
  | "setPaymentMethod"
  | "setLoading"
  | "applyCoupon"
  | "removeCoupon"
  | "setCouponError"
  | "setCouponLoading"
  | "reset"
> = {
  step: "info",
  info: { name: "", phone: "", email: "" },
  address: { pinCode: "", address1: "", address2: "", landmark: "", state: "" },
  paymentMethod: null,
  loading: false,
  couponCode: null,
  couponApplied: false,
  couponError: null,
  discountAmount: 0,
  couponLoading: false,
};

// Checkout state is ephemeral — intentionally not persisted. Reload mid-checkout
// returns the user to step 1, which is the right UX anyway.
export const useCheckoutStore = create<CheckoutState>((set) => ({
  ...empty,
  setStep: (step) => set({ step }),
  setInfo: (info) => set({ info }),
  setAddress: (address) => set({ address }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setLoading: (loading) => set({ loading }),
  applyCoupon: (couponCode, discountAmount) =>
    set({ couponCode, couponApplied: true, couponError: null, discountAmount }),
  removeCoupon: () =>
    set({ couponCode: null, couponApplied: false, couponError: null, discountAmount: 0 }),
  setCouponError: (couponError) =>
    set({ couponError, couponApplied: false, discountAmount: 0 }),
  setCouponLoading: (couponLoading) => set({ couponLoading }),
  reset: () => set(empty),
}));
