import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SeoHead } from "@/components/SeoHead";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StarRating } from "@/components/StarRating";
import { Search, Check, X, Flag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminReviewsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["admin-reviews", search, statusFilter],
    queryFn: async () => {
      let query = supabase.from("reviews").select("*, products(name), profiles(name, email)").order("created_at", { ascending: false });
      if (statusFilter !== "all") query = query.eq("status", statusFilter as any);
      if (search) query = query.ilike("title", `%${search}%`);
      const { data } = await query.limit(50);
      return data || [];
    },
  });

  const moderateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("reviews").update({ status: status as any, moderated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-reviews"] }); toast.success("Review updated"); },
    onError: () => toast.error("Failed to update review"),
  });

  return (
    <>
      <SeoHead title="Reviews - Admin" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
          <p className="text-muted-foreground">Manage and moderate user reviews</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search reviews..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="spam">Spam</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="product-card overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Product</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Reviewer</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Rating</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Title</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews?.map((r: any) => (
                <tr key={r.id} className="admin-table-row">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{r.products?.name || "—"}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-foreground">{r.profiles?.name || "Anonymous"}</p>
                    <p className="text-xs text-muted-foreground">{r.profiles?.email}</p>
                  </td>
                  <td className="px-4 py-3"><StarRating rating={r.overall_rating} size="sm" /></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">{r.title || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {r.status === "pending" && (
                        <>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-success" onClick={() => moderateMutation.mutate({ id: r.id, status: "approved" })}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => moderateMutation.mutate({ id: r.id, status: "rejected" })}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => moderateMutation.mutate({ id: r.id, status: "flagged" })}>
                        <Flag className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>}
              {!isLoading && reviews?.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No reviews found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
