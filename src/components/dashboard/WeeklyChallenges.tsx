import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Target, Star, MessageSquare, BookmarkPlus, Trophy } from "lucide-react";

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: any;
  target: number;
  current: number;
  reward: string;
}

export function WeeklyChallenges({ userId }: { userId: string }) {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekStartStr = weekStart.toISOString();

  const { data: stats } = useQuery({
    queryKey: ["weekly-challenges", userId, weekStartStr],
    queryFn: async () => {
      const [reviews, comments, saved] = await Promise.all([
        supabase
          .from("reviews")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", weekStartStr),
        supabase
          .from("review_comments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", weekStartStr),
        supabase
          .from("saved_products")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", weekStartStr),
      ]);
      return {
        reviews: reviews.count || 0,
        comments: comments.count || 0,
        saved: saved.count || 0,
      };
    },
  });

  const challenges: Challenge[] = [
    {
      id: "reviews",
      title: "Review Streak",
      description: "Write 3 reviews this week",
      icon: Star,
      target: 3,
      current: Math.min(stats?.reviews || 0, 3),
      reward: "+50 XP",
    },
    {
      id: "comments",
      title: "Community Voice",
      description: "Leave 5 comments on reviews",
      icon: MessageSquare,
      target: 5,
      current: Math.min(stats?.comments || 0, 5),
      reward: "+30 XP",
    },
    {
      id: "saved",
      title: "Explorer",
      description: "Save 3 new products",
      icon: BookmarkPlus,
      target: 3,
      current: Math.min(stats?.saved || 0, 3),
      reward: "+20 XP",
    },
  ];

  const completed = challenges.filter((c) => c.current >= c.target).length;

  return (
    <Card className="border-border/50">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Weekly Challenges</h3>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Trophy className="h-3 w-3 text-[hsl(var(--star))]" />
            {completed}/{challenges.length}
          </div>
        </div>

        <div className="space-y-3">
          {challenges.map((challenge, i) => {
            const isComplete = challenge.current >= challenge.target;
            const progress = (challenge.current / challenge.target) * 100;
            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`p-3 rounded-xl border transition-colors ${
                  isComplete ? "border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5" : "border-border/30 bg-muted/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isComplete ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" : "bg-muted text-muted-foreground"
                  }`}>
                    <challenge.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-semibold ${isComplete ? "text-[hsl(var(--success))]" : "text-foreground"}`}>
                        {challenge.title}
                        {isComplete && " ✓"}
                      </p>
                      <span className="text-[10px] font-medium text-muted-foreground">{challenge.reward}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{challenge.description}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Progress value={progress} className="h-1.5 flex-1" />
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {challenge.current}/{challenge.target}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
