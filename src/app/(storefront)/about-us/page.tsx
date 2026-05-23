import type { Metadata } from "next";

import { AboutNextProject } from "@/components/storefront/about-next-project";

import { AboutHero } from "./components/about-hero";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn more about Fluidlife, our mission, vision, and values.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      {/* Hero with logo + "We Are INNOVATORS / FORMULATORS / MANUFACTURERS" stagger */}
      <AboutHero />

      {/* Vision & Mission */}
      <section className="py-12">
        <div className="bg-muted/40 grid md:grid-cols-2">
          {/* Brand-gradient placeholder block. Replace with /img/about_section.webp
              when you have the asset. */}
          <div className="flex items-center justify-center md:justify-end md:pr-12 p-8 md:p-12">
            <div className="relative h-72 w-72 md:h-96 md:w-96 rounded-3xl overflow-hidden brand-gradient">
              <div className="absolute inset-4 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-white text-7xl md:text-8xl font-extrabold drop-shadow-md">F</span>
              </div>
            </div>
          </div>

          <div className="px-4 md:pr-12 flex flex-col items-start justify-center md:mr-12 md:my-10 py-10 md:py-0">
            <h3 className="gradient-text-semibold text-xl md:text-2xl mb-2">Our Vision</h3>
            <p className="text-base leading-relaxed text-muted-foreground">
              To be a sizeable brand that is omnipresent in retail as well as digital
              space with high brand recall for problem-solving health and hygiene
              products.
            </p>
            <p className="text-base leading-relaxed text-muted-foreground mt-3">
              To build assets and capabilities to serve larger audiences across the
              globe.
            </p>
            <p className="text-base leading-relaxed text-muted-foreground mt-3">
              To create wealth for all stakeholders involved — shareholders, investors,
              partners, and team members.
            </p>
            <p className="text-base leading-relaxed text-muted-foreground mt-3">
              To have a significant and notable contribution back to society,
              particularly for environment and welfare causes.
            </p>

            <h3 className="gradient-text-semibold text-xl md:text-2xl mb-2 mt-12">Our Mission</h3>
            <p className="text-base leading-relaxed text-muted-foreground">
              To make top-notch care and well-being products that customers trust and
              have seen effective results with.
            </p>
            <p className="text-base leading-relaxed text-muted-foreground mt-3">
              To stand out as a brand that makes conscious, problem-solving, innovative,
              environment-friendly, and value products in the health and hygiene space.
            </p>
          </div>
        </div>
      </section>

      {/* Pre-footer CTA */}
      <AboutNextProject />
    </main>
  );
}
