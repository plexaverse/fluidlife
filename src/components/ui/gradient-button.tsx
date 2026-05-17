import React, { type JSX } from "react";

import { cn } from "@/lib/utils";

interface GradientButtonProps {
  text?: string;
  isCart?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  /** Override the default brand gradient — pass Tailwind `from-* via-* to-*` */
  gradient?: string;
  prefixIcon?: JSX.Element | null;
  type?: "button" | "submit";
}

/**
 * Brand gradient pill button. Ported from takekare for visual continuity —
 * use this for primary CTAs (Explore More, Buy Now, Get In Touch).
 */
export const GradientButton: React.FC<GradientButtonProps> = ({
  text,
  isCart,
  onClick,
  className,
  disabled,
  gradient,
  prefixIcon,
  type = "button",
}) => (
  <button
    type={type}
    disabled={disabled}
    onClick={onClick}
    className={cn(
      "bg-gradient-to-r text-white font-medium px-6 py-3 rounded-full shadow-md transition duration-300 ease-in-out",
      "hover:brightness-110 hover:shadow-lg",
      "active:brightness-90 active:shadow-inner",
      "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400",
      "disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none",
      gradient ?? "from-pink-500 via-purple-500 to-blue-500",
      className
    )}
  >
    <div className="flex items-center justify-center gap-2">
      {prefixIcon}
      {isCart ? (
        <svg
          stroke="currentColor"
          fill="currentColor"
          strokeWidth="0"
          viewBox="0 0 448 512"
          height="20"
          width="20"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path d="M352 160v-32C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128v32H0v272c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V160h-96zm-192-32c0-35.29 28.71-64 64-64s64 28.71 64 64v32H160v-32zm160 120c-13.255 0-24-10.745-24-24s10.745-24 24-24 24 10.745 24 24-10.745 24-24 24zm-192 0c-13.255 0-24-10.745-24-24s10.745-24 24-24 24 10.745 24 24-10.745 24-24 24z" />
        </svg>
      ) : (
        <span className="text-sm md:text-lg">{text}</span>
      )}
    </div>
  </button>
);

export default GradientButton;
