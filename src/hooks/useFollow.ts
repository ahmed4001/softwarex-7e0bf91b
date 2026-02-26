import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useFollow(targetUserId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: isFollowing = false } = useQuery({
    queryKey: ["is-following", user?.id, targetUserId],
    enabled: !!user && !!targetUserId && user.id !== targetUserId,
    queryFn: async () => {
      const { count } = await supabase
        .from("user_follows")
        .select("id", { count: "exact", head: true })
        .eq("follower_id", user!.id)
        .eq("following_id", targetUserId);
      return (count || 0) > 0;
    },
  });

  const { data: followerCount = 0 } = useQuery({
    queryKey: ["follower-count", targetUserId],
    enabled: !!targetUserId,
    queryFn: async () => {
      const { count } = await supabase
        .from("user_follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", targetUserId);
      return count || 0;
    },
  });

  const { data: followingCount = 0 } = useQuery({
    queryKey: ["following-count", targetUserId],
    enabled: !!targetUserId,
    queryFn: async () => {
      const { count } = await supabase
        .from("user_follows")
        .select("id", { count: "exact", head: true })
        .eq("follower_id", targetUserId);
      return count || 0;
    },
  });

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");
      if (isFollowing) {
        await supabase
          .from("user_follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);
      } else {
        await supabase
          .from("user_follows")
          .insert({ follower_id: user.id, following_id: targetUserId });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["is-following", user?.id, targetUserId] });
      qc.invalidateQueries({ queryKey: ["follower-count", targetUserId] });
    },
  });

  return { isFollowing, followerCount, followingCount, toggleFollow, canFollow: !!user && user.id !== targetUserId };
}
