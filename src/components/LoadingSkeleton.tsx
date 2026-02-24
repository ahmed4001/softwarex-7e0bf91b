import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="glass-card p-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-14 w-14 rounded-2xl flex-shrink-0 shimmer" />
        <div className="flex-1">
          <Skeleton className="h-5 w-40 mb-2.5 shimmer" />
          <Skeleton className="h-4 w-64 mb-2.5 shimmer" />
          <Skeleton className="h-4 w-32 shimmer" />
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass-card border-l-4 border-l-muted p-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-3 w-24 mb-3 shimmer" />
          <Skeleton className="h-9 w-20 shimmer" />
        </div>
        <Skeleton className="h-14 w-14 rounded-2xl shimmer" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl shimmer" />
      ))}
    </div>
  );
}
