import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail, MessageSquare, Star, Users, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface Preference {
  key: string;
  icon: React.ElementType;
  label: string;
  description: string;
  default: boolean;
}

const preferences: Preference[] = [
  { key: "review_replies", icon: MessageSquare, label: "Review replies", description: "When someone replies to your review", default: true },
  { key: "new_followers", icon: Users, label: "New followers", description: "When someone follows you", default: true },
  { key: "product_updates", icon: TrendingUp, label: "Product updates", description: "Updates on products you've reviewed", default: false },
  { key: "weekly_digest", icon: Mail, label: "Weekly digest", description: "Summary of activity and recommendations", default: true },
  { key: "badge_earned", icon: Star, label: "Badge earned", description: "When you unlock a new badge", default: true },
];

export function NotificationPreferences() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(preferences.map((p) => [p.key, p.default]))
  );

  const toggle = (key: string) => {
    setPrefs((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      toast.success("Preferences updated");
      return updated;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Bell className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Notification Preferences</h3>
      </div>
      <div className="space-y-3">
        {preferences.map((pref) => {
          const Icon = pref.icon;
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
                checked={prefs[pref.key]}
                onCheckedChange={() => toggle(pref.key)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
