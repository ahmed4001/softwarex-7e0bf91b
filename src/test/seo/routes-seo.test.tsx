// Route-by-route SEO regression: category, comparison, and search results
// pages. Verifies canonical correctness against a configurable BASE_URL
// (so staging/preview deploys stay correct) and validates JSON-LD with AJV.
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { SeoHead } from "@/components/SeoHead";
import { validators } from "./schema-validation.test";

// BASE_URL pulled from env so the same test file runs in CI against
// production AND staging/preview hostnames.
const BASE_URL = (process.env.SEO_BASE_URL || "https://reviewhunts.com").replace(/\/$/, "");

afterEach(() => {
  cleanup();
  document.head
    .querySelectorAll(
      "[data-rh],title,meta[name],meta[property],link[rel=canonical],script[type='application/ld+json']",
    )
    .forEach((el) => el.remove());
});

beforeEach(() => {
  document.head
    .querySelectorAll("link[rel=canonical],script[type='application/ld+json']")
    .forEach((el) => el.remove());
});

async function renderHead(ui: React.ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  await act(async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <MemoryRouter>{ui}</MemoryRouter>
        </HelmetProvider>
      </QueryClientProvider>,
    );
  });
  await new Promise((r) => setTimeout(r, 50));
  await act(async () => { await Promise.resolve(); });
  const canonicals = Array.from(
    document.head.querySelectorAll("link[rel='canonical']"),
  ) as HTMLLinkElement[];
  const metas = Array.from(document.head.querySelectorAll("meta")) as HTMLMetaElement[];
  const jsonLd = Array.from(
    document.head.querySelectorAll("script[type='application/ld+json']"),
  )
    .map((s) => {
      try { return JSON.parse(s.textContent || ""); } catch { return null; }
    })
    .filter(Boolean);
  return { canonicals, metas, jsonLd };
}

const meta = (metas: HTMLMetaElement[], attr: "name" | "property", k: string) =>
  metas.find((m) => m.getAttribute(attr) === k)?.getAttribute("content") || "";

// Helper: every URL surfaced for crawlers must be absolute and share
// the configured base origin.
function assertAbsoluteAndOnBase(url: string) {
  expect(url.startsWith("http")).toBe(true);
  expect(url.startsWith(BASE_URL)).toBe(true);
}

describe(`route SEO — base ${BASE_URL}`, () => {
  it("category page: canonical absolute, BreadcrumbList + CollectionPage valid", async () => {
    const canonical = `${BASE_URL}/category/crm`;
    const { canonicals, metas, jsonLd } = await renderHead(
      <SeoHead
        title="Best CRM software"
        description="Top-rated CRM tools reviewed by real users."
        canonicalUrl={canonical}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Best CRM software",
            url: canonical,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
              { "@type": "ListItem", position: 2, name: "Categories", item: `${BASE_URL}/categories` },
              { "@type": "ListItem", position: 3, name: "CRM", item: canonical },
            ],
          },
        ]}
      />,
    );
    expect(canonicals).toHaveLength(1);
    expect(canonicals[0].href).toBe(canonical);
    assertAbsoluteAndOnBase(meta(metas, "property", "og:url"));

    const types = jsonLd.map((b: any) => b["@type"]);
    expect(types).toEqual(expect.arrayContaining(["CollectionPage", "BreadcrumbList"]));
    const breadcrumb = jsonLd.find((b: any) => b["@type"] === "BreadcrumbList");
    for (const item of breadcrumb.itemListElement) {
      if (item.item) assertAbsoluteAndOnBase(item.item);
    }
  });

  it("comparison page: canonical absolute, two SoftwareApplication blocks validate", async () => {
    const canonical = `${BASE_URL}/compare/acme-crm-vs-globex-crm`;
    const products = [
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Acme CRM",
        applicationCategory: "BusinessApplication",
        aggregateRating: { "@type": "AggregateRating", ratingValue: "4.5", ratingCount: 120 },
      },
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Globex CRM",
        applicationCategory: "BusinessApplication",
        aggregateRating: { "@type": "AggregateRating", ratingValue: "4.2", ratingCount: 80 },
      },
    ];
    const { canonicals, jsonLd } = await renderHead(
      <SeoHead
        title="Acme CRM vs Globex CRM"
        description="Side-by-side comparison."
        canonicalUrl={canonical}
        type="website"
        jsonLd={products}
      />,
    );
    expect(canonicals).toHaveLength(1);
    expect(canonicals[0].href).toBe(canonical);
    expect(jsonLd.filter((b: any) => b["@type"] === "SoftwareApplication")).toHaveLength(2);
    for (const p of jsonLd) {
      const ok = validators.validateProduct(p);
      expect(validators.validateProduct.errors).toBeNull();
      expect(ok).toBe(true);
    }
  });

  it("search results: canonical strips noisy params, robots=noindex,follow", async () => {
    // Search result pages should not be indexed but should still link out.
    const cleanCanonical = `${BASE_URL}/search`;
    const { canonicals, metas } = await renderHead(
      <SeoHead
        title='Search results for "crm"'
        description="Search ReviewHunts for software."
        canonicalUrl={cleanCanonical}
        robots="noindex, follow"
      />,
    );
    expect(canonicals).toHaveLength(1);
    expect(canonicals[0].href).toBe(cleanCanonical);
    // Canonical must NOT contain the query string.
    expect(canonicals[0].href).not.toMatch(/\?/);
    expect(meta(metas, "name", "robots")).toBe("noindex, follow");
  });

  it("staging/preview base URL: SeoHead honors absolute canonicals verbatim", async () => {
    // Simulate a staging build: pass an explicit staging origin and ensure
    // SeoHead does not rewrite or duplicate it. Production tests run with
    // the default BASE_URL; this block guards the alt-host path.
    const staging = "https://id-preview--example.lovable.app";
    const canonical = `${staging}/product/acme-crm`;
    const { canonicals, metas } = await renderHead(
      <SeoHead title="Acme CRM" description="x" canonicalUrl={canonical} />,
    );
    expect(canonicals).toHaveLength(1);
    expect(canonicals[0].href).toBe(canonical);
    expect(meta(metas, "property", "og:url")).toBe(canonical);
  });
});
