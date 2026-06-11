import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SeoHead } from "@/components/SeoHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, RefreshCw, ExternalLink, Wand2, ArrowRight } from "lucide-react";
import { UUID_RE } from "@/lib/identifier";
import { toast } from "sonner";
import { useState } from "react";

// Tables that produce public URLs from a slug-like column.
const TARGETS: Array<{
  table: string;
  col: "slug" | "username";
  nameCol: string; // column used to derive a clean slug
  route: (v: string) => string;
  label: string;
}> = [
  { table: "products", col: "slug", nameCol: "name", route: (s) => `/product/${s}`, label: "Products" },
  { table: "categories", col: "slug", nameCol: "name", route: (s) => `/categories/${s}`, label: "Categories" },
  { table: "blog_posts", col: "slug", nameCol: "title", route: (s) => `/blog/${s}`, label: "Blog Posts" },
  { table: "deals", col: "slug", nameCol: "title", route: (s) => `/deals/${s}`, label: "Deals" },
  { table: "discussions", col: "slug", nameCol: "title", route: (s) => `/discussions/${s}`, label: "Discussions" },
  { table: "lists", col: "slug", nameCol: "title", route: (s) => `/lists/${s}`, label: "Lists" },
  { table: "tech_stacks", col: "slug", nameCol: "title", route: (s) => `/tech-stacks/${s}`, label: "Tech Stacks" },
  { table: "comparisons", col: "slug", nameCol: "title", route: (s) => `/compare/${s}`, label: "Comparisons" },
  { table: "buyer_guides", col: "slug", nameCol: "title", route: (s) => `/buyer-guides/${s}`, label: "Buyer Guides" },
  { table: "glossary_terms", col: "slug", nameCol: "term", route: (s) => `/glossary/${s}`, label: "Glossary" },
  { table: "alternative_pages", col: "slug", nameCol: "title", route: (s) => `/alternatives/${s}`, label: "Alternatives" },
  { table: "keyword_landing_pages", col: "slug", nameCol: "keyword", route: (s) => `/${s}`, label: "Keyword Landing" },
  { table: "seo_landing_pages", col: "slug", nameCol: "title", route: (s) => `/${s}`, label: "SEO Landing" },
  { table: "pages", col: "slug", nameCol: "title", route: (s) => `/${s}`, label: "CMS Pages" },
  { table: "profiles", col: "username", nameCol: "name", route: (s) => `/u/${s}`, label: "User Profiles" },
];

// Legacy path prefixes (where users may still have stale links) mapped to the
// canonical prefix. UUIDs found in any of these become redirects pointing at
// the new clean slug.
const LEGACY_PREFIXES: Record<string, string[]> = {
  products: ["/projects", "/product"],
  blog_posts: ["/blog", "/posts"],
  deals: ["/deals", "/deal"],
  profiles: ["/u", "/user", "/users", "/profile"],
  discussions: ["/discussions", "/discussion"],
};

interface Issue {
  id: string;
  value: string;
  name: string | null;
  reason: "uuid" | "missing" | "non_seo";
}

interface Report {
  table: string;
  label: string;
  col: string;
  nameCol: string;
  route: (v: string) => string;
  total: number;
  missing: Issue[];
  uuidLike: Issue[];
  nonSeo: Issue[];
}

