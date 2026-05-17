"use client";

import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

import { useAuthStore, isTokenValid } from "@/stores/auth-store";
import { useWishlistStore } from "@/stores/wishlist-store";

import { CartDrawer } from "./cart-drawer";
import { ForceLightTheme } from "./force-light-theme";
import { GlobalLoader } from "./global-loader";
import { LoginModal } from "./login-modal";

/**
 * Mounts client-side providers that the storefront tree depends on:
 *  - <Toaster>: react-hot-toast notifications
 *  - <GlobalLoader>: full-screen overlay driven by useUIStore
 *  - <LoginModal> + <CartDrawer>: globally-available modals
 *
 * Also auto-clears the persisted auth slice if the access token has expired
 * past its refreshToken window — keeps the navbar from showing a stale
 * authenticated state.
 *
 * The zustand stores themselves don't need a provider — they're imported
 * directly by components. The `persist` middleware rehydrates from localStorage
 * after first client render; the `hydrated` guard delays the modals one tick
 * to avoid hydration mismatches on persisted slices.
 */
export function StorefrontProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    setHydrated(true);

    // On first mount, if the persisted token is past its lifetime AND we have
    // no refresh token, clear stale auth state. (If we have a refresh token,
    // the api-client interceptor will refresh on the next 401.)
    const s = useAuthStore.getState();
    if (s.isAuthenticated && !isTokenValid(s) && !s.refreshToken) {
      s.logout();
    }
  }, []);

  // Hydrate the wishlist when authenticated; reset on sign-out.
  useEffect(() => {
    if (!hydrated) return;
    if (isAuthenticated) {
      useWishlistStore.getState().load();
    } else {
      useWishlistStore.getState().reset();
    }
  }, [hydrated, isAuthenticated]);

  return (
    <>
      {/* Storefront is light-only; admin + distributor keep their theme toggle. */}
      <ForceLightTheme />
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: "#363636", color: "#fff" },
        }}
      />
      {hydrated && (
        <>
          <GlobalLoader />
          <LoginModal />
          <CartDrawer />
        </>
      )}
    </>
  );
}
