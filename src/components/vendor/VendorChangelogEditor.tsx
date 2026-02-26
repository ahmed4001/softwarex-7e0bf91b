import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

export function VendorChangelogEditor({ productId }: { productId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [version, setVersion] = useState("");
  const [changeType, setChangeType] = useState("improvement");

  const { data: changelogs, isLoading } = useQuery({
    queryKey: ["vendor-changelogs", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_changelogs")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("product_changelogs").insert({
        product_id: productId,
        title,
        body,
        version: version || null,
        change_type: changeType,
        is_published: true,
        published_at: new Date().toISOString(),
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Changelog entry added!");
      queryClient.invalidateQueries({ queryKey: ["vendor-changelogs", productId] });
      setShowForm(false);
      setTitle("");
      setBody("");
      setVersion("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_changelogs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Entry deleted");
      queryClient.invalidateQueries({ queryKey: ["vendor-changelogs", productId] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground">Product Changelog</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)} variant={showForm ? "outline" : "default"} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> New Entry
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/20">
          <CardContent className="p-4 space-y-3">
            <Input placeholder="Title (e.g. Dark mode support)" value={title} onChange={(e) => setTitle(e.target.value)} />
            <div className="flex gap-2">
              <Input placeholder="Version (optional)" value={version} onChange={(e) => setVersion(e.target.value)} className="w-32" />
              <Select value={changeType} onValueChange={setChangeType}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="feature">Feature</SelectItem>
                  <SelectItem value="improvement">Improvement</SelectItem>
                  <SelectItem value="bugfix">Bug Fix</SelectItem>
                  <SelectItem value="breaking">Breaking</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea placeholder="Description..." value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => createMutation.mutate()} disabled={!title || createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Publish
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted/40 animate-pulse" />)}</div>
      ) : (changelogs || []).length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No changelog entries yet.</p>
      ) : (
        <div className="space-y-2">
          {(changelogs || []).map((entry: any) => (
            <Card key={entry.id} className="border-border/50">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{entry.title}</span>
                    {entry.version && <Badge variant="outline" className="text-[10px]">{entry.version}</Badge>}
                    <Badge variant="secondary" className="text-[10px] capitalize">{entry.change_type}</Badge>
                    <Badge variant={entry.is_published ? "default" : "secondary"} className="text-[10px]">
                      {entry.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {entry.published_at ? format(new Date(entry.published_at), "MMM d, yyyy") : format(new Date(entry.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(entry.id)} className="text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
