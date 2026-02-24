import { Link } from "react-router-dom";
import { StarRating } from "./StarRating";
import { ArrowUpRight, Sparkles } from "lucide-react";
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Link to={`/product/${slug}`} className="glass-card p-5 group block relative">
        {is_sponsored && (
          <span className="absolute top-3 right-3 text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">
            AD
          </span>
        )}
        <div className="flex items-start gap-3.5">
          <div className="h-11 w-11 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
            {logo_url ? (
              <img src={logo_url} alt={name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-base font-bold text-primary">{name.charAt(0)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="font-semibold text-foreground text-[15px] group-hover:text-primary transition-colors truncate">
                {name}
              </h3>
              {is_featured && <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
            </div>
            {tagline && <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{tagline}</p>}
            <div className="flex items-center gap-2">
              <StarRating rating={avg_rating} size="sm" />
              <span className="text-sm font-semibold text-foreground">{avg_rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({total_reviews})</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {category_name && (
                <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded font-medium">{category_name}</span>
              )}
              {pricing_model && (
                <span className="text-[11px] text-muted-foreground capitalize font-medium">{pricing_model}</span>
              )}
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
        </div>
      </Link>
    </motion.div>
  );
}
