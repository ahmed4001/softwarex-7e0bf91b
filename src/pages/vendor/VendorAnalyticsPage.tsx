import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SeoHead } from "@/components/SeoHead";
import { ProductAnalyticsDashboard } from "@/components/analytics/ProductAnalyticsDashboard";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Star, Eye, TrendingUp, ThumbsUp, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { format, subDays } from "date-fns";

const PIE_COLORS = ["hsl(245, 82%, 63%)", "hsl(38, 92%, 50%)", "hsl(152, 69%, 45%)", "hsl(0, 72%, 50%)", "hsl(187, 92%, 42%)"];

export default function VendorAnalyticsPage() {
  const { user } = useAuth();

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ["vendor-claims-analytics", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("product_claims")
        .select("product_id")
        .eq("user_id", user!.id)
        .eq("status", "approved");
      return data || [];
    },
  });

  const productIds = claims.map((c: any) => c.product_id).filter(Boolean);

  // Fetch product details
  const { data: products = [] } = useQuery({
    queryKey: ["vendor-products-detail", productIds],
    enabled: productIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, avg_rating, total_reviews, view_count, click_count")
        .in("id", productIds);
      return data || [];
    },
  });

  // Fetch reviews for claimed products
  const { data: allReviews = [] } = useQuery({
    queryKey: ["vendor-reviews-analytics", productIds],
    enabled: productIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, overall_rating, status, created_at, product_id, helpful_count")
        .in("product_id", productIds)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Vendor responses count
  const { data: responseCount } = useQuery({
    queryKey: ["vendor-response-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase.from("vendor_responses").select("id", { count: "exact", head: true }).eq("user_id", user!.id);
      return count ?? 0;
    },
  });

  // Aggregate stats
  const totalViews = products.reduce((s: number, p: any) => s + (p.view_count || 0), 0);
  const totalClicks = products.reduce((s: number, p: any) => s + (p.click_count || 0), 0);
  const avgRating = products.length > 0 ? products.reduce((s: number, p: any) => s + Number(p.avg_rating || 0), 0) / products.length : 0;
  const totalReviews = allReviews.length;
  const approvedReviews = allReviews.filter((r: any) => r.status === "approved").length;
  const unansweredReviews = totalReviews - (responseCount || 0);

  // Rating distribution
  const ratingDist = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    allReviews.forEach((r: any) => { if (r.overall_rating >= 1 && r.overall_rating <= 5) dist[r.overall_rating - 1]++; });
    return dist.map((v, i) => ({ rating: `${i + 1}★`, count: v }));
  }, [allReviews]);

  // Reviews by product (for bar chart)
  const reviewsByProduct = useMemo(() => {
    return products.map((p: any) => ({
      name: p.name.length > 15 ? p.name.slice(0, 15) + "…" : p.name,
      reviews: p.total_reviews || 0,
      rating: Number(p.avg_rating || 0).toFixed(1),
    }));
  }, [products]);

  // Status distribution
  const statusDist = useMemo(() => {
    const counts: Record<string, number> = {};
    allReviews.forEach((r: any) => { const s = r.status || "pending"; counts[s] = (counts[s] || 0) + 1; });
    return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [allReviews]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-16 text-muted-foreground">Loading...</div>;
  }

  if (productIds.length === 0) {
    return (
      <>
        <SeoHead title="Analytics — Vendor" />
        <div className="glass-card p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">No claimed products</h2>
          <p className="text-sm text-muted-foreground mb-4">Claim a product to see analytics.</p>
          <Link to="/vendor/claim"><Button>Claim a Product</Button></Link>
        </div>
      </>
    );
  }

  return (
    <>
      <SeoHead title="Product Analytics — Vendor" description="View analytics for your claimed products." />
      <div className="space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard title="Total Views" value={totalViews.toLocaleString()} icon={Eye} color="primary" />
          <StatCard title="Total Clicks" value={totalClicks.toLocaleString()} icon={TrendingUp} color="secondary" />
          <StatCard title="Avg Rating" value={avgRating ? avgRating.toFixed(1) : "—"} icon={Star} color="warning" />
          <StatCard title="Total Reviews" value={totalReviews} icon={MessageSquare} color="success" />
          <StatCard title="Responses" value={responseCount || 0} icon={ThumbsUp} color="primary" />
          <StatCard title="Unanswered" value={unansweredReviews > 0 ? unansweredReviews : 0} icon={MessageSquare} color="warning" />
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Rating distribution */}
          <Card>
            <CardHeader><CardTitle className="text-base">Rating Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ratingDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="rating" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Reviews" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Reviews by product */}
          {reviewsByProduct.length > 1 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Reviews by Product</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={reviewsByProduct} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="reviews" fill="hsl(var(--secondary))" radius={[0, 6, 6, 0]} name="Reviews" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Status distribution */}
          <Card>
            <CardHeader><CardTitle className="text-base">Review Status</CardTitle></CardHeader>
            <CardContent>
              {statusDist.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusDist} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value" strokeWidth={0}>
                      {statusDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-16">No data</p>
              )}
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {statusDist.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {s.name}: {s.value}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Full analytics dashboard */}
        <ProductAnalyticsDashboard productIds={productIds} title="Detailed Trends" />
      </div>
    </>
  );
}
