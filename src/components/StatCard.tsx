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
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  success: "bg-emerald-50 text-success",
  warning: "bg-amber-50 text-warning",
  destructive: "bg-red-50 text-destructive",
};

export function StatCard({ title, value, icon: Icon, trend, trendLabel, color = "primary" }: StatCardProps) {
  return (
    <div className={cn("stat-card", borderColors[color])}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {trend !== undefined && (
            <div className={cn("flex items-center gap-1 mt-1 text-xs font-medium", trend >= 0 ? "text-success" : "text-destructive")}>
              {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend)}% {trendLabel || "vs last period"}
            </div>
          )}
        </div>
        <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", iconBgs[color])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
