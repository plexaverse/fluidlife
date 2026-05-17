"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";

import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { useUIStore } from "@/stores/ui-store";

/**
 * Floating "Go to cart" pill that appears on scroll-down once the cart has
 * items, and tucks away at the very top + very bottom of the page. Ported
 * from takekare's BottomNavBar pattern.
 */
export function BottomNavBar() {
  const totalItems = useCartStore((s) => s.totalItems);
  const openCartDrawer = useUIStore((s) => s.openCartDrawer);

  const [visible, setVisible] = useState(false);
  const [lastY, setLastY] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const h = window.innerHeight;
      const d = document.documentElement.scrollHeight;
      if (y === 0 || y + h >= d) setVisible(false);
      else if (y > lastY) setVisible(true);
      else setVisible(false);
      setLastY(y);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [lastY]);

  if (totalItems === 0) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 left-4 md:left-auto md:right-10 z-40",
        "bg-card border rounded-full p-2 pl-6 shadow-lg",
        "md:w-100 max-w-md mx-auto md:mx-0",
        "transition-transform duration-700",
        visible ? "translate-y-0" : "translate-y-40 pointer-events-none"
      )}
    >
      <nav className="flex items-center justify-between gap-3">
        <span className="text-sm md:text-base text-muted-foreground">
          {totalItems} {totalItems === 1 ? "item" : "items"} in cart
        </span>
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={openCartDrawer}
          className="brand-gradient inline-flex items-center gap-2 rounded-full px-5 py-2 text-white font-medium shadow-md hover:brightness-110"
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Go to cart</span>
        </motion.button>
      </nav>
    </div>
  );
}
