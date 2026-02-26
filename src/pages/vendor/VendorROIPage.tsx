import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, MousePointerClick, Users, Star, TrendingUp, DollarSign } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { subDays } from "date-fns";

export default function VendorROIPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState("30");
  const [leadValue, setLeadValue] = useState("50");

  const { data: claimedProducts = [] } = useQuery({
    queryKey: ["vendor-claimed-products-roi", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: claims } = await supabase
        .from("product_claims")
        .select("product_id")
        .eq("user_id", user!.id)
        .eq("status", "approved");
      if (!claims?.length) return [];
      const pids = claims.map(c => c.product_id);
      const { data } = await supabase.from("products").select("id, name, view_count, click_count, total_reviews, avg_rating").in("id", pids);
      return data || [];
    },
  });

  const productIds = claimedProducts.map((p: any) => p.id);

  const { data: leads = [] } = useQuery({
    queryKey: ["vendor-leads-roi", user?.id, period],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase.from("vendor_leads").select("*").eq("vendor_user_id", user!.id);
      if (period !== "all") {
        q = q.gte("created_at", subDays(new Date(), parseInt(period)).toISOString());
      }
      const { data } = await q;
      return data || [];
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["vendor-reviews-roi", productIds, period],
    enabled: productIds.length > 0,
    queryFn: async () => {
      let q = supabase.from("reviews").select("id, overall_rating, created_at").in("product_id", productIds).eq("status", "approved");
      if (period !== "all") {
        q = q.gte("created_at", subDays(new Date(), parseInt(period)).toISOString());
      }
      const { data } = await q;
      return data || [];
    },
  });

  const { data: responses = [] } = useQuery({
    queryKey: ["vendor-responses-roi", user?.id, period],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase.from("vendor_responses").select("id").eq("user_id", user!.id);
      if (period !== "all") {
        q = q.gte("created_at", subDays(new Date(), parseInt(period)).toISOString());
      }
      const { data } = await q;
      return data || [];
    },
  });

  const totalViews = claimedProducts.reduce((s: number, p: any) => s + (p.view_count || 0), 0);
  const totalClicks = claimedProducts.reduce((s: number, p: any) => s + (p.click_count || 0), 0);
  const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0";
  const responseRate = reviews.length > 0 ? ((responses.length / reviews.length) * 100).toFixed(0) : "0";
  const estimatedValue = leads.length * parseFloat(leadValue || "0");

  // Lead funnel data
  const funnelData = [
    { name: "New", value: leads.filter((l: any) => l.status === "new").length },
    { name: "Contacted", value: leads.filter((l: any) => l.status === "contacted").length },
    { name: "Qualified", value: leads.filter((l: any) => l.status === "qualified").length },
    { name: "Closed", value: leads.filter((l: any) => l.status === "closed").length },
  ];

  const metrics = [
    { label: "Total Views", value: totalViews.toLocaleString(), icon: Eye, color: "text-blue-500" },
    { label: "Total Clicks", value: totalClicks.toLocaleString(), icon: MousePointerClick, color: "text-green-500" },
    { label: "CTR", value: `${ctr}%`, icon: TrendingUp, color: "text-primary" },
    { label: "Leads Captured", value: leads.length, icon: Users, color: "text-amber-500" },
    { label: "Reviews Received", value: reviews.length, icon: Star, color: "text-yellow-500" },
    { label: "Response Rate", value: `${responseRate}%`, icon: TrendingUp, color: "text-emerald-500" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">ROI Report</h1>
          <p className="text-muted-foreground text-sm mt-1">Measure the impact of your vendor presence</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32 rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4 text-center">
              <m.icon className={`h-5 w-5 mx-auto mb-1 ${m.color}`} />
              <p className="text-xl font-display font-bold">{m.value}</p>
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader><CardTitle className="text-sm">Lead Funnel</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={funnelData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Estimated Lead Value</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Label className="text-sm whitespace-nowrap">$/Lead</Label>
              <Input type="number" className="w-24 rounded-lg" value={leadValue} onChange={(e) => setLeadValue(e.target.value)} />
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
              <DollarSign className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-display font-bold">${estimatedValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Estimated pipeline value ({leads.length} leads × ${leadValue})</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {claimedProducts.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Per-Product Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-2.5 px-4 font-medium">Product</th>
                    <th className="text-right py-2.5 px-4 font-medium">Views</th>
                    <th className="text-right py-2.5 px-4 font-medium">Clicks</th>
                    <th className="text-right py-2.5 px-4 font-medium">CTR</th>
                    <th className="text-right py-2.5 px-4 font-medium">Rating</th>
                    <th className="text-right py-2.5 px-4 font-medium">Reviews</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {claimedProducts.map((p: any) => {
                    const pCtr = p.view_count > 0 ? ((p.click_count / p.view_count) * 100).toFixed(1) : "0";
                    return (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-4 font-medium">{p.name}</td>
                        <td className="py-2.5 px-4 text-right text-muted-foreground">{(p.view_count || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-right text-muted-foreground">{(p.click_count || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-right">{pCtr}%</td>
                        <td className="py-2.5 px-4 text-right">★ {Number(p.avg_rating || 0).toFixed(1)}</td>
                        <td className="py-2.5 px-4 text-right text-muted-foreground">{p.total_reviews || 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
