"use client";

import { Loader2 } from "lucide-react";

import { useUIStore } from "@/stores/ui-store";

export function GlobalLoader() {
  const { loading, loadingMessage } = useUIStore();
  if (!loading) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/95 dark:bg-neutral-900/95 px-8 py-6 shadow-2xl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {loadingMessage && <p className="text-sm text-muted-foreground">{loadingMessage}</p>}
      </div>
    </div>
  );
}
