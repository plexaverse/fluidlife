"use client";

import { useEffect } from "react";

/**
 * Storefront-only theme lock.
 *
 * The admin + distributor trees keep their next-themes-driven system/dark/
 * light toggle. The customer storefront is light-only — we don't have a dark
 * design language for the marketing pages, so a dark-mode admin who pops
 * over to /explore would otherwise see broken contrast.
 *
 * On mount: remove the `.dark` class from <html> (if next-themes added it).
 * On unmount (navigation away from the storefront subtree, e.g. back to
 * /admin): restore it. This intentionally does NOT touch next-themes'
 * localStorage state — the user's preference is preserved for the admin and
 * distributor trees.
 *
 * Trade-off: a dark-mode user landing directly on /storefront refreshes
 * sees a single-frame dark flash before this effect runs and removes the
 * class. The flash is negligible in practice and avoids the bigger UX
 * regression of clobbering the user's stored theme choice.
 */
export function ForceLightTheme() {
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    if (wasDark) root.classList.remove("dark");
    return () => {
      if (wasDark) root.classList.add("dark");
    };
  }, []);
  return null;
}
