import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product_id, question } = await req.json();
    if (!product_id || !question) {
      return new Response(JSON.stringify({ error: "product_id and question required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Fetch product info
    const { data: product } = await sb
      .from("products")
      .select("name, description, tagline")
      .eq("id", product_id)
      .single();

    // Fetch approved reviews
    const { data: reviews } = await sb
      .from("reviews")
      .select("title, body, pros, cons, overall_rating, reviewer_role, company_size")
      .eq("product_id", product_id)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(50);

    const reviewText = (reviews || [])
      .map((r: any, i: number) =>
        `Review ${i + 1} (${r.overall_rating}/5): ${r.title || ""}\nPros: ${r.pros || "N/A"}\nCons: ${r.cons || "N/A"}\n${r.body || ""}`
      )
      .join("\n---\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a helpful product Q&A assistant for "${product?.name || "this product"}". Answer questions based ONLY on the review data provided. Be concise and cite specific reviews when possible. If the reviews don't contain enough info to answer, say so. Product: ${product?.tagline || ""}\n\nReview Data:\n${reviewText}`,
          },
          { role: "user", content: question },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exceeded." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "No answer generated.";

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("product-qa-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
