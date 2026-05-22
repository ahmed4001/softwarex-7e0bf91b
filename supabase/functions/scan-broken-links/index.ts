// Scans a list of URLs and returns broken/timeout entries.
// Public function (no JWT required) — only reads remote URLs.
import { corsHeaders } from "https://deno.land/x/supabase_functions_cors@v1.0.0/mod.ts";

const TIMEOUT_MS = 8000;
const CONCURRENCY = 8;
const MAX_URLS = 500;

type CheckResult = {
  url: string;
  ok: boolean;
  status: number | null;
  error?: string;
  ms: number;
  redirected?: boolean;
  finalUrl?: string;
};

async function checkOne(url: string): Promise<CheckResult> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const headers = {
    "user-agent":
      "Mozilla/5.0 (compatible; LovableLinkChecker/1.0; +https://lovable.dev)",
    accept: "*/*",
  };
  try {
    // Try HEAD first (cheap)
    let res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers,
    });
    // Some servers don't support HEAD — retry with GET
    if (res.status === 405 || res.status === 501 || res.status === 403) {
      res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers,
      });
    }
    clearTimeout(timer);
    return {
      url,
      ok: res.ok,
      status: res.status,
      ms: Date.now() - start,
      redirected: res.redirected,
      finalUrl: res.url !== url ? res.url : undefined,
    };
  } catch (err) {
    clearTimeout(timer);
    const msg = (err as Error).message || String(err);
    const isTimeout = controller.signal.aborted || /abort/i.test(msg);
    return {
      url,
      ok: false,
      status: null,
      error: isTimeout ? "timeout" : msg,
      ms: Date.now() - start,
    };
  }
}

async function runWithConcurrency<T>(
  items: string[],
  worker: (u: string) => Promise<T>,
  limit: number,
): Promise<T[]> {
  const out: T[] = new Array(items.length);
  let i = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      out[idx] = await worker(items[idx]);
    }
  });
  await Promise.all(runners);
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);
    const rawUrls: unknown = body?.urls;
    if (!Array.isArray(rawUrls)) {
      return new Response(
        JSON.stringify({ error: "Body must include `urls: string[]`" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Sanitize, dedupe, keep only http(s)
    const seen = new Set<string>();
    const urls: string[] = [];
    for (const u of rawUrls) {
      if (typeof u !== "string") continue;
      const trimmed = u.trim();
      if (!/^https?:\/\//i.test(trimmed)) continue;
      if (seen.has(trimmed)) continue;
      seen.add(trimmed);
      urls.push(trimmed);
      if (urls.length >= MAX_URLS) break;
    }

    const results = await runWithConcurrency(urls, checkOne, CONCURRENCY);
    const broken = results.filter((r) => !r.ok);

    return new Response(
      JSON.stringify({
        checked: results.length,
        brokenCount: broken.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
