"use client";

import { create } from "zustand";

import { addToWishlist, listWishlist, removeFromWishlist, type WishlistEntry } from "@/services/wishlist";

interface WishlistState {
  entries: WishlistEntry[];
  loaded: boolean;
  loading: boolean;
  /** Track per-product mutations so the heart button can show a pending state */
  pending: Record<string, true>;

  load: () => Promise<void>;
  reset: () => void;
  isInWishlist: (productId: string) => boolean;
  toggle: (productId: string) => Promise<"added" | "removed" | "error">;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  entries: [],
  loaded: false,
  loading: false,
  pending: {},

  load: async () => {
    if (get().loading || get().loaded) return;
    set({ loading: true });
    try {
      const entries = await listWishlist();
      set({ entries, loaded: true, loading: false });
    } catch {
      // Caller-facing error toasts come from the page; here we just unset loading.
      set({ loading: false });
    }
  },

  reset: () => set({ entries: [], loaded: false, loading: false, pending: {} }),

  isInWishlist: (productId) => get().entries.some((e) => e.productId === productId),

  toggle: async (productId) => {
    if (get().pending[productId]) return "error";
    set({ pending: { ...get().pending, [productId]: true } });

    const inList = get().entries.some((e) => e.productId === productId);
    try {
      if (inList) {
        await removeFromWishlist(productId);
        set({
          entries: get().entries.filter((e) => e.productId !== productId),
        });
        return "removed";
      }
      const entry = await addToWishlist(productId);
      // Refetch the entry's product join — addToWishlist returns the raw row
      // without product details, so we reload to get the joined data.
      // (Cheap; the wishlist is small.)
      const fresh = await listWishlist();
      set({ entries: fresh });
      return "added";
    } catch {
      return "error";
    } finally {
      const { [productId]: _, ...rest } = get().pending;
      set({ pending: rest });
    }
  },
}));
