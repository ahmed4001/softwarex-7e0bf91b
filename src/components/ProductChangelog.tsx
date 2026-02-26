import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Rocket, Bug, Sparkles, AlertTriangle } from "lucide-react";

const changeTypeConfig: Record<string, { icon: any; color: string; label: string }> = {
  feature: { icon: Rocket, color: "bg-primary/10 text-primary", label: "New Feature" },
  improvement: { icon: Sparkles, color: "bg-accent/10 text-accent-foreground", label: "Improvement" },
  bugfix: { icon: Bug, color: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]", label: "Bug Fix" },
  breaking: { icon: AlertTriangle, color: "bg-destructive/10 text-destructive", label: "Breaking Change" },
};

export function ProductChangelog({ productId }: { productId: string }) {
  const { data: changelogs, isLoading } = useQuery({
    queryKey: ["product-changelogs", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_changelogs")
        .select("*")
        .eq("product_id", productId)
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted/40 animate-pulse" />)}</div>;

  if (!changelogs || changelogs.length === 0) {
    return <div className="glass-card p-12 text-center text-muted-foreground">No changelog entries yet.</div>;
  }

  return (
    <div className="space-y-1">
      {changelogs.map((entry: any, idx: number) => {
        const config = changeTypeConfig[entry.change_type] || changeTypeConfig.improvement;
        const Icon = config.icon;
        return (
          <div key={entry.id} className="relative flex gap-4">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${config.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              {idx < changelogs.length - 1 && <div className="w-px flex-1 bg-border/50 my-1" />}
            </div>
            <div className="pb-6 flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground text-sm">{entry.title}</h3>
                {entry.version && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{entry.version}</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mb-1.5">
                {entry.published_at ? format(new Date(entry.published_at), "MMM d, yyyy") : "Draft"}
                <span className="mx-1.5">·</span>
                <span className={`font-medium`}>{config.label}</span>
              </p>
              {entry.body && <p className="text-sm text-muted-foreground leading-relaxed">{entry.body}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
