import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SEO_KEYS = [
  "site_name",
  "seo_default_description",
  "seo_default_keywords",
  "seo_default_og_image",
  "seo_google_verification",
  "seo_bing_verification",
];

export function useSeoSettings() {
  const { data } = useQuery({
    queryKey: ["seo-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", SEO_KEYS);
      const map: Record<string, string> = {};
      (data || []).forEach((row) => {
        if (row.value != null) map[row.key] = String(row.value).replace(/^"|"$/g, "");
      });
      return map;
    },
    staleTime: 10 * 60 * 1000,
  });

  return {
    siteName: data?.site_name || "",
    defaultDescription: data?.seo_default_description || "",
    defaultKeywords: data?.seo_default_keywords || "",
    defaultOgImage: data?.seo_default_og_image || "",
    googleVerification: data?.seo_google_verification || "",
    bingVerification: data?.seo_bing_verification || "",
  };
}
