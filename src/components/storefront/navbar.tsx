"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShoppingBag, User as UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import { useUIStore } from "@/stores/ui-store";

import { NavCategoriesMenu } from "./nav-categories-menu";

interface NavbarCategory {
  id: string;
  name: string;
  image: string | null;
}

interface NavbarProps {
  categories: NavbarCategory[];
}

function initials(name: string | null | undefined): string {
  if (!name) return "U";
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U"
  );
}

export function Navbar({ categories }: NavbarProps) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastY, setLastY] = useState(0);

  const { isAuthenticated, user, logout } = useAuthStore();
  const totalItems = useCartStore((s) => s.totalItems);
  const openLoginModal = useUIStore((s) => s.openLoginModal);
  const openCartDrawer = useUIStore((s) => s.openCartDrawer);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 0);
      if (y === 0 || y < lastY) setVisible(true);
      else setVisible(false);
      setLastY(y);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [lastY]);

  const handleAuth = () => {
    if (isAuthenticated) router.push("/account");
    else openLoginModal();
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-transform duration-600",
        scrolled ? "bg-white/70 dark:bg-black/60 backdrop-blur-md" : "bg-transparent",
        visible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <div className="mx-auto w-full max-w-7xl flex flex-col px-4 md:px-6">
        {/* Top row: logo (left) + actions (right). Categories slot in via
            translate below — same pattern as takekare's Navbar. */}
        <div className="relative flex h-16 items-center justify-between gap-4">
          {/* Left: logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-lg tracking-tight ml-2 md:ml-5"
          >
            <span className="inline-block h-7 w-7 rounded-md brand-gradient" aria-hidden />
            <span>Fluidlife</span>
          </Link>

          {/* Right: actions */}
          <div className="flex items-center gap-2 mr-2">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium"
                      aria-label="Account"
                    >
                      {initials(user?.name)}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium">{user?.name || "My Account"}</p>
                    <p className="text-xs text-muted-foreground">{user?.phone}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/account?tab=profile")}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/account?tab=orders")}>
                    Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/account?tab=addresses")}>
                    Addresses
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="text-destructive">
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" onClick={handleAuth} aria-label="Sign in">
                <UserIcon className="h-5 w-5" />
              </Button>
            )}

            <motion.button
              type="button"
              onClick={openCartDrawer}
              whileTap={{ scale: 0.95 }}
              className="brand-gradient inline-flex items-center gap-2 rounded-full px-4 py-2 text-white text-sm font-medium shadow-sm"
              aria-label="Open cart"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="tabular-nums">{totalItems}</span>
            </motion.button>
          </div>

          {/* Centre: category hover menu — absolutely positioned so it
              stays mathematically centred regardless of how wide the
              logo or the actions group grow. Hidden on mobile. */}
          {categories.length > 0 && (
            <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 inset-y-0 items-center pointer-events-none">
              <div className="pointer-events-auto">
                <NavCategoriesMenu categories={categories} />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
