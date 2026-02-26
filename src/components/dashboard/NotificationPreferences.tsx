import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail, MessageSquare, Star, Users, TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface PrefConfig {
  key: string;
  icon: React.ElementType;
  label: string;
  description: string;
  default: boolean;
}

const prefConfigs: PrefConfig[] = [
  { key: "review_replies", icon: MessageSquare, label: "Review replies", description: "When someone replies to your review", default: true },
  { key: "new_followers", icon: Users, label: "New followers", description: "When someone follows you", default: true },
  { key: "product_updates", icon: TrendingUp, label: "Product updates", description: "Updates on products you've reviewed", default: false },
  { key: "weekly_digest", icon: Mail, label: "Weekly digest", description: "Summary of activity and recommendations", default: true },
  { key: "badge_earned", icon: Star, label: "Badge earned", description: "When you unlock a new badge", default: true },
];

const defaults = Object.fromEntries(prefConfigs.map((p) => [p.key, p.default]));

export function NotificationPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: prefs, isLoading } = useQuery({
    queryKey: ["notification-preferences", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (data) return data;
      // Create default row
      const { data: created } = await supabase
        .from("notification_preferences")
        .insert({ user_id: user!.id })
        .select()
        .single();
      return created;
    },
  });

  const updatePref = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: boolean }) => {
      const { error } = await supabase
        .from("notification_preferences")
        .update({ [key]: value })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences", user?.id] });
      toast.success("Preferences updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (!user) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Bell className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Notification Preferences</h3>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {prefConfigs.map((pref) => {
            const Icon = pref.icon;
            const checked = (prefs as any)?.[pref.key] ?? pref.default;
            return (
              <div key={pref.key} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <Label className="text-sm font-medium text-foreground cursor-pointer">{pref.label}</Label>
                    <p className="text-[11px] text-muted-foreground">{pref.description}</p>
                  </div>
                </div>
                <Switch
                  checked={checked}
                  onCheckedChange={(val) => updatePref.mutate({ key: pref.key, value: val })}
                  disabled={updatePref.isPending}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
