// Enriches products with features, integrations, pros/cons, screenshots & founded_year.
// POST body: { ids?: string[], batchSize?: number, offset?: number, overwrite?: boolean }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FIRECRAWL_V2 = "https://api.firecrawl.dev/v2";

async function scrapeMarkdown(apiKey: string, url: string): Promise<string> {
  const res = await fetch(`${FIRECRAWL_V2}/scrape`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || `scrape ${res.status}`);
  return (json?.data?.markdown ?? json?.markdown ?? "").slice(0, 16000);
}

async function scrapeScreenshot(apiKey: string, url: string): Promise<string | null> {
  try {
    const res = await fetch(`${FIRECRAWL_V2}/scrape`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["screenshot"], waitFor: 2500 }),
    });
    const json = await res.json();
    if (!res.ok) return null;
    return json?.data?.screenshot ?? json?.screenshot ?? null;
  } catch { return null; }
}

async function aiExtract(apiKey: string, name: string, websiteUrl: string, markdown: string) {
  const systemPrompt = `You enrich a SaaS product profile from its homepage content. Return ONLY JSON.
Schema:
{
  "tagline": string|null (<=90 chars),
  "description": string|null (2-3 paragraphs markdown describing what the product does),
  "features": string[] (4-10 short feature names),
  "integrations": string[] (well-known integration partner names mentioned, e.g. "Slack","Salesforce"),
  "pros_summary": string|null (1-2 short sentences listing top strengths),
  "cons_summary": string|null (1-2 short sentences with honest limitations or trade-offs),
  "founded_year": number|null (4-digit year if discoverable from page footer/about, else null),
  "headquarters": string|null (city, country if stated),
  "pricing_description": string|null (1-2 sentences summarizing pricing model)
}
Be factual. If a field is not clearly supported by the content, return null or [].`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Product: ${name}\nWebsite: ${websiteUrl}\n\n${markdown}` },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`AI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  try { return JSON.parse(json?.choices?.[0]?.message?.content ?? "{}"); }
  catch { return {}; }
}

async function uploadScreenshot(
  supabase: any,
  productId: string,
  dataUrlOrBase64: string,
): Promise<string | null> {
  try {
    let b64 = dataUrlOrBase64;
    let contentType = "image/png";
    const m = /^data:(image\/[a-z]+);base64,(.+)$/i.exec(dataUrlOrBase64);
    if (m) { contentType = m[1]; b64 = m[2]; }
    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const ext = contentType.split("/")[1] || "png";
    const path = `screenshots/${productId}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images")
      .upload(path, bin, { contentType, upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data?.publicUrl ?? null;
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY missing");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const ids: string[] | undefined = Array.isArray(body.ids) ? body.ids : undefined;
    const batchSize = Math.max(1, Math.min(Number(body.batchSize) || 5, 25));
    const offset = Math.max(0, Number(body.offset) || 0);
    const overwrite = Boolean(body.overwrite);

    let q = supabase
      .from("products")
      .select("id, name, slug, website_url, features, integrations, pros_summary, cons_summary, founded_year, screenshots, tagline, description")
      .eq("is_active", true)
      .not("website_url", "is", null)
      .neq("website_url", "");
    if (ids?.length) q = q.in("id", ids);
    else q = q.range(offset, offset + batchSize - 1);
    const { data: rows, error } = await q;
    if (error) throw error;

    const results: any[] = [];
    let succeeded = 0, failed = 0;

    for (const p of rows || []) {
      try {
        const md = await scrapeMarkdown(FIRECRAWL_API_KEY, p.website_url);
        if (!md) { failed++; results.push({ id: p.id, status: "no_content" }); continue; }
        const ai = await aiExtract(LOVABLE_API_KEY, p.name, p.website_url, md);

        const update: any = {};
        const setIf = (key: string, val: any, isArray = false) => {
          const existing = (p as any)[key];
          const empty = isArray
            ? !Array.isArray(existing) || existing.length === 0
            : !existing;
          const hasNew = isArray ? Array.isArray(val) && val.length > 0 : !!val;
          if (hasNew && (overwrite || empty)) update[key] = val;
        };
        setIf("tagline", ai.tagline);
        setIf("description", ai.description);
        setIf("features", ai.features, true);
        setIf("integrations", ai.integrations, true);
        setIf("pros_summary", ai.pros_summary);
        setIf("cons_summary", ai.cons_summary);
        setIf("pricing_description", ai.pricing_description);
        setIf("headquarters", ai.headquarters);
        if (typeof ai.founded_year === "number" && ai.founded_year > 1900 && ai.founded_year <= new Date().getFullYear()) {
          if (overwrite || !p.founded_year) update.founded_year = ai.founded_year;
        }

        // Screenshot — only when missing or overwrite
        const hasShots = Array.isArray(p.screenshots) && p.screenshots.length > 0;
        if (!hasShots || overwrite) {
          const shot = await scrapeScreenshot(FIRECRAWL_API_KEY, p.website_url);
          if (shot) {
            const uploaded = await uploadScreenshot(supabase, p.id, shot);
            if (uploaded) {
              update.screenshots = overwrite ? [uploaded] : [...(p.screenshots || []), uploaded];
            }
          }
        }

        if (Object.keys(update).length > 0) {
          const { error: upErr } = await supabase.from("products").update(update).eq("id", p.id);
          if (upErr) throw upErr;
          succeeded++;
          results.push({ id: p.id, name: p.name, status: "updated", fields: Object.keys(update) });
        } else {
          results.push({ id: p.id, name: p.name, status: "no_changes" });
        }
      } catch (e) {
        failed++;
        results.push({ id: p.id, name: p.name, status: "error", reason: String(e).slice(0, 200) });
      }
    }

    const processed = (rows || []).length;
    return new Response(
      JSON.stringify({
        success: true,
        processed,
        succeeded,
        failed,
        nextOffset: ids?.length ? null : offset + processed,
        done: ids?.length ? true : processed < batchSize,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
