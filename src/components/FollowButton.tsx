import { useFollow } from "@/hooks/useFollow";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";

interface FollowButtonProps {
  targetUserId: string;
  size?: "sm" | "default";
}

export function FollowButton({ targetUserId, size = "sm" }: FollowButtonProps) {
  const { isFollowing, canFollow, toggleFollow } = useFollow(targetUserId);

  if (!canFollow) return null;

  return (
    <Button
      size={size}
      variant={isFollowing ? "outline" : "default"}
      onClick={() => toggleFollow.mutate()}
      disabled={toggleFollow.isPending}
      className="gap-1.5 rounded-xl"
    >
      {toggleFollow.isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : isFollowing ? (
        <UserCheck className="h-3.5 w-3.5" />
      ) : (
        <UserPlus className="h-3.5 w-3.5" />
      )}
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
}
