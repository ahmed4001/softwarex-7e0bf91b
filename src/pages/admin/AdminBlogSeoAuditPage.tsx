import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SeoHead } from "@/components/SeoHead";
import { computeSeoScore, type SeoCheck } from "@/lib/blog-seo-score";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowUpRight, ArrowDown, ArrowUp, Loader2, RefreshCw, Search, X,
  AlertTriangle, ShieldAlert, TrendingDown, Camera, Download, ListChecks,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
  updated_at: string | null;
};

type Scored = {
  post: Post;
  score: number;
  checks: SeoCheck[];
  severity: number; // weighted severity (bad*weight + warn*weight*0.4)
  badCount: number;
  warnCount: number;
  prevScore: number | null;
  delta: number; // score - prevScore (negative = drop)
  topIssues: SeoCheck[]; // sorted by weight desc, level worst-first
};

type Snapshot = Record<string, { score: number; capturedAt: string }>;
const SNAPSHOT_KEY = "seo-audit:snapshot:v1";

function loadSnapshot(): Snapshot {
  try { return JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || "{}"); } catch { return {}; }
}
function saveSnapshot(snap: Snapshot) {
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snap));
}

type SortKey = "drop" | "severity" | "score" | "issues" | "views" | "title";

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/60";
  if (score >= 60) return "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200/60";
  return "text-rose-600 bg-rose-50 dark:bg-rose-950/30 border-rose-200/60";
}

function deltaColor(d: number) {
  if (d <= -10) return "text-rose-600 bg-rose-50 dark:bg-rose-950/40";
  if (d < 0) return "text-amber-600 bg-amber-50 dark:bg-amber-950/40";
  if (d > 0) return "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40";
  return "text-muted-foreground bg-muted/40";
}

