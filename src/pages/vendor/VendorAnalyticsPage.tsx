import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SeoHead } from "@/components/SeoHead";
import { ProductAnalyticsDashboard } from "@/components/analytics/ProductAnalyticsDashboard";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Star, Eye, TrendingUp, ThumbsUp, MessageSquare, Clock, Percent, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts";
import { format, subDays, differenceInHours } from "date-fns";

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

  // Fetch reviews with sub-criteria fields
  const { data: allReviews = [] } = useQuery({
    queryKey: ["vendor-reviews-analytics", productIds],
    enabled: productIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, overall_rating, status, created_at, product_id, helpful_count, ease_of_use, customer_support, value_for_money, features_rating, recommendation_likelihood")
        .in("product_id", productIds)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Fetch vendor responses with created_at and review_id
  const { data: vendorResponses = [] } = useQuery({
    queryKey: ["vendor-responses-analytics", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("vendor_responses")
        .select("id, review_id, created_at")
        .eq("user_id", user!.id);
      return data || [];
    },
  });

  const responseCount = vendorResponses.length;

  // Aggregate stats
  const totalViews = products.reduce((s: number, p: any) => s + (p.view_count || 0), 0);
  const totalClicks = products.reduce((s: number, p: any) => s + (p.click_count || 0), 0);
  const avgRating = products.length > 0 ? products.reduce((s: number, p: any) => s + Number(p.avg_rating || 0), 0) / products.length : 0;
  const totalReviews = allReviews.length;
  const unansweredReviews = totalReviews - responseCount;

  // Response rate & avg response time
  const responseMap = useMemo(() => {
    const map = new Map<string, any>();
    vendorResponses.forEach((vr: any) => map.set(vr.review_id, vr));
    return map;
  }, [vendorResponses]);

  const responseRate = totalReviews > 0 ? Math.round((responseCount / totalReviews) * 100) : 0;

  const avgResponseTime = useMemo(() => {
    const times: number[] = [];
    allReviews.forEach((r: any) => {
      const resp = responseMap.get(r.id);
      if (resp) {
        const hours = differenceInHours(new Date(resp.created_at), new Date(r.created_at));
        if (hours >= 0) times.push(hours);
      }
    });
    if (times.length === 0) return null;
    const avgHours = times.reduce((a, b) => a + b, 0) / times.length;
    return avgHours;
  }, [allReviews, responseMap]);

  const avgResponseTimeLabel = useMemo(() => {
    if (avgResponseTime === null) return "—";
    if (avgResponseTime < 24) return `${Math.round(avgResponseTime)}h`;
    return `${(avgResponseTime / 24).toFixed(1)}d`;
  }, [avgResponseTime]);

  // Response streak
  const responseStreak = useMemo(() => {
    let streak = 0;
    for (const r of allReviews) {
      if (responseMap.has(r.id)) streak++;
      else break;
    }
    return streak;
  }, [allReviews, responseMap]);

  // Rating distribution
  const ratingDist = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    allReviews.forEach((r: any) => { if (r.overall_rating >= 1 && r.overall_rating <= 5) dist[r.overall_rating - 1]++; });
    return dist.map((v, i) => ({ rating: `${i + 1}★`, count: v }));
  }, [allReviews]);

  // Reviews by product
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

  // Sub-criteria averages
  const subCriteriaData = useMemo(() => {
    const fields = [
      { key: "ease_of_use", label: "Ease of Use" },
      { key: "customer_support", label: "Customer Support" },
      { key: "value_for_money", label: "Value for Money" },
      { key: "features_rating", label: "Features" },
      { key: "recommendation_likelihood", label: "Recommendation" },
    ];
    return fields.map(({ key, label }) => {
      const vals = allReviews.map((r: any) => r[key]).filter((v: any) => v != null && v > 0);
      const avg = vals.length > 0 ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : 0;
      return { name: label, avg: Number(avg.toFixed(1)), count: vals.length };
    });
  }, [allReviews]);

  // Monthly sentiment trend
  const monthlyTrend = useMemo(() => {
    const buckets: Record<string, { totalRating: number; count: number }> = {};
    allReviews.forEach((r: any) => {
      if (!r.created_at) return;
      const month = format(new Date(r.created_at), "yyyy-MM");
      if (!buckets[month]) buckets[month] = { totalRating: 0, count: 0 };
      buckets[month].totalRating += r.overall_rating;
      buckets[month].count++;
    });
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, { totalRating, count }]) => ({
        month: format(new Date(month + "-01"), "MMM yy"),
        avgRating: Number((totalRating / count).toFixed(2)),
        reviews: count,
      }));
  }, [allReviews]);

  // Monthly response rate
  const monthlyResponseData = useMemo(() => {
    const buckets: Record<string, { responded: number; unresponded: number }> = {};
    allReviews.forEach((r: any) => {
      if (!r.created_at) return;
      const month = format(new Date(r.created_at), "yyyy-MM");
      if (!buckets[month]) buckets[month] = { responded: 0, unresponded: 0 };
      if (responseMap.has(r.id)) buckets[month].responded++;
      else buckets[month].unresponded++;
    });
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, { responded, unresponded }]) => ({
        month: format(new Date(month + "-01"), "MMM yy"),
        responded,
        unresponded,
      }));
  }, [allReviews, responseMap]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-16 text-muted-foreground">Loading...</div>;
  }

  if (productIds.length === 0) {
    return (
      <>
        <SeoHead title="Analytics — Vendor" robots="noindex, nofollow" />
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
      <SeoHead title="Product Analytics — Vendor" description="View analytics for your claimed products." robots="noindex, nofollow" />
      <div className="space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <StatCard title="Total Views" value={totalViews.toLocaleString()} icon={Eye} color="primary" />
          <StatCard title="Total Clicks" value={totalClicks.toLocaleString()} icon={TrendingUp} color="secondary" />
          <StatCard title="Avg Rating" value={avgRating ? avgRating.toFixed(1) : "—"} icon={Star} color="warning" />
          <StatCard title="Total Reviews" value={totalReviews} icon={MessageSquare} color="success" />
          <StatCard title="Responses" value={responseCount} icon={ThumbsUp} color="primary" />
          <StatCard title="Unanswered" value={unansweredReviews > 0 ? unansweredReviews : 0} icon={MessageSquare} color="warning" />
          <StatCard title="Response Rate" value={`${responseRate}%`} icon={Percent} color="success" />
          <StatCard title="Avg Response" value={avgResponseTimeLabel} icon={Clock} color="secondary" />
        </div>

        {/* Response streak badge */}
        {responseStreak > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1">
              <Zap className="h-3.5 w-3.5" />
              {responseStreak} review response streak
            </Badge>
          </div>
        )}

        {/* Charts row 1 — existing */}
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

        {/* Charts row 2 — NEW: Sub-criteria + Sentiment trend */}
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Sub-criteria breakdown */}
          <Card>
            <CardHeader><CardTitle className="text-base">Sub-Criteria Breakdown</CardTitle></CardHeader>
            <CardContent>
              {subCriteriaData.some(d => d.count > 0) ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={subCriteriaData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(value: number) => [`${value} / 5`, "Avg"]} />
                    <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} name="Average" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-16">No sub-criteria data yet</p>
              )}
            </CardContent>
          </Card>

          {/* Monthly rating trend */}
          <Card>
            <CardHeader><CardTitle className="text-base">Monthly Rating Trend</CardTitle></CardHeader>
            <CardContent>
              {monthlyTrend.length > 1 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={monthlyTrend}>
                    <defs>
                      <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="rating" domain={[0, 5]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="count" orientation="right" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    <Area yAxisId="rating" type="monotone" dataKey="avgRating" stroke="hsl(var(--primary))" fill="url(#ratingGrad)" name="Avg Rating" />
                    <Bar yAxisId="count" dataKey="reviews" fill="hsl(var(--muted-foreground))" opacity={0.3} radius={[4, 4, 0, 0]} name="Reviews" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-16">Need 2+ months of data</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts row 3 — NEW: Response rate over time */}
        <Card>
          <CardHeader><CardTitle className="text-base">Response Rate Over Time</CardTitle></CardHeader>
          <CardContent>
            {monthlyResponseData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyResponseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="responded" stackId="a" fill="hsl(152, 69%, 45%)" radius={[0, 0, 0, 0]} name="Responded" />
                  <Bar dataKey="unresponded" stackId="a" fill="hsl(0, 72%, 50%)" radius={[4, 4, 0, 0]} name="Unresponded" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-16">No data</p>
            )}
          </CardContent>
        </Card>

        {/* Full analytics dashboard */}
        <ProductAnalyticsDashboard productIds={productIds} title="Detailed Trends" />
      </div>
    </>
  );
}
