import { Link } from "react-router-dom";
import { StarRating } from "./StarRating";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

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
    <Link to={`/product/${slug}`} className="product-card group block">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
          {logo_url ? (
            <img src={logo_url} alt={name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl font-bold text-primary">{name.charAt(0)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">{name}</h3>
            {is_sponsored && <Badge variant="secondary" className="text-xs">Sponsored</Badge>}
            {is_featured && <Badge className="text-xs bg-primary/10 text-primary border-0">Featured</Badge>}
          </div>
          {tagline && <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{tagline}</p>}
          <div className="flex items-center gap-3">
            <StarRating rating={avg_rating} size="sm" />
            <span className="text-sm font-medium text-foreground">{avg_rating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">({total_reviews} reviews)</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {category_name && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{category_name}</span>}
            {pricing_model && <span className="text-xs text-muted-foreground capitalize">{pricing_model}</span>}
          </div>
        </div>
        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
      </div>
    </Link>
  );
}
