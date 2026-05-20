import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Helmet } from "react-helmet-async";

export interface Crumb {
  label: string;
  to?: string;
}

interface Props {
  items: Crumb[];
}

export function Breadcrumbs({ items }: Props) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.to && { item: `${origin}${c.to}` }),
    })),
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <nav aria-label="Breadcrumb" className="text-sm">
        <ol className="flex items-center gap-1.5 flex-wrap text-muted-foreground">
          {items.map((c, i) => (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-border" />}
              {c.to && i < items.length - 1 ? (
                <Link to={c.to} className="hover:text-foreground transition-colors">{c.label}</Link>
              ) : (
                <span className="text-foreground/80 truncate max-w-[280px]">{c.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
