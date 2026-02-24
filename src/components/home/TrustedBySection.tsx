const brands = [
  "Stripe", "Notion", "Slack", "Figma", "Linear", "Vercel",
  "Shopify", "Atlassian", "HubSpot", "Zendesk", "Intercom", "Airtable",
];

export function TrustedBySection() {
  return (
    <section className="py-10 border-b border-border">
      <div className="container">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-8">
          Reviewed & compared by teams at
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {brands.map((brand) => (
            <span
              key={brand}
              className="text-base font-semibold text-muted-foreground/30 select-none"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
