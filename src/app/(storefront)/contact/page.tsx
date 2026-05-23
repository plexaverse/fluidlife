import type { Metadata } from "next";

import { SocialIcons } from "@/components/storefront/social-icons";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";

import { ContactForm } from "./components/contact-form";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Get in touch with Fluidlife — email, phone, or send us a message. We listen to our consumers.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-20 bg-white text-black">
        <div className="container mx-auto px-4 pt-20">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl mb-2">Let&apos;s talk</h1>
            <h2 className="text-3xl md:text-4xl mb-6">about you.</h2>

            <p className="text-lg mb-4">We listen to our consumers!</p>
            <TextGenerateEffect
              className="text-sm md:text-lg mb-4"
              words="If you have any feedback or a story to share with us, we are here! Also, if you have any issues that you face in your everyday hygiene and want a solution, write to us, we will customise a solution just for YOU!"
            />

            <div
              className="opacity-0 animate-fade-up"
              style={{ animationDelay: "7.5s" }}
            >
              <p className="gradient-text-semibold text-3xl md:text-4xl pt-4">
                Stay Fluid!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Form + info */}
      <section className="pt-12 pb-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <ContactForm />

            <div className="p-2">
              <h4 className="gradient-text-semibold text-2xl md:text-3xl mb-8">
                Contact Info.
              </h4>

              <h3 className="text-2xl mb-6">Let&apos;s Talk.</h3>
              <div className="mb-8">
                <p className="mb-2">
                  <a
                    href="mailto:hello@fluidlife.example"
                    className="text-gray-700 hover:text-purple-600"
                  >
                    hello@fluidlife.example
                  </a>
                </p>
                <p>
                  <a
                    href="tel:+910000000000"
                    className="text-gray-700 hover:text-purple-600"
                  >
                    +91 00000 00000
                  </a>
                </p>
              </div>

              <h3 className="text-2xl mb-6">Visit Us.</h3>
              <div>
                <p className="text-gray-700">
                  Fluidlife Health and Hygiene, opposite Nandai Girls Hostel,
                  <br />
                  Sitaram Nagar, Latur - 413512,
                  <br />
                  Maharashtra, India.
                </p>
              </div>

              <SocialIcons iconColor="black" />

              <p className="mt-8 text-sm text-muted-foreground">
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
          </div>
        </div>
      </section>

      {/* Google Maps. Iframe + business pin ported from takekare; swap the
          `pb` parameter for your registered office before launch. */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="w-full h-[400px] relative">
            <iframe
              title="Fluidlife on Google Maps"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3786.0162252593645!2d76.56398861086711!3d18.392112682604537!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcf83fcfe145637%3A0x123f2d20030091c6!2sTakeKare%20Health%20and%20Hygiene!5e0!3m2!1sen!2sin!4v1696963808939!5m2!1sen!2sin"
              className="absolute inset-0 w-full h-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