export default function AdminBlogSeoAuditPage() {
  const [recomputeKey, setRecomputeKey] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot>(() => loadSnapshot());
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("drop");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { data: posts, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-blog-seo-audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, slug, title, body, seo_title, seo_description, seo_keywords, featured_image, status, view_count, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Post[];
    },
  });

  const scored = useMemo<Scored[]>(() => {
    if (!posts) return [];
    return posts.map((p) => {
      const result = computeSeoScore({
        title: p.title,
        seoTitle: p.seo_title ?? undefined,
        metaDescription: p.seo_description ?? undefined,
        slug: p.slug,
        body: p.body ?? "",
        focusKeyword: p.seo_keywords?.split(",")[0]?.trim(),
        featuredImage: p.featured_image ?? undefined,
      });
      let severity = 0, badCount = 0, warnCount = 0;
      for (const c of result.checks) {
        if (c.level === "bad") { severity += c.weight; badCount++; }
        else if (c.level === "warn") { severity += c.weight * 0.4; warnCount++; }
      }
      const topIssues = result.checks
        .filter((c) => c.level !== "good")
        .sort((a, b) => {
          const aw = a.level === "bad" ? 1 : 0;
          const bw = b.level === "bad" ? 1 : 0;
          if (aw !== bw) return bw - aw;
          return b.weight - a.weight;
        })
        .slice(0, 4);
      const prev = snapshot[p.id]?.score ?? null;
      return {
        post: p, score: result.score, checks: result.checks,
        severity: Math.round(severity * 10) / 10,
        badCount, warnCount,
        prevScore: prev,
        delta: prev == null ? 0 : result.score - prev,
        topIssues,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, snapshot, recomputeKey]);

  const lastSnapshotAt = useMemo(() => {
    const ts = Object.values(snapshot).map((s) => s.capturedAt).sort().slice(-1)[0];
    return ts ? new Date(ts) : null;
  }, [snapshot]);

  const rows = useMemo(() => {
    let r = scored;
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter((s) => s.post.title.toLowerCase().includes(q) || s.post.slug.toLowerCase().includes(q));
    }
    if (statusFilter !== "all") r = r.filter((s) => s.post.status === statusFilter);
    if (severityFilter === "critical") r = r.filter((s) => s.badCount >= 3);
    else if (severityFilter === "warn") r = r.filter((s) => s.badCount > 0 && s.badCount < 3);
    else if (severityFilter === "drops") r = r.filter((s) => s.delta < 0);

    const dir = sortDir === "asc" ? 1 : -1;
    r = [...r].sort((a, b) => {
      switch (sortKey) {
        case "drop": return (a.delta - b.delta) * dir;
        case "severity": return (a.severity - b.severity) * dir;
        case "score": return (a.score - b.score) * dir;
        case "issues": return ((a.badCount + a.warnCount) - (b.badCount + b.warnCount)) * dir;
        case "views": return ((a.post.view_count || 0) - (b.post.view_count || 0)) * dir;
        case "title": return a.post.title.localeCompare(b.post.title) * dir;
      }
    });
    return r;
  }, [scored, query, statusFilter, severityFilter, sortKey, sortDir]);

  const totals = useMemo(() => ({
    posts: scored.length,
    critical: scored.filter((s) => s.badCount >= 3).length,
    droppers: scored.filter((s) => s.delta < 0).length,
    avg: scored.length ? Math.round(scored.reduce((a, s) => a + s.score, 0) / scored.length) : 0,
    biggestDrop: scored.reduce((m, s) => (s.delta < m ? s.delta : m), 0),
  }), [scored]);

  const captureBaseline = () => {
    const next: Snapshot = {};
    const now = new Date().toISOString();
    for (const s of scored) next[s.post.id] = { score: s.score, capturedAt: now };
    saveSnapshot(next);
    setSnapshot(next);
    toast({ title: "Baseline captured", description: `Snapshot saved for ${scored.length} posts. Future scans will be compared against this baseline.` });
  };

  const clearBaseline = () => {
    localStorage.removeItem(SNAPSHOT_KEY);
    setSnapshot({});
    toast({ title: "Baseline cleared" });
  };

  const exportCsv = () => {
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const headers = ["Title", "Slug", "Status", "Score", "Prev Score", "Delta", "Severity", "Errors", "Warnings", "Views", "Top Issues"];
    const lines = [headers.join(",")];
    for (const s of rows) {
      lines.push([
        s.post.title, s.post.slug, s.post.status, s.score, s.prevScore ?? "", s.delta,
        s.severity, s.badCount, s.warnCount, s.post.view_count ?? 0,
        s.topIssues.map((i) => i.label).join(" | "),
      ].map(esc).join(","));
    }
    const csv = "\uFEFF" + lines.join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seo-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir(k === "title" ? "asc" : "desc"); }
  };

  useEffect(() => { /* trigger memo recompute */ }, [recomputeKey]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const kpis = [
    { label: "Posts audited", value: totals.posts, icon: ListChecks, tone: "text-foreground" },
    { label: "Critical (3+ errors)", value: totals.critical, icon: ShieldAlert, tone: "text-rose-600" },
    { label: "Score drops", value: totals.droppers, icon: TrendingDown, tone: "text-amber-600" },
    { label: "Biggest drop", value: totals.biggestDrop === 0 ? "—" : `${totals.biggestDrop}`, icon: TrendingDown, tone: "text-rose-600" },
    { label: "Average score", value: totals.avg, icon: AlertTriangle, tone: "text-foreground" },
  ];

  const presets: { key: SortKey; label: string }[] = [
    { key: "drop", label: "Biggest score drop" },
    { key: "severity", label: "Highest severity" },
    { key: "issues", label: "Most issues" },
    { key: "score", label: "Lowest score" },
    { key: "views", label: "Highest views" },
  ];

  return (
    <div className="space-y-6">
      <SeoHead title="Bulk SEO Audit" robots="noindex, nofollow" />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Bulk SEO Audit</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Scan every blog post and prioritize by score drop or highest-severity errors.
            {lastSnapshotAt && (
              <span className="ml-2 text-xs">· Baseline captured {lastSnapshotAt.toLocaleDateString()} {lastSnapshotAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { refetch(); setRecomputeKey((k) => k + 1); }} disabled={isFetching}>
            {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Rescan
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={captureBaseline}>
            <Camera className="h-3.5 w-3.5" /> {lastSnapshotAt ? "Recapture baseline" : "Capture baseline"}
          </Button>
          {lastSnapshotAt && (
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={clearBaseline}>
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCsv} disabled={rows.length === 0}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Link to="/admin/blog/seo" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            Dashboard <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.label}</span>
              <k.icon className={cn("h-3.5 w-3.5", k.tone)} />
            </div>
            <div className={cn("text-2xl font-semibold mt-1 tabular-nums", k.tone)}>{k.value}</div>
          </div>
        ))}
      </div>

      {!lastSnapshotAt && (
        <div className="rounded-xl border border-dashed border-amber-300/60 bg-amber-50/40 dark:bg-amber-950/20 p-4 text-sm flex items-start gap-3">
          <Camera className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-900 dark:text-amber-200">No baseline captured</p>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">Capture a baseline now — future scans will compare against it so you can spot score drops.</p>
          </div>
        </div>
      )}

      {/* Sort presets + filters */}
      <div className="rounded-xl border bg-card p-3 flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-1">Sort by</span>
        {presets.map((p) => (
          <button
            key={p.key}
            onClick={() => { setSortKey(p.key); setSortDir("desc"); if (p.key === "drop" || p.key === "score") setSortDir("asc"); }}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs font-medium transition-colors border",
              sortKey === p.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:text-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title or slug…" className="h-8 text-xs pl-8 w-56" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="h-8 text-xs w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              <SelectItem value="critical">Critical (3+ errors)</SelectItem>
              <SelectItem value="warn">Has errors</SelectItem>
              <SelectItem value="drops">Score dropped</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Audit table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground border-b bg-muted/30">
              <tr>
                <Th onClick={() => toggleSort("title")} align="left" className="px-4">Post {sortKey === "title" && <SortArrow dir={sortDir} />}</Th>
                <Th onClick={() => toggleSort("score")} align="right" className="px-3 w-20">Score {sortKey === "score" && <SortArrow dir={sortDir} />}</Th>
                <Th onClick={() => toggleSort("drop")} align="right" className="px-3 w-24">Δ vs baseline {sortKey === "drop" && <SortArrow dir={sortDir} />}</Th>
                <Th onClick={() => toggleSort("severity")} align="right" className="px-3 w-24">Severity {sortKey === "severity" && <SortArrow dir={sortDir} />}</Th>
                <Th onClick={() => toggleSort("issues")} align="right" className="px-3 w-24">Errors / Warn {sortKey === "issues" && <SortArrow dir={sortDir} />}</Th>
                <th className="text-left px-4 py-2 font-medium">Top issues</th>
                <Th onClick={() => toggleSort("views")} align="right" className="px-4 w-20">Views {sortKey === "views" && <SortArrow dir={sortDir} />}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center text-sm text-muted-foreground">No posts match your filters.</td></tr>
              ) : rows.map((s) => (
                <tr key={s.post.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-2.5">
                    <Link to={`/admin/blog/${s.post.id}/edit`} className="hover:underline font-medium block truncate max-w-[320px]">
                      {s.post.title}
                    </Link>
                    <div className="text-[11px] text-muted-foreground capitalize">{s.post.status} · /{s.post.slug}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className={cn("text-xs font-semibold px-2 py-1 rounded-md border tabular-nums", scoreColor(s.score))}>{s.score}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {s.prevScore == null ? (
                      <span className="text-[11px] text-muted-foreground">—</span>
                    ) : (
                      <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded tabular-nums", deltaColor(s.delta))}>
                        {s.delta > 0 ? <ArrowUp className="h-3 w-3" /> : s.delta < 0 ? <ArrowDown className="h-3 w-3" /> : null}
                        {s.delta > 0 ? `+${s.delta}` : s.delta}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-xs font-semibold">
                    <span className={cn(s.severity >= 10 ? "text-rose-600" : s.severity >= 5 ? "text-amber-600" : "text-muted-foreground")}>
                      {s.severity || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs tabular-nums">
                    <span className="text-rose-600 font-semibold">{s.badCount}</span>
                    <span className="text-muted-foreground"> / </span>
                    <span className="text-amber-600 font-semibold">{s.warnCount}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {s.topIssues.length === 0 ? (
                        <span className="text-[11px] text-emerald-600">All clear</span>
                      ) : s.topIssues.map((i) => (
                        <span
                          key={i.id}
                          title={i.message}
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded font-medium border",
                            i.level === "bad"
                              ? "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200/60"
                              : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200/60",
                          )}
                        >
                          {i.label}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-xs text-muted-foreground">
                    {(s.post.view_count || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t bg-muted/20 text-xs text-muted-foreground">
          {rows.length} of {scored.length} posts shown
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
        "py-2 font-medium cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap",
        align === "left" ? "text-left" : "text-right",
        className,
      )}
    >
      <span className={cn("inline-flex items-center gap-1", align === "right" && "justify-end w-full")}>{children}</span>
    </th>
  );
}

function SortArrow({ dir }: { dir: "asc" | "desc" }) {
  return dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}
