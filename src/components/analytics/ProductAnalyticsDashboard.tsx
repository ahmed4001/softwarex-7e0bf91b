import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, MousePointerClick, Star, TrendingUp, CalendarIcon } from "lucide-react";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line,
} from "recharts";

type DateRange = { from: Date; to: Date };

const presets = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

interface Props {
  productIds?: string[]; // If provided, filter to these products only (vendor mode)
  title?: string;
}

export function ProductAnalyticsDashboard({ productIds, title = "Product Analytics" }: Props) {
  const [range, setRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [activePreset, setActivePreset] = useState<string>("30d");
  const [selectedProductId, setSelectedProductId] = useState<string>("all");

  const applyPreset = (days: number, label: string) => {
    setRange({ from: subDays(new Date(), days), to: new Date() });
    setActivePreset(label);
  };

  // Fetch products (filtered by IDs for vendor)
  const { data: products = [] } = useQuery({
    queryKey: ["analytics-products", productIds],
    queryFn: async () => {
      let q = supabase.from("products").select("id, name, slug, view_count, click_count, avg_rating, total_reviews");
      if (productIds && productIds.length > 0) {
        q = q.in("id", productIds);
      }
      q = q.order("view_count", { ascending: false }).limit(50);
      const { data } = await q;
      return data || [];
    },
  });

  const targetProductIds = useMemo(() => {
    if (selectedProductId !== "all") return [selectedProductId];
    if (productIds) return productIds;
    return products.map((p: any) => p.id);
  }, [selectedProductId, productIds, products]);

  // Fetch reviews in date range for trend data
  const { data: reviews = [] } = useQuery({
    queryKey: ["analytics-reviews", targetProductIds, range.from.toISOString(), range.to.toISOString()],
    enabled: targetProductIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, overall_rating, created_at, product_id, status")
        .in("product_id", targetProductIds)
        .gte("created_at", range.from.toISOString())
        .lte("created_at", range.to.toISOString())
        .order("created_at", { ascending: true });
      return data || [];
    },
  });

  // Aggregate stats
  const totalViews = useMemo(() => {
    const filtered = selectedProductId === "all" ? products : products.filter((p: any) => p.id === selectedProductId);
    return filtered.reduce((s: number, p: any) => s + (p.view_count || 0), 0);
  }, [products, selectedProductId]);

  const totalClicks = useMemo(() => {
    const filtered = selectedProductId === "all" ? products : products.filter((p: any) => p.id === selectedProductId);
    return filtered.reduce((s: number, p: any) => s + (p.click_count || 0), 0);
  }, [products, selectedProductId]);

  const avgRating = useMemo(() => {
    const filtered = selectedProductId === "all" ? products : products.filter((p: any) => p.id === selectedProductId);
    const rated = filtered.filter((p: any) => p.total_reviews > 0);
    if (rated.length === 0) return 0;
    return rated.reduce((s: number, p: any) => s + Number(p.avg_rating || 0), 0) / rated.length;
  }, [products, selectedProductId]);

  // Build daily review trend chart data
  const chartData = useMemo(() => {
    const days = eachDayOfInterval({ start: range.from, end: range.to });
    const map: Record<string, { date: string; reviews: number; avgRating: number; ratings: number[] }> = {};
    for (const d of days) {
      const key = format(d, "yyyy-MM-dd");
      map[key] = { date: format(d, "MMM dd"), reviews: 0, avgRating: 0, ratings: [] };
    }
    for (const r of reviews) {
      const key = format(parseISO(r.created_at!), "yyyy-MM-dd");
      if (map[key]) {
        map[key].reviews++;
        map[key].ratings.push(r.overall_rating);
      }
    }
    return days.map((d) => {
      const key = format(d, "yyyy-MM-dd");
      const entry = map[key];
      return {
        date: entry.date,
        reviews: entry.reviews,
        avgRating: entry.ratings.length > 0 ? +(entry.ratings.reduce((a, b) => a + b, 0) / entry.ratings.length).toFixed(1) : null,
      };
    });
  }, [reviews, range]);

  // Review status distribution
  const statusDist = useMemo(() => {
    const counts: Record<string, number> = { approved: 0, pending: 0, rejected: 0, spam: 0, flagged: 0 };
    for (const r of reviews) {
      const s = r.status || "pending";
      counts[s] = (counts[s] || 0) + 1;
    }
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [reviews]);

  // Top products by views
  const topByViews = useMemo(() => {
    return [...products]
      .sort((a: any, b: any) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, 8)
      .map((p: any) => ({ name: p.name.length > 20 ? p.name.slice(0, 20) + "…" : p.name, views: p.view_count || 0, clicks: p.click_count || 0 }));
  }, [products]);

  const COLORS = {
    views: "hsl(var(--primary))",
    clicks: "hsl(var(--secondary))",
    reviews: "hsl(245, 82%, 63%)",
    rating: "hsl(38, 92%, 50%)",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground mt-1">Views, clicks, and review trends over time</p>
      </motion.div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Presets */}
        <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1">
          {presets.map((p) => (
            <Button
              key={p.label}
              variant={activePreset === p.label ? "default" : "ghost"}
              size="sm"
              className="rounded-lg text-xs h-8 px-3"
              onClick={() => applyPreset(p.days, p.label)}
            >
              {p.label}
            </Button>
          ))}
        </div>

        {/* Custom date range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 rounded-xl h-8 text-xs">
              <CalendarIcon className="h-3.5 w-3.5" />
              {format(range.from, "MMM dd")} – {format(range.to, "MMM dd")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{ from: range.from, to: range.to }}
              onSelect={(r: any) => {
                if (r?.from && r?.to) {
                  setRange({ from: startOfDay(r.from), to: endOfDay(r.to) });
                  setActivePreset("");
                }
              }}
              numberOfMonths={2}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        {/* Product filter */}
        {products.length > 1 && (
          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
            <SelectTrigger className="w-[200px] h-8 text-xs rounded-xl">
              <SelectValue placeholder="All products" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              {products.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Views" value={totalViews.toLocaleString()} icon={Eye} color="primary" />
        <StatCard title="Total Clicks" value={totalClicks.toLocaleString()} icon={MousePointerClick} color="secondary" />
        <StatCard title="Avg Rating" value={avgRating ? avgRating.toFixed(1) : "—"} icon={Star} color="warning" />
        <StatCard title="Reviews (period)" value={reviews.length} icon={TrendingUp} color="success" />
      </div>

      {/* Charts row */}
      <div className="grid xl:grid-cols-2 gap-5">
        {/* Review trend */}
        <div className="glass-card p-6">
          <h3 className="font-display font-bold text-foreground mb-4">Review Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="reviewGradAnalytics" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.reviews} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={COLORS.reviews} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Area type="monotone" dataKey="reviews" stroke={COLORS.reviews} fill="url(#reviewGradAnalytics)" strokeWidth={2} name="Reviews" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Average rating over time */}
        <div className="glass-card p-6">
          <h3 className="font-display font-bold text-foreground mb-4">Average Rating Over Time</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData.filter((d) => d.avgRating !== null)}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Line type="monotone" dataKey="avgRating" stroke={COLORS.rating} strokeWidth={2.5} dot={false} name="Avg Rating" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top products by views + clicks */}
      {topByViews.length > 0 && selectedProductId === "all" && (
        <div className="glass-card p-6">
          <h3 className="font-display font-bold text-foreground mb-4">Top Products — Views & Clicks</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topByViews} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Bar dataKey="views" fill={COLORS.views} radius={[0, 6, 6, 0]} name="Views" />
              <Bar dataKey="clicks" fill={COLORS.clicks} radius={[0, 6, 6, 0]} name="Clicks" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Review status breakdown */}
      {statusDist.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-display font-bold text-foreground mb-4">Review Status Distribution</h3>
          <div className="flex flex-wrap gap-4">
            {statusDist.map((s) => (
              <div key={s.name} className="flex items-center gap-2 bg-muted/50 rounded-xl px-4 py-2.5">
                <span className="text-sm font-semibold text-foreground">{s.value}</span>
                <span className="text-xs text-muted-foreground">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
