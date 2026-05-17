import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

const SUPPORT_LINKS = [
  { href: "/return-policy", label: "Shipping & Returns" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-of-service", label: "Terms of Service" },
];

const SHOP_LINKS = [
  { href: "/explore", label: "Explore products" },
  { href: "/about-us", label: "About Fluidlife" },
  { href: "/contact", label: "Contact us" },
];

export function Footer() {
  return (
    <footer className="bg-[#18191d] text-gray-200">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Contact */}
        <div className="space-y-4">
          <h5 className="text-base font-semibold">Contact us</h5>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2">
              <MapPin className="h-4 w-4 mt-1 shrink-0" />
              <div>
                <p>Registered office</p>
                <p className="text-gray-400">
                  {/* Placeholder — replace with real address before launch */}
                  Fluidlife, India
                </p>
              </div>
            </li>
            <li className="flex gap-2">
              <Mail className="h-4 w-4 mt-1 shrink-0" />
              <a
                href="mailto:hello@fluidlife.example"
                className="text-gray-400 hover:text-white transition-colors"
              >
                hello@fluidlife.example
              </a>
            </li>
            <li className="flex gap-2">
              <Phone className="h-4 w-4 mt-1 shrink-0" />
              <a href="tel:+910000000000" className="text-gray-400 hover:text-white transition-colors">
                +91 000 000 0000
              </a>
            </li>
          </ul>
        </div>

        {/* Shop */}
        <div className="space-y-4">
          <h5 className="text-base font-semibold">Shop</h5>
          <ul className="space-y-2 text-sm">
            {SHOP_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-gray-400 hover:text-white transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div className="space-y-4">
          <h5 className="text-base font-semibold">Support & policies</h5>
          <ul className="space-y-2 text-sm">
            {SUPPORT_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-gray-400 hover:text-white transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Brand */}
        <div className="space-y-4 flex flex-col items-start md:items-center">
          <div className="flex items-center gap-2">
            <span className="inline-block h-8 w-8 rounded-md brand-gradient" aria-hidden />
            <span className="text-xl font-semibold">Fluidlife</span>
          </div>
          <p className="text-sm text-gray-400 md:text-center">
            Healthier, safer, more sustainable everyday choices.
          </p>
        </div>
      </div>

      <div className="border-t border-white/5">
        <p className="mx-auto max-w-7xl px-4 md:px-6 py-4 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Fluidlife. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
