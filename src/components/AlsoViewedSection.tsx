import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ProductLogo } from "@/components/ProductLogo";
import { Star, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export function AlsoViewedSection({ productId, categoryId }: { productId: string; categoryId?: string | null }) {
  const { data: related } = useQuery({
    queryKey: ["also-viewed", productId, categoryId],
    enabled: !!productId,
    queryFn: async () => {
      // Get products from same category, excluding current
      let query = supabase
        .from("products")
        .select("id, name, slug, logo_url, avg_rating, total_reviews, tagline")
        .eq("is_active", true)
        .neq("id", productId)
        .order("view_count", { ascending: false })
        .limit(6);

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data } = await query;
      return data || [];
    },
  });

  if (!related || related.length === 0) return null;

  return (
    <section className="mt-12 mb-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-display font-bold text-foreground">Users Also Viewed</h2>
          <Link to="/search" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
            Browse All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {related.map((p: any, i: number) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
            >
              <Link to={`/product/${p.slug}`}>
                <Card className="border-border/50 hover:border-primary/20 transition-all hover:shadow-sm group">
                  <CardContent className="p-4 flex items-center gap-3">
                    <ProductLogo name={p.name} logoUrl={p.logo_url} size="sm" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {p.name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground truncate">{p.tagline}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Star className="h-3 w-3 text-[hsl(var(--star))] fill-[hsl(var(--star))]" />
                        <span className="text-[11px] font-medium">{Number(p.avg_rating).toFixed(1)}</span>
                        <span className="text-[10px] text-muted-foreground">({p.total_reviews})</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
