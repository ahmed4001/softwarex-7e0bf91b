import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Search, Download, Users, UserPlus, UserCheck, CheckCircle, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";

const statusOptions = ["new", "contacted", "qualified", "closed"] as const;
const statusColors: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-600 border-blue-200",
  contacted: "bg-amber-500/10 text-amber-600 border-amber-200",
  qualified: "bg-primary/10 text-primary border-primary/20",
  closed: "bg-muted text-muted-foreground border-border",
};

export default function VendorLeadsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["vendor-leads", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("vendor_leads")
        .select("*")
        .eq("vendor_user_id", user!.id)
        .order("created_at", { ascending: false });
      
      // Fetch product names separately
      if (data && data.length > 0) {
        const productIds = [...new Set(data.map(l => l.product_id))];
        const { data: products } = await supabase
          .from("products")
          .select("id, name")
          .in("id", productIds);
        const productMap = new Map((products || []).map(p => [p.id, p.name]));
        return data.map(l => ({ ...l, product_name: productMap.get(l.product_id) || "Unknown" }));
      }
      return [];
    },
  });

  const updateLead = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("vendor_leads").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-leads"] });
      setEditingNotes(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filtered = leads.filter((l: any) => {
    const matchesSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase()) || (l.company || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: leads.length,
    new: leads.filter((l: any) => l.status === "new").length,
    qualified: leads.filter((l: any) => l.status === "qualified").length,
    closed: leads.filter((l: any) => l.status === "closed").length,
  };

  const exportCSV = () => {
    const rows = [["Name", "Email", "Company", "Product", "Status", "Date", "Notes"]];
    filtered.forEach((l: any) => rows.push([l.name, l.email, l.company || "", l.product_name, l.status, format(new Date(l.created_at), "yyyy-MM-dd"), l.notes || ""]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "vendor-leads.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  };

  const statCards = [
    { label: "Total Leads", value: stats.total, icon: Users, color: "text-foreground" },
    { label: "New", value: stats.new, icon: UserPlus, color: "text-blue-600" },
    { label: "Qualified", value: stats.qualified, icon: UserCheck, color: "text-primary" },
    { label: "Closed", value: stats.closed, icon: CheckCircle, color: "text-muted-foreground" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Leads</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your inbound leads</p>
        </div>
        <div className="flex gap-2">
          <Link to="/vendor/leads/analytics">
            <Button variant="outline" size="sm" className="gap-1.5 rounded-lg">
              <BarChart3 className="h-4 w-4" /> Analytics
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-lg" onClick={exportCSV}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <p className="text-2xl font-display font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search leads..." className="pl-9 rounded-lg" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading leads...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No leads found.</div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-3 px-4 font-medium">Name</th>
                <th className="text-left py-3 px-4 font-medium">Email</th>
                <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Company</th>
                <th className="text-left py-3 px-4 font-medium hidden lg:table-cell">Product</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Date</th>
                <th className="text-left py-3 px-4 font-medium hidden lg:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((l: any) => (
                <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-medium">{l.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{l.email}</td>
                  <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{l.company || "—"}</td>
                  <td className="py-3 px-4 hidden lg:table-cell">{l.product_name}</td>
                  <td className="py-3 px-4">
                    <Select
                      value={l.status}
                      onValueChange={(v) => updateLead.mutate({ id: l.id, updates: { status: v } })}
                    >
                      <SelectTrigger className="h-7 w-28 text-xs rounded-md border-0">
                        <Badge variant="outline" className={`text-xs ${statusColors[l.status] || ""}`}>{l.status}</Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs hidden md:table-cell">{format(new Date(l.created_at), "MMM d, yyyy")}</td>
                  <td className="py-3 px-4 hidden lg:table-cell">
                    {editingNotes === l.id ? (
                      <div className="flex gap-1">
                        <Textarea className="text-xs min-h-[40px] h-10" value={notesValue} onChange={(e) => setNotesValue(e.target.value)} />
                        <Button size="sm" variant="ghost" className="text-xs" onClick={() => { updateLead.mutate({ id: l.id, updates: { notes: notesValue } }); }}>Save</Button>
                      </div>
                    ) : (
                      <button
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left max-w-[150px] truncate"
                        onClick={() => { setEditingNotes(l.id); setNotesValue(l.notes || ""); }}
                      >
                        {l.notes || "Add note..."}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
