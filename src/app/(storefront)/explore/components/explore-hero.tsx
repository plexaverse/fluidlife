import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";

/**
 * Hero banner for the Explore page. Ported from takekare's `ExploreMoreLandingBanner`
 * with the takekare copy preserved verbatim and the gradient palette retuned to
 * Fluidlife's pink / purple / blue.
 */
export function ExploreHero() {
  // Trim the gradient down to a hero strip instead of the full viewport.
  return (
    <div className="relative h-[60vh] min-h-[420px] max-h-[640px] w-full overflow-hidden">
      <BackgroundGradientAnimation
        containerClassName="!h-full !w-full"
        className="absolute inset-0 z-50 flex flex-col items-center justify-center text-white font-bold px-4 pointer-events-none text-center"
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
          <p className="bg-clip-text text-transparent drop-shadow-2xl bg-gradient-to-b from-white/90 to-white/30 text-4xl md:text-6xl lg:text-7xl leading-tight">
            Explore Our Products
          </p>
          <p className="mt-4 max-w-2xl text-sm md:text-base text-white/85 font-normal">
            Exploring means rethinking the ordinary, breaking habits, and
            discovering smarter ways to care.
          </p>
        </div>
      </BackgroundGradientAnimation>
    </div>
  );
}