const NON_SEO_RE = /[^a-z0-9-]/;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export default function AdminSeoRouteAuditPage() {
  const qc = useQueryClient();
  const [busyTable, setBusyTable] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery<Report[]>({
    queryKey: ["seo-route-audit"],
    queryFn: async () => {
      const reports: Report[] = [];
      for (const t of TARGETS) {
        const { data: rows, count } = await (supabase as any)
          .from(t.table)
          .select(`id, ${t.col}, ${t.nameCol}`, { count: "exact" })
          .limit(20000);

        const missing: Issue[] = [];
        const uuidLike: Issue[] = [];
        const nonSeo: Issue[] = [];
        for (const r of rows ?? []) {
          const v = (r as any)[t.col] as string | null;
          const name = (r as any)[t.nameCol] as string | null;
          const id = (r as any).id as string;
          if (!v || v.trim() === "") {
            missing.push({ id, value: "(empty)", name, reason: "missing" });
          } else if (UUID_RE.test(v)) {
            uuidLike.push({ id, value: v, name, reason: "uuid" });
          } else if (NON_SEO_RE.test(v)) {
            nonSeo.push({ id, value: v, name, reason: "non_seo" });
          }
        }
        reports.push({
          table: t.table,
          label: t.label,
          col: t.col,
          nameCol: t.nameCol,
          route: t.route,
          total: count ?? rows?.length ?? 0,
          missing,
          uuidLike,
          nonSeo,
        });
      }
      return reports;
    },
  });

  const { data: redirectsData, refetch: refetchRedirects } = useQuery({
    queryKey: ["route-redirects"],
    queryFn: async () => {
      const { data, count } = await (supabase as any)
        .from("route_redirects")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(50);
      return { rows: data ?? [], count: count ?? 0 };
    },
  });

  const fix = useMutation({
    mutationFn: async (report: Report) => {
      setBusyTable(report.table);
      const t = TARGETS.find((x) => x.table === report.table)!;
      const fixable = [...report.uuidLike, ...report.missing, ...report.nonSeo];
      let fixed = 0;
      let redirected = 0;

      // Pre-load all existing slugs for collision avoidance.
      const { data: existing } = await (supabase as any)
        .from(report.table)
        .select(t.col)
        .limit(20000);
      const taken = new Set<string>((existing ?? []).map((r: any) => r[t.col]).filter(Boolean));

      for (const issue of fixable) {
        const base = slugify(issue.name || issue.value || "item") || "item";
        let candidate = base;
        let n = 1;
        while (taken.has(candidate)) candidate = `${base}-${++n}`;
        taken.add(candidate);

        const { error: updErr } = await (supabase as any)
          .from(report.table)
          .update({ [t.col]: candidate })
          .eq("id", issue.id);
        if (updErr) continue;
        fixed++;

        // Build redirect entries: from each legacy/current prefix using the old
        // bad value -> the canonical clean URL.
        const newPath = t.route(candidate);
        const fromValue = issue.reason === "missing" ? issue.id : issue.value;
        const prefixes = new Set<string>([
          // Always include the canonical current prefix using the broken value.
          t.route(fromValue).split(`/${fromValue}`)[0],
          ...(LEGACY_PREFIXES[report.table] ?? []),
        ]);

        for (const prefix of prefixes) {
          const fromPath = `${prefix}/${fromValue}`;
          if (fromPath === newPath) continue;
          const { error: redErr } = await (supabase as any)
            .from("route_redirects")
            .upsert(
              {
                from_path: fromPath,
                to_path: newPath,
                status_code: 301,
                source: `seo-audit:${report.table}`,
              },
              { onConflict: "from_path" },
            );
          if (!redErr) redirected++;
        }
      }

      return { fixed, redirected, table: report.label };
    },
    onSuccess: (r) => {
      toast.success(`${r.table}: fixed ${r.fixed} slugs, created ${r.redirected} redirects`);
      qc.invalidateQueries({ queryKey: ["seo-route-audit"] });
      qc.invalidateQueries({ queryKey: ["route-redirects"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Fix failed"),
    onSettled: () => setBusyTable(null),
  });

  const fixAll = useMutation({
    mutationFn: async () => {
      const reports = data ?? [];
      let totalFixed = 0;
      let totalRedirected = 0;
      for (const r of reports) {
        if (r.uuidLike.length + r.missing.length + r.nonSeo.length === 0) continue;
        const result = await fix.mutateAsync(r);
        totalFixed += result.fixed;
        totalRedirected += result.redirected;
      }
      return { totalFixed, totalRedirected };
    },
    onSuccess: (r) =>
      toast.success(`Done: ${r.totalFixed} slugs fixed, ${r.totalRedirected} redirects created`),
  });

  const totalIssues = (data ?? []).reduce(
    (n, r) => n + r.missing.length + r.uuidLike.length + r.nonSeo.length,
    0,
  );

  return (
    <div className="space-y-6">
      <SeoHead title="SEO Route Audit | Admin" robots="noindex" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            SEO Route Audit
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Scans every routable table for UUID-style slugs, missing slugs, and non-SEO characters.
            Click <strong>Auto-fix</strong> to backfill clean slugs and generate 301 redirects from
            the old URLs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={totalIssues === 0 ? "default" : "destructive"}>
            {totalIssues === 0 ? "All clean" : `${totalIssues} issues`}
          </Badge>
          <Button
            size="sm"
            onClick={() => fixAll.mutate()}
            disabled={totalIssues === 0 || fixAll.isPending || !!busyTable}
          >
            <Wand2 className={`w-3.5 h-3.5 mr-1.5 ${fixAll.isPending ? "animate-pulse" : ""}`} />
            Auto-fix all
          </Button>
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
            Re-scan
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Active redirects</span>
            <Badge variant="outline">{redirectsData?.count ?? 0}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(redirectsData?.rows ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No redirects yet.</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-auto">
              {(redirectsData?.rows ?? []).map((r: any) => (
                <div key={r.id} className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-muted-foreground truncate">{r.from_path}</span>
                  <ArrowRight className="w-3 h-3 shrink-0 text-muted-foreground" />
                  <span className="truncate">{r.to_path}</span>
                  <Badge variant="outline" className="ml-auto text-[10px]">
                    {r.status_code} · {r.hit_count} hits
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading && (
        <div className="text-center text-muted-foreground py-12">Scanning routes…</div>
      )}

      <div className="grid gap-4">
        {(data ?? []).map((r) => {
          const issueCount = r.missing.length + r.uuidLike.length + r.nonSeo.length;
          return (
            <Card key={r.table} className={issueCount > 0 ? "border-amber-500/40" : ""}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    {issueCount === 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                    {r.label}
                    <span className="text-xs font-mono text-muted-foreground">
                      {r.table}.{r.col}
                    </span>
                  </span>
                  <div className="flex gap-1.5 items-center">
                    <Badge variant="outline" className="text-[10px]">{r.total} rows</Badge>
                    {r.uuidLike.length > 0 && (
                      <Badge variant="destructive" className="text-[10px]">{r.uuidLike.length} UUID</Badge>
                    )}
                    {r.missing.length > 0 && (
                      <Badge variant="destructive" className="text-[10px]">{r.missing.length} missing</Badge>
                    )}
                    {r.nonSeo.length > 0 && (
                      <Badge variant="secondary" className="text-[10px]">{r.nonSeo.length} non-SEO</Badge>
                    )}
                    {issueCount > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2"
                        onClick={() => fix.mutate(r)}
                        disabled={busyTable === r.table}
                      >
                        <Wand2 className="w-3 h-3 mr-1" />
                        {busyTable === r.table ? "Fixing…" : "Auto-fix"}
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              {issueCount > 0 && (
                <CardContent className="space-y-3">
                  {r.uuidLike.length > 0 && (
                    <IssueGroup title="UUID-style slugs — redirect to canonical slug" items={r.uuidLike.slice(0, 10)} route={r.route} tone="destructive" />
                  )}
                  {r.missing.length > 0 && (
                    <IssueGroup title="Missing slugs — backfill required" items={r.missing.slice(0, 10)} route={r.route} tone="destructive" />
                  )}
                  {r.nonSeo.length > 0 && (
                    <IssueGroup title="Non-SEO characters (uppercase, _, spaces, /)" items={r.nonSeo.slice(0, 10)} route={r.route} tone="secondary" />
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function IssueGroup({
  title,
  items,
  route,
  tone,
}: {
  title: string;
  items: Issue[];
  route: (v: string) => string;
  tone: "destructive" | "secondary";
}) {
  return (
    <div>
      <div className="text-xs font-semibold text-muted-foreground mb-1.5">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it, i) => (
          <a
            key={`${it.value}-${i}`}
            href={route(it.value)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-mono px-2 py-1 rounded border bg-muted/40 hover:bg-muted transition-colors"
          >
            <Badge variant={tone} className="text-[9px] py-0 px-1">{it.reason}</Badge>
            {it.value}
            <ExternalLink className="w-3 h-3 opacity-50" />
          </a>
        ))}
      </div>
    </div>
  );
}
