import { Link, useLocation } from "react-router-dom";
import { SearchBar } from "./SearchBar";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/category/all", label: "Categories" },
  { to: "/compare", label: "Compare" },
  { to: "/blog", label: "Blog" },
];

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-16 gap-4">
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="h-8 w-8 rounded-lg gradient-hero flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">S</span>
          </div>
          <span className="text-lg font-bold text-foreground hidden sm:block">SoftwareHub</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                location.pathname === l.to ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block flex-1 max-w-md">
          <SearchBar variant="compact" />
        </div>

        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link to="/register">
            <Button size="sm">Get Started</Button>
          </Link>
          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card p-4 space-y-2">
          <SearchBar variant="compact" className="mb-3" />
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted">
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
