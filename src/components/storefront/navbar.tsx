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

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/about-us", label: "About" },
  { href: "/contact", label: "Contact" },
];

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

export function Navbar() {
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
        "fixed inset-x-0 top-0 z-50 transition-transform duration-500",
        scrolled ? "bg-white/70 dark:bg-black/60 backdrop-blur-md" : "bg-transparent",
        visible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        {/* Logo placeholder */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight">
          <span className="inline-block h-7 w-7 rounded-md brand-gradient" aria-hidden />
          <span>Fluidlife</span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden lg:flex items-center gap-6 text-sm">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-muted-foreground hover:text-foreground transition-colors">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          {/* Auth */}
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

          {/* Cart */}
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
      </nav>
    </header>
  );
}
