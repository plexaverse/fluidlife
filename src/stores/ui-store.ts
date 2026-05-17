"use client";

import { create } from "zustand";

/**
 * Ephemeral UI state shared across the storefront — modals, global loading
 * indicator, etc. Anything that should survive a reload belongs in another
 * store with the `persist` middleware.
 */
interface UIState {
  loading: boolean;
  loadingMessage: string;
  loginModalOpen: boolean;
  cartDrawerOpen: boolean;

  startLoading: (message?: string) => void;
  stopLoading: () => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  loading: false,
  loadingMessage: "",
  loginModalOpen: false,
  cartDrawerOpen: false,

  startLoading: (message = "") => set({ loading: true, loadingMessage: message }),
  stopLoading: () => set({ loading: false, loadingMessage: "" }),
  openLoginModal: () => set({ loginModalOpen: true }),
  closeLoginModal: () => set({ loginModalOpen: false }),
  openCartDrawer: () => set({ cartDrawerOpen: true }),
  closeCartDrawer: () => set({ cartDrawerOpen: false }),
}));
