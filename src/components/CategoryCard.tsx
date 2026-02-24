import { Link } from "react-router-dom";
import { 
  BarChart3, Code, DollarSign, Globe, HeadphonesIcon, LayoutDashboard, 
  Mail, Megaphone, Shield, ShoppingCart, Users, Zap
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<any>> = {
  "bar-chart": BarChart3, code: Code, dollar: DollarSign, globe: Globe,
  headphones: HeadphonesIcon, layout: LayoutDashboard, mail: Mail,
  megaphone: Megaphone, shield: Shield, cart: ShoppingCart, users: Users, zap: Zap,
};

interface CategoryCardProps {
  slug: string;
  name: string;
  icon?: string;
  product_count: number;
  color?: string;
}

export function CategoryCard({ slug, name, icon, product_count, color }: CategoryCardProps) {
  const IconComponent = iconMap[icon || ""] || LayoutDashboard;
  
  return (
    <Link
      to={`/category/${slug}`}
      className="product-card group flex flex-col items-center text-center p-6 hover:border-primary/30"
    >
      <div
        className="h-14 w-14 rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
        style={{ backgroundColor: `${color || '#4F46E5'}15` }}
      >
        <IconComponent className="h-7 w-7" style={{ color: color || '#4F46E5' }} />
      </div>
      <h3 className="font-semibold text-foreground mb-1">{name}</h3>
      <p className="text-sm text-muted-foreground">{product_count} products</p>
    </Link>
  );
}
