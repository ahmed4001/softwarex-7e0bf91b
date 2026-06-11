import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Looks up the current pathname in `route_redirects` and, if a mapping exists,
 * navigates (replace) to the canonical target. Runs on every pathname change.
 *
 * We use client-side replace navigation because Lovable hosting is a SPA — true
 * HTTP 301s aren't possible from the browser. Crawlers that respect canonical
 * tags will still consolidate signals via the destination page's <link rel="canonical">.
 */
export function RouteRedirector() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const path = location.pathname;
    // Skip admin/api/internal paths.
    if (path.startsWith("/admin") || path.startsWith("/vendor") || path === "/") return;

    (async () => {
      const { data } = await (supabase as any)
        .from("route_redirects")
        .select("to_path")
        .eq("from_path", path)
        .maybeSingle();
      if (cancelled || !data?.to_path || data.to_path === path) return;
      // Fire-and-forget hit counter.
      (supabase as any).rpc("increment_redirect_hit", { _from_path: path });
      navigate(data.to_path + location.search + location.hash, { replace: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.search, location.hash, navigate]);

  return null;
}
