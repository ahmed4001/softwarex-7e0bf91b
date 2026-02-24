import { Link } from "react-router-dom";
import { 
  BarChart3, Code, DollarSign, Globe, HeadphonesIcon, LayoutDashboard, 
  Mail, Megaphone, Shield, ShoppingCart, Users, Zap
} from "lucide-react";
import { motion } from "framer-motion";

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
  index?: number;
}

export function CategoryCard({ slug, name, icon, product_count, color, index = 0 }: CategoryCardProps) {
  const IconComponent = iconMap[icon || ""] || LayoutDashboard;
  const c = color || '#6366f1';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link
        to={`/category/${slug}`}
        className="glass-card glow-border group flex flex-col items-center text-center p-7 relative overflow-hidden"
      >
        {/* Subtle background glow */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `radial-gradient(circle at center, ${c}08, transparent 70%)` }}
        />
        
        <div
          className="relative h-16 w-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
          style={{ 
            backgroundColor: `${c}12`,
            boxShadow: `0 0 0 0 ${c}00`,
          }}
        >
          <IconComponent className="h-8 w-8 transition-colors duration-300" style={{ color: c }} />
        </div>
        <h3 className="font-display font-semibold text-foreground mb-1">{name}</h3>
        <p className="text-sm text-muted-foreground">{product_count} products</p>
      </Link>
    </motion.div>
  );
}
