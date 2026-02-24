import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

const sizeMap = { sm: "h-3.5 w-3.5", md: "h-5 w-5", lg: "h-6 w-6" };

export function StarRating({ rating, maxRating = 5, size = "md", showValue = false, interactive = false, onChange }: StarRatingProps) {
  return (
    <div className="inline-flex items-center gap-1">
      {Array.from({ length: maxRating }, (_, i) => {
        const filled = i < Math.floor(rating);
        const half = !filled && i < rating;
        return (
          <Star
            key={i}
            className={cn(
              sizeMap[size],
              "transition-colors",
              filled ? "fill-star text-star" : half ? "fill-star/50 text-star" : "fill-muted text-muted-foreground/30",
              interactive && "cursor-pointer hover:text-star hover:fill-star/70"
            )}
            onClick={() => interactive && onChange?.(i + 1)}
          />
        );
      })}
      {showValue && <span className="ml-1 font-semibold text-foreground">{rating.toFixed(1)}</span>}
    </div>
  );
}
