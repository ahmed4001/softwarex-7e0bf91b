import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// All public tables to export
const TABLES = [
  "categories",
  "products",
  "reviews",
  "comparisons",
  "alternatives",
  "alternative_pages",
  "advertisements",
  "activity_logs",
  "alert_history",
  "award_categories",
  "award_nominations",
  "award_votes",
  "badges",
  "blog_posts",
  "brevo_accounts",
  "brevo_campaigns",
  "buyer_guides",
  "buyer_guide_completions",
  "category_trend_reports",
  "changelog_subscriptions",
  "competitive_battlecards",
  "digest_logs",
  "discussions",
  "discussion_replies",
  "discussion_votes",
  "email_templates",
  "glossary_terms",
  "list_items",
  "list_votes",
  "lists",
  "media_library",
  "moderation_queue",
  "newsletter_subscribers",
  "notification_preferences",
  "notifications",
  "pages",
  "point_transactions",
  "price_alerts",
  "pricing_features",
  "pricing_tier_features",
  "product_changelogs",
  "product_pricing_tiers",
  "profiles",
];

function escapeSQL(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

function rowToInsert(table: string, row: Record<string, unknown>): string {
  const cols = Object.keys(row);
  const vals = cols.map((c) => escapeSQL(row[c]));
  return `INSERT INTO public.${table} (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${vals.join(", ")}) ON CONFLICT DO NOTHING;`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { mode = "all", table: singleTable, offset = 0, limit = 5000 } = await req.json().catch(() => ({}));

    // MODE: list_storage — list all files in product-images bucket
    if (mode === "list_storage") {
      const allFiles: { name: string; url: string }[] = [];
      let storageOffset = 0;
      const storageLimit = 1000;

      while (true) {
        const { data: files, error } = await supabase.storage
          .from("product-images")
          .list("", { limit: storageLimit, offset: storageOffset });

        if (error) throw error;
        if (!files || files.length === 0) break;

        for (const f of files) {
          if (f.id) {
            const { data: urlData } = supabase.storage
              .from("product-images")
              .getPublicUrl(f.name);
            allFiles.push({ name: f.name, url: urlData.publicUrl });
          }
        }
        storageOffset += storageLimit;
        if (files.length < storageLimit) break;
      }

      return new Response(JSON.stringify({ files: allFiles, count: allFiles.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // MODE: single table export
    if (mode === "table" && singleTable) {
      const { data, error, count } = await supabase
        .from(singleTable)
        .select("*", { count: "exact" })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const inserts = (data || []).map((row: Record<string, unknown>) => rowToInsert(singleTable, row));

      return new Response(
        JSON.stringify({
          table: singleTable,
          rows: data?.length || 0,
          total: count,
          has_more: (offset + limit) < (count || 0),
          next_offset: offset + limit,
          sql: inserts.join("\n"),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // MODE: summary — show row counts for all tables
    if (mode === "summary") {
      const summary: { table: string; count: number }[] = [];

      for (const t of TABLES) {
        try {
          const { count, error } = await supabase.from(t).select("*", { count: "exact", head: true });
          if (!error) {
            summary.push({ table: t, count: count || 0 });
          } else {
            summary.push({ table: t, count: -1 });
          }
        } catch {
          summary.push({ table: t, count: -1 });
        }
      }

      const total = summary.reduce((s, t) => s + Math.max(t.count, 0), 0);

      return new Response(
        JSON.stringify({ tables: summary, total_rows: total, table_count: summary.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // MODE: all — export all tables (careful: can be large)
    const allSQL: string[] = [];
    const stats: { table: string; rows: number }[] = [];

    for (const t of TABLES) {
      try {
        let tableOffset = 0;
        let tableRows = 0;

        while (true) {
          const { data, error } = await supabase
            .from(t)
            .select("*")
            .range(tableOffset, tableOffset + 999);

          if (error) {
            console.error(`Error exporting ${t}:`, error.message);
            break;
          }
          if (!data || data.length === 0) break;

          for (const row of data) {
            allSQL.push(rowToInsert(t, row as Record<string, unknown>));
          }
          tableRows += data.length;
          tableOffset += 1000;
          if (data.length < 1000) break;
        }

        stats.push({ table: t, rows: tableRows });
      } catch (e) {
        console.error(`Failed on table ${t}:`, e);
        stats.push({ table: t, rows: -1 });
      }
    }

    return new Response(
      JSON.stringify({
        stats,
        total_inserts: allSQL.length,
        sql: allSQL.join("\n"),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("export-database error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
