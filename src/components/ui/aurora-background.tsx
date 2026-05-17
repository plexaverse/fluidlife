"use client";

import React, { type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Aceternity-style aurora hero background — full-height container with a soft
 * peach-to-white gradient sweep behind the content. Ported from the takekare
 * reference; the WebP overlay image is omitted (we don't have the asset),
 * so the gradient + the children carry the visual weight.
 */
export const AuroraBackground = ({ className, children, ...props }: AuroraBackgroundProps) => (
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
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating soft-blur orbs for depth */}
        <div className="absolute top-1/4 right-[10%] h-72 w-72 rounded-full bg-purple-300/30 blur-3xl" />
        <div className="absolute bottom-1/3 left-[8%] h-64 w-64 rounded-full bg-blue-300/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-pink-200/30 blur-3xl" />
      </div>
      {children}
    </div>
  </main>
);
