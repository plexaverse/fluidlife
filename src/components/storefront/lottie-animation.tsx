"use client";

import Lottie from "lottie-react";

interface LottieAnimationProps {
  animationData: object;
  width?: number | string;
  height?: number | string;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
}

/**
 * Thin Lottie wrapper. Kept as a client component so server pages can import
 * the JSON via `next/dynamic` or by passing the imported asset down.
 */
export function LottieAnimation({
  animationData,
  width = "100%",
  height = "100%",
  loop = true,
  autoplay = true,
  className,
}: LottieAnimationProps) {
  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
      style={{ width, height }}
      className={className}
    />
  );
}
