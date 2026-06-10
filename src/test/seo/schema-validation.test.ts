// JSON-LD schema validation via AJV. Fails when required fields for
// FAQPage / BlogPosting / Product are missing or malformed.
import { describe, it, expect } from "vitest";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// Minimal but meaningful schemas — enforce the fields Google's rich
// results docs flag as required.
const faqPageSchema = {
  type: "object",
  required: ["@context", "@type", "mainEntity"],
  properties: {
    "@context": { const: "https://schema.org" },
    "@type": { const: "FAQPage" },
    mainEntity: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["@type", "name", "acceptedAnswer"],
        properties: {
          "@type": { const: "Question" },
          name: { type: "string", minLength: 1 },
          acceptedAnswer: {
            type: "object",
            required: ["@type", "text"],
            properties: {
              "@type": { const: "Answer" },
              text: { type: "string", minLength: 1 },
            },
          },
        },
      },
    },
  },
};

const blogPostingSchema = {
  type: "object",
  required: ["@context", "@type", "headline", "author", "datePublished"],
  properties: {
    "@context": { const: "https://schema.org" },
    "@type": { const: "BlogPosting" },
    headline: { type: "string", minLength: 1, maxLength: 110 },
    author: {
      oneOf: [
        { type: "object", required: ["@type", "name"] },
        { type: "array", minItems: 1 },
      ],
    },
    datePublished: { type: "string", format: "date-time" },
    dateModified: { type: "string", format: "date-time" },
    image: {
      oneOf: [
        { type: "string", format: "uri" },
        { type: "array", items: { type: "string", format: "uri" } },
        { type: "object" },
      ],
    },
  },
};

const productSchema = {
  type: "object",
  required: ["@context", "@type", "name"],
  properties: {
    "@context": { const: "https://schema.org" },
    "@type": { enum: ["Product", "SoftwareApplication"] },
    name: { type: "string", minLength: 1 },
    aggregateRating: {
      type: "object",
      required: ["@type", "ratingValue", "ratingCount"],
      properties: {
        "@type": { const: "AggregateRating" },
        ratingValue: { type: ["string", "number"] },
        ratingCount: { type: ["string", "number"] },
      },
    },
    offers: {
      type: "object",
      required: ["@type", "price", "priceCurrency"],
    },
  },
};

const validateFaq = ajv.compile(faqPageSchema);
const validateBlog = ajv.compile(blogPostingSchema);
const validateProduct = ajv.compile(productSchema);

describe("JSON-LD schema validation", () => {
  it("accepts a well-formed FAQPage", () => {
    const ok = validateFaq({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "Q?", acceptedAnswer: { "@type": "Answer", text: "A." } },
      ],
    });
    expect(validateFaq.errors).toBeNull();
    expect(ok).toBe(true);
  });

  it("rejects FAQPage missing mainEntity", () => {
    const ok = validateFaq({ "@context": "https://schema.org", "@type": "FAQPage" });
    expect(ok).toBe(false);
    expect(validateFaq.errors?.some((e) => e.params.missingProperty === "mainEntity")).toBe(true);
  });

  it("rejects FAQPage Question missing acceptedAnswer", () => {
    const ok = validateFaq({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [{ "@type": "Question", name: "Q?" }],
    });
    expect(ok).toBe(false);
  });

  it("accepts a well-formed BlogPosting", () => {
    const ok = validateBlog({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: "How we ship",
      author: { "@type": "Person", name: "Jane" },
      datePublished: "2026-01-01T00:00:00.000Z",
      dateModified: "2026-01-02T00:00:00.000Z",
      image: "https://reviewhunts.com/og.png",
    });
    expect(validateBlog.errors).toBeNull();
    expect(ok).toBe(true);
  });

  it("rejects BlogPosting missing headline/author/datePublished", () => {
    const ok = validateBlog({ "@context": "https://schema.org", "@type": "BlogPosting" });
    expect(ok).toBe(false);
    const missing = validateBlog.errors?.map((e) => e.params.missingProperty);
    expect(missing).toEqual(expect.arrayContaining(["headline", "author", "datePublished"]));
  });

  it("rejects BlogPosting with malformed datePublished", () => {
    const ok = validateBlog({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: "x",
      author: { "@type": "Person", name: "Jane" },
      datePublished: "not-a-date",
    });
    expect(ok).toBe(false);
  });

  it("accepts a well-formed SoftwareApplication with aggregateRating", () => {
    const ok = validateProduct({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Acme CRM",
      aggregateRating: { "@type": "AggregateRating", ratingValue: "4.5", ratingCount: 12 },
    });
    expect(validateProduct.errors).toBeNull();
    expect(ok).toBe(true);
  });

  it("rejects Product missing name", () => {
    const ok = validateProduct({ "@context": "https://schema.org", "@type": "Product" });
    expect(ok).toBe(false);
    expect(validateProduct.errors?.some((e) => e.params.missingProperty === "name")).toBe(true);
  });

  it("rejects Product aggregateRating missing ratingCount", () => {
    const ok = validateProduct({
      "@context": "https://schema.org",
      "@type": "Product",
      name: "x",
      aggregateRating: { "@type": "AggregateRating", ratingValue: 4.5 },
    });
    expect(ok).toBe(false);
  });
});

// Re-export so other tests can reuse the validators.
export const validators = { validateFaq, validateBlog, validateProduct };
