"use client";

import { useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: { id: string; url: string }[];
  name: string;
}

/**
 * Two-column gallery: main image + thumbnail strip. Click a thumb to swap the
 * main image. Falls back to a gradient placeholder when there are no images.
 */
export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  if (images.length === 0) {
    return (
      <div className="aspect-square w-full overflow-hidden rounded-2xl brand-gradient opacity-20" />
    );
  }

  const current = images[Math.min(active, images.length - 1)];

  return (
    <div className="flex flex-col gap-4 md:flex-row-reverse">
      <div className="relative flex-1 aspect-square overflow-hidden rounded-2xl bg-muted">
        <Image
          src={current.url}
          alt={name}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:max-h-[60vh]">
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(idx)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-muted transition-colors",
                idx === active ? "border-primary" : "border-transparent hover:border-muted-foreground/40"
              )}
              aria-label={`View image ${idx + 1}`}
            >
              <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
