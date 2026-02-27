import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MousePointerClick, TrendingUp, DollarSign, ExternalLink } from "lucide-react";
import { useMemo } from "react";

const sb = supabase as any;

interface AffiliateClick {
  id: string;
  product_id: string;
  destination_url: string;
  referrer_url: string | null;
  created_at: string;
}

export default function AdminAffiliateAnalyticsPage() {
  const { data: clicks, isLoading } = useQuery({
    queryKey: ["admin-affiliate-clicks"],
    queryFn: async () => {
      const { data } = await sb
        .from("affiliate_clicks")
        .select("id, product_id, destination_url, referrer_url, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      return (data || []) as AffiliateClick[];
    },
  });

  const { data: products } = useQuery({
    queryKey: ["admin-products-for-affiliate"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, click_count, affiliate_url, website_url")
        .order("click_count", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const stats = useMemo(() => {
    if (!clicks) return { total: 0, today: 0, thisWeek: 0, uniqueProducts: 0 };
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    
    return {
      total: clicks.length,
      today: clicks.filter(c => new Date(c.created_at) >= todayStart).length,
      thisWeek: clicks.filter(c => new Date(c.created_at) >= weekStart).length,
      uniqueProducts: new Set(clicks.map(c => c.product_id)).size,
    };
  }, [clicks]);

  const productMap = useMemo(() => {
    const map = new Map<string, any>();
    (products || []).forEach(p => map.set(p.id, p));
    return map;
  }, [products]);

  const topProducts = useMemo(() => {
    return (products || [])
      .filter(p => (p.click_count || 0) > 0)
      .sort((a, b) => (b.click_count || 0) - (a.click_count || 0))
      .slice(0, 20);
  }, [products]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MousePointerClick className="w-6 h-6 text-primary" /> Affiliate Click Analytics
        </h1>
        <p className="text-sm text-muted-foreground">Track outbound clicks to product websites and affiliate links.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Clicks", value: stats.total, icon: MousePointerClick },
          { label: "Today", value: stats.today, icon: TrendingUp },
          { label: "This Week", value: stats.thisWeek, icon: TrendingUp },
          { label: "Products Clicked", value: stats.uniqueProducts, icon: DollarSign },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <s.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Products by Clicks</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Affiliate URL</TableHead>
                <TableHead>Website</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!topProducts.length ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No clicks tracked yet</TableCell></TableRow>
              ) : topProducts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell><Badge variant="secondary">{p.click_count || 0}</Badge></TableCell>
                  <TableCell>
                    {p.affiliate_url ? (
                      <a href={p.affiliate_url} target="_blank" rel="noopener" className="text-primary hover:underline text-sm flex items-center gap-1">
                        {p.affiliate_url.replace(/^https?:\/\//, "").slice(0, 30)}... <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : <span className="text-muted-foreground text-sm">—</span>}
                  </TableCell>
                  <TableCell>
                    {p.website_url ? (
                      <a href={p.website_url} target="_blank" rel="noopener" className="text-sm text-muted-foreground hover:text-foreground">
                        {p.website_url.replace(/^https?:\/\//, "").slice(0, 30)}
                      </a>
                    ) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Clicks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Clicks</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Referrer</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : !clicks?.length ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No clicks yet</TableCell></TableRow>
              ) : clicks.slice(0, 50).map((click) => {
                const prod = productMap.get(click.product_id);
                return (
                  <TableRow key={click.id}>
                    <TableCell className="font-medium">{prod?.name || click.product_id.slice(0, 8)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-48 truncate">{click.destination_url}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-48 truncate">{click.referrer_url || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(click.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
