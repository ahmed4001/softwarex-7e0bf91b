import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Calendar, Trophy, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

function computeStreak(dates: string[]): { current: number; longest: number; activeDays: number } {
  if (dates.length === 0) return { current: 0, longest: 0, activeDays: 0 };

  const uniqueDays = Array.from(
    new Set(dates.map((d) => new Date(d).toISOString().slice(0, 10)))
  ).sort((a, b) => b.localeCompare(a)); // desc

  const activeDays = uniqueDays.length;

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let current = 0;
  if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
    current = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      const prev = new Date(uniqueDays[i - 1]);
      const curr = new Date(uniqueDays[i]);
      const diff = (prev.getTime() - curr.getTime()) / 86400000;
      if (diff === 1) current++;
      else break;
    }
  }

  let longest = 1;
  let run = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]);
    const curr = new Date(uniqueDays[i]);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (diff === 1) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }
  longest = Math.max(longest, run);

  return { current, longest, activeDays };
}

export function StreakTracker({ userId }: { userId: string }) {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ["streak-tracker", userId],
    queryFn: async () => {
      const [reviewsRes, logsRes] = await Promise.all([
        supabase
          .from("reviews")
          .select("created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(365),
        supabase
          .from("activity_logs")
          .select("created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(365),
      ]);

      const allDates = [
        ...(reviewsRes.data || []).map((r) => r.created_at!),
        ...(logsRes.data || []).map((a) => a.created_at!),
      ].filter(Boolean);

      return computeStreak(allDates);
    },
  });

  if (isLoading) {
    return (
      <div className="glass-card p-5 animate-pulse">
        <div className="h-5 w-32 bg-muted rounded mb-4" />
        <div className="flex gap-4">
          <div className="h-16 w-24 bg-muted/60 rounded-xl" />
          <div className="h-16 w-24 bg-muted/60 rounded-xl" />
          <div className="h-16 w-24 bg-muted/60 rounded-xl" />
        </div>
      </div>
    );
  }

  const { current = 0, longest = 0, activeDays = 0 } = data || {};

  const flameColor =
    current >= 7 ? "text-destructive" : current >= 3 ? "text-warning" : "text-muted-foreground";

  // Last 7 days indicators
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    return d;
  }).reverse();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Flame className={`h-5 w-5 ${flameColor}`} />
        <h3 className="font-bold text-foreground text-sm">Activity Streak</h3>
      </div>

      <div className="flex items-end gap-6 mb-5">
        <div className="text-center">
          <motion.p
            key={current}
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className="text-3xl font-display font-bold text-foreground"
          >
            {current}
          </motion.p>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
            Current
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center gap-1 justify-center">
            <Trophy className="h-3.5 w-3.5 text-warning" />
            <p className="text-lg font-bold text-foreground">{longest}</p>
          </div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
            Best
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center gap-1 justify-center">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <p className="text-lg font-bold text-foreground">{activeDays}</p>
          </div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
            Total Days
          </p>
        </div>
      </div>

      {/* Last 7 days dot visualization */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground font-medium mr-1">Last 7d</span>
        {last7.map((day) => {
          // Check if this day had activity by comparing with allDates logic
          // We'll use a simple heuristic: days within current streak from today
          const dayDate = new Date(day);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          dayDate.setHours(0, 0, 0, 0);
          const daysAgo = Math.round((today.getTime() - dayDate.getTime()) / 86400000);
          const isActive = daysAgo < current;

          return (
            <div
              key={day}
              className={`h-3 w-3 rounded-full transition-colors ${
                isActive
                  ? "bg-primary"
                  : daysAgo === 0 && current > 0
                    ? "bg-primary"
                    : "bg-muted"
              }`}
              title={day}
            />
          );
        })}
      </div>

      {current >= 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 flex items-center gap-1.5 text-xs text-warning font-semibold"
        >
          <Zap className="h-3.5 w-3.5" />
          {current >= 7 ? "You're on fire! 🔥" : "Keep it going! 💪"}
        </motion.div>
      )}
    </motion.div>
  );
}
