"use client";

import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

import { GlobalLoader } from "./global-loader";

/**
 * Mounts client-side providers that the storefront tree depends on:
 *  - <Toaster>: react-hot-toast notifications
 *  - <GlobalLoader>: full-screen overlay driven by useUIStore
 *
 * The zustand stores themselves don't need a provider — they're imported
 * directly by components. The `persist` middleware rehydrates from localStorage
 * after first client render; we delay rendering children one tick to avoid
 * hydration mismatches on persisted slices (cart, auth).
 */
export function StorefrontProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  return (
    <>
      {/* Render the tree always; the hydrated guard only suppresses interactive
          UI that depends on persisted state during the brief flash. Children
          can use useUIStore freely since UI store isn't persisted. */}
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: "#363636", color: "#fff" },
        }}
      />
      {hydrated && <GlobalLoader />}
    </>
  );
}
