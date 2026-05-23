import type { Metadata } from "next";
import Image from "next/image";

import { AboutNextProject } from "@/components/storefront/about-next-project";

import { AboutHero } from "./components/about-hero";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn more about Fluidlife — our mission, vision, values, and the brands we work with.",
};

// Client logos. Filenames mirror takekare's catalogue under /public/img/clients;
// swap the labels for Fluidlife's own retail / B2B partners as they come on board.
const CLIENTS = [
  { name: "ONGC", image: "/img/clients/01.png" },
  { name: "Baikakaji", image: "/img/clients/03.png" },
  { name: "Sunrich", image: "/img/clients/02.png" },
  { name: "Latur General Store", image: "/img/clients/05.png" },
  { name: "Tumbledry", image: "/img/clients/04.png" },
  { name: "Force Xpress", image: "/img/clients/06.png" },
  { name: "The Linen People", image: "/img/clients/08.png" },
  { name: "Carnival Resort", image: "/img/clients/07.png" },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <AboutHero />

      {/* Vision & Mission */}
      <section className="py-12 md:py-12">
        <div className="bg-gray-50 grid md:grid-cols-2">
          <div className="p-0 rounded-lg flex flex-col items-end justify-center md:ml-20 overflow-hidden md:pr-12">
            <Image
              src="/img/about_section.webp"
              alt="Fluidlife — innovators, formulators, manufacturers"
              width={420}
              height={420}
              className="rounded-lg py-12 pr-0"
            />
          </div>

          <div className="bg-gray-50 px-4 md:pr-12 rounded-lg flex flex-col items-start justify-center md:mr-30 md:my-10">
            <h3 className="gradient-text-semibold text-xl md:text-2xl mb-2">
              Our Vision
            </h3>
            <p className="text-base leading-relaxed">
              To be a sizeable brand that is omnipresent in retail as well as
              digital space with high brand recall for problem solving health
              and hygiene products.
            </p>
            <p className="text-base leading-relaxed mt-3">
              To build assets and capabilities to serve to larger audiences
              across the globe.
            </p>
            <p className="text-base leading-relaxed mt-3">
              To create wealth for all stakeholders involved like shareholders,
              investors, partners and team members.
            </p>
            <p className="text-base leading-relaxed mt-3">
              To have a significant and notable contribution back to the
              society, particularly for environment and welfare causes.
            </p>

            <h3 className="gradient-text-semibold text-xl md:text-2xl mb-2 mt-12">
              Our Mission
            </h3>
            <p className="text-base leading-relaxed">
              To make top notch care and well-being products, that the consumers
              trust and have seen effective results with.
            </p>
            <p className="text-base leading-relaxed mt-3">
              To stand out as a brand that makes conscious, problem solving,
              innovative, environment friendly and value products in the health
              and hygiene space.
            </p>
          </div>
        </div>
      </section>

      {/* Our Clients */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="gradient-text-semibold text-3xl md:text-4xl font-bold mb-12 text-center">
              Our Clients
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-8">
              {CLIENTS.map((client) => (
                <div
                  key={client.name}
                  className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center justify-center hover:shadow-md transition-shadow"
                >
                  <Image
                    src={client.image}
                    alt={`${client.name} logo`}
                    width={120}
                    height={80}
                    className="mb-3 object-contain h-20 w-auto"
                  />
                  <p className="text-base text-gray-800 text-center">
                    {client.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pre-footer CTA */}
      <AboutNextProject />
    </main>
  );
}
