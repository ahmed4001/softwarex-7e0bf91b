import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SeoHead } from "@/components/SeoHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { CheckCircle, XCircle, Clock, Search, ExternalLink, Filter } from "lucide-react";

type ReviewItem = {
  id: string;
  product_id: string;
  product_name: string;
  candidate_url: string;
  candidate_domain: string | null;
  confidence: number | null;
  source: string | null;
  candidates: any;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
  created_at: string;
};

export default function AdminWebsiteReviewQueuePage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["website-review-queue", statusFilter],
    queryFn: async () => {
      let q = (supabase as any)
        .from("website_url_review_queue")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as ReviewItem[];
    },
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const s = search.toLowerCase();
    return items.filter(
      (i) =>
        i.product_name.toLowerCase().includes(s) ||
        i.candidate_url.toLowerCase().includes(s) ||
        (i.candidate_domain || "").toLowerCase().includes(s),
    );
  }, [items, search]);

  const approve = useMutation({
    mutationFn: async (item: ReviewItem) => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      const { error: upErr } = await supabase
        .from("products")
        .update({ website_url: item.candidate_url })
        .eq("id", item.product_id);
      if (upErr) throw upErr;
      const { error: qErr } = await (supabase as any)
        .from("website_url_review_queue")
        .update({
          status: "approved",
          reviewed_by: uid,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", item.id);
      if (qErr) throw qErr;
    },
    onSuccess: () => {
      toast({ title: "Approved", description: "Website URL applied to product." });
      qc.invalidateQueries({ queryKey: ["website-review-queue"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const reject = useMutation({
    mutationFn: async (item: ReviewItem) => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      const { error } = await (supabase as any)
        .from("website_url_review_queue")
        .update({
          status: "rejected",
          reviewed_by: uid,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Rejected", description: "Candidate URL discarded." });
      qc.invalidateQueries({ queryKey: ["website-review-queue"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0 };
    for (const i of items) (c as any)[i.status] = ((c as any)[i.status] || 0) + 1;
    return c;
  }, [items]);

  return (
    <>
      <SeoHead title="Website Review Queue - Admin" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Website Review Queue</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Approve or reject low-confidence website matches found by Clearbit/Firecrawl before they go live on product pages.
          </p>
        </div>

        <Card>
          <CardContent className="p-4 flex flex-wrap items-end gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search product or domain..."
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
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm min-w-[140px]"
              >
                <option value="pending">Pending ({counts.pending})</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="all">All</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Candidate URL</TableHead>
                  <TableHead className="w-[110px]">Confidence</TableHead>
                  <TableHead className="w-[100px]">Source</TableHead>
                  <TableHead className="w-[110px]">Status</TableHead>
                  <TableHead className="w-[130px]">Created</TableHead>
                  <TableHead className="w-[200px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <Filter className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-muted-foreground text-sm">Nothing in this queue.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <span className="font-medium text-sm">{item.product_name}</span>
                      </TableCell>
                      <TableCell>
                        <a
                          href={item.candidate_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {item.candidate_domain || item.candidate_url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium tabular-nums">
                          {item.confidence !== null ? `${(item.confidence * 100).toFixed(0)}%` : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px]">
                          {item.source || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.status === "pending" && (
                          <Badge variant="secondary" className="gap-1 text-[11px]">
                            <Clock className="h-3 w-3" /> Pending
                          </Badge>
                        )}
                        {item.status === "approved" && (
                          <Badge variant="default" className="gap-1 text-[11px]">
                            <CheckCircle className="h-3 w-3" /> Approved
                          </Badge>
                        )}
                        {item.status === "rejected" && (
                          <Badge variant="destructive" className="gap-1 text-[11px]">
                            <XCircle className="h-3 w-3" /> Rejected
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(item.created_at), "MMM d, yyyy")}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.status === "pending" ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              disabled={approve.isPending}
                              onClick={() => approve.mutate(item)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={reject.isPending}
                              onClick={() => reject.mutate(item)}
                            >
                              <XCircle className="h-3 w-3 mr-1" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {item.reviewed_at ? format(new Date(item.reviewed_at), "MMM d") : ""}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
