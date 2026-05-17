"use client";

import { toast } from "react-hot-toast";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { useWishlistStore } from "@/stores/wishlist-store";

interface WishlistButtonProps {
  productId: string;
  variant?: "icon" | "full";
  className?: string;
}

export function WishlistButton({ productId, variant = "icon", className }: WishlistButtonProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openLoginModal = useUIStore((s) => s.openLoginModal);
  const isIn = useWishlistStore((s) => s.isInWishlist(productId));
  const pending = useWishlistStore((s) => !!s.pending[productId]);
  const toggle = useWishlistStore((s) => s.toggle);

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    const result = await toggle(productId);
    if (result === "added") toast.success("Saved to wishlist");
    else if (result === "removed") toast.success("Removed from wishlist");
    else if (result === "error") toast.error("Could not update wishlist");
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-label={isIn ? "Remove from wishlist" : "Save to wishlist"}
        aria-pressed={isIn}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-sm transition-transform hover:scale-110 disabled:opacity-50",
          className
        )}
      >
        <Heart
          className={cn(
            "h-4 w-4 transition-colors",
            isIn ? "fill-rose-500 text-rose-500" : "text-foreground"
          )}
        />
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={pending}
      aria-pressed={isIn}
      className={cn("gap-2", className)}
    >
      <Heart className={cn("h-4 w-4", isIn ? "fill-rose-500 text-rose-500" : "")} />
      {isIn ? "Saved" : "Save to wishlist"}
    </Button>
  );
}
