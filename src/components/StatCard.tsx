import { cn } from "@/lib/utils";
import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  color?: "primary" | "secondary" | "success" | "warning" | "destructive";
}

const borderColors = {
  primary: "border-l-primary",
  secondary: "border-l-secondary",
  success: "border-l-success",
  warning: "border-l-warning",
  destructive: "border-l-destructive",
};

const iconBgs = {
  primary: "bg-primary/8 text-primary",
  secondary: "bg-secondary/8 text-secondary",
  success: "bg-success/8 text-success",
  warning: "bg-warning/8 text-warning",
  destructive: "bg-destructive/8 text-destructive",
};

export function StatCard({ title, value, icon: Icon, trend, trendLabel, color = "primary" }: StatCardProps) {
  return (
    <div className={cn("stat-card group", borderColors[color])}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{title}</p>
          <p className="text-3xl font-display font-bold text-foreground">{value}</p>
          {trend !== undefined && (
            <div className={cn("flex items-center gap-1 mt-2 text-xs font-semibold", trend >= 0 ? "text-success" : "text-destructive")}>
              {trend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {Math.abs(trend)}% {trendLabel || "vs last period"}
            </div>
          )}
        </div>
        <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110", iconBgs[color])}>
          <Icon className="h-7 w-7" />
        </div>
      </div>
    </div>
  );
}
