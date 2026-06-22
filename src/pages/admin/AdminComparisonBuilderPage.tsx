import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SeoHead } from "@/components/SeoHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Trash2, Eye, Loader2, ArrowLeftRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function AdminComparisonBuilderPage() {
  const queryClient = useQueryClient();
  const [productASearch, setProductASearch] = useState("");
  const [productBSearch, setProductBSearch] = useState("");
  const [productA, setProductA] = useState<{ id: string; name: string } | null>(null);
  const [productB, setProductB] = useState<{ id: string; name: string } | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  const { data: comparisons = [], isLoading } = useQuery({
    queryKey: ["admin-comparisons-builder"],
    queryFn: async () => {
      const { data } = await supabase
        .from("comparisons")
        .select("*, categories(name)")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const searchProducts = (search: string) => useQuery({
    queryKey: ["product-search-compare", search],
    enabled: search.length > 1,
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name, slug").ilike("name", `%${search}%`).limit(8);
      return data || [];
    },
  });

  const { data: productAResults = [] } = searchProducts(productASearch);
  const { data: productBResults = [] } = searchProducts(productBSearch);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!productA || !productB) throw new Error("Select both products");
      if (productA.id === productB.id) throw new Error("Products must be different");
      const finalSlug = slug || `${productA.name.toLowerCase().replace(/\s+/g, "-")}-vs-${productB.name.toLowerCase().replace(/\s+/g, "-")}`;
      const finalTitle = title || `${productA.name} vs ${productB.name}`;
      const { error } = await supabase.from("comparisons").insert({
        product_ids: [productA.id, productB.id],
        title: finalTitle,
        slug: finalSlug,
        summary: summary || null,
        is_published: isPublished,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comparisons-builder"] });
      setProductA(null);
      setProductB(null);
      setTitle("");
      setSlug("");
      setSummary("");
      toast.success("Comparison created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("comparisons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comparisons-builder"] });
      toast.success("Comparison deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, val }: { id: string; val: boolean }) => {
      const { error } = await supabase.from("comparisons").update({ is_published: val }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comparisons-builder"] });
      toast.success("Updated");
    },
  });

  const ProductPicker = ({ label, searchVal, setSearchVal, results, selected, setSelected }: {
    label: string; searchVal: string; setSearchVal: (v: string) => void;
    results: { id: string; name: string }[]; selected: { id: string; name: string } | null;
    setSelected: (v: { id: string; name: string } | null) => void;
  }) => (
    <div className="space-y-2 flex-1">
      <Label>{label}</Label>
      {selected ? (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/20">
          <span className="text-sm font-medium text-foreground flex-1">{selected.name}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelected(null)}><Trash2 className="h-3 w-3" /></Button>
        </div>
      ) : (
        <>
          <Input placeholder="Search products..." value={searchVal} onChange={(e) => setSearchVal(e.target.value)} />
          {results.length > 0 && (
            <div className="border border-border rounded-lg max-h-40 overflow-y-auto">
              {results.map((p) => (
                <button key={p.id} className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors" onClick={() => { setSelected(p); setSearchVal(""); }}>
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <>
      <SeoHead title="Comparison Builder - Admin" robots="noindex, nofollow" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ArrowLeftRight className="h-6 w-6" /> Comparison Builder
          </h1>
          <p className="text-muted-foreground">Create and manage product comparisons</p>
        </div>

        {/* Builder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create New Comparison</CardTitle>
            <CardDescription>Pick two products to compare</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <ProductPicker label="Product A" searchVal={productASearch} setSearchVal={setProductASearch} results={productAResults} selected={productA} setSelected={setProductA} />
              <div className="flex items-end pb-2"><ArrowLeftRight className="h-5 w-5 text-muted-foreground" /></div>
              <ProductPicker label="Product B" searchVal={productBSearch} setSearchVal={setProductBSearch} results={productBResults} selected={productB} setSelected={setProductB} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title (auto-generated if empty)</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Slack vs Teams" />
              </div>
              <div className="space-y-2">
                <Label>Slug (auto-generated if empty)</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. slack-vs-teams" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Summary</Label>
              <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Optional comparison summary..." rows={2} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                <Label>Publish immediately</Label>
              </div>
              <Button onClick={() => createMutation.mutate()} disabled={!productA || !productB || createMutation.isPending} className="gap-2">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create Comparison
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Existing comparisons */}
        <div className="product-card overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Title</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Slug</th>
                <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3">Views</th>
                <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3">Published</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((c: any) => (
                <tr key={c.id} className="admin-table-row">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{c.title || "Untitled"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.slug || "—"}</td>
                  <td className="px-4 py-3 text-center text-sm">{c.view_count || 0}</td>
                  <td className="px-4 py-3 text-center">
                    <Switch checked={c.is_published} onCheckedChange={(v) => togglePublish.mutate({ id: c.id, val: v })} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {c.slug && (
                        <Link to={`/compare/${c.slug}`}><Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-3.5 w-3.5" /></Button></Link>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(c.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>}
              {!isLoading && comparisons.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No comparisons yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
