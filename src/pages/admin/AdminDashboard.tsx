import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SeoHead } from "@/components/SeoHead";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Package, Star, Users, MessageSquare, Eye, Sparkles } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";

type Review = Tables<"reviews">;
type Product = Tables<"products">;
type Profile = Tables<"profiles">;

interface ReviewWithRelations extends Review {
  products: Pick<Product, "name"> | null;
  profiles: Pick<Profile, "name"> | null;
}

interface TopProduct extends Pick<Product, "name" | "total_reviews" | "avg_rating" | "view_count"> {}

interface DailyReviewCount {
  day: string;
  reviews: number;
}

interface StatusBreakdownItem {
  name: string;
  value: number;
}

const CHART_COLORS = ["hsl(245, 82%, 63%)", "hsl(187, 92%, 42%)", "hsl(152, 69%, 45%)", "hsl(38, 92%, 50%)", "hsl(0, 72%, 50%)"];

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [products, reviews, users, pending] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("reviews").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      return {
        products: products.count ?? 0,
        reviews: reviews.count ?? 0,
        users: users.count ?? 0,
        pending: pending.count ?? 0,
      };
    },
  });

  // Real reviews-over-time data: count reviews per day for last 30 days
  const { data: reviewsOverTime } = useQuery<DailyReviewCount[]>({
    queryKey: ["admin-reviews-over-time"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: reviews } = await supabase
        .from("reviews")
        .select("created_at")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true });

      // Build a map of day -> count
      const countByDay = new Map<string, number>();
      for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - 29 + i);
        const key = d.toISOString().split("T")[0];
        countByDay.set(key, 0);
      }

      for (const r of reviews ?? []) {
        if (r.created_at) {
          const key = r.created_at.split("T")[0];
          if (countByDay.has(key)) {
            countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
          }
        }
      }

      return Array.from(countByDay.entries()).map(([day, reviews]) => ({
        day: new Date(day).toLocaleDateString("en", { month: "short", day: "numeric" }),
        reviews,
      }));
    },
  });

  // Real status breakdown from DB
  const { data: statusBreakdown } = useQuery<StatusBreakdownItem[]>({
    queryKey: ["admin-review-status-breakdown"],
    queryFn: async () => {
      const statuses = ["approved", "pending", "rejected", "spam", "flagged"] as const;
      const counts = await Promise.all(
        statuses.map((s) =>
          supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", s)
        )
      );

      const items: StatusBreakdownItem[] = statuses.map((s, i) => ({
        name: s.charAt(0).toUpperCase() + s.slice(1),
        value: counts[i].count ?? 0,
      }));

      // Filter out zero-value statuses for cleaner chart
      return items.filter((item) => item.value > 0);
    },
  });

  const { data: enrichmentStats } = useQuery({
    queryKey: ["admin-enrichment-stats"],
    queryFn: async () => {
      const { data: allProducts } = await supabase
        .from("products")
        .select("id, website_url, features, category_id, categories!products_category_id_fkey(name, slug)")
        .eq("is_active", true);

      const products = allProducts ?? [];
      const needsEnrichment = products.filter(
        (p) => !p.website_url || !p.features || (Array.isArray(p.features) && p.features.length === 0)
      );

      const byCategory: Record<string, { name: string; total: number; needsEnrich: number }> = {};
      for (const p of products) {
        const cat = p.categories as unknown as { name: string; slug: string } | null;
        const catName = cat?.name ?? "Uncategorized";
        const catSlug = cat?.slug ?? "uncategorized";
        if (!byCategory[catSlug]) byCategory[catSlug] = { name: catName, total: 0, needsEnrich: 0 };
        byCategory[catSlug].total++;
      }
      for (const p of needsEnrichment) {
        const cat = p.categories as unknown as { name: string; slug: string } | null;
        const catSlug = cat?.slug ?? "uncategorized";
        if (byCategory[catSlug]) byCategory[catSlug].needsEnrich++;
      }

      const topCategories = Object.entries(byCategory)
        .filter(([, v]) => v.needsEnrich > 0)
        .sort((a, b) => b[1].needsEnrich - a[1].needsEnrich)
        .slice(0, 8);

      return {
        total: products.length,
        needsEnrichment: needsEnrichment.length,
        enriched: products.length - needsEnrichment.length,
        topCategories,
      };
    },
  });

  const { data: recentReviews } = useQuery<ReviewWithRelations[]>({
    queryKey: ["admin-recent-reviews"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*, products(name), profiles(name)")
        .order("created_at", { ascending: false })
        .limit(10);
      return (data as unknown as ReviewWithRelations[]) ?? [];
    },
  });

  const { data: topProducts } = useQuery<TopProduct[]>({
    queryKey: ["admin-top-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("name, total_reviews, avg_rating, view_count")
        .order("view_count", { ascending: false })
        .limit(5);
      return (data as TopProduct[]) ?? [];
    },
  });

  const statusTotal = useMemo(
    () => (statusBreakdown ?? []).reduce((sum, s) => sum + s.value, 0),
    [statusBreakdown]
  );

  return (
    <>
      <SeoHead title="Admin Dashboard" />
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Platform overview and recent activity</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <StatCard title="Total Products" value={stats?.products ?? 0} icon={Package} color="primary" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <StatCard title="Total Reviews" value={stats?.reviews ?? 0} icon={Star} color="secondary" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <StatCard title="Total Users" value={stats?.users ?? 0} icon={Users} color="success" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <StatCard title="Pending Reviews" value={stats?.pending ?? 0} icon={MessageSquare} color="warning" />
          </motion.div>
        </div>

        <div className="grid xl:grid-cols-3 gap-5">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="xl:col-span-2 glass-card p-6">
            <h3 className="font-display font-bold text-foreground mb-5">Reviews — Last 30 Days</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={reviewsOverTime ?? []}>
                <defs>
                  <linearGradient id="reviewGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(245, 82%, 63%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(245, 82%, 63%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 15%, 90%)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(225, 10%, 48%)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(225, 10%, 48%)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(225, 15%, 90%)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} />
                <Area type="monotone" dataKey="reviews" stroke="hsl(245, 82%, 63%)" fill="url(#reviewGrad)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-6">
            <h3 className="font-display font-bold text-foreground mb-5">Review Status</h3>
            {statusBreakdown && statusBreakdown.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" strokeWidth={0}>
                      {statusBreakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-4 justify-center mt-3">
                  {statusBreakdown.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      {s.name} ({statusTotal > 0 ? Math.round((s.value / statusTotal) * 100) : 0}%)
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-16">No review data yet.</p>
            )}
          </motion.div>

          {/* Enrichment Widget */}
          {enrichmentStats && enrichmentStats.needsEnrichment > 0 && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.27 }} className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-warning" />
                  <h3 className="font-display font-bold text-foreground">Product Enrichment Status</h3>
                </div>
                <Link to="/admin/seed">
                  <Button variant="outline" size="sm" className="rounded-lg font-medium">
                    <Sparkles className="mr-1 h-3 w-3" /> Enrich Now
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 rounded-xl bg-muted/50">
                  <div className="text-2xl font-bold text-foreground">{enrichmentStats.total}</div>
                  <div className="text-xs text-muted-foreground">Total Products</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-success/10">
                  <div className="text-2xl font-bold text-success">{enrichmentStats.enriched}</div>
                  <div className="text-xs text-muted-foreground">Enriched</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-warning/10">
                  <div className="text-2xl font-bold text-warning">{enrichmentStats.needsEnrichment}</div>
                  <div className="text-xs text-muted-foreground">Need Enrichment</div>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Enrichment progress</span>
                  <span>{Math.round((enrichmentStats.enriched / enrichmentStats.total) * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-success transition-all"
                    style={{ width: `${(enrichmentStats.enriched / enrichmentStats.total) * 100}%` }}
                  />
                </div>
              </div>
              {enrichmentStats.topCategories.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground mb-2">Top categories needing enrichment</div>
                  {enrichmentStats.topCategories.map(([slug, cat]) => (
                    <div key={slug} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50 text-sm">
                      <span className="font-medium text-foreground">{cat.name}</span>
                      <span className="text-xs text-warning">{cat.needsEnrich} / {cat.total}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>

        <div className="grid xl:grid-cols-2 gap-5">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-foreground">Recent Reviews</h3>
              <Link to="/admin/reviews"><Button variant="ghost" size="sm" className="rounded-lg font-medium">View All</Button></Link>
            </div>
            <div className="space-y-1">
              {recentReviews?.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{r.title || "Untitled"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">on {r.products?.name ?? "—"} · by {r.profiles?.name ?? "Anonymous"}</p>
                  </div>
                  <StatusBadge status={r.status ?? "pending"} />
                </div>
              ))}
              {(!recentReviews || recentReviews.length === 0) && <p className="text-sm text-muted-foreground text-center py-8">No reviews yet.</p>}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-foreground">Top Products</h3>
              <Link to="/admin/products"><Button variant="ghost" size="sm" className="rounded-lg font-medium">View All</Button></Link>
            </div>
            <div className="space-y-1">
              {topProducts?.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-5 text-center">#{i + 1}</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.total_reviews} reviews · ★ {Number(p.avg_rating).toFixed(1)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <Eye className="h-3.5 w-3.5" /> {p.view_count}
                  </div>
                </div>
              ))}
              {(!topProducts || topProducts.length === 0) && <p className="text-sm text-muted-foreground text-center py-8">No products yet.</p>}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
