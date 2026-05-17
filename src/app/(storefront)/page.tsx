import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        {/* Soft brand gradient background */}
        <div className="absolute inset-0 -z-10 brand-gradient opacity-10" aria-hidden />

        <div className="mx-auto max-w-6xl px-4 md:px-6 py-24 md:py-32 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-4">
            Healthier. Safer. Sustainable.
          </p>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight mb-6">
            Everyday care, <span className="gradient-text-bold">reimagined</span>.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Fluidlife brings you thoughtfully made hygiene and wellness essentials —
            so the choices that take care of you don&apos;t cost the planet.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/explore">Explore products</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/about-us">About Fluidlife</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Foundation stub — real category, featured, and review sections land in phase 2 */}
      <section className="mx-auto max-w-6xl px-4 md:px-6 pb-24">
        <div className="rounded-2xl border bg-card p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold mb-2">Storefront coming together</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            We&apos;re putting the finishing touches on browsing, cart, and checkout. In the
            meantime, you can read our policies and reach out from the links below.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
            <Link className="underline-offset-4 hover:underline" href="/privacy-policy">
              Privacy
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link className="underline-offset-4 hover:underline" href="/return-policy">
              Shipping &amp; Returns
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link className="underline-offset-4 hover:underline" href="/terms-of-service">
              Terms
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
