import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SeoHead } from "@/components/SeoHead";
import { ProductAnalyticsDashboard } from "@/components/analytics/ProductAnalyticsDashboard";
import { Package } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

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
      <ProductAnalyticsDashboard productIds={productIds} title="Your Product Analytics" />
    </>
  );
}
