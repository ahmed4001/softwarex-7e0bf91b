import { cn } from "@/lib/utils";

type Status = "approved" | "pending" | "rejected" | "spam" | "flagged" | "draft" | "published" | "scheduled" | "archived" | "active" | "inactive";

const statusStyles: Record<string, string> = {
  approved: "status-badge-approved",
  published: "status-badge-approved",
  active: "status-badge-approved",
  pending: "status-badge-pending",
  scheduled: "status-badge-pending",
  draft: "bg-muted text-muted-foreground",
  rejected: "status-badge-rejected",
  spam: "status-badge-rejected",
  flagged: "bg-orange-100 text-orange-700",
  archived: "bg-muted text-muted-foreground",
  inactive: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("status-badge", statusStyles[status] || "bg-muted text-muted-foreground")}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
