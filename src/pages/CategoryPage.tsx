import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SeoHead } from "@/components/SeoHead";
import { ProductCard } from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/LoadingSkeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function CategoryPage() {
  const { slug } = useParams();
  const [sort, setSort] = useState("rating");
  const isAll = slug === "all";

  const { data: category } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      if (isAll) return { name: "All Categories", description: "Browse all software categories", slug: "all" };
      const { data } = await supabase.from("categories").select("*").eq("slug", slug!).single();
      return data;
    },
    enabled: !!slug,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories-list"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").eq("is_active", true).order("name");
      return data || [];
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products-category", slug, sort],
    queryFn: async () => {
      let query = supabase.from("products").select("*, categories(name)").eq("is_active", true);
      if (!isAll && category && 'id' in category) query = query.eq("category_id", (category as any).id);
      if (sort === "rating") query = query.order("avg_rating", { ascending: false });
      else if (sort === "reviews") query = query.order("total_reviews", { ascending: false });
      else if (sort === "newest") query = query.order("created_at", { ascending: false });
      else query = query.order("name");
      const { data } = await query.limit(20);
      return data || [];
    },
    enabled: !!category,
  });

  return (
    <>
      <SeoHead title={category?.name || "Categories"} description={category?.description || "Browse software"} />
      <div className="container py-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <span className="text-foreground">{category?.name || "Categories"}</span>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-56 flex-shrink-0">
            <h3 className="font-semibold text-foreground mb-3">Categories</h3>
            <div className="space-y-1">
              <Link to="/category/all" className={`block px-3 py-2 text-sm rounded-lg transition-colors ${isAll ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"}`}>
                All Categories
              </Link>
              {categories?.map((c) => (
                <Link key={c.id} to={`/category/${c.slug}`} className={`block px-3 py-2 text-sm rounded-lg transition-colors ${slug === c.slug ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"}`}>
                  {c.name} <span className="text-xs opacity-60">({c.product_count})</span>
                </Link>
              ))}
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{isAll ? "All Software" : `Best ${category?.name} Software in ${new Date().getFullYear()}`}</h1>
                <p className="text-muted-foreground mt-1">{products?.length || 0} products found</p>
              </div>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Top Rated</SelectItem>
                  <SelectItem value="reviews">Most Reviews</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="name">A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              {isLoading ? Array.from({ length: 5 }).map((_, i) => <ProductCardSkeleton key={i} />) :
                products?.map((p: any) => (
                  <ProductCard
                    key={p.id} id={p.id} slug={p.slug} name={p.name} tagline={p.tagline}
                    logo_url={p.logo_url} avg_rating={Number(p.avg_rating)} total_reviews={p.total_reviews}
                    pricing_model={p.pricing_model} category_name={p.categories?.name}
                    is_featured={p.is_featured} is_sponsored={p.is_sponsored}
                  />
                ))
              }
              {!isLoading && products?.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">No products found in this category.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
