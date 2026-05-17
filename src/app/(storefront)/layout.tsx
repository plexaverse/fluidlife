import type { Metadata } from "next";

import { Navbar } from "@/components/storefront/navbar";
import { Footer } from "@/components/storefront/footer";
import { StorefrontProvider } from "@/components/storefront/storefront-provider";
import { BottomNavBar } from "@/components/storefront/bottom-nav-bar";
import { WhatsappButton } from "@/components/storefront/whatsapp-button";
import { getPublicCategories } from "@/services/server/categories";

export const metadata: Metadata = {
  title: { default: "Fluidlife", template: "%s | Fluidlife" },
  description: "Healthier, safer, more sustainable everyday choices.",
};

// Layout needs live category data for the nav hover menu — render on demand
// rather than statically at build time so we don't need a build-time DB.
export const dynamic = "force-dynamic";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch in the layout (a Server Component) so every storefront page gets
  // the category dropdown without each one needing to query.
  const categories = await getPublicCategories();
  const navCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    image: c.image,
  }));

  return (
    <StorefrontProvider>
      <Navbar categories={navCategories} />
      {/* pt-24 offsets the fixed navbar height (~h-16 + category strip) */}
      <main className="flex-1 pt-16 md:pt-24">{children}</main>
      <Footer />
      {/* Floating UI islands — sit above the footer */}
      <BottomNavBar />
      <WhatsappButton />
    </StorefrontProvider>
  );
}
