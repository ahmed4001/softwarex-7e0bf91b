import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SeoHead } from "@/components/SeoHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Link } from "react-router-dom";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

export default function AdminCategoriesPage() {
  const [search, setSearch] = useState("");

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin-categories", search],
    queryFn: async () => {
      let query = supabase.from("categories").select("*").order("sort_order");
      if (search) query = query.ilike("name", `%${search}%`);
      const { data } = await query;
      return data || [];
    },
  });

  return (
    <>
      <SeoHead title="Categories - Admin" robots="noindex, nofollow" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Categories</h1>
            <p className="text-muted-foreground">{categories?.length || 0} categories</p>
          </div>
          <Link to="/admin/categories/new"><Button className="gap-1"><Plus className="h-4 w-4" />Add Category</Button></Link>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search categories..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        <div className="product-card overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Slug</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Products</th>
                <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3">Active</th>
                <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3">Featured</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories?.map((c) => (
                <tr key={c.id} className="admin-table-row">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color || "#4F46E5" }} />
                      <span className="text-sm font-medium text-foreground">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.slug}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.product_count}</td>
                  <td className="px-4 py-3 text-center"><Switch checked={c.is_active || false} /></td>
                  <td className="px-4 py-3 text-center"><Switch checked={c.is_featured || false} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/admin/categories/${c.id}/edit`}><Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button></Link>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>}
              {!isLoading && categories?.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No categories found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
