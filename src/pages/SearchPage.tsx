import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SeoHead } from "@/components/SeoHead";
import { ProductCard } from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/LoadingSkeleton";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";

  const { data: products, isLoading } = useQuery({
    queryKey: ["search", q],
    queryFn: async () => {
      if (!q.trim()) return [];
      const { data } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("is_active", true)
        .ilike("name", `%${q}%`)
        .order("avg_rating", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: q.length > 0,
  });

  return (
    <>
      <SeoHead title={q ? `Search: ${q}` : "Search"} />
      <div className="container py-8">
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setParams({ q: e.target.value })}
              placeholder="Search software..."
              className="h-14 pl-12 text-lg rounded-2xl"
            />
          </div>
        </div>

        {q && <p className="text-muted-foreground mb-6">{products?.length || 0} results for "{q}"</p>}

        <div className="grid md:grid-cols-2 gap-4">
          {isLoading ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />) :
            products?.map((p: any) => (
              <ProductCard
                key={p.id} id={p.id} slug={p.slug} name={p.name} tagline={p.tagline}
                logo_url={p.logo_url} avg_rating={Number(p.avg_rating)} total_reviews={p.total_reviews}
                pricing_model={p.pricing_model} category_name={p.categories?.name}
              />
            ))
          }
        </div>

        {!isLoading && q && products?.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-medium mb-2">No results found</p>
            <p>Try different keywords or <Link to="/category/all" className="text-primary hover:underline">browse categories</Link></p>
          </div>
        )}
      </div>
    </>
  );
}
