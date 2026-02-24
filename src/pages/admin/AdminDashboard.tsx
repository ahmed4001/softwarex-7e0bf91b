import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SeoHead } from "@/components/SeoHead";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Package, Star, Users, MessageSquare, Eye, TrendingUp, UserPlus, BarChart3 } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CHART_COLORS = ["hsl(239, 84%, 67%)", "hsl(187, 92%, 41%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)"];

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
        products: products.count || 0,
        reviews: reviews.count || 0,
        users: users.count || 0,
        pending: pending.count || 0,
      };
    },
  });

  const { data: recentReviews } = useQuery({
    queryKey: ["admin-recent-reviews"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*, products(name), profiles(name)")
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  const { data: topProducts } = useQuery({
    queryKey: ["admin-top-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("name, total_reviews, avg_rating, view_count").order("view_count", { ascending: false }).limit(5);
      return data || [];
    },
  });

  // Mock chart data
  const reviewsOverTime = Array.from({ length: 30 }, (_, i) => ({
    day: `Day ${i + 1}`,
    reviews: Math.floor(Math.random() * 20) + 5,
  }));

  const statusBreakdown = [
    { name: "Approved", value: 65 },
    { name: "Pending", value: 20 },
    { name: "Rejected", value: 10 },
    { name: "Spam", value: 5 },
  ];

  return (
    <>
      <SeoHead title="Admin Dashboard" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back. Here's an overview of your platform.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Products" value={stats?.products || 0} icon={Package} color="primary" trend={12} />
          <StatCard title="Total Reviews" value={stats?.reviews || 0} icon={Star} color="secondary" trend={8} />
          <StatCard title="Total Users" value={stats?.users || 0} icon={Users} color="success" trend={15} />
          <StatCard title="Pending Reviews" value={stats?.pending || 0} icon={MessageSquare} color="warning" trend={-5} />
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 product-card">
            <h3 className="font-semibold text-foreground mb-4">Reviews Over Last 30 Days</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={reviewsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="reviews" stroke="hsl(239, 84%, 67%)" fill="hsl(239, 84%, 67%)" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="product-card">
            <h3 className="font-semibold text-foreground mb-4">Review Status</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {statusBreakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 justify-center">
              {statusBreakdown.map((s, i) => (
                <div key={s.name} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                  {s.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tables Row */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Recent Reviews */}
          <div className="product-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Recent Reviews</h3>
              <Link to="/admin/reviews"><Button variant="ghost" size="sm">View All</Button></Link>
            </div>
            <div className="space-y-3">
              {recentReviews?.slice(0, 5).map((r: any) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{r.title || "Untitled review"}</p>
                    <p className="text-xs text-muted-foreground">on {r.products?.name || "Unknown"} by {r.profiles?.name || "Anonymous"}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={r.status} />
                  </div>
                </div>
              ))}
              {(!recentReviews || recentReviews.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">No reviews yet.</p>}
            </div>
          </div>

          {/* Top Products */}
          <div className="product-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Top Products by Views</h3>
              <Link to="/admin/products"><Button variant="ghost" size="sm">View All</Button></Link>
            </div>
            <div className="space-y-3">
              {topProducts?.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.total_reviews} reviews · ★ {Number(p.avg_rating).toFixed(1)}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="h-3 w-3" /> {p.view_count}
                  </div>
                </div>
              ))}
              {(!topProducts || topProducts.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">No products yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
