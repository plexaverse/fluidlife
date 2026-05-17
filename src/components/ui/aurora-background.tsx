"use client";

import Image from "next/image";
import React, { type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  /** Foreground hero illustration. Defaults to /img/landing-picture-transparent.webp. */
  foregroundSrc?: string | null;
}

/**
 * Aceternity-style aurora hero background — full-height container with a soft
 * peach-to-white gradient sweep behind the content, plus floating blur orbs
 * for depth and a foreground hero illustration on the right (responsive:
 * top-right on mobile, bottom-right on desktop). Matches takekare's layout.
 *
 * Pass `foregroundSrc={null}` to render the gradient-only version.
 */
export const AuroraBackground = ({
  className,
  children,
  foregroundSrc = "/img/landing-picture-transparent.webp",
  ...props
}: AuroraBackgroundProps) => (
  <main>
    <div
      className={cn(
        "transition-bg relative flex h-[100vh] flex-col items-center justify-center",
        "bg-zinc-50 text-slate-950 dark:bg-zinc-900",
        "bg-gradient-to-t from-white via-[#FEC5BD] to-white",
        className
      )}
      {...props}
    >
      {/* Soft blur orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-[10%] h-72 w-72 rounded-full bg-purple-300/30 blur-3xl" />
        <div className="absolute bottom-1/3 left-[8%] h-64 w-64 rounded-full bg-blue-300/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-pink-200/30 blur-3xl" />
      </div>

      {/* Foreground illustration (mirrors takekare's layered hero PNG) */}
      {foregroundSrc && (
        <Image
          src={foregroundSrc}
          alt=""
          width={800}
          height={800}
          priority
          aria-hidden
          className={cn(
            "absolute right-0 opacity-90 pointer-events-none select-none",
            // mobile: top half, smaller
            "top-[14vh] w-[80vw]",
            // tablet+: bottom-right, fixed width
            "md:top-auto md:bottom-0 md:w-[50vw] lg:w-[40vw]"
          )}
        />
      )}

      {children}
    </div>
  </main>
);
