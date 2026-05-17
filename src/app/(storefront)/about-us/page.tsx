import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About Fluidlife",
  description: "The story behind Fluidlife and why we build what we build.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-16 space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl md:text-5xl font-semibold">
          We make everyday care <span className="gradient-text-bold">better</span>.
        </h1>
        <p className="text-lg text-muted-foreground">
          Healthier for you. Safer for your family. Lighter on the planet.
        </p>
      </header>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p>
          Fluidlife was built around a simple frustration — the things we use every day
          shouldn&apos;t force a trade-off between what works for us and what works for the
          environment. So we set out to make better-everyday-care a quiet, easy default.
        </p>
        <p>
          Every product on this catalogue is chosen with three filters: it has to{" "}
          <strong>actually work</strong>, it has to be <strong>safe</strong> to use, and it
          has to make a <strong>genuine environmental contribution</strong> — through
          recyclable packaging, lower-impact ingredients, or longer-lived design.
        </p>
        <p>
          We&apos;re a small team based in India, building this slowly and thoughtfully.
          Thanks for being here.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 pt-4">
        <Button asChild>
          <Link href="/explore">Browse the catalogue</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/contact">Get in touch</Link>
        </Button>
      </div>
    </div>
  );
}
