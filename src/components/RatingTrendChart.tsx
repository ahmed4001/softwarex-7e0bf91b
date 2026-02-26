import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, ComposedChart } from "recharts";
import { TrendingUp } from "lucide-react";

interface RatingTrendChartProps {
  productId: string;
}

export function RatingTrendChart({ productId }: RatingTrendChartProps) {
  const { data: trendData = [], isLoading } = useQuery({
    queryKey: ["rating-trend", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("overall_rating, created_at")
        .eq("product_id", productId)
        .eq("status", "approved")
        .order("created_at");

      if (!data || data.length === 0) return [];

      const monthMap = new Map<string, { total: number; count: number }>();
      data.forEach((r: any) => {
        const d = new Date(r.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const entry = monthMap.get(key) || { total: 0, count: 0 };
        entry.total += r.overall_rating;
        entry.count += 1;
        monthMap.set(key, entry);
      });

      return [...monthMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, { total, count }]) => ({
          month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
          avg: Number((total / count).toFixed(2)),
          count,
        }));
    },
    enabled: !!productId,
  });

  if (isLoading || trendData.length < 2) return null;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Rating Trend</h3>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis yAxisId="left" domain={[0, 5]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.75rem",
              fontSize: 12,
            }}
          />
          <Bar yAxisId="right" dataKey="count" fill="hsl(var(--primary) / 0.15)" radius={[4, 4, 0, 0]} name="Reviews" />
          <Line yAxisId="left" type="monotone" dataKey="avg" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--primary))" }} name="Avg Rating" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
