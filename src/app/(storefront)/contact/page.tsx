import type { Metadata } from "next";
import { Mail, MapPin, MessageSquare, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Get in touch with Fluidlife — email, phone, WhatsApp.",
};

const CONTACT_CHANNELS = [
  {
    Icon: Mail,
    label: "Email",
    value: "hello@fluidlife.example",
    href: "mailto:hello@fluidlife.example",
  },
  {
    Icon: Phone,
    label: "Phone",
    value: "+91 000 000 0000",
    href: "tel:+910000000000",
  },
  {
    Icon: MessageSquare,
    label: "WhatsApp",
    value: "+91 000 000 0000",
    href: "https://wa.me/910000000000",
  },
] as const;

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-16 space-y-8">
      <header>
        <h1 className="text-3xl md:text-5xl font-semibold mb-3">Get in touch</h1>
        <p className="text-lg text-muted-foreground">
          For orders, returns, or anything in between — we&apos;re a quick message away.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CONTACT_CHANNELS.map((ch) => (
          <a
            key={ch.label}
            href={ch.href}
            target={ch.href.startsWith("http") ? "_blank" : undefined}
            rel={ch.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="group rounded-2xl border bg-card p-6 hover:bg-muted/30 transition-colors"
          >
            <ch.Icon className="h-5 w-5 text-muted-foreground mb-3 group-hover:text-foreground transition-colors" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
              {ch.label}
            </p>
            <p className="font-medium">{ch.value}</p>
          </a>
        ))}
      </div>

      <section className="rounded-2xl border bg-card p-6 flex gap-4">
        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
            Registered office
          </p>
          <p>Fluidlife, India</p>
          <p className="text-sm text-muted-foreground mt-1">
            Placeholder address — replace with your registered office before launch.
          </p>
        </div>
      </section>

      <p className="text-sm text-muted-foreground">
        For privacy-related concerns, see our{" "}
        <a className="underline" href="/privacy-policy">
          privacy policy
        </a>
        . For returns or shipping queries, see our{" "}
        <a className="underline" href="/return-policy">
          shipping &amp; returns
        </a>{" "}
        policy.
      </p>
    </div>
  );
}
