import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SeoHead } from "@/components/SeoHead";
import { computeSeoScore } from "@/lib/blog-seo-score";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BarChart3, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Globe, FileText, Eye, Link2, ArrowUpRight, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Search, X, RefreshCw,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download,
} from "lucide-react";

type Post = {
  id: string;
  slug: string;
  title: string;
  body: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  featured_image: string | null;
  status: string;
  view_count: number | null;
  published_at: string | null;
};

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/60";
  if (score >= 60) return "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200/60";
  return "text-rose-600 bg-rose-50 dark:bg-rose-950/30 border-rose-200/60";
}

function extractLinks(html: string): string[] {
  const out: string[] = [];
  const re = /href=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html || "")) !== null) out.push(m[1]);
  return out;
}

export default function AdminBlogSeoDashboardPage() {
  const queryClient = useQueryClient();
  const [recomputeKey, setRecomputeKey] = useState(0);
  const [recomputing, setRecomputing] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const { data: posts, isLoading, isFetching } = useQuery({
    queryKey: ["admin-blog-seo"],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("id, slug, title, body, seo_title, seo_description, seo_keywords, featured_image, status, view_count, published_at")
        .order("created_at", { ascending: false });
      return (data || []) as Post[];
    },
  });

  const recompute = async () => {
    setRecomputing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["admin-blog-seo"] });
      // Force the useMemo to re-run even if data reference is identical
      setRecomputeKey((k) => k + 1);
      setLastRun(new Date());
      toast({ title: "SEO scores recomputed", description: `${posts?.length ?? 0} posts re-scored.` });
    } catch (err: any) {
      toast({ title: "Recompute failed", description: err.message, variant: "destructive" });
    } finally {
      setRecomputing(false);
    }
  };

  const analysis = useMemo(() => {
    if (!posts) return null;
    const scored = posts.map((p) => {
      const result = computeSeoScore({
        title: p.title,
        seoTitle: p.seo_title ?? undefined,
        metaDescription: p.seo_description ?? undefined,
        slug: p.slug,
        body: p.body ?? "",
        focusKeyword: p.seo_keywords?.split(",")[0]?.trim(),
        featuredImage: p.featured_image ?? undefined,
      });
      const links = extractLinks(p.body ?? "");
      return { post: p, ...result, links };
    });

    const published = scored.filter((s) => s.post.status === "published");
    const drafts = scored.filter((s) => s.post.status === "draft");
    const scheduled = scored.filter((s) => s.post.status === "scheduled");

    const avgScore = scored.length
      ? Math.round(scored.reduce((a, s) => a + s.score, 0) / scored.length)
      : 0;

    const topPerformers = [...published]
      .sort((a, b) => (b.post.view_count || 0) - (a.post.view_count || 0))
      .slice(0, 5);

    const underperformers = [...published]
      .filter((s) => s.score < 70 || (s.post.view_count || 0) < 10)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5);

    const missingMeta = scored.filter(
      (s) => !s.post.seo_description || (s.post.seo_description?.length ?? 0) < 80
    );
    const missingKeyword = scored.filter((s) => !s.post.seo_keywords);
    const noFeaturedImage = scored.filter((s) => !s.post.featured_image);

    const suspiciousLinks = scored.flatMap((s) =>
      s.links
        .filter((l) => l.startsWith("http://") || /localhost|127\.0\.0\.1/.test(l))
        .map((link) => ({ post: s.post, link }))
    );

    const totalViews = published.reduce((a, s) => a + (s.post.view_count || 0), 0);

    return {
      scored, published, drafts, scheduled,
      avgScore, topPerformers, underperformers,
      missingMeta, missingKeyword, noFeaturedImage,
      suspiciousLinks, totalViews,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, recomputeKey]);

  if (isLoading || !analysis) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = [
    { label: "Avg SEO Score", value: `${analysis.avgScore}`, icon: BarChart3, hint: "Across all posts" },
    { label: "Published", value: analysis.published.length, icon: Globe, hint: "Indexable pages" },
    { label: "Drafts", value: analysis.drafts.length, icon: FileText, hint: "Not indexed" },
    { label: "Total Views", value: analysis.totalViews.toLocaleString(), icon: Eye, hint: "Lifetime" },
  ];

  return (
    <div className="space-y-8">
      <SeoHead title="Blog SEO Dashboard" robots="noindex, nofollow" />

      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">SEO Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live audit of every blog post — performance, scores, and content health.
            {lastRun && (
              <span className="ml-2 text-xs">
                · Last recomputed {lastRun.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={recompute}
            disabled={recomputing || isFetching}
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            {recomputing || isFetching
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <RefreshCw className="h-3.5 w-3.5" />}
            Recompute SEO scores
          </Button>
          <Link to="/admin/blog/seo-audit" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            Bulk audit <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <Link to="/admin/blog" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            Back to posts <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</span>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-semibold mt-2 tabular-nums">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.hint}</div>
          </div>
        ))}
      </div>

      {/* Indexed vs not */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Globe className="h-4 w-4" /> Index Coverage
        </h2>
        <div className="flex h-3 rounded-full overflow-hidden bg-muted">
          {(() => {
            const total = Math.max(1, analysis.scored.length);
            const pub = (analysis.published.length / total) * 100;
            const sch = (analysis.scheduled.length / total) * 100;
            const drf = (analysis.drafts.length / total) * 100;
            return (
              <>
                <div style={{ width: `${pub}%` }} className="bg-emerald-500" />
                <div style={{ width: `${sch}%` }} className="bg-amber-500" />
                <div style={{ width: `${drf}%` }} className="bg-muted-foreground/40" />
              </>
            );
          })()}
        </div>
        <div className="flex gap-6 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Published ({analysis.published.length})</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Scheduled ({analysis.scheduled.length})</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-muted-foreground/40" /> Draft ({analysis.drafts.length})</span>
        </div>
      </div>

      {/* Top + Underperformers */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" /> Top Performers
          </h2>
          <div className="space-y-3">
            {analysis.topPerformers.length === 0 && (
              <p className="text-sm text-muted-foreground">No published posts yet.</p>
            )}
            {analysis.topPerformers.map((s) => (
              <Link
                key={s.post.id}
                to={`/admin/blog/${s.post.id}/edit`}
                className="flex items-center justify-between gap-3 py-2 hover:bg-muted/40 -mx-2 px-2 rounded-md transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{s.post.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {(s.post.view_count || 0).toLocaleString()} views · {s.stats.words} words
                  </div>
                </div>
                <span className={cn("text-xs font-semibold px-2 py-1 rounded-md border", scoreColor(s.score))}>
                  {s.score}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-rose-600" /> Needs Attention
          </h2>
          <div className="space-y-3">
            {analysis.underperformers.length === 0 && (
              <p className="text-sm text-muted-foreground">All published posts are healthy 🎉</p>
            )}
            {analysis.underperformers.map((s) => (
              <Link
                key={s.post.id}
                to={`/admin/blog/${s.post.id}/edit`}
                className="flex items-center justify-between gap-3 py-2 hover:bg-muted/40 -mx-2 px-2 rounded-md transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{s.post.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {(s.post.view_count || 0).toLocaleString()} views ·{" "}
                    {s.checks.filter((c) => c.level !== "good").length} issues
                  </div>
                </div>
                <span className={cn("text-xs font-semibold px-2 py-1 rounded-md border", scoreColor(s.score))}>
                  {s.score}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Health issues */}
      <div className="grid md:grid-cols-3 gap-4">
        <IssueCard
          icon={AlertTriangle}
          title="Missing meta description"
          count={analysis.missingMeta.length}
          items={analysis.missingMeta.slice(0, 5).map((s) => s.post)}
        />
        <IssueCard
          icon={AlertTriangle}
          title="No focus keyword"
          count={analysis.missingKeyword.length}
          items={analysis.missingKeyword.slice(0, 5).map((s) => s.post)}
        />
        <IssueCard
          icon={AlertTriangle}
          title="Missing featured image"
          count={analysis.noFeaturedImage.length}
          items={analysis.noFeaturedImage.slice(0, 5).map((s) => s.post)}
        />
      </div>

      {/* Suspicious links */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Link2 className="h-4 w-4" /> Suspicious Links
          <span className="text-xs font-normal text-muted-foreground">
            (insecure http:// or localhost references)
          </span>
        </h2>
        {analysis.suspiciousLinks.length === 0 ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> No broken or insecure links detected.
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-auto">
            {analysis.suspiciousLinks.slice(0, 20).map((l, i) => (
              <Link
                key={i}
                to={`/admin/blog/${l.post.id}/edit`}
                className="flex items-center justify-between gap-3 text-sm py-1.5 hover:bg-muted/40 -mx-2 px-2 rounded-md"
              >
                <span className="truncate font-mono text-xs text-rose-600">{l.link}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{l.post.title}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Broken link scanner */}
      <BrokenLinkScanner scored={analysis.scored} />

      {/* All posts score table */}
      <PostsTable scored={analysis.scored} />
    </div>
  );
}

type CheckResult = {
  url: string;
  ok: boolean;
  status: number | null;
  error?: string;
  ms: number;
  redirected?: boolean;
  finalUrl?: string;
};

function BrokenLinkScanner({
  scored,
}: {
  scored: { post: Post; links: string[] }[];
}) {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const [scannedAt, setScannedAt] = useState<Date | null>(null);

  // Map url -> posts that contain it
  const urlToPosts = useMemo(() => {
    const m = new Map<string, Post[]>();
    for (const s of scored) {
      for (const link of s.links) {
        if (!/^https?:\/\//i.test(link)) continue;
        const arr = m.get(link) || [];
        arr.push(s.post);
        m.set(link, arr);
      }
    }
    return m;
  }, [scored]);

  const allUrls = useMemo(() => Array.from(urlToPosts.keys()), [urlToPosts]);

  const scan = async () => {
    if (allUrls.length === 0) {
      toast({ title: "No external links found", description: "Nothing to scan." });
      return;
    }
    setScanning(true);
    setResults(null);
    try {
      const { data, error } = await supabase.functions.invoke("scan-broken-links", {
        body: { urls: allUrls },
      });
      if (error) throw error;
      const list: CheckResult[] = data?.results ?? [];
      setResults(list);
      setScannedAt(new Date());
      const broken = list.filter((r) => !r.ok).length;
      toast({
        title: "Link scan complete",
        description: `${list.length} checked · ${broken} broken`,
      });
    } catch (err: any) {
      toast({
        title: "Scan failed",
        description: err.message || "Unable to scan links",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  const broken = (results ?? []).filter((r) => !r.ok);

  const statusBadge = (r: CheckResult) => {
    if (r.error === "timeout") return "Timeout";
    if (r.status) return String(r.status);
    return r.error || "Error";
  };

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <Link2 className="h-4 w-4" /> Broken Link Scanner
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Checks every external <code className="text-[10px]">http(s)://</code> link across
            your posts for 404s, 5xx errors and timeouts.
            {scannedAt && (
              <span className="ml-1">
                · Last scan {scannedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </p>
        </div>
        <div className="text-right">
          <Button onClick={scan} disabled={scanning} size="sm" variant="outline" className="gap-1.5">
            {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {scanning ? "Scanning…" : `Scan ${allUrls.length} link${allUrls.length === 1 ? "" : "s"}`}
          </Button>
        </div>
      </div>

      {results === null && !scanning && (
        <p className="text-sm text-muted-foreground mt-6">
          Click <strong>Scan</strong> to run a live check on all outbound URLs.
        </p>
      )}

      {scanning && (
        <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking {allUrls.length} URL{allUrls.length === 1 ? "" : "s"}…
        </div>
      )}

      {results && !scanning && (
        <>
          <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
            <div className="rounded-md border p-3">
              <div className="text-muted-foreground">Checked</div>
              <div className="text-xl font-semibold tabular-nums">{results.length}</div>
            </div>
            <div className="rounded-md border p-3 border-emerald-200/60">
              <div className="text-emerald-700">Healthy</div>
              <div className="text-xl font-semibold tabular-nums text-emerald-600">
                {results.length - broken.length}
              </div>
            </div>
            <div className={cn("rounded-md border p-3", broken.length > 0 ? "border-rose-200/60" : "")}>
              <div className={broken.length > 0 ? "text-rose-700" : "text-muted-foreground"}>Broken</div>
              <div className={cn("text-xl font-semibold tabular-nums", broken.length > 0 ? "text-rose-600" : "")}>
                {broken.length}
              </div>
            </div>
          </div>

          {broken.length === 0 ? (
            <p className="mt-4 text-sm flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> All links are reachable.
            </p>
          ) : (
            <div className="mt-5 border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground bg-muted/30 border-b">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Status</th>
                    <th className="text-left px-3 py-2 font-medium">URL</th>
                    <th className="text-left px-3 py-2 font-medium">Found in</th>
                  </tr>
                </thead>
                <tbody>
                  {broken.map((r, i) => {
                    const posts = urlToPosts.get(r.url) || [];
                    return (
                      <tr key={i} className="border-t align-top">
                        <td className="px-3 py-2.5">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md border text-rose-600 bg-rose-50 dark:bg-rose-950/30 border-rose-200/60">
                            <AlertTriangle className="h-3 w-3" /> {statusBadge(r)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs text-rose-600 hover:underline break-all"
                          >
                            {r.url}
                          </a>
                          {r.finalUrl && (
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              → redirected to <span className="font-mono">{r.finalUrl}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-xs">
                          <div className="flex flex-col gap-0.5 max-w-xs">
                            {posts.slice(0, 3).map((p) => (
                              <Link
                                key={p.id}
                                to={`/admin/blog/${p.id}/edit`}
                                className="hover:underline truncate text-muted-foreground hover:text-foreground"
                              >
                                {p.title}
                              </Link>
                            ))}
                            {posts.length > 3 && (
                              <span className="text-muted-foreground">+ {posts.length - 3} more</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

type SortKey = "title" | "status" | "views" | "words" | "score";
type SortDir = "asc" | "desc";

function PostsTable({ scored }: { scored: { post: Post; score: number; stats: { words: number } }[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const rows = useMemo(() => {
    let r = scored;
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter((s) => s.post.title.toLowerCase().includes(q) || s.post.slug.toLowerCase().includes(q));
    }
    if (statusFilter !== "all") r = r.filter((s) => s.post.status === statusFilter);
    if (scoreFilter !== "all") {
      r = r.filter((s) =>
        scoreFilter === "good" ? s.score >= 80
        : scoreFilter === "warn" ? s.score >= 60 && s.score < 80
        : s.score < 60
      );
    }
    const dir = sortDir === "asc" ? 1 : -1;
    r = [...r].sort((a, b) => {
      switch (sortKey) {
        case "title": return a.post.title.localeCompare(b.post.title) * dir;
        case "status": return a.post.status.localeCompare(b.post.status) * dir;
        case "views": return ((a.post.view_count || 0) - (b.post.view_count || 0)) * dir;
        case "words": return (a.stats.words - b.stats.words) * dir;
        case "score": return (a.score - b.score) * dir;
      }
    });
    return r;
  }, [scored, query, statusFilter, scoreFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "title" || key === "status" ? "asc" : "desc"); }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey !== k ? <ArrowUpDown className="h-3 w-3 opacity-40" />
    : sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;

  const hasFilters = query || statusFilter !== "all" || scoreFilter !== "all";

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageRows = rows.slice(pageStart, pageStart + pageSize);

  // Reset to first page whenever filters/sort/pageSize change
  useEffect(() => { setPage(1); }, [query, statusFilter, scoreFilter, sortKey, sortDir, pageSize]);

  const exportCsv = () => {
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const headers = [
      "Title", "Slug", "Status", "Views", "Words", "SEO Score",
      "SEO Title", "Meta Description", "Focus Keyword",
      "Has Featured Image", "Published At",
    ];
    const lines = [headers.join(",")];
    for (const s of rows) {
      const p = s.post;
      lines.push([
        p.title, p.slug, p.status, p.view_count ?? 0, s.stats.words, s.score,
        p.seo_title ?? "", p.seo_description ?? "",
        p.seo_keywords?.split(",")[0]?.trim() ?? "",
        p.featured_image ? "yes" : "no",
        p.published_at ?? "",
      ].map(esc).join(","));
    }
    const csv = "\uFEFF" + lines.join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `blog-seo-report-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported", description: `${rows.length} ${rows.length === 1 ? "post" : "posts"} exported.` });
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="p-6 pb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-semibold">All posts</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {rows.length === 0
              ? `0 of ${scored.length} posts`
              : `${pageStart + 1}–${Math.min(pageStart + pageSize, rows.length)} of ${rows.length}${rows.length !== scored.length ? ` (filtered from ${scored.length})` : ""}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title…"
              className="h-8 text-xs pl-8 w-48"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={scoreFilter} onValueChange={setScoreFilter}>
            <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All scores</SelectItem>
              <SelectItem value="good">Good (80+)</SelectItem>
              <SelectItem value="warn">Warning (60–79)</SelectItem>
              <SelectItem value="bad">Poor (&lt; 60)</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <button
              onClick={() => { setQuery(""); setStatusFilter("all"); setScoreFilter("all"); }}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-md border"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
          <Button
            onClick={exportCsv}
            disabled={rows.length === 0}
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV{hasFilters ? ` (${rows.length})` : ""}
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground border-y bg-muted/30">
            <tr>
              <Th onClick={() => toggleSort("title")} align="left" className="px-6"><span className="inline-flex items-center gap-1">Title <SortIcon k="title" /></span></Th>
              <Th onClick={() => toggleSort("status")} align="left" className="px-3"><span className="inline-flex items-center gap-1">Status <SortIcon k="status" /></span></Th>
              <Th onClick={() => toggleSort("views")} align="right" className="px-3"><span className="inline-flex items-center gap-1 justify-end">Views <SortIcon k="views" /></span></Th>
              <Th onClick={() => toggleSort("words")} align="right" className="px-3"><span className="inline-flex items-center gap-1 justify-end">Words <SortIcon k="words" /></span></Th>
              <Th onClick={() => toggleSort("score")} align="right" className="px-6"><span className="inline-flex items-center gap-1 justify-end">SEO <SortIcon k="score" /></span></Th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground">No posts match your filters.</td></tr>
            ) : pageRows.map((s) => (
              <tr key={s.post.id} className="border-t hover:bg-muted/30">
                <td className="px-6 py-2.5">
                  <Link to={`/admin/blog/${s.post.id}/edit`} className="hover:underline font-medium">
                    {s.post.title}
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-xs capitalize text-muted-foreground">{s.post.status}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{(s.post.view_count || 0).toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{s.stats.words}</td>
                <td className="px-6 py-2.5 text-right">
                  <span className={cn("text-xs font-semibold px-2 py-1 rounded-md border", scoreColor(s.score))}>
                    {s.score}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-t bg-muted/20 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>Rows per page</span>
          <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger className="h-7 w-[68px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100, 200].map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground tabular-nums">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(1)} disabled={currentPage === 1} aria-label="First page">
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} aria-label="Previous page">
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} aria-label="Next page">
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(totalPages)} disabled={currentPage === totalPages} aria-label="Last page">
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Th({ children, onClick, align, className }: { children: React.ReactNode; onClick: () => void; align: "left" | "right"; className?: string }) {
  return (
    <th
      onClick={onClick}
      className={cn(
        "py-2 font-medium cursor-pointer select-none hover:text-foreground transition-colors",
        align === "left" ? "text-left" : "text-right",
        className,
      )}
    >
      {children}
    </th>
  );
}

function IssueCard({
  icon: Icon, title, count, items,
}: {
  icon: typeof AlertTriangle; title: string; count: number; items: { id: string; title: string }[];
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Icon className={cn("h-4 w-4", count > 0 ? "text-amber-600" : "text-emerald-600")} />
          {title}
        </h3>
        <span className="text-xs font-semibold tabular-nums">{count}</span>
      </div>
      <div className="mt-3 space-y-1.5">
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground">All good.</p>
        )}
        {items.map((p) => (
          <Link
            key={p.id}
            to={`/admin/blog/${p.id}/edit`}
            className="block text-xs text-muted-foreground hover:text-foreground truncate"
          >
            · {p.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
