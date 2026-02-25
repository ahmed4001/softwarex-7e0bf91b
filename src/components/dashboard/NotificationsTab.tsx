import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, Award, MessageSquare, Star, Package, Info, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const typeIcons: Record<string, typeof Bell> = {
  badge: Award,
  review: Star,
  response: MessageSquare,
  product: Package,
  info: Info,
};

export function NotificationsTab({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["dashboard-notifications", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);
      return data || [];
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard-notifications", userId] }),
  });

  const markOneRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard-notifications", userId] }),
  });

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
        <div className="relative mx-auto w-24 h-24 mb-6">
          <div className="absolute inset-0 rounded-2xl bg-primary/5 rotate-6" />
          <div className="absolute inset-0 rounded-2xl bg-primary/10 -rotate-3" />
          <div className="relative h-full w-full rounded-2xl bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center">
            <Bell className="h-10 w-10 text-primary/50" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">No notifications yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          You'll see badge awards, review responses, and other updates here.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{unreadCount}</span> unread
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </Button>
        </div>
      )}

      <AnimatePresence initial={false}>
        {notifications.map((n: any, i: number) => {
          const Icon = typeIcons[n.type || "info"] || Bell;
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`glass-card p-4 flex items-start gap-3 transition-colors ${
                !n.is_read ? "border-l-2 border-l-primary bg-primary/[0.02]" : ""
              }`}
              onClick={() => !n.is_read && markOneRead.mutate(n.id)}
              role="button"
              tabIndex={0}
            >
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                !n.is_read ? "bg-primary/10" : "bg-muted"
              }`}>
                <Icon className={`h-4 w-4 ${!n.is_read ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className={`text-sm leading-tight ${!n.is_read ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}>
                    {n.title}
                  </h4>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </span>
                </div>
                {n.message && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                )}
                {n.link && (
                  <Link to={n.link} className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1.5">
                    View details <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
              {!n.is_read && (
                <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
