import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Package, Star, Wand2, Loader2, CheckCircle2,
  AlertCircle, Download, Trash2, ChevronDown, ChevronUp,
  Zap, Globe, Building2, Calendar, DollarSign, Layers,
  ThumbsUp, ThumbsDown, BrainCircuit, ArrowRight,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────
type GeneratedProduct = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  website_url: string;
  logo_url: string | null;
  category: string;
  category_id: string | null;
  pricing_model: string;
  starting_price: number | null;
  avg_rating: number;
  total_reviews: number;
  founded_year: number;
  headquarters: string;
  company_size: string;
  employee_count: number;
  features: string[];
  integrations: string[];
  pros_summary: string;
  cons_summary: string;
  seo_title: string;
  seo_description: string;
  is_verified: boolean;
  is_featured: boolean;
  is_active: boolean;
  selected?: boolean;
};

type GeneratedReview = {
  overall_rating: number;
  ease_of_use: number;
  customer_support: number;
  value_for_money: number;
  features_rating: number;
  title: string;
  pros: string;
  cons: string;
  body: string;
  reviewer_role: string;
  company_size: string;
  industry: string;
  usage_duration: string;
  use_case: string;
  recommendation_likelihood: number;
  selected?: boolean;
};

// ─── Stat Pill Component ───────────────────────────────
function StatPill({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border border-border/50">
      <Icon className="h-3.5 w-3.5 text-primary" />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold">{value}</span>
    </div>
  );
}

