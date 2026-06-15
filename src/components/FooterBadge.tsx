import { useState, useEffect } from "react";

export type FooterBadgeItem = {
  name: string;
  href: string;
  src: string;
  srcDark?: string;
  width?: number;
  height?: number;
  rel?: string;
};

function useIsDark() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  return isDark;
}

export function FooterBadge({ badge }: { badge: FooterBadgeItem }) {
  const isDark = useIsDark();
  const [failed, setFailed] = useState(false);
  const src = isDark && badge.srcDark ? badge.srcDark : badge.src;
  const label = `${badge.name} (opens in new tab)`;

  return (
    <a
      href={badge.href}
      target="_blank"
      rel={badge.rel || "noopener noreferrer"}
      aria-label={label}
      title={badge.name}
      className="inline-flex items-center"
    >
      {failed ? (
        <span
          role="img"
          aria-label={badge.name}
          className="inline-flex items-center h-[40px] px-3 rounded-md border border-white/15 bg-white/5 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          {badge.name}
        </span>
      ) : (
        <img
          src={src}
          alt={badge.name}
          width={badge.width}
          height={badge.height}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="block max-h-[54px] w-auto"
        />
      )}
    </a>
  );
}

export const DEFAULT_FOOTER_BADGES: FooterBadgeItem[] = [
  {
    name: "Featured on Startup Fame",
    href: "https://startupfa.me/s/reviewhunts?utm_source=reviewhunts.com",
    src: "https://startupfa.me/badges/featured-badge.webp",
    width: 171,
    height: 54,
  },
  {
    name: "Featured on StartupSpotlight",
    href: "https://startupspotlight.co/startup/reviewhunts",
    src: "https://startupspotlight.co/api/badge/cmqdfgeox000j15mgvctsu0ab?variant=dark&v=2",
    width: 248,
    height: 48,
    rel: "dofollow",
  },
  {
    name: "Listed on Sell With Boost",
    href: "https://sellwithboost.com",
    src: "https://sellwithboost.com/badge/listing-dark.svg",
    height: 40,
  },
  {
    name: "Featured on Startup Directory",
    href: "https://startupdirectory.net",
    src: "https://startupdirectory.net/badge/featured-light.svg",
    srcDark: "https://startupdirectory.net/badge/featured-dark.svg",
  },
  {
    name: "Listed on AI Directories",
    href: "https://www.aidirectori.es",
    src: "https://cdn.aidirectori.es/ai-tools/badges/dark-mode.png",
  },
  {
    name: "Listed on Launchpadly Startup Directory",
    href: "https://launchpadly.co/startup/reviewhunts",
    src: "https://launchpadly.co/embed/badges/startup/reviewhunts.svg?variant=light",
    srcDark: "https://launchpadly.co/embed/badges/startup/reviewhunts.svg?variant=dark",
    width: 260,
    height: 48,
  },
  {
    name: "Featured on IndieShowcase",
    href: "https://indieshowcase.io",
    src: "https://indieshowcase.io/badge/featured-light.svg",
    srcDark: "https://indieshowcase.io/badge/featured-dark.svg",
  },
  {
    name: "ReviewHunts on Product Hunt",
    href: "https://www.producthunt.com/products/reviewhunts?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-reviewhunts",
    src: "https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1171004&theme=light&t=1781529682739",
    srcDark: "https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1171004&theme=dark&t=1781529682739",
    width: 250,
    height: 54,
  },
];
