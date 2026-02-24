import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId, websiteUrl, productSlug, mode } = await req.json();
    // mode: "logo" | "screenshot" | "both"

    if (!productId || !websiteUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "productId and websiteUrl are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl connector not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let formattedUrl = websiteUrl.trim();
    if (!formattedUrl.startsWith("http")) formattedUrl = `https://${formattedUrl}`;

    const slug = productSlug || productId;
    const fetchMode = mode || "both";
    const results: { logoUrl?: string; screenshotUrl?: string } = {};

    // ── Scrape with Firecrawl ──────────────────────────────
    const formats: string[] = [];
    if (fetchMode === "logo" || fetchMode === "both") formats.push("links", "markdown");
    if (fetchMode === "screenshot" || fetchMode === "both") formats.push("screenshot");

    console.log(`Scraping ${formattedUrl} with formats: ${formats.join(", ")}`);

    const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats,
        waitFor: 3000,
        onlyMainContent: false,
      }),
    });

    if (!scrapeRes.ok) {
      const errText = await scrapeRes.text();
      console.error("Firecrawl error:", scrapeRes.status, errText);
      
      // Fallback for logo: try Clearbit
      if (fetchMode === "logo" || fetchMode === "both") {
        try {
          const domain = new URL(formattedUrl).hostname.replace("www.", "");
          const clearbitUrl = `https://logo.clearbit.com/${domain}`;
          const testRes = await fetch(clearbitUrl, { method: "HEAD" });
          if (testRes.ok) {
            results.logoUrl = clearbitUrl;
            await supabase.from("products").update({ logo_url: clearbitUrl }).eq("id", productId);
          }
        } catch { /* skip */ }
      }

      return new Response(
        JSON.stringify({ success: true, results, fallback: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const scrapeData = await scrapeRes.json();
    const pageData = scrapeData.data || scrapeData;

    // ── Process Screenshot ─────────────────────────────────
    if ((fetchMode === "screenshot" || fetchMode === "both") && pageData.screenshot) {
      try {
        // screenshot is a base64 string or URL
        let screenshotBytes: Uint8Array;
        
        if (pageData.screenshot.startsWith("http")) {
          const imgRes = await fetch(pageData.screenshot);
          screenshotBytes = new Uint8Array(await imgRes.arrayBuffer());
        } else {
          // base64
          const base64 = pageData.screenshot.replace(/^data:image\/\w+;base64,/, "");
          const binaryStr = atob(base64);
          screenshotBytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            screenshotBytes[i] = binaryStr.charCodeAt(i);
          }
        }

        const screenshotPath = `screenshots/${slug}-${Date.now()}.png`;
        const { error: upErr } = await supabase.storage
          .from("product-images")
          .upload(screenshotPath, screenshotBytes, {
            contentType: "image/png",
            upsert: true,
          });

        if (upErr) {
          console.error("Screenshot upload error:", upErr);
        } else {
          const { data: urlData } = supabase.storage
            .from("product-images")
            .getPublicUrl(screenshotPath);
          results.screenshotUrl = urlData.publicUrl;

          // Add to product screenshots array
          const { data: existing } = await supabase
            .from("products")
            .select("screenshots")
            .eq("id", productId)
            .single();

          const currentScreenshots = Array.isArray(existing?.screenshots) ? existing.screenshots : [];
          if (!currentScreenshots.includes(urlData.publicUrl)) {
            currentScreenshots.push(urlData.publicUrl);
            await supabase
              .from("products")
              .update({ screenshots: currentScreenshots })
              .eq("id", productId);
          }
        }
      } catch (e) {
        console.error("Screenshot processing error:", e);
      }
    }

    // ── Process Logo ───────────────────────────────────────
    if (fetchMode === "logo" || fetchMode === "both") {
      try {
        const domain = new URL(formattedUrl).hostname.replace("www.", "");

        // Strategy 1: Try extracting logo from page metadata
        const metadata = pageData.metadata || {};
        let logoSrc = metadata.ogImage || null;

        // Strategy 2: Try common favicon/logo patterns
        if (!logoSrc) {
          const logoCandidates = [
            `https://logo.clearbit.com/${domain}`,
            `${formattedUrl}/favicon.ico`,
            `https://${domain}/apple-touch-icon.png`,
            `https://${domain}/favicon-32x32.png`,
          ];

          for (const candidate of logoCandidates) {
            try {
              const testRes = await fetch(candidate, { method: "HEAD", redirect: "follow" });
              if (testRes.ok) {
                const ct = testRes.headers.get("content-type") || "";
                if (ct.includes("image")) {
                  logoSrc = candidate;
                  break;
                }
              }
            } catch { /* skip */ }
          }
        }

        if (logoSrc) {
          // Download and re-upload to our storage for reliability
          try {
            const imgRes = await fetch(logoSrc);
            if (imgRes.ok) {
              const contentType = imgRes.headers.get("content-type") || "image/png";
              const ext = contentType.includes("svg") ? "svg" : contentType.includes("ico") ? "ico" : "png";
              const logoPath = `logos/${slug}-${Date.now()}.${ext}`;
              const logoBytes = new Uint8Array(await imgRes.arrayBuffer());

              const { error: upErr } = await supabase.storage
                .from("product-images")
                .upload(logoPath, logoBytes, {
                  contentType,
                  upsert: true,
                });

              if (!upErr) {
                const { data: urlData } = supabase.storage
                  .from("product-images")
                  .getPublicUrl(logoPath);
                results.logoUrl = urlData.publicUrl;
                await supabase
                  .from("products")
                  .update({ logo_url: urlData.publicUrl })
                  .eq("id", productId);
              } else {
                // Fallback: use external URL directly
                results.logoUrl = logoSrc;
                await supabase
                  .from("products")
                  .update({ logo_url: logoSrc })
                  .eq("id", productId);
              }
            }
          } catch {
            // Use external URL as fallback
            results.logoUrl = logoSrc;
            await supabase
              .from("products")
              .update({ logo_url: logoSrc })
              .eq("id", productId);
          }
        }
      } catch (e) {
        console.error("Logo processing error:", e);
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("bulk-fetch-photos error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
