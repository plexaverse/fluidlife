"use client";

/**
 * About-page hero. Mirrors takekare's layered logo + staggered rise-scale
 * headlines ("We Are INNOVATORS / FORMULATORS / MANUFACTURERS").
 *
 * Lottie omitted (no asset, no extra dep) — replaced with floating blur orbs
 * for the same hover-y feel. Logo placeholder uses the brand gradient; swap
 * for a real Fluidlife logo at /img/fluidlife-icon.svg later.
 */
export function AboutHero() {
  return (
    <section className="relative pt-24 pb-16 bg-white text-black">
      <div className="w-full flex flex-col justify-center items-center px-4">
        {/* Floating blur orbs (visual replacement for the takekare Lottie loop) */}
        <div className="absolute inset-x-0 top-0 h-[480px] overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-12 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-pink-200/40 blur-3xl" />
          <div className="absolute top-32 left-1/3 h-56 w-56 rounded-full bg-blue-300/30 blur-3xl" />
          <div className="absolute top-24 right-1/3 h-56 w-56 rounded-full bg-purple-300/30 blur-3xl" />
        </div>

        <div className="relative max-w-3xl flex flex-col items-center justify-center">
          {/* Logo placeholder — square brand-gradient with an F mark. Swap with
              <Image src="/img/fluidlife-icon.svg" /> when you have a real logo. */}
          <div className="relative z-10 mt-20 mb-4 h-28 w-28 md:h-36 md:w-36 rounded-3xl brand-gradient shadow-xl flex items-center justify-center drop-shadow-[0_0_10px_white]">
            <span className="text-white text-5xl md:text-6xl font-extrabold">F</span>
          </div>

          <div
            className="gradient-text mb-2 text-xl opacity-0 animate-rise-scale"
            style={{ animationDelay: "0s" }}
          >
            We Are
          </div>
          <div
            className="mb-2 opacity-0 animate-rise-scale"
            style={{ animationDelay: "1s" }}
          >
            <h3 className="gradient-text-semibold text-3xl md:text-4xl text-center">
              INNOVATORS
            </h3>
          </div>
          <div
            className="mb-2 opacity-0 animate-rise-scale"
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
    </section>
  );
}
