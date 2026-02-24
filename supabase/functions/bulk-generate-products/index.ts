import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "AI not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { category_id, category_name, batch_size = 25, offset = 0 } = await req.json();

    if (!category_id || !category_name) {
      return new Response(
        JSON.stringify({ success: false, error: "category_id and category_name required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get existing product names in this category to avoid duplicates
    const { data: existingProducts } = await supabase
      .from("products")
      .select("name, slug")
      .eq("category_id", category_id);
    
    const existingNames = new Set((existingProducts || []).map((p: any) => p.name.toLowerCase()));
    const existingSlugs = new Set((existingProducts || []).map((p: any) => p.slug));

    console.log(`Generating ${batch_size} ${category_name} products (offset ${offset}, ${existingNames.size} existing)`);

    const pricingModels = ["free", "freemium", "paid", "subscription", "one-time"];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: "You are a software industry database expert. Generate ONLY valid JSON arrays of real software products. No markdown, no explanation, just the JSON array.",
          },
          {
            role: "user",
            content: `Generate ${batch_size} REAL, existing ${category_name} software products (batch ${offset / batch_size + 1}, skip first ${offset} most popular ones).

Each product must be a real software that exists. Include lesser-known and niche products too, not just the top ones.

Return a JSON array where each item has:
- name: exact real product name
- tagline: one-line description (max 100 chars)  
- description: 2-3 sentence description
- website_url: real official website URL
- pricing_model: one of "free", "freemium", "paid", "subscription", "one-time"
- starting_price: monthly price in USD (null if free)
- features: array of 4-6 key features as strings
- avg_rating: realistic rating between 3.0-5.0 (one decimal)
- total_reviews: realistic review count (10-10000)
- founded_year: year company was founded (or null)
- headquarters: city, country (or null)
- company_size: one of "1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5000+"

Do NOT include these already-existing products: ${Array.from(existingNames).slice(0, 100).join(", ")}

Return ONLY the JSON array, no wrapping object.`,
          },
        ],
        temperature: 0.7,
      }),
    });

    const aiData = await aiRes.json();
    const content = aiData?.choices?.[0]?.message?.content || "";

    let products: any[] = [];
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const parsed = JSON.parse(jsonMatch[1]?.trim() || content.trim());
      products = Array.isArray(parsed) ? parsed : parsed.products || [];
    } catch (e) {
      console.error("Failed to parse AI response:", content.substring(0, 300));
      return new Response(
        JSON.stringify({ success: false, error: "Failed to parse AI response", raw: content.substring(0, 500) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for (const p of products) {
      if (!p.name) { skipped++; continue; }

      const slug = slugify(p.name);
      if (existingSlugs.has(slug) || existingNames.has(p.name.toLowerCase())) {
        skipped++;
        continue;
      }

      // Generate logo URL from website
      let logoUrl: string | null = null;
      if (p.website_url) {
        try {
          const domain = new URL(p.website_url).hostname;
          logoUrl = `https://logo.clearbit.com/${domain}`;
        } catch {}
      }

      const record = {
        name: p.name,
        slug,
        category_id,
        tagline: p.tagline || `${p.name} - ${category_name} solution`,
        description: p.description || `${p.name} is a ${category_name.toLowerCase()} software product.`,
        website_url: p.website_url || null,
        logo_url: logoUrl,
        pricing_model: pricingModels.includes(p.pricing_model) ? p.pricing_model : "freemium",
        starting_price: p.starting_price || null,
        features: Array.isArray(p.features) ? p.features : [],
        avg_rating: p.avg_rating ? Math.min(5, Math.max(0, Number(p.avg_rating))) : null,
        total_reviews: p.total_reviews ? Math.max(0, Number(p.total_reviews)) : null,
        founded_year: p.founded_year || null,
        headquarters: p.headquarters || null,
        company_size: p.company_size || null,
        is_active: true,
        published_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("products").insert(record);
      if (error) {
        // Try with modified slug if duplicate
        if (error.message?.includes("duplicate") || error.code === "23505") {
          record.slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
          const { error: retryError } = await supabase.from("products").insert(record);
          if (retryError) { errors++; } else { inserted++; }
        } else {
          errors++;
        }
      } else {
        inserted++;
      }

      existingSlugs.add(record.slug);
      existingNames.add(p.name.toLowerCase());
    }

    console.log(`Batch done: ${inserted} inserted, ${skipped} skipped, ${errors} errors`);

    return new Response(
      JSON.stringify({ success: true, inserted, skipped, errors, total_generated: products.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
