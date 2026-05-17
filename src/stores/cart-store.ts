"use client";

import { v4 as uuid } from "uuid";
import toast from "react-hot-toast";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { CartItem, ProductSummary } from "@/types/storefront";

interface CartState {
  items: CartItem[];
  /** Aggregates kept in state for cheap renders (no useMemo needed). */
  totalItems: number;
  totalAmount: number;
  totalWeight: number;
  pinCode: string;

  /** Direct-buy mode preserves the user's main cart while one item flows through checkout. */
  isDirectBuy: boolean;
  originalCartItems: CartItem[];

  addToCart: (product: ProductSummary, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  setPinCode: (pinCode: string) => void;
  resetPinCode: () => void;
  enterDirectBuy: (product: ProductSummary, quantity?: number) => void;
  exitDirectBuy: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────

function lineTotal(price: string, qty: number): number {
  const n = parseFloat(price);
  return Number.isFinite(n) ? n * qty : 0;
}

function recompute(items: CartItem[]): {
  totalItems: number;
  totalAmount: number;
  totalWeight: number;
} {
  let totalItems = 0;
  let totalAmount = 0;
  let totalWeight = 0;
  for (const it of items) {
    totalItems += it.quantity;
    totalAmount += it.totalPrice;
    totalWeight += (it.product.weight || 0) * it.quantity;
  }
  return { totalItems, totalAmount, totalWeight };
}

// ── Store ───────────────────────────────────────────────────────────

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalAmount: 0,
      totalWeight: 0,
      pinCode: "",
      isDirectBuy: false,
      originalCartItems: [],

      addToCart: (product, quantity = 1) => {
        const items = [...get().items];
        const existing = items.find((i) => i.productId === product.id);
        if (existing) {
          existing.quantity += quantity;
          existing.totalPrice = lineTotal(product.price, existing.quantity);
        } else {
          items.push({
            id: uuid(),
            productId: product.id,
            product,
            quantity,
            totalPrice: lineTotal(product.price, quantity),
            addedAt: new Date().toISOString(),
          });
        }
        set({ items, ...recompute(items) });
        toast.success(`${product.name} added to cart`, { duration: 1400 });
      },

      removeFromCart: (productId) => {
        const items = get()
          .items.map((i) =>
            i.productId === productId ? { ...i, quantity: Math.max(0, i.quantity - 1) } : i
          )
          .filter((i) => i.quantity > 0)
          .map((i) => ({ ...i, totalPrice: lineTotal(i.product.price, i.quantity) }));
        set({ items, ...recompute(items) });
      },

      updateQuantity: (productId, quantity) => {
        const items = get()
          .items.map((i) =>
            i.productId === productId
              ? { ...i, quantity: Math.max(0, quantity), totalPrice: lineTotal(i.product.price, Math.max(0, quantity)) }
              : i
          )
          .filter((i) => i.quantity > 0);
        set({ items, ...recompute(items) });
      },

      clear: () => set({ items: [], totalItems: 0, totalAmount: 0, totalWeight: 0, pinCode: "" }),

      setPinCode: (pinCode) => set({ pinCode }),
      resetPinCode: () => set({ pinCode: "" }),

      enterDirectBuy: (product, quantity = 1) => {
        const current = get();
        if (current.isDirectBuy) return; // already in direct-buy, no-op
        const newItem: CartItem = {
          id: uuid(),
          productId: product.id,
          product,
          quantity,
          totalPrice: lineTotal(product.price, quantity),
          addedAt: new Date().toISOString(),
        };
        const items = [newItem];
        set({
          originalCartItems: [...current.items],
          items,
          isDirectBuy: true,
          ...recompute(items),
        });
      },

      exitDirectBuy: () => {
        const current = get();
        if (!current.isDirectBuy) return;
        const items = [...current.originalCartItems];
        set({
          items,
          originalCartItems: [],
          isDirectBuy: false,
          ...recompute(items),
        });
      },
    }),
    {
      name: "fluidlife.cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        items: s.items,
        totalItems: s.totalItems,
        totalAmount: s.totalAmount,
        totalWeight: s.totalWeight,
        pinCode: s.pinCode,
        isDirectBuy: s.isDirectBuy,
        originalCartItems: s.originalCartItems,
      }),
    }
  )
);
