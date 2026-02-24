import { Link } from "react-router-dom";
import { StarRating } from "./StarRating";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Sparkles, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  logo_url?: string;
  avg_rating: number;
  total_reviews: number;
  pricing_model?: string;
  category_name?: string;
  is_featured?: boolean;
  is_sponsored?: boolean;
}

export function ProductCard({ slug, name, tagline, logo_url, avg_rating, total_reviews, pricing_model, category_name, is_featured, is_sponsored }: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/product/${slug}`} className="product-card glow-border group block relative">
        {is_sponsored && (
          <div className="absolute -top-px -right-px">
            <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl">
              SPONSORED
            </div>
          </div>
        )}
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-border/50">
            {logo_url ? (
              <img src={logo_url} alt={name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xl font-display font-bold gradient-text">{name.charAt(0)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors truncate">{name}</h3>
              {is_featured && (
                <span className="flex items-center gap-0.5 text-primary text-xs font-medium">
                  <Sparkles className="h-3 w-3" />
                </span>
              )}
            </div>
            {tagline && <p className="text-sm text-muted-foreground line-clamp-1 mb-2.5">{tagline}</p>}
            <div className="flex items-center gap-3">
              <StarRating rating={avg_rating} size="sm" />
              <span className="text-sm font-bold text-foreground">{avg_rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({total_reviews})</span>
            </div>
            <div className="flex items-center gap-2 mt-2.5">
              {category_name && (
                <span className="text-[11px] text-muted-foreground bg-muted/80 px-2.5 py-1 rounded-lg font-medium">{category_name}</span>
              )}
              {pricing_model && (
                <span className="text-[11px] text-muted-foreground capitalize font-medium">{pricing_model === "free" ? "Free" : pricing_model}</span>
              )}
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 flex-shrink-0 mt-1" />
        </div>
      </Link>
    </motion.div>
  );
}
