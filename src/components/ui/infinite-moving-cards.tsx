"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

interface InfiniteMovingCardsProps {
  items: { quote: string; name: string; title: string | React.ReactNode }[];
  direction?: "left" | "right";
  speed: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}

/**
 * Aceternity infinite marquee. Renders quote cards on a horizontal scroller
 * that loops seamlessly. The animation itself lives in globals.css
 * (`--animate-scroll` / `@keyframes scroll`); we clone the children once on
 * mount so the loop reads as continuous, and pipe direction/speed in via CSS
 * custom properties.
 */
export function InfiniteMovingCards({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
}: InfiniteMovingCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLUListElement>(null);
  const initialised = useRef(false);

  useEffect(() => {
    // One-shot setup: clone children for the seamless loop and set CSS vars.
    // We apply the `animate-scroll` class via classList rather than state to
    // avoid the React "cascading render" lint warning on a one-shot mount.
    if (!initialised.current && containerRef.current && scrollerRef.current) {
      initialised.current = true;

      Array.from(scrollerRef.current.children).forEach((node) => {
        scrollerRef.current?.appendChild(node.cloneNode(true));
      });

      containerRef.current.style.setProperty(
        "--animation-direction",
        direction === "left" ? "forwards" : "reverse",
      );

      const speedMap: Record<"fast" | "normal" | "slow", string> = {
        fast: "20s",
        normal: "40s",
        slow: "80s",
      };
      containerRef.current.style.setProperty("--animation-duration", speedMap[speed]);
      scrollerRef.current.classList.add("animate-scroll");
    }

    const scroller = scrollerRef.current;
    if (!scroller) return;
    const handleTouchStart = () => {
      scroller.style.animationPlayState = "paused";
    };
    const handleTouchEnd = () => {
      scroller.style.animationPlayState = "running";
    };
    scroller.addEventListener("touchstart", handleTouchStart);
    scroller.addEventListener("touchend", handleTouchEnd);
    return () => {
      scroller.removeEventListener("touchstart", handleTouchStart);
      scroller.removeEventListener("touchend", handleTouchEnd);
    };
  }, [direction, speed]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative max-w-7xl overflow-hidden select-none [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]",
        className,
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          "flex w-max min-w-full shrink-0 flex-nowrap gap-4 py-4",
          pauseOnHover && "hover:[animation-play-state:paused]",
        )}
      >
        {items.map((item) => (
          <li
            key={item.name}
            className="relative w-[80vw] md:w-[350px] max-w-full shrink-0 rounded-2xl border border-b-0 border-zinc-200 bg-[linear-gradient(180deg,#fafafa,#f5f5f5)] px-8 py-6 md:w-[450px] dark:border-zinc-700 dark:bg-[linear-gradient(180deg,#27272a,#18181b)]"
          >
            <blockquote>
              <span className="relative z-20 text-sm leading-[1.6] font-normal text-neutral-800 dark:text-gray-100">
                {item.quote}
              </span>
              <div className="relative z-20 mt-6 flex flex-row items-center">
                <span className="flex flex-col gap-1">
                  <span className="text-sm leading-[1.6] font-normal text-neutral-500 dark:text-gray-400">
                    {item.name}
                  </span>
                  <span className="text-sm leading-[1.6] font-normal text-neutral-500 dark:text-gray-400">
                    {item.title}
                  </span>
                </span>
              </div>
            </blockquote>
          </li>
        ))}
      </ul>
    </div>
  );
}
