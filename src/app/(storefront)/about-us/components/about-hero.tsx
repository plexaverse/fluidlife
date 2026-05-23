"use client";

import Image from "next/image";

import { LottieAnimation } from "@/components/storefront/lottie-animation";
import aboutBgAnimation from "../../../../../public/animations/about-bg.json";

/**
 * About-page hero. Mirrors takekare's layered logo + staggered rise-scale
 * headlines ("We Are INNOVATORS / FORMULATORS / MANUFACTURERS"), using the
 * `about-bg.json` Lottie behind the logo for the same hover-y backdrop.
 */
export function AboutHero() {
  return (
    <section className="relative pt-20 bg-white text-black">
      <div className="w-full flex flex-col justify-center items-center">
        <div className="relative">
          <div className="max-w-3xl flex flex-col items-center justify-center">
            <LottieAnimation
              animationData={aboutBgAnimation}
              height={340}
              loop
              autoplay
              className="absolute inset-0 z-0 w-[90%] h-[90%] object-cover"
            />

            <Image
              src="/img/fluidlife-icon.svg"
              alt="Fluidlife"
              width={150}
              height={150}
              priority
              className="relative z-10 mx-16 mt-20 pt-4 filter drop-shadow-[rgb(255,255,255)_0px_0px_10px]"
            />

            <div
              className="gradient-text opacity-0 animate-rise-scale mb-2 text-xl"
              style={{ animationDelay: "0s" }}
            >
              We Are
            </div>
            <div
              className="opacity-0 animate-rise-scale mb-2"
              style={{ animationDelay: "1s" }}
            >
              <h3 className="gradient-text-semibold text-3xl md:text-4xl text-center">
                INNOVATORS
              </h3>
            </div>
            <div
              className="opacity-0 animate-rise-scale mb-2"
              style={{ animationDelay: "2s" }}
            >
              <h3 className="gradient-text-semibold text-3xl md:text-4xl text-center">
                FORMULATORS
              </h3>
            </div>
            <div className="opacity-0 animate-rise-scale" style={{ animationDelay: "3s" }}>
              <h3 className="gradient-text-semibold text-3xl md:text-4xl text-center">
                MANUFACTURERS
              </h3>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
