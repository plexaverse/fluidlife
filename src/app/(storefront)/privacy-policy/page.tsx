import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Fluidlife privacy policy. Learn how we collect, use, and protect your personal information.",
};

const sections = [
  {
    title: "Objective, scope and applicability",
    content: [
      "Fluidlife respects individual privacy and is committed to protecting personal information.",
      "This Privacy Policy describes how we collect, use, disclose, and transfer personal information through our platforms (website and mobile applications).",
      "By accessing and using our platform, you consent to the collection and use of information as described in this policy.",
    ],
  },
  {
    title: "Information collection",
    subsections: [
      {
        subtitle: "Types of information collected",
        points: [
          "Personal name, email, postal address, phone number",
          "Date of birth, language preference, location",
          "Shipping information and IP addresses",
          "Financial information (processed by our payment partners; we never store card details)",
          "Interests and preferences",
        ],
      },
      {
        subtitle: "Collection methods",
        points: [
          "Direct submission on our platform",
          "Automatic collection via cookies and similar technologies",
          "Information from third-party sources",
          "Social media interactions",
        ],
      },
    ],
  },
  {
    title: "Purpose of information collection",
    content: [
      "We collect and use personal information to:",
      "Verify your identity",
      "Fulfil product purchases and process orders",
      "Communicate with customers",
      "Run marketing and promotional activities (with consent)",
      "Improve our service",
      "Comply with legal obligations",
    ],
  },
  {
    title: "Information sharing",
    content: [
      "We share personal information only with:",
      "Authorised affiliates and service providers (payment, logistics, communications)",
      "Third parties when you give explicit consent",
      "Authorities, in response to legal requirements or court orders",
    ],
  },
  {
    title: "Your rights under the DPDP Act, 2023",
    content: [
      "You have the right to:",
      "Access and update your personal information",
      "Opt out of marketing communications",
      "Withdraw consent at any time",
      "Request erasure of your data (subject to lawful retention for accounting, tax, and order records)",
      "Export your data — available from your account dashboard",
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <header className="mb-10">
        <h1 className="gradient-text text-3xl md:text-4xl mb-4 border-b pb-4">Privacy Policy</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          We are committed to protecting your personal information and ensuring transparency in our
          data practices.
        </p>
      </header>

      <div className="space-y-6">
        {sections.map((section, index) => (
          <article key={index} className="bg-card shadow-sm rounded-lg overflow-hidden border">
            <div className="px-6 py-4 bg-muted/50 border-b">
              <h2 className="text-xl">{section.title}</h2>
            </div>
            <div className="p-6">
              {section.content && (
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  {section.content.map((item, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              {section.subsections &&
                section.subsections.map((sub, subIdx) => (
                  <div key={subIdx} className={subIdx > 0 ? "mt-6" : ""}>
                    <h3 className="text-base font-medium mb-3">{sub.subtitle}</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      {sub.points.map((point, pIdx) => (
                        <li key={pIdx} className="leading-relaxed">
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          </article>
        ))}

        <article className="bg-card shadow-sm rounded-lg overflow-hidden border">
          <div className="px-6 py-4 bg-muted/50 border-b">
            <h2 className="text-xl">Contact</h2>
          </div>
          <div className="p-6">
            <p className="text-muted-foreground mb-4">
              For privacy concerns or queries, contact our grievance officer:
            </p>
            <address className="not-italic bg-muted p-4 rounded-md">
              <strong>Fluidlife</strong>
              <br />
              India
              <div className="mt-2">
                <strong>Email:</strong>{" "}
                <a className="underline" href="mailto:hello@fluidlife.example">
                  hello@fluidlife.example
                </a>
              </div>
            </address>
          </div>
        </article>
      </div>
    </div>
  );
}
