"use client";

import { IconHeartFilled } from "@tabler/icons-react";

import {
  DraggableCardBody,
  DraggableCardContainer,
} from "@/components/ui/draggable-card";

/**
 * Floating, draggable product cards used inside the Explore "features" bento.
 * Ported from takekare — each card lives at a fixed `top-/left-` so they form
 * a layered "scattered on a desk" look. Drop the takekare product assets in
 * /public/img/products as you replace them with your own photography.
 */
const ITEMS = [
  {
    title: "Inner-wear Wash",
    image: "/img/products/IIW_5.webp",
    className: "absolute top-100 left-[20%] rotate-[-5deg]",
  },
  {
    title: "Hand Wash",
    image: "/img/products/HW_6.webp",
    className: "absolute top-70 left-[25%] rotate-[-7deg]",
  },
  {
    title: "Liquid Detergent",
    image: "/img/products/LD_6.webp",
    className: "absolute top-45 left-[40%] rotate-[8deg]",
  },
  {
    title: "Natural Floor Cleaner",
    image: "/img/products/FC_5.webp",
    className: "absolute top-60 left-[55%] rotate-[10deg]",
  },
];

export function ProductDraggableCards() {
  return (
    <DraggableCardContainer className="relative flex min-h-screen w-full items-em justify-center overflow-clip">
      <div className="absolute top-50 md:top-1/2 mx-auto max-w-sm -translate-y-3/4 text-center text-2xl font-black text-neutral-400 md:text-4xl dark:text-neutral-800">
        <IconHeartFilled className="inline-block h-8 w-8 text-pink-500 animate-pulse" />
        <span className="gradient-text-semibold block">We Care</span>
        <span className="gradient-text-semibold block">about you!</span>
      </div>
      {ITEMS.map((item) => (
        <DraggableCardBody key={item.title} className={item.className}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image}
            alt={item.title}
            className="pointer-events-none relative z-10 h-40 w-40 object-cover"
          />
          <h3 className="mt-4 text-center text-lg font-bold text-neutral-700 dark:text-neutral-300">
            {item.title}
          </h3>
        </DraggableCardBody>
      ))}
    </DraggableCardContainer>
  );
}
