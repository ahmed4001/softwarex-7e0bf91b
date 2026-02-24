import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function PaginationControls({ page, totalPages, onPageChange, className = "" }: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="icon"
        className="rounded-xl"
        disabled={page === 0}
        onClick={() => onPageChange(Math.max(0, page - 1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {Array.from({ length: totalPages }).map((_, i) => {
        if (totalPages <= 7 || i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1) {
          return (
            <Button
              key={i}
              variant={i === page ? "default" : "outline"}
              size="icon"
              className="rounded-xl h-9 w-9 text-sm"
              onClick={() => onPageChange(i)}
            >
              {i + 1}
            </Button>
          );
        }
        if (i === 1 && page > 3) return <span key={i} className="text-muted-foreground px-1">…</span>;
        if (i === totalPages - 2 && page < totalPages - 4) return <span key={i} className="text-muted-foreground px-1">…</span>;
        return null;
      })}
      <Button
        variant="outline"
        size="icon"
        className="rounded-xl"
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}