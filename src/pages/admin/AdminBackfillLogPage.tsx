import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SeoHead } from "@/components/SeoHead";
import { BackfillRunnerPanel } from "@/components/admin/BackfillRunnerPanel";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, CheckCircle, XCircle, HelpCircle, BarChart3, Globe, Clock } from "lucide-react";
import { format } from "date-fns";

type BackfillLog = {
  id: string;
  product_id: string | null;
  product_name: string;
  source_query: string;
  status: string;
  confidence: number | null;
  matched_domain: string | null;
  matched_url: string | null;
  previous_url: string | null;
  reason: string | null;
  candidates: any;
  created_at: string;
};

const STATUS_META: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  match: { label: "Match", variant: "default", icon: CheckCircle },
  no_match: { label: "No Match", variant: "destructive", icon: XCircle },
  skipped: { label: "Skipped", variant: "secondary", icon: HelpCircle },
};

export default function AdminBackfillLogPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [minConfidence, setMinConfidence] = useState<string>("");
  const [maxConfidence, setMaxConfidence] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["admin-backfill-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("backfill_match_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data || []) as BackfillLog[];
    },
  });

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      // Product name search
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          log.product_name.toLowerCase().includes(q) ||
          log.source_query.toLowerCase().includes(q) ||
          (log.matched_domain && log.matched_domain.toLowerCase().includes(q)) ||
          (log.reason && log.reason.toLowerCase().includes(q));
        if (!match) return false;
      }

      // Status filter
      if (statusFilter !== "all" && log.status !== statusFilter) return false;

      // Confidence range
      if (minConfidence !== "" && (log.confidence === null || log.confidence < parseFloat(minConfidence))) return false;
      if (maxConfidence !== "" && (log.confidence === null || log.confidence > parseFloat(maxConfidence))) return false;

      // Date range
      if (dateFrom && new Date(log.created_at) < new Date(dateFrom)) return false;
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (new Date(log.created_at) > to) return false;
      }

      return true;
    });
  }, [logs, search, statusFilter, minConfidence, maxConfidence, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const matches = filtered.filter((l) => l.status === "match").length;
    const noMatches = filtered.filter((l) => l.status === "no_match").length;
    const avgConfidence =
      total > 0
        ? filtered.reduce((sum, l) => sum + (l.confidence || 0), 0) / total
        : 0;
    return { total, matches, noMatches, avgConfidence };
  }, [filtered]);

  const statuses = useMemo(() => [...new Set(logs.map((l) => l.status))], [logs]);

  return (
    <>
      <SeoHead title="Backfill Audit Log - Admin" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Backfill Audit Log</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Audit every website_url change from the backfill process
          </p>
        </div>

        <BackfillRunnerPanel />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Total Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-extrabold text-foreground">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" /> Matches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-extrabold text-foreground">{stats.matches}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <XCircle className="h-4 w-4" /> Misses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-extrabold text-foreground">{stats.noMatches}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Globe className="h-4 w-4" /> Avg Confidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-extrabold text-foreground">
                {stats.avgConfidence.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search product, domain, query, reason..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-medium">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-1 focus:ring-ring min-w-[120px]"
                >
                  <option value="all">All Statuses</option>
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_META[s]?.label || s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-medium">Min Confidence</label>
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  placeholder="0.00"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(e.target.value)}
                  className="h-9 w-28"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-medium">Max Confidence</label>
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  placeholder="1.00"
                  value={maxConfidence}
                  onChange={(e) => setMaxConfidence(e.target.value)}
                  className="h-9 w-28"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-medium">From</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9 w-40"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-medium">To</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9 w-40"
                />
              </div>

              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setMinConfidence("");
                  setMaxConfidence("");
                  setDateFrom("");
                  setDateTo("");
                }}
                className="h-9 px-3 rounded-md border border-input bg-background text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Reset
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Status</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Query / Domain</TableHead>
                  <TableHead className="w-[100px]">Confidence</TableHead>
                  <TableHead>Previous → New URL</TableHead>
                  <TableHead className="w-[120px]">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <Filter className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-muted-foreground text-sm">No records match your filters</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((log) => {
                    const meta = STATUS_META[log.status] || { label: log.status, variant: "outline", icon: HelpCircle };
                    const Icon = meta.icon;
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant={meta.variant} className="gap-1 text-[11px]">
                            <Icon className="h-3 w-3" />
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                              {log.product_name}
                            </span>
                            {log.product_id && (
                              <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">
                                {log.product_id.slice(0, 8)}…
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <span className="text-muted-foreground truncate max-w-[220px]" title={log.source_query}>
                              {log.source_query}
                            </span>
                            {log.matched_domain && (
                              <span className="text-foreground truncate max-w-[220px]" title={log.matched_domain}>
                                {log.matched_domain}
                              </span>
                            )}
                            {log.reason && (
                              <span className="text-[11px] text-muted-foreground/70 truncate max-w-[220px]" title={log.reason}>
                                {log.reason}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.confidence !== null ? (
                            <span className="text-sm font-medium tabular-nums">
                              {(log.confidence * 100).toFixed(0)}%
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5 max-w-[240px]">
                            {log.previous_url ? (
                              <span className="text-[11px] text-muted-foreground truncate" title={log.previous_url}>
                                ← {log.previous_url}
                              </span>
                            ) : (
                              <span className="text-[11px] text-muted-foreground/40">← (none)</span>
                            )}
                            {log.matched_url ? (
                              <a
                                href={log.matched_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-primary truncate hover:underline"
                                title={log.matched_url}
                              >
                                → {log.matched_url}
                              </a>
                            ) : (
                              <span className="text-[11px] text-muted-foreground/40">→ (none)</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                            <Clock className="h-3 w-3" />
                            {format(new Date(log.created_at), "MMM d, yyyy")}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60 ml-4">
                            {format(new Date(log.created_at), "h:mm a")}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
