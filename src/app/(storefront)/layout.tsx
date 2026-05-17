import type { Metadata } from "next";

import { Navbar } from "@/components/storefront/navbar";
import { Footer } from "@/components/storefront/footer";
import { StorefrontProvider } from "@/components/storefront/storefront-provider";

export const metadata: Metadata = {
  title: { default: "Fluidlife", template: "%s | Fluidlife" },
  description: "Healthier, safer, more sustainable everyday choices.",
};

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StorefrontProvider>
      <Navbar />
      {/* pt-16 offsets the fixed navbar height (h-16) */}
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </StorefrontProvider>
  );
}
