import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SeoHead } from "@/components/SeoHead";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Activity, Search, User, Clock } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

const ACTION_COLORS: Record<string, string> = {
  create: "default",
  update: "secondary",
  delete: "destructive",
  login: "outline",
};

export default function AdminActivityPage() {
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["admin-activity-logs", entityFilter],
    queryFn: async () => {
      let query = supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (entityFilter !== "all") {
        query = query.eq("entity_type", entityFilter);
      }

      const { data } = await query;
      return data || [];
    },
  });

  const filtered = search.trim()
    ? logs.filter((l: any) =>
        l.action?.toLowerCase().includes(search.toLowerCase()) ||
        l.entity_type?.toLowerCase().includes(search.toLowerCase()) ||
        l.entity_id?.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const entityTypes = [...new Set(logs.map((l: any) => l.entity_type).filter(Boolean))];

  return (
    <>
      <SeoHead title="Activity Log - Admin" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Activity Log</h1>
          <p className="text-muted-foreground">Track user actions and system events</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search actions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-40 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {entityTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="product-card p-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No activity logs found</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((log: any) => (
              <div key={log.id} className="product-card p-4 flex items-center gap-4">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{log.action}</span>
                    {log.entity_type && (
                      <Badge variant="outline" className="text-[10px]">{log.entity_type}</Badge>
                    )}
                    {log.entity_id && (
                      <span className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">{log.entity_id}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                    {log.user_id && (
                      <span className="flex items-center gap-1"><User className="h-3 w-3" />{log.user_id.substring(0, 8)}...</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </span>
                    {log.ip_address && <span>IP: {log.ip_address}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
