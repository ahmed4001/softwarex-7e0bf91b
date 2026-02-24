import { Link } from "react-router-dom";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">S</span>
              </div>
              <span className="text-base font-bold text-foreground">SoftwareHub</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              The best place to discover, compare, and review business software. Real reviews from real users.
            </p>
          </div>
          
          {[
            { title: "Browse", links: [
              { to: "/category/all", label: "All Categories" },
              { to: "/compare", label: "Compare" },
              { to: "/blog", label: "Blog" },
              { to: "/search", label: "Search" },
            ]},
            { title: "Company", links: [
              { to: "/page/about", label: "About" },
              { to: "/page/contact", label: "Contact" },
              { to: "/submit-product", label: "List Your Product" },
            ]},
            { title: "Legal", links: [
              { to: "/page/privacy", label: "Privacy Policy" },
              { to: "/page/terms", label: "Terms of Service" },
            ]},
          ].map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-foreground mb-4 text-sm">{section.title}</h4>
              <div className="space-y-2.5">
                {section.links.map((l) => (
                  <Link key={l.to} to={l.to} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} SoftwareHub. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
