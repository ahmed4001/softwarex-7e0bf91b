import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { List } from "lucide-react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface Props {
  html: string;
  containerSelector?: string;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export function TableOfContents({ html, containerSelector = "[data-post-body]" }: Props) {
  const headings = useMemo<Heading[]>(() => {
    if (!html) return [];
    const div = document.createElement("div");
    div.innerHTML = html;
    return Array.from(div.querySelectorAll("h2, h3")).map((el, i) => ({
      id: el.id || `${slugify(el.textContent || `section-${i}`)}-${i}`,
      text: el.textContent || "",
      level: Number(el.tagName[1]),
    }));
  }, [html]);

  const [activeId, setActiveId] = useState<string>("");

  // Inject ids into the rendered DOM after mount
  useEffect(() => {
    const root = document.querySelector(containerSelector);
    if (!root) return;
    const els = root.querySelectorAll("h2, h3");
    els.forEach((el, i) => {
      if (!el.id && headings[i]) el.id = headings[i].id;
    });
  }, [headings, containerSelector, html]);

  // Scroll-spy
  useEffect(() => {
    if (!headings.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0.1 }
    );
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <nav aria-label="Table of contents" className="text-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        <List className="h-3.5 w-3.5" /> On this page
      </div>
      <ul className="space-y-1.5 border-l border-border">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={cn(
                "block py-1 -ml-px border-l-2 transition-colors hover:text-foreground",
                h.level === 3 ? "pl-6" : "pl-4",
                activeId === h.id
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-muted-foreground"
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
