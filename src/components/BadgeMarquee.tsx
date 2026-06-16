import { FooterBadge, type FooterBadgeItem } from "./FooterBadge";

type Props = {
  badges: FooterBadgeItem[];
  speedSeconds?: number;
  ariaLabel?: string;
};

export function BadgeMarquee({ badges, speedSeconds = 40, ariaLabel = "Featured on / listed on directories" }: Props) {
  if (!badges?.length) return null;

  // Duplicate the list to enable a seamless -50% translate loop
  const loop = [...badges, ...badges];

  return (
    <nav
      aria-label={ariaLabel}
      className="badge-marquee relative w-full overflow-hidden py-4"
      style={{
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0, #000 8%, #000 92%, transparent 100%)",
        maskImage:
          "linear-gradient(to right, transparent 0, #000 8%, #000 92%, transparent 100%)",
      }}
    >
      <div
        className="badge-marquee-track flex w-max items-center gap-10"
        style={{ animationDuration: `${speedSeconds}s` }}
      >
        {loop.map((b, i) => (
          <div
            key={`${b.name}-${i}`}
            className="shrink-0 opacity-80 hover:opacity-100 transition-opacity"
            aria-hidden={i >= badges.length ? "true" : undefined}
          >
            <FooterBadge badge={b} />
          </div>
        ))}
      </div>
    </nav>
  );
}
