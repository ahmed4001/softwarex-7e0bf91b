import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

interface ProductWithCategory extends Product {
  categories: { name: string } | null;
}

interface UseProductsOptions {
  search?: string;
  categoryId?: string;
  sort?: "rating" | "reviews" | "newest" | "name";
  limit?: number;
  enabled?: boolean;
  onlyActive?: boolean;
}

export function useProducts({
  search,
  categoryId,
  sort = "newest",
  limit = 50,
  enabled = true,
  onlyActive = true,
}: UseProductsOptions = {}) {
  return useQuery<ProductWithCategory[]>({
    queryKey: ["products", { search, categoryId, sort, limit, onlyActive }],
    enabled,
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*, categories!products_category_id_fkey(name)");

      if (onlyActive) query = query.eq("is_active", true);
      if (categoryId) query = query.eq("category_id", categoryId);
      if (search) query = query.ilike("name", `%${search}%`);

      // Always prioritize full-info products
      query = query.order("info_score", { ascending: false });

      switch (sort) {
        case "rating":
          query = query.order("avg_rating", { ascending: false });
          break;
        case "reviews":
          query = query.order("total_reviews", { ascending: false });
          break;
        case "name":
          query = query.order("name", { ascending: true });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      const { data } = await query.limit(limit);
      return (data as unknown as ProductWithCategory[]) ?? [];
    },
  });
}
