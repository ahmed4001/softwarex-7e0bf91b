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
    <div className="glass-card p-7">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <StarRating rating={overall_rating} size="sm" />
            <span className="text-sm font-display font-bold">{overall_rating}.0</span>
          </div>
          {title && <h4 className="font-display font-bold text-lg text-foreground">{title}</h4>}
        </div>
        {verified_reviewer && (
          <div className="flex items-center gap-1.5 text-success text-xs font-semibold bg-success/8 px-3 py-1.5 rounded-full">
            <CheckCircle className="h-3.5 w-3.5" /> Verified
          </div>
        )}
      </div>

      {pros && (
        <div className="mb-3 p-3 rounded-xl bg-success/5 border border-success/10">
          <span className="text-xs font-bold text-success uppercase tracking-wider">Pros</span>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{pros}</p>
        </div>
      )}
      {cons && (
        <div className="mb-3 p-3 rounded-xl bg-destructive/5 border border-destructive/10">
          <span className="text-xs font-bold text-destructive uppercase tracking-wider">Cons</span>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{cons}</p>
        </div>
      )}
      {body && <p className="text-sm text-muted-foreground leading-relaxed mb-4">{body}</p>}

      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary">{(reviewer_name || "A").charAt(0)}</span>
          </div>
          <div>
            <span className="font-semibold text-foreground">{reviewer_name || "Anonymous"}</span>
            {reviewer_role && <span className="opacity-60"> · {reviewer_role}</span>}
            {company_size && <span className="opacity-60"> · {company_size}</span>}
          </div>
          <span className="opacity-40">· {formatDistanceToNow(new Date(created_at), { addSuffix: true })}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 rounded-lg">
            <ThumbsUp className="h-3.5 w-3.5" /> {helpful_count}
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs rounded-lg">
            <ThumbsDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
