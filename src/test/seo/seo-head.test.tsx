// SEO regression: render SeoHead in jsdom under HelmetProvider for
// representative "key route" configs and assert document.head output.
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { SeoHead } from "@/components/SeoHead";

afterEach(() => {
  cleanup();
  // Helmet leaves tags on document.head between tests; reset.
  document.head.querySelectorAll(
    "[data-rh],title,meta[name],meta[property],link[rel=canonical],script[type='application/ld+json']",
  ).forEach((el) => el.remove());
});

async function renderSeo(ui: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  await act(async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <MemoryRouter>{ui}</MemoryRouter>
        </HelmetProvider>
      </QueryClientProvider>,
    );
  });
  // Helmet defers head mutations via requestAnimationFrame; wait a couple frames.
  await new Promise((r) => setTimeout(r, 50));
  await act(async () => { await Promise.resolve(); });
  return {
    title: document.title,
    metas: Array.from(document.head.querySelectorAll("meta")) as HTMLMetaElement[],
    canonicals: Array.from(
      document.head.querySelectorAll("link[rel='canonical']"),
    ) as HTMLLinkElement[],
    jsonLdBlocks: Array.from(
      document.head.querySelectorAll("script[type='application/ld+json']"),
    ).map((s) => {
      try { return JSON.parse(s.textContent || ""); } catch { return null; }
    }).filter(Boolean),
  };
}

const metaContent = (metas: HTMLMetaElement[], attr: "name" | "property", key: string) =>
  metas.find((m) => m.getAttribute(attr) === key)?.getAttribute("content") || "";

describe("SeoHead — Home route", () => {
  it("emits title, description, single canonical, og:* + twitter:*", async () => {
    const { title, metas, canonicals } = await renderSeo(
      <SeoHead
        title="Discover the best software"
        description="Real user reviews, AI-powered insights, and curated buyer guides."
        canonicalUrl="https://reviewhunts.com/"
      />,
    );
    expect(title).toMatch(/Discover the best software/);
    expect(metaContent(metas, "name", "description").length).toBeGreaterThan(20);
    expect(canonicals).toHaveLength(1);
    expect(canonicals[0].href).toBe("https://reviewhunts.com/");
    expect(metaContent(metas, "property", "og:title")).toMatch(/Discover the best software/);
    expect(metaContent(metas, "property", "og:url")).toBe("https://reviewhunts.com/");
    expect(metaContent(metas, "name", "twitter:card")).toBe("summary_large_image");
  });
});

describe("SeoHead — Blog index (CollectionPage + Blog JSON-LD)", () => {
  it("emits Blog and CollectionPage JSON-LD blocks", async () => {
    const { jsonLdBlocks } = await renderSeo(
      <SeoHead
        title="Blog"
        description="Articles."
        canonicalUrl="https://reviewhunts.com/blog"
        jsonLd={[
          { "@context": "https://schema.org", "@type": "Blog", name: "Blog", url: "https://reviewhunts.com/blog" },
          { "@context": "https://schema.org", "@type": "CollectionPage", name: "Blog", url: "https://reviewhunts.com/blog" },
        ]}
      />,
    );
    const types = jsonLdBlocks.map((b: any) => b["@type"]);
    expect(types).toContain("Blog");
    expect(types).toContain("CollectionPage");
  });
});

describe("SeoHead — Product route (SoftwareApplication + BreadcrumbList + FAQPage)", () => {
  it("emits all expected schemas and a product-specific canonical", async () => {
    const { jsonLdBlocks, canonicals, metas } = await renderSeo(
      <SeoHead
        title="Acme CRM reviews"
        description="Real users review Acme CRM."
        canonicalUrl="https://reviewhunts.com/product/acme-crm"
        type="product"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Acme CRM",
            applicationCategory: "BusinessApplication",
            aggregateRating: { "@type": "AggregateRating", ratingValue: "4.5", bestRating: "5", ratingCount: 12 },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://reviewhunts.com" },
              { "@type": "ListItem", position: 2, name: "Acme CRM" },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              { "@type": "Question", name: "Does it integrate?", acceptedAnswer: { "@type": "Answer", text: "Yes." } },
            ],
          },
        ]}
      />,
    );
    const types = jsonLdBlocks.map((b: any) => b["@type"]);
    expect(types).toEqual(expect.arrayContaining(["SoftwareApplication", "BreadcrumbList", "FAQPage"]));
    const sw = jsonLdBlocks.find((b: any) => b["@type"] === "SoftwareApplication");
    expect(sw.aggregateRating.ratingValue).toBe("4.5");
    expect(canonicals).toHaveLength(1);
    expect(canonicals[0].href).toBe("https://reviewhunts.com/product/acme-crm");
    expect(metaContent(metas, "property", "og:type")).toBe("product");
  });
});

describe("SeoHead — fallback canonical", () => {
  it("derives a self-referencing canonical from window.location when not given", async () => {
    const { canonicals } = await renderSeo(<SeoHead title="Some page" description="x" />);
    expect(canonicals).toHaveLength(1);
    expect(canonicals[0].href).toMatch(/^http:\/\/localhost\//);
  });
});

describe("SeoHead — JSON-LD blocks must be valid JSON", () => {
  it("each script tag parses cleanly", async () => {
    const { jsonLdBlocks } = await renderSeo(
      <SeoHead
        title="t"
        description="d"
        jsonLd={[{ "@context": "https://schema.org", "@type": "WebPage", name: "x" }]}
      />,
    );
    expect(jsonLdBlocks.length).toBeGreaterThan(0);
    for (const b of jsonLdBlocks) expect(b["@context"]).toBe("https://schema.org");
  });
});
