import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description: "Fluidlife shipping, return, and refund policy.",
};

export default function ReturnPolicy() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="gradient-text text-3xl md:text-4xl mb-6 border-b pb-4">Shipping &amp; Returns</h1>

      <section className="mb-8">
        <p className="text-muted-foreground mb-4">
          At Fluidlife, your satisfaction is our priority. We work hard to make sure you get the best
          products that serve your purpose without hurting the environment. We understand that there
          can be an instance when you wish to return an item — here&apos;s the process.
        </p>
        <p className="text-muted-foreground mb-4">
          Simply reach out from the <a className="underline" href="/contact">Contact us</a> page, or:
        </p>
        <ul className="list-disc list-inside mb-4 text-muted-foreground">
          <li>Email: hello@fluidlife.example</li>
          <li>WhatsApp: +91 000 000 0000</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl mb-4">Review process</h2>
        <div className="space-y-4 text-muted-foreground">
          <p>
            <strong className="text-foreground">Review of your request:</strong> once you&apos;ve raised
            a request, please allow us 2 working days to review it.
          </p>
          <p>
            <strong className="text-foreground">Product verification and resolution:</strong> after we
            receive your product(s), we will conduct a thorough verification against your claim. Based
            on our findings, we will initiate the replacement or refund process. Replacement is subject
            to stock availability.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl mb-4">Reasons for return</h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Wrong product delivery</li>
          <li>Expired product delivery</li>
          <li>Damaged product delivery</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl mb-4">Refund &amp; cancellation</h2>
        <div className="space-y-4 text-muted-foreground">
          <p>
            <strong className="text-foreground">Full refund for unopened, unused merchandise:</strong>{" "}
            we issue a full refund on any full-priced, unopened, unused merchandise returned to our
            warehouse within 7 days from delivery. Reverse pickup is available in most Indian pincodes.
          </p>
          <p>
            <strong className="text-foreground">Opened merchandise:</strong> if you receive opened
            merchandise, please reject it at the time of delivery.
          </p>
          <p>
            <strong className="text-foreground">Sale &amp; used products:</strong> we cannot offer
            exchanges or refunds on sale items, opened products, or used products. We are not liable for
            damage that occurs after delivery.
          </p>
          <p>
            <strong className="text-foreground">Refund process:</strong> once the product reaches our
            nearest warehouse and is verified, we initiate your refund. You&apos;ll be notified via SMS
            and email.
          </p>
        </div>
      </section>

      <section className="bg-muted rounded-lg p-6">
        <h2 className="text-2xl mb-4">Get in touch</h2>
        <div className="space-y-1 text-muted-foreground">
          <p>Email: hello@fluidlife.example</p>
          <p>WhatsApp: +91 000 000 0000</p>
          <p>Our team is here to make the process as straightforward as possible.</p>
        </div>
      </section>
    </div>
  );
}
