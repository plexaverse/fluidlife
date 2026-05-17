"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import { AuroraBackground } from "@/components/ui/aurora-background";
import { GradientButton } from "@/components/ui/gradient-button";
import { cn } from "@/lib/utils";

interface LandingBannerProps {
  className?: string;
}

export function LandingBanner({ className }: LandingBannerProps) {
  const router = useRouter();
  return (
    <AuroraBackground className={cn(className)}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
        className="h-full w-full relative flex flex-col gap-4 items-start justify-end md:justify-center px-4 z-10"
      >
        <div
          className={cn(
            "mt-28 sm:mt-20 md:ml-24 md:mt-24 md:pl-20 md:pt-10 px-4 mx-0 rounded-[30px]",
            "backdrop-blur-[3px] bg-[linear-gradient(rgba(255,255,255,0.8),rgba(255,255,255,0))]",
            "md:w-3/5"
          )}
        >
          <h2 className="gradient-text text-2xl sm:text-3xl md:text-4xl text-left pt-4">
            Glad you made it! <br />
            Shows that you Kare...
          </h2>
          <p className="font-extralight md:text-xl pb-4 md:pt-3 md:pb-8">
            Let&apos;s make healthier, safer &amp; hygienic choices together...
          </p>
          <GradientButton
            text="Explore More"
            onClick={() => router.push("/explore")}
            className="mb-24"
          />
        </div>
      </motion.div>
    </AuroraBackground>
  );
}
