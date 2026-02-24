import { Link, useLocation } from "react-router-dom";
import { SearchBar } from "./SearchBar";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/category/all", label: "Categories" },
  { to: "/compare", label: "Compare" },
  { to: "/blog", label: "Blog" },
];

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={cn(
      "sticky top-0 z-50 transition-all duration-500",
      scrolled 
        ? "bg-card/80 backdrop-blur-2xl border-b border-border/50 shadow-[0_1px_20px_-8px_hsl(var(--foreground)/0.08)]" 
        : "bg-transparent border-b border-transparent"
    )}>
      <div className="container flex items-center justify-between h-16 lg:h-18 gap-4">
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
          <div className="h-9 w-9 rounded-xl gradient-hero flex items-center justify-center transition-transform duration-300 group-hover:scale-110 glow-primary">
            <span className="text-sm font-black text-primary-foreground tracking-tight">S</span>
          </div>
          <span className="text-lg font-display font-bold text-foreground hidden sm:block">
            Software<span className="gradient-text">Hub</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-0.5">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200",
                location.pathname === l.to 
                  ? "text-primary bg-primary/8" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block flex-1 max-w-md">
          <SearchBar variant="compact" />
        </div>

        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex font-medium">Sign In</Button>
          </Link>
          <Link to="/register">
            <Button size="sm" className="btn-premium rounded-xl text-primary-foreground font-semibold px-5">Get Started</Button>
          </Link>
          <button className="lg:hidden p-2 rounded-xl hover:bg-muted transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border/50 bg-card/95 backdrop-blur-2xl overflow-hidden"
          >
            <div className="p-4 space-y-1">
              <SearchBar variant="compact" className="mb-4" />
              {navLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl hover:bg-muted transition-colors"
                >
                  {l.label}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