// ─── Rating Stars ──────────────────────────────────────
function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${s <= Math.round(rating) ? "text-[hsl(var(--star))] fill-[hsl(var(--star))]" : "text-border"}`}
        />
      ))}
      <span className="ml-1 text-xs font-semibold">{rating}</span>
    </div>
  );
}

// ─── Animated Counter ──────────────────────────────────
function AnimatedNumber({ value }: { value: number }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="font-bold text-2xl"
    >
      {value}
    </motion.span>
  );
}

// ─── Generate Products Tab ─────────────────────────────
function GenerateProductsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [count, setCount] = useState("5");
  const [products, setProducts] = useState<GeneratedProduct[]>([]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories-list"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name, slug").order("name");
      return data || [];
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const cat = categories.find((c) => c.id === selectedCategory);
      if (!cat) throw new Error("Select a category");
      const { data, error } = await supabase.functions.invoke("ai-generate-products", {
        body: { action: "generate_category", payload: { category: cat.name, count: parseInt(count), categoryId: cat.id } },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.products as GeneratedProduct[];
    },
    onSuccess: (data) => {
      setProducts(data.map((p) => ({ ...p, selected: true })));
      toast({ title: "Generated!", description: `${data.length} products generated successfully.` });
    },
    onError: (e: any) => toast({ title: "Generation failed", description: e.message, variant: "destructive" }),
  });

  const handleImport = async () => {
    const selected = products.filter((p) => p.selected !== false);
    if (!selected.length) return;
    setImporting(true);
    setImportProgress(0);
    let imported = 0;

    for (const p of selected) {
      const { error } = await supabase.from("products").upsert(
        {
          name: p.name, slug: p.slug, tagline: p.tagline, description: p.description,
          website_url: p.website_url, logo_url: p.logo_url, category_id: p.category_id,
          pricing_model: p.pricing_model as any, starting_price: p.starting_price,
          avg_rating: p.avg_rating, total_reviews: p.total_reviews, founded_year: p.founded_year,
          headquarters: p.headquarters, company_size: p.company_size, employee_count: p.employee_count,
          features: p.features, integrations: p.integrations, pros_summary: p.pros_summary,
          cons_summary: p.cons_summary, seo_title: p.seo_title, seo_description: p.seo_description,
          is_verified: true, is_active: true,
        },
        { onConflict: "slug" }
      );
      if (error) console.error("Import error for", p.name, error);
      imported++;
      setImportProgress(Math.round((imported / selected.length) * 100));
    }

    setImporting(false);
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    toast({ title: "Import complete", description: `${imported} products imported.` });
    setProducts([]);
  };

  const toggleProduct = (idx: number) => {
    setProducts((prev) => prev.map((p, i) => (i === idx ? { ...p, selected: !p.selected } : p)));
  };

  const selectedCount = products.filter((p) => p.selected).length;

  return (
    <div className="space-y-6">
      {/* Generator Card */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="bg-gradient-to-br from-primary/10 via-accent/30 to-transparent p-1">
          <div className="bg-card rounded-[calc(var(--radius)-2px)] p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BrainCircuit className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Generate from Category</h3>
                <p className="text-xs text-muted-foreground">AI discovers real software products and populates all fields</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-5 space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-11 bg-background/50">
                    <SelectValue placeholder="Choose a category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3 space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Count</Label>
                <Input type="number" min="1" max="20" value={count} onChange={(e) => setCount(e.target.value)} className="h-11 bg-background/50" />
              </div>
              <div className="md:col-span-4">
                <Button
                  onClick={() => generateMutation.mutate()}
                  disabled={!selectedCategory || generateMutation.isPending}
                  className="w-full h-11 font-semibold shadow-md"
                  size="lg"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate {count} Products
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Loading State */}
      <AnimatePresence>
        {generateMutation.isPending && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="p-8 border-dashed border-2 border-primary/20">
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"
                >
                  <Sparkles className="h-6 w-6 text-primary" />
                </motion.div>
                <div className="text-center">
                  <p className="font-semibold">AI is generating products...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Discovering real software products with accurate data
                  </p>
                </div>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="h-2 w-2 rounded-full bg-primary"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {products.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{products.length} Products Ready</h3>
                  <p className="text-xs text-muted-foreground">{selectedCount} selected for import</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setProducts((prev) => prev.map((p) => ({ ...p, selected: true })))}
                  className="text-xs"
                >
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setProducts([])} className="text-xs text-destructive hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Discard
                </Button>
                <Button
                  size="sm"
                  onClick={handleImport}
                  disabled={importing || selectedCount === 0}
                  className="shadow-sm"
                >
                  {importing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <Download className="h-4 w-4 mr-1.5" />
                  )}
                  Import {selectedCount}
                </Button>
              </div>
            </div>

            {importing && (
              <div className="space-y-1.5">
                <Progress value={importProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">{importProgress}% complete</p>
              </div>
            )}

            {/* Product Cards */}
            <div className="space-y-3">
              {products.map((p, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className={`overflow-hidden transition-all duration-200 ${p.selected ? "border-primary/30 shadow-sm" : "opacity-50 border-border/50"}`}>
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={p.selected}
                          onCheckedChange={() => toggleProduct(idx)}
                          className="mt-1"
                        />
                        <div className="h-12 w-12 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {p.logo_url ? (
                            <img src={p.logo_url} alt="" className="h-10 w-10 object-contain" />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-[15px]">{p.name}</span>
                            <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wider">
                              {p.pricing_model}
                            </Badge>
                            <RatingStars rating={p.avg_rating} />
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{p.tagline}</p>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            {p.website_url && (
                              <a href={p.website_url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-primary hover:underline">
                                <Globe className="h-3 w-3" />
                                {new URL(p.website_url).hostname}
                              </a>
                            )}
                            {p.headquarters && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Building2 className="h-3 w-3" /> {p.headquarters}
                              </span>
                            )}
                            {p.founded_year && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" /> {p.founded_year}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="flex-shrink-0 h-8 w-8"
                          onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                        >
                          {expandedIdx === idx ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedIdx === idx && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-0">
                            <div className="border-t border-border/50 pt-4 space-y-4">
                              {/* Stats row */}
                              <div className="flex flex-wrap gap-2">
                                <StatPill icon={DollarSign} label="Price" value={p.starting_price ? `$${p.starting_price}/mo` : "Free"} />
                                <StatPill icon={Building2} label="Size" value={p.company_size} />
                                <StatPill icon={Star} label="Reviews" value={String(p.total_reviews)} />
                              </div>

                              {/* Features */}
                              {p.features?.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Features</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {p.features.map((f, i) => (
                                      <Badge key={i} variant="outline" className="text-[11px] font-normal bg-muted/30">
                                        {f}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Pros & Cons */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {p.pros_summary && (
                                  <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                      <ThumbsUp className="h-3.5 w-3.5 text-primary" />
                                      <span className="text-xs font-semibold text-primary">Pros</span>
                                    </div>
                                    <p className="text-xs text-foreground/80 leading-relaxed">{p.pros_summary}</p>
                                  </div>
                                )}
                                {p.cons_summary && (
                                  <div className="rounded-lg bg-destructive/5 border border-destructive/10 p-3">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                      <ThumbsDown className="h-3.5 w-3.5 text-destructive" />
                                      <span className="text-xs font-semibold text-destructive">Cons</span>
                                    </div>
                                    <p className="text-xs text-foreground/80 leading-relaxed">{p.cons_summary}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {products.length === 0 && !generateMutation.isPending && (
        <Card className="p-12 border-dashed border-2">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Package className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <div>
              <p className="font-medium text-muted-foreground">No products generated yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Select a category above and click generate to discover real software products
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Generate Reviews Tab ──────────────────────────────
function GenerateReviewsTab() {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState("");
  const [reviewCount, setReviewCount] = useState("5");
  const [reviews, setReviews] = useState<GeneratedReview[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products-for-reviews"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, avg_rating, category_id, categories(name)")
        .eq("is_active", true)
        .order("name")
        .limit(500);
      return data || [];
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const prod = products.find((p) => p.id === selectedProduct);
      if (!prod) throw new Error("Select a product");
      const categoryName = (prod as any).categories?.name || "Software";
      const { data, error } = await supabase.functions.invoke("ai-generate-products", {
        body: {
          action: "generate_reviews",
          payload: {
            product_name: prod.name,
            product_category: categoryName,
            count: parseInt(reviewCount),
            avg_rating: prod.avg_rating || 4.2,
          },
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.reviews as GeneratedReview[];
    },
    onSuccess: (data) => {
      setReviews(data.map((r) => ({ ...r, selected: true })));
      toast({ title: "Reviews generated!", description: `${data.length} reviews ready to import.` });
    },
    onError: (e: any) => toast({ title: "Generation failed", description: e.message, variant: "destructive" }),
  });

  const handleImport = async () => {
    const selected = reviews.filter((r) => r.selected !== false);
    if (!selected.length) return;
    setImporting(true);
    setImportProgress(0);
    let imported = 0;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast({ title: "Must be logged in", variant: "destructive" }); setImporting(false); return; }

    for (const r of selected) {
      const { error } = await supabase.from("reviews").insert({
        product_id: selectedProduct,
        user_id: user.id,
        overall_rating: r.overall_rating,
        ease_of_use: r.ease_of_use,
        customer_support: r.customer_support,
        value_for_money: r.value_for_money,
        features_rating: r.features_rating,
        title: r.title,
        pros: r.pros,
        cons: r.cons,
        body: r.body,
        reviewer_role: r.reviewer_role,
        company_size: r.company_size,
        industry: r.industry,
        usage_duration: r.usage_duration,
        use_case: r.use_case,
        recommendation_likelihood: r.recommendation_likelihood,
        verified_reviewer: true,
        status: "approved" as any,
        source: "imported" as any,
      });
      if (error) console.error("Review import error:", error);
      imported++;
      setImportProgress(Math.round((imported / selected.length) * 100));
    }

    setImporting(false);
    toast({ title: "Reviews imported", description: `${imported} reviews added.` });
    setReviews([]);
  };

  const selectedCount = reviews.filter((r) => r.selected).length;

  return (
    <div className="space-y-6">
      {/* Generator Card */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="bg-gradient-to-br from-[hsl(var(--star))]/10 via-accent/20 to-transparent p-1">
          <div className="bg-card rounded-[calc(var(--radius)-2px)] p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-xl bg-[hsl(var(--star))]/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-[hsl(var(--star))]" />
              </div>
              <div>
                <h3 className="font-semibold">Generate Reviews</h3>
                <p className="text-xs text-muted-foreground">AI creates realistic, varied reviews for any product</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-5 space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Product</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="h-11 bg-background/50">
                    <SelectValue placeholder="Choose a product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3 space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Count</Label>
                <Input type="number" min="1" max="20" value={reviewCount} onChange={(e) => setReviewCount(e.target.value)} className="h-11 bg-background/50" />
              </div>
              <div className="md:col-span-4">
                <Button
                  onClick={() => generateMutation.mutate()}
                  disabled={!selectedProduct || generateMutation.isPending}
                  className="w-full h-11 font-semibold shadow-md"
                  size="lg"
                >
                  {generateMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating...</>
                  ) : (
                    <><Star className="h-4 w-4 mr-2" /> Generate {reviewCount} Reviews</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Loading */}
      <AnimatePresence>
        {generateMutation.isPending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="p-8 border-dashed border-2 border-[hsl(var(--star))]/20">
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="h-12 w-12 rounded-full bg-[hsl(var(--star))]/10 flex items-center justify-center"
                >
                  <Star className="h-6 w-6 text-[hsl(var(--star))]" />
                </motion.div>
                <p className="font-semibold">Generating realistic reviews...</p>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i} className="h-2 w-2 rounded-full bg-[hsl(var(--star))]"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reviews list */}
      <AnimatePresence>
        {reviews.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-[hsl(var(--star))]/10 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{reviews.length} Reviews Ready</h3>
                  <p className="text-xs text-muted-foreground">{selectedCount} selected</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive" onClick={() => setReviews([])}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Discard
                </Button>
                <Button size="sm" onClick={handleImport} disabled={importing || selectedCount === 0} className="shadow-sm">
                  {importing ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Download className="h-4 w-4 mr-1.5" />}
                  Import {selectedCount}
                </Button>
              </div>
            </div>

            {importing && (
              <div className="space-y-1.5">
                <Progress value={importProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">{importProgress}%</p>
              </div>
            )}

            <div className="space-y-3">
              {reviews.map((r, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                  <Card className={`p-4 transition-all duration-200 ${r.selected ? "border-primary/30 shadow-sm" : "opacity-50"}`}>
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={r.selected}
                        onCheckedChange={() => setReviews((prev) => prev.map((rv, i) => (i === idx ? { ...rv, selected: !rv.selected } : rv)))}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium text-sm">{r.title}</span>
                          <RatingStars rating={r.overall_rating} />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <span className="font-medium">{r.reviewer_role}</span>
                          <span>·</span>
                          <span>{r.industry}</span>
                          <span>·</span>
                          <span>{r.company_size}</span>
                          <span>·</span>
                          <span>{r.usage_duration}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{r.body}</p>
                        <div className="flex gap-4 mt-2">
                          <div className="flex items-center gap-1 text-xs">
                            <Zap className="h-3 w-3 text-primary" />
                            <span>Ease: {r.ease_of_use}/5</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <DollarSign className="h-3 w-3 text-primary" />
                            <span>Value: {r.value_for_money}/5</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <Layers className="h-3 w-3 text-primary" />
                            <span>Features: {r.features_rating}/5</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {reviews.length === 0 && !generateMutation.isPending && (
        <Card className="p-12 border-dashed border-2">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Star className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="font-medium text-muted-foreground">No reviews generated yet</p>
            <p className="text-sm text-muted-foreground/70">Select a product and generate realistic reviews</p>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Enrich Products Tab ───────────────────────────────
function EnrichProductsTab() {
  const { toast } = useToast();
  const [enriching, setEnriching] = useState<string | null>(null);
  const [enrichProgress, setEnrichProgress] = useState(0);
  const [bulkEnriching, setBulkEnriching] = useState(false);
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products-to-enrich"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, website_url, description, features, logo_url, tagline, pricing_model, avg_rating, category_id, categories(name)")
        .eq("is_active", true)
        .order("name")
        .limit(500);
      return data || [];
    },
  });

  const needsEnrichment = products.filter(
    (p) => !p.description || !p.features || (Array.isArray(p.features) && p.features.length === 0) || !p.tagline
  );
  const enrichedCount = products.length - needsEnrichment.length;
  const enrichPercent = products.length > 0 ? Math.round((enrichedCount / products.length) * 100) : 0;

  const enrichSingle = async (product: any) => {
    setEnriching(product.id);
    try {
      const { data, error } = await supabase.functions.invoke("ai-generate-products", {
        body: {
          action: "enrich_product",
          payload: {
            product: {
              name: product.name, category: (product as any).categories?.name || "Software",
              website_url: product.website_url, description: product.description,
              features: product.features, tagline: product.tagline, pricing_model: product.pricing_model,
            },
          },
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const enrichment = data.enrichment;
      const updatePayload: any = {};
      const fields = ["description", "tagline", "features", "integrations", "pros_summary", "cons_summary",
        "logo_url", "seo_title", "seo_description", "founded_year", "headquarters", "company_size", "pricing_model", "starting_price"];
      for (const f of fields) { if (enrichment[f]) updatePayload[f] = enrichment[f]; }

      await supabase.from("products").update(updatePayload).eq("id", product.id);
      queryClient.invalidateQueries({ queryKey: ["admin-products-to-enrich"] });
      toast({ title: "Enriched", description: `${product.name} updated.` });
    } catch (e: any) {
      toast({ title: "Enrichment failed", description: e.message, variant: "destructive" });
    } finally {
      setEnriching(null);
    }
  };

  const enrichAll = async () => {
    setBulkEnriching(true);
    setEnrichProgress(0);
    for (let i = 0; i < needsEnrichment.length; i++) {
      await enrichSingle(needsEnrichment[i]);
      setEnrichProgress(Math.round(((i + 1) / needsEnrichment.length) * 100));
    }
    setBulkEnriching(false);
    toast({ title: "Bulk enrichment complete" });
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="bg-gradient-to-br from-accent/40 via-primary/5 to-transparent p-1">
          <div className="bg-card rounded-[calc(var(--radius)-2px)] p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Wand2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Data Enrichment</h3>
                  <p className="text-xs text-muted-foreground">AI fills missing descriptions, features, taglines & more</p>
                </div>
              </div>
              <Button
                onClick={enrichAll}
                disabled={bulkEnriching || needsEnrichment.length === 0}
                className="shadow-md"
              >
                {bulkEnriching ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Enriching...</>
                ) : (
                  <><Wand2 className="h-4 w-4 mr-2" /> Enrich All ({needsEnrichment.length})</>
                )}
              </Button>
            </div>

            {/* Progress overview */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 rounded-xl bg-muted/30">
                <AnimatedNumber value={products.length} />
                <p className="text-xs text-muted-foreground mt-1">Total Products</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-primary/5">
                <AnimatedNumber value={enrichedCount} />
                <p className="text-xs text-muted-foreground mt-1">Enriched</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-destructive/5">
                <AnimatedNumber value={needsEnrichment.length} />
                <p className="text-xs text-muted-foreground mt-1">Needs Work</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Enrichment progress</span>
                <span className="font-semibold">{enrichPercent}%</span>
              </div>
              <Progress value={enrichPercent} className="h-2.5" />
            </div>

            {bulkEnriching && (
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Batch progress</span>
                  <span className="font-semibold">{enrichProgress}%</span>
                </div>
                <Progress value={enrichProgress} className="h-2" />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Product list */}
      <div className="space-y-2">
        {needsEnrichment.map((p, idx) => {
          const missing: string[] = [];
          if (!p.description) missing.push("description");
          if (!p.features || (Array.isArray(p.features) && p.features.length === 0)) missing.push("features");
          if (!p.tagline) missing.push("tagline");
          if (!p.logo_url) missing.push("logo");

          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
            >
              <Card className="p-4 hover:shadow-sm transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {p.logo_url ? (
                      <img src={p.logo_url} alt="" className="h-8 w-8 object-contain" />
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">{p.name?.[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm">{p.name}</span>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {missing.map((m) => (
                        <Badge key={m} variant="outline" className="text-[10px] text-destructive/80 border-destructive/20 bg-destructive/5">
                          <AlertCircle className="h-2.5 w-2.5 mr-0.5" /> {m}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => enrichSingle(p)}
                    disabled={enriching === p.id || bulkEnriching}
                    className="gap-1.5"
                  >
                    {enriching === p.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Wand2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Enrich</span>
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}

        {needsEnrichment.length === 0 && !isLoading && (
          <Card className="p-12 border-dashed border-2">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </div>
              <p className="font-semibold">All products fully enriched!</p>
              <p className="text-sm text-muted-foreground">Every product has complete data. Nice work.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────
export default function AdminAIImportPage() {
  return (
    <div className="space-y-8 max-w-5xl">
      {/* Page Header */}
      <div className="flex items-start gap-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0"
        >
          <Sparkles className="h-6 w-6 text-primary" />
        </motion.div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Product Data Generator</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Generate, enrich, and import real software product data · Powered by AI + Clearbit logos
          </p>
        </div>
      </div>

      {/* Source badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="gap-1.5 px-3 py-1 bg-card">
          <BrainCircuit className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs">Lovable AI</span>
        </Badge>
        <Badge variant="outline" className="gap-1.5 px-3 py-1 bg-card">
          <Globe className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs">Clearbit Logos</span>
        </Badge>
        <Badge variant="outline" className="gap-1.5 px-3 py-1 bg-card">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs">No API Key Required</span>
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="bg-card border border-border/50 p-1 h-auto rounded-xl shadow-sm">
          <TabsTrigger
            value="generate"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:shadow-sm text-sm"
          >
            <Package className="h-4 w-4" /> Generate Products
          </TabsTrigger>
          <TabsTrigger
            value="reviews"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:shadow-sm text-sm"
          >
            <Star className="h-4 w-4" /> Generate Reviews
          </TabsTrigger>
          <TabsTrigger
            value="enrich"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:shadow-sm text-sm"
          >
            <Wand2 className="h-4 w-4" /> Enrich Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-6">
          <GenerateProductsTab />
        </TabsContent>
        <TabsContent value="reviews" className="mt-6">
          <GenerateReviewsTab />
        </TabsContent>
        <TabsContent value="enrich" className="mt-6">
          <EnrichProductsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
