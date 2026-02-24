import { StarRating } from "./StarRating";
import { ThumbsUp, ThumbsDown, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface ReviewCardProps {
  title?: string;
  body?: string;
  pros?: string;
  cons?: string;
  overall_rating: number;
  reviewer_name?: string;
  reviewer_role?: string;
  company_size?: string;
  helpful_count?: number;
  verified_reviewer?: boolean;
  created_at: string;
}

export function ReviewCard({ title, body, pros, cons, overall_rating, reviewer_name, reviewer_role, company_size, helpful_count = 0, verified_reviewer, created_at }: ReviewCardProps) {
  return (
    <div className="product-card">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <StarRating rating={overall_rating} size="sm" />
            <span className="text-sm font-semibold">{overall_rating}.0</span>
          </div>
          {title && <h4 className="font-semibold text-foreground">{title}</h4>}
        </div>
        {verified_reviewer && (
          <div className="flex items-center gap-1 text-success text-xs font-medium">
            <CheckCircle className="h-3.5 w-3.5" /> Verified
          </div>
        )}
      </div>
      
      {pros && (
        <div className="mb-2">
          <span className="text-xs font-semibold text-success">PROS: </span>
          <span className="text-sm text-muted-foreground">{pros}</span>
        </div>
      )}
      {cons && (
        <div className="mb-2">
          <span className="text-xs font-semibold text-destructive">CONS: </span>
          <span className="text-sm text-muted-foreground">{cons}</span>
        </div>
      )}
      {body && <p className="text-sm text-muted-foreground mb-3">{body}</p>}

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{reviewer_name || "Anonymous"}</span>
          {reviewer_role && <> · {reviewer_role}</>}
          {company_size && <> · {company_size}</>}
          <> · {formatDistanceToNow(new Date(created_at), { addSuffix: true })}</>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
            <ThumbsUp className="h-3 w-3" /> {helpful_count}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            <ThumbsDown className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
