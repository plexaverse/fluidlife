import { AmazonIcon } from "./amazon-icon";

interface SocialIconsProps {
  iconColor?: string;
}

interface SocialLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

/**
 * Social row (Amazon, Instagram) used at the bottom of the contact info block.
 * Ported from takekare with the same SVG markup. Update the hrefs once
 * Fluidlife's own profiles are live.
 */
export function SocialIcons({ iconColor = "black" }: SocialIconsProps) {
  const socialLinks: SocialLink[] = [
    {
      href: "https://www.amazon.in",
      label: "Amazon",
      icon: <AmazonIcon color={iconColor} width={16} height={16} />,
    },
    {
      href: "https://www.instagram.com",
      label: "Instagram",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke={iconColor}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      ),
    },
  ];

  return (
    <ul className="flex space-x-8 text-sm mb-10 mt-4">
      {socialLinks.map((link) => (
        <li key={link.href}>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            className="hover:underline"
          >
            <div className="w-8 h-8 rounded-full border border-gray-500 flex items-center justify-center">
              {link.icon}
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
}
