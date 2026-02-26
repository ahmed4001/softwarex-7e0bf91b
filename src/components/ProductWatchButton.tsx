import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProductWatch } from "@/hooks/useProductWatch";
import { useAuth } from "@/hooks/useAuth";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function ProductWatchButton({ productId }: { productId: string }) {
  const { user } = useAuth();
  const { isWatching, toggle, isToggling } = useProductWatch(productId);

  if (!user) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={isWatching ? "default" : "outline"}
          size="sm"
          onClick={() => toggle()}
          disabled={isToggling}
          className="gap-1.5 rounded-xl"
        >
          {isWatching ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          {isWatching ? "Watching" : "Watch"}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isWatching ? "Stop getting notifications for this product" : "Get notified about new reviews"}
      </TooltipContent>
    </Tooltip>
  );
}
