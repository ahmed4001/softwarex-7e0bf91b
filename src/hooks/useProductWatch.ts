import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export function useProductWatch(productId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: isWatching = false } = useQuery({
    queryKey: ["product-watch", user?.id, productId],
    enabled: !!user && !!productId,
    queryFn: async () => {
      const { data } = await supabase
        .from("product_watches")
        .select("id")
        .eq("user_id", user!.id)
        .eq("product_id", productId!)
        .maybeSingle();
      return !!data;
    },
  });

  const toggle = useMutation({
    mutationFn: async () => {
      if (!user || !productId) throw new Error("Not authenticated");
      if (isWatching) {
        await supabase
          .from("product_watches")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId);
      } else {
        const { error } = await supabase
          .from("product_watches")
          .insert({ user_id: user.id, product_id: productId, watch_type: "product" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-watch", user?.id, productId] });
      queryClient.invalidateQueries({ queryKey: ["my-watches"] });
      toast.success(isWatching ? "Stopped watching" : "Now watching this product");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return { isWatching, toggle: toggle.mutate, isToggling: toggle.isPending };
}
