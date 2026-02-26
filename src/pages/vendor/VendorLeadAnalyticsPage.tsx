import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, FunnelChart, Treemap, Cell, CartesianGrid, AreaChart, Area, PieChart, Pie } from "recharts";
import { ArrowLeft, TrendingUp, TrendingDown, Users, UserPlus, UserCheck, CheckCircle, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { format, subDays, parseISO, startOfDay } from "date-fns";

const STAGE_CONFIG = [
  { key: "new", label: "New", color: "hsl(var(--primary))" },
  { key: "contacted", label: "Contacted", color: "hsl(210, 70%, 55%)" },
  { key: "qualified", label: "Qualified", color: "hsl(150, 60%, 45%)" },
  { key: "closed", label: "Closed", color: "hsl(var(--muted-foreground))" },
];

export default function VendorLeadAnalyticsPage() {
  const { user } = useAuth();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["vendor-leads-analytics", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("vendor_leads")
        .select("id, status, source, created_at, product_id")
        .eq("vendor_user_id", user!.id)
        .order("created_at", { ascending: true });
      return data || [];
    },
  });

  // Funnel data
  const funnelData = useMemo(() => {
    const counts: Record<string, number> = { new: 0, contacted: 0, qualified: 0, closed: 0 };
    leads.forEach((l: any) => { if (counts[l.status] !== undefined) counts[l.status]++; });
    const total = leads.length || 1;
    return STAGE_CONFIG.map((stage, i) => ({
      name: stage.label,
      value: counts[stage.key],
      fill: stage.color,
      percentage: Math.round((counts[stage.key] / total) * 100),
      conversionFromPrev: i === 0
        ? 100
        : counts[STAGE_CONFIG[i - 1].key] > 0
          ? Math.round((counts[stage.key] / counts[STAGE_CONFIG[i - 1].key]) * 100)
          : 0,
    }));
  }, [leads]);

  // Daily leads over last 30 days
  const dailyData = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const day = format(subDays(new Date(), i), "yyyy-MM-dd");
      days[day] = 0;
    }
    leads.forEach((l: any) => {
      const day = format(parseISO(l.created_at), "yyyy-MM-dd");
      if (days[day] !== undefined) days[day]++;
    });
    return Object.entries(days).map(([date, count]) => ({
      date: format(parseISO(date), "MMM d"),
      leads: count,
    }));
  }, [leads]);

  // Source breakdown
  const sourceData = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach((l: any) => {
      const src = l.source || "direct";
      map[src] = (map[src] || 0) + 1;
    });
    const colors = ["hsl(var(--primary))", "hsl(210, 70%, 55%)", "hsl(150, 60%, 45%)", "hsl(35, 80%, 55%)", "hsl(var(--muted-foreground))"];
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value, fill: colors[i % colors.length] }));
  }, [leads]);

  // Conversion rates
  const conversionRate = useMemo(() => {
    const total = leads.length;
    const closed = leads.filter((l: any) => l.status === "closed").length;
    const qualified = leads.filter((l: any) => l.status === "qualified").length;
    return {
      overallClose: total > 0 ? Math.round((closed / total) * 100) : 0,
      qualifiedClose: qualified > 0 ? Math.round((closed / (qualified + closed)) * 100) : 0,
    };
  }, [leads]);

  // Leads this week vs last week
  const weekComparison = useMemo(() => {
    const now = new Date();
    const thisWeekStart = startOfDay(subDays(now, 7));
    const lastWeekStart = startOfDay(subDays(now, 14));
    const thisWeek = leads.filter((l: any) => parseISO(l.created_at) >= thisWeekStart).length;
    const lastWeek = leads.filter((l: any) => {
      const d = parseISO(l.created_at);
      return d >= lastWeekStart && d < thisWeekStart;
    }).length;
    const change = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : thisWeek > 0 ? 100 : 0;
    return { thisWeek, lastWeek, change };
  }, [leads]);

  const chartConfig = {
    leads: { label: "Leads", color: "hsl(var(--primary))" },
  };

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> Lead Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Pipeline performance and conversion insights</p>
        </div>
        <Link to="/vendor/leads">
          <Button variant="outline" size="sm" className="gap-1.5 rounded-lg">
            <ArrowLeft className="h-4 w-4" /> Back to Leads
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              {weekComparison.change !== 0 && (
                <Badge variant="outline" className={weekComparison.change > 0 ? "text-green-600 border-green-200 bg-green-50" : "text-red-600 border-red-200 bg-red-50"}>
                  {weekComparison.change > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {Math.abs(weekComparison.change)}%
                </Badge>
              )}
            </div>
            <p className="text-2xl font-display font-bold">{leads.length}</p>
            <p className="text-xs text-muted-foreground">Total Leads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <UserPlus className="h-4 w-4 text-muted-foreground mb-2" />
            <p className="text-2xl font-display font-bold">{weekComparison.thisWeek}</p>
            <p className="text-xs text-muted-foreground">This Week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <UserCheck className="h-4 w-4 text-muted-foreground mb-2" />
            <p className="text-2xl font-display font-bold">{conversionRate.overallClose}%</p>
            <p className="text-xs text-muted-foreground">Close Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <CheckCircle className="h-4 w-4 text-muted-foreground mb-2" />
            <p className="text-2xl font-display font-bold">{conversionRate.qualifiedClose}%</p>
            <p className="text-xs text-muted-foreground">Qualified → Close</p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {funnelData.map((stage, i) => {
              const maxValue = Math.max(...funnelData.map((s) => s.value), 1);
              const widthPercent = Math.max((stage.value / maxValue) * 100, 8);
              return (
                <div key={stage.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{stage.name}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{stage.value} leads</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{stage.percentage}% of total</span>
                      {i > 0 && (
                        <span className="font-medium" style={{ color: stage.fill }}>
                          {stage.conversionFromPrev}% from {funnelData[i - 1].name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="relative h-10 bg-muted/30 rounded-xl overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-700"
                      style={{
                        width: `${widthPercent}%`,
                        backgroundColor: stage.fill,
                        color: "white",
                        minWidth: "2.5rem",
                      }}
                    >
                      {stage.value}
                    </div>
                  </div>
                  {i < funnelData.length - 1 && (
                    <div className="flex justify-center py-0.5">
                      <svg width="12" height="12" viewBox="0 0 12 12" className="text-muted-foreground/40">
                        <path d="M6 0 L6 10 M2 6 L6 10 L10 6" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Leads Over Time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Leads Over Time (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[220px] w-full">
              <AreaChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} className="text-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Source Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {sourceData.length > 0 ? (
              <div className="space-y-3">
                {sourceData.map((src) => {
                  const maxVal = Math.max(...sourceData.map((s) => s.value), 1);
                  return (
                    <div key={src.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize text-foreground">{src.name}</span>
                        <span className="text-muted-foreground">{src.value} leads</span>
                      </div>
                      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${(src.value / maxVal) * 100}%`, backgroundColor: src.fill }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No source data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Status Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Pipeline Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={28}>
                {funnelData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
