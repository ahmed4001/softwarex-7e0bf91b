import { SeoHead } from "@/components/SeoHead";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SearchBar } from "@/components/SearchBar";
import { StarRating } from "@/components/StarRating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function ComparePage() {
  const [productIds, setProductIds] = useState<string[]>([]);

  const { data: products } = useQuery({
    queryKey: ["compare-products", productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];
      const { data } = await supabase.from("products").select("*").in("id", productIds);
      return data || [];
    },
    enabled: productIds.length > 0,
  });

  const { data: allProducts } = useQuery({
    queryKey: ["all-products-for-compare"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name, slug, logo_url, avg_rating").eq("is_active", true).order("name").limit(100);
      return data || [];
    },
  });

  return (
    <>
      <SeoHead title="Compare Software" description="Compare software side by side" />
      <div className="container py-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Compare Software</h1>
        <p className="text-muted-foreground mb-6">Select up to 3 products to compare side by side.</p>

        {/* Product selector */}
        <div className="flex flex-wrap gap-2 mb-8">
          {products?.map((p) => (
            <Badge key={p.id} variant="secondary" className="gap-1 pr-1">
              {p.name}
              <button onClick={() => setProductIds(ids => ids.filter(id => id !== p.id))}><X className="h-3 w-3" /></button>
            </Badge>
          ))}
          {productIds.length < 3 && (
            <select
              className="text-sm border border-border rounded-lg px-3 py-1.5 bg-card"
              onChange={(e) => { if (e.target.value && !productIds.includes(e.target.value)) setProductIds([...productIds, e.target.value]); e.target.value = ""; }}
              value=""
            >
              <option value="">+ Add product</option>
              {allProducts?.filter(p => !productIds.includes(p.id)).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        {products && products.length > 0 ? (
          <div className="product-card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Feature</th>
                  {products.map(p => (
                    <th key={p.id} className="text-center py-3 px-4">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                          {p.logo_url ? <img src={p.logo_url} alt="" className="h-full w-full object-cover rounded-xl" /> : <span className="font-bold text-primary">{p.name.charAt(0)}</span>}
                        </div>
                        <span className="text-sm font-semibold">{p.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Rating", render: (p: any) => <StarRating rating={Number(p.avg_rating)} size="sm" showValue /> },
                  { label: "Reviews", render: (p: any) => <span>{p.total_reviews}</span> },
                  { label: "Pricing", render: (p: any) => <Badge variant="outline" className="capitalize">{p.pricing_model}</Badge> },
                  { label: "Starting Price", render: (p: any) => <span>{p.starting_price ? `$${p.starting_price}/mo` : "—"}</span> },
                  { label: "Company Size", render: (p: any) => <span>{p.company_size || "—"}</span> },
                  { label: "Founded", render: (p: any) => <span>{p.founded_year || "—"}</span> },
                ].map((row) => (
                  <tr key={row.label} className="border-b border-border">
                    <td className="py-3 px-4 text-sm font-medium text-muted-foreground">{row.label}</td>
                    {products.map(p => <td key={p.id} className="py-3 px-4 text-center text-sm">{row.render(p)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">Select products above to start comparing.</div>
        )}
      </div>
    </>
  );
}
