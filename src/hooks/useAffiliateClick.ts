import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCallback } from "react";

const sb = supabase as any;

export function useAffiliateClick() {
  const { user } = useAuth();

  const trackClick = useCallback(async (productId: string, destinationUrl: string) => {
    try {
      await sb.from("affiliate_clicks").insert([{
        product_id: productId,
        user_id: user?.id || null,
        destination_url: destinationUrl,
        referrer_url: window.location.href,
        user_agent: navigator.userAgent.substring(0, 500),
      }]);
    } catch {
      // Fire-and-forget, don't block navigation
    }
  }, [user?.id]);

  const handleAffiliateClick = useCallback((productId: string, websiteUrl: string, affiliateUrl?: string | null) => {
    const url = affiliateUrl || websiteUrl;
    trackClick(productId, url);
    window.open(url, "_blank", "noopener,noreferrer");
  }, [trackClick]);

  return { trackClick, handleAffiliateClick };
}
