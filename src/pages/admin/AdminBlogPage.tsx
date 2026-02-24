import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SeoHead } from "@/components/SeoHead";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import {
  Plus, Pencil, Trash2, Eye, FileText, Globe, PenLine, TrendingUp,
  Search, ExternalLink, History, Copy, CheckCircle2, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type StatusFilter = "all" | "published" | "draft" | "scheduled" | "archived";

export default function AdminBlogPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-blog"],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const categories = useMemo(() => {
    if (!posts) return [];
    const cats = new Set(posts.map((p) => p.category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [posts]);

  const filtered = useMemo(() => {
    if (!posts) return [];
    return posts.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (categoryFilter !== "all" && (p.category || "") !== categoryFilter) return false;
      if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.slug.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [posts, statusFilter, categoryFilter, search]);

  const stats = useMemo(() => {
    if (!posts) return { total: 0, published: 0, drafts: 0, withCTA: 0 };
    return {
      total: posts.length,
      published: posts.filter((p) => p.status === "published").length,
      drafts: posts.filter((p) => p.status === "draft").length,
      withCTA: posts.filter((p) => p.is_featured).length,
    };
  }, [posts]);

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleCopySlug = (slug: string) => {
    navigator.clipboard.writeText(`/blog/${slug}`);
    toast({ title: "Slug copied" });
  };

  const bulkStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const ids = Array.from(selected);
      const payload: any = { status: newStatus };
      if (newStatus === "published") payload.published_at = new Date().toISOString();
      const { error } = await supabase.from("blog_posts").update(payload).in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_, newStatus) => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
      toast({ title: `${selected.size} post(s) ${newStatus === "published" ? "published" : "unpublished"}` });
      setSelected(new Set());
    },
    onError: (err: any) => {
      toast({ title: "Bulk update failed", description: err.message, variant: "destructive" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selected);
      const { error } = await supabase.from("blog_posts").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
      toast({ title: `${selected.size} post(s) deleted` });
      setSelected(new Set());
      setDeleteDialogOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "Bulk delete failed", description: err.message, variant: "destructive" });
      setDeleteDialogOpen(false);
    },
  });

  const isBulkLoading = bulkStatusMutation.isPending || bulkDeleteMutation.isPending;

  const statusTabs: { label: string; value: StatusFilter; count: number }[] = [
    { label: "All", value: "all", count: stats.total },
    { label: "Published", value: "published", count: stats.published },
    { label: "Drafts", value: "draft", count: stats.drafts },
  ];

  const statCards = [
    { label: "Total Pages", value: stats.total, icon: FileText, color: "text-muted-foreground" },
    { label: "Published", value: stats.published, icon: Globe, color: "text-emerald-500" },
    { label: "Drafts", value: stats.drafts, icon: PenLine, color: "text-amber-500" },
    { label: "Featured", value: stats.withCTA, icon: TrendingUp, color: "text-primary" },
  ];

  return (
    <>
      <SeoHead title="Blog & CMS - Admin" />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Content Management</h1>
            <p className="text-muted-foreground text-sm">Create, manage, and publish blog posts and landing pages</p>
          </div>
          <Link to="/admin/blog/new">
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" /> New Page
            </Button>
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className="product-card flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
              </div>
              <s.icon className={cn("h-8 w-8 opacity-60", s.color)} />
            </div>
          ))}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 gap-0.5">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  statusFilter === tab.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="ml-auto relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        {/* Bulk actions bar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <span className="text-sm font-medium text-foreground">{selected.size} selected</span>
            <div className="h-4 w-px bg-border" />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={isBulkLoading}
              onClick={() => bulkStatusMutation.mutate("published")}
            >
              {bulkStatusMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
              Publish
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={isBulkLoading}
              onClick={() => bulkStatusMutation.mutate("draft")}
            >
              <PenLine className="h-3.5 w-3.5" /> Unpublish
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
              disabled={isBulkLoading}
              onClick={() => setDeleteDialogOpen(true)}
            >
              {bulkDeleteMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Delete
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())} className="ml-auto">
              Clear selection
            </Button>
          </div>
        )}

        {/* Table */}
        <div className="product-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 w-10">
                    <Checkbox
                      checked={filtered.length > 0 && selected.size === filtered.length}
                      onCheckedChange={toggleAll}
                    />
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Title</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Slug</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Category</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Featured</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Updated</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="admin-table-row border-b border-border/50 last:border-0">
                    <td className="px-4 py-3">
                      <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggleOne(p.id)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{p.title}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground font-mono text-xs">/{p.slug}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{p.category || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3">
                      {p.is_featured ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Yes
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <Link to={`/blog/${p.slug}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="View">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Link to={`/admin/blog/${p.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="History">
                          <History className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Copy slug" onClick={() => handleCopySlug(p.slug)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Delete" onClick={() => setSingleDeleteId(p.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {isLoading && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
                )}
                {!isLoading && filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No posts found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} post(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected blog posts will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => bulkDeleteMutation.mutate()}
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!singleDeleteId} onOpenChange={(open) => { if (!open) setSingleDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This blog post will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!singleDeleteId) return;
                const { error } = await supabase.from("blog_posts").delete().eq("id", singleDeleteId);
                if (error) {
                  toast({ title: "Delete failed", description: error.message, variant: "destructive" });
                } else {
                  queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
                  toast({ title: "Post deleted" });
                }
                setSingleDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
