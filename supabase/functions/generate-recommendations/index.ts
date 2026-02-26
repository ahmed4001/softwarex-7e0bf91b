import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { user_id } = await req.json();
    if (!user_id) throw new Error("user_id required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's reviews
    const { data: reviews } = await supabase
      .from("reviews")
      .select("product_id, overall_rating, products(name, category_id)")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(20);

    // Get user's saved products
    const { data: saved } = await supabase
      .from("saved_products")
      .select("product_id, products(name, category_id)")
      .eq("user_id", user_id)
      .limit(20);

    // Get user's profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("industry, company_size")
      .eq("user_id", user_id)
      .single();

    // Collect category IDs user is interested in
    const categoryIds = new Set<string>();
    const reviewedProductIds = new Set<string>();
    const savedProductIds = new Set<string>();

    (reviews || []).forEach((r: any) => {
      if (r.product_id) reviewedProductIds.add(r.product_id);
      if (r.products?.category_id) categoryIds.add(r.products.category_id);
    });
    (saved || []).forEach((s: any) => {
      if (s.product_id) savedProductIds.add(s.product_id);
      if (s.products?.category_id) categoryIds.add(s.products.category_id);
    });

    const excludeIds = [...reviewedProductIds, ...savedProductIds];

    // Find candidate products from same categories
    let candidates: any[] = [];
    if (categoryIds.size > 0) {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, tagline, avg_rating, total_reviews, category_id")
        .in("category_id", [...categoryIds])
        .eq("is_active", true)
        .order("avg_rating", { ascending: false })
        .limit(30);
      candidates = (data || []).filter((p: any) => !excludeIds.includes(p.id));
    }

    if (candidates.length === 0) {
      // Fallback: top rated products
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, tagline, avg_rating, total_reviews, category_id")
        .eq("is_active", true)
        .order("avg_rating", { ascending: false })
        .limit(20);
      candidates = (data || []).filter((p: any) => !excludeIds.includes(p.id));
    }

    if (candidates.length === 0) {
      return new Response(JSON.stringify({ success: true, count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use AI to rank and explain
    const reviewedNames = (reviews || []).map((r: any) => `${r.products?.name} (rated ${r.overall_rating}/5)`).join(", ");
    const savedNames = (saved || []).map((s: any) => s.products?.name).join(", ");
    const candidateList = candidates.slice(0, 15).map((c: any) => `${c.name}: ${c.tagline || "no description"} (${c.avg_rating}★, ${c.total_reviews} reviews)`).join("\n");

    const prompt = `Based on a user's activity:
- Reviewed: ${reviewedNames || "none"}
- Saved: ${savedNames || "none"}
- Industry: ${profile?.industry || "unknown"}
- Company size: ${profile?.company_size || "unknown"}

Pick the top 6 most relevant products from this list and explain why each is a good fit in one short sentence:
${candidateList}

Return a JSON array of objects with "name" (exact product name) and "reason" (one sentence).`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a product recommendation engine. Return only valid JSON arrays." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "recommend_products",
            description: "Return recommended products with reasons",
            parameters: {
              type: "object",
              properties: {
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      reason: { type: "string" },
                    },
                    required: ["name", "reason"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["recommendations"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "recommend_products" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    let recs: { name: string; reason: string }[] = [];

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      recs = parsed.recommendations || [];
    }

    // Map names back to product IDs
    const nameMap = new Map(candidates.map((c: any) => [c.name.toLowerCase(), c]));

    // Clear old recommendations
    await supabase.from("user_recommendations").delete().eq("user_id", user_id);

    // Insert new ones
    const inserts = recs
      .map((rec, idx) => {
        const product = nameMap.get(rec.name.toLowerCase());
        if (!product) return null;
        return {
          user_id,
          product_id: product.id,
          score: 100 - idx * 10,
          reason: rec.reason,
        };
      })
      .filter(Boolean);

    if (inserts.length > 0) {
      await supabase.from("user_recommendations").insert(inserts);
    }

    return new Response(JSON.stringify({ success: true, count: inserts.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-recommendations error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
