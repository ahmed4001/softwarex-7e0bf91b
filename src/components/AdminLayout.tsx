import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  BarChart3, Box, ChevronDown, ChevronRight, FileText, FolderOpen,
  Image, LayoutDashboard, LogOut, Megaphone, MessageSquare, Settings,
  Star, Users, Bell, Search, Menu, Activity, Mail
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/admin" },
  {
    label: "Products", icon: Box, children: [
      { label: "All Products", to: "/admin/products" },
      { label: "Add Product", to: "/admin/products/new" },
      { label: "Sponsored", to: "/admin/products/sponsored" },
    ]
  },
  {
    label: "Categories", icon: FolderOpen, children: [
      { label: "All Categories", to: "/admin/categories" },
      { label: "Add Category", to: "/admin/categories/new" },
    ]
  },
  {
    label: "Reviews", icon: Star, children: [
      { label: "All Reviews", to: "/admin/reviews" },
      { label: "Pending", to: "/admin/reviews/pending" },
      { label: "Flagged", to: "/admin/reviews/flagged" },
    ]
  },
  {
    label: "Users", icon: Users, children: [
      { label: "All Users", to: "/admin/users" },
    ]
  },
  {
    label: "Blog & CMS", icon: FileText, children: [
      { label: "Blog Posts", to: "/admin/blog" },
      { label: "Add Post", to: "/admin/blog/new" },
      { label: "Pages", to: "/admin/pages" },
    ]
  },
  { label: "Media Library", icon: Image, to: "/admin/media" },
  { label: "Advertisements", icon: Megaphone, to: "/admin/ads" },
  { label: "Submissions", icon: MessageSquare, to: "/admin/submissions" },
  { label: "Email Templates", icon: Mail, to: "/admin/emails" },
  { label: "Analytics", icon: BarChart3, to: "/admin/analytics" },
  { label: "Settings", icon: Settings, to: "/admin/settings" },
  { label: "Activity Log", icon: Activity, to: "/admin/activity" },
];

function SidebarItem({ item, collapsed }: { item: any; collapsed: boolean }) {
  const location = useLocation();
  const [open, setOpen] = useState(() => {
    if (item.children) return item.children.some((c: any) => location.pathname.startsWith(c.to));
    return false;
  });
  const isActive = item.to ? location.pathname === item.to : item.children?.some((c: any) => location.pathname.startsWith(c.to));
  const Icon = item.icon;

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            isActive ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <Icon className="h-4.5 w-4.5 flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </>
          )}
        </button>
        {open && !collapsed && (
          <div className="ml-7 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
            {item.children.map((child: any) => (
              <Link
                key={child.to}
                to={child.to}
                className={cn(
                  "block px-3 py-1.5 rounded-md text-sm transition-colors",
                  location.pathname === child.to ? "text-sidebar-primary font-medium" : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
                )}
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={item.to}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        isActive ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      )}
    >
      <Icon className="h-4.5 w-4.5 flex-shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className={cn(
        "bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-200 flex-shrink-0",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
          <div className="h-8 w-8 rounded-lg gradient-hero flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary-foreground">S</span>
          </div>
          {!collapsed && <span className="text-sm font-bold text-sidebar-foreground">SoftwareHub Admin</span>}
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {sidebarItems.map((item) => (
            <SidebarItem key={item.label} item={item} collapsed={collapsed} />
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors">
            <LogOut className="h-4.5 w-4.5" />
            {!collapsed && <span>Back to Site</span>}
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 bg-card border-b border-border h-14 flex items-center px-6 gap-4">
          <button onClick={() => setCollapsed(!collapsed)}>
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-10 h-9 bg-muted border-0" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">3</span>
            </Button>
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">A</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 bg-muted/30">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
