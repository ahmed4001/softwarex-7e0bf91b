import { Link } from "react-router-dom";
import { Github, Twitter, Linkedin, ArrowUpRight } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="relative overflow-hidden">
      {/* Gradient top border */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="bg-foreground text-background relative">
        <div className="absolute inset-0 mesh-gradient opacity-20" />
        <div className="container relative py-20">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="h-9 w-9 rounded-xl gradient-hero flex items-center justify-center">
                  <span className="text-sm font-black text-primary-foreground">S</span>
                </div>
                <span className="text-lg font-display font-bold">SoftwareHub</span>
              </div>
              <p className="text-sm opacity-50 leading-relaxed max-w-xs mb-6">
                Discover the best software for your business. Real reviews from verified users, honest comparisons.
              </p>
              <div className="flex items-center gap-3">
                {[Twitter, Github, Linkedin].map((Icon, i) => (
                  <a key={i} href="#" className="h-9 w-9 rounded-xl bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors">
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
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
                { to: "/page/privacy", label: "Privacy" },
                { to: "/page/terms", label: "Terms" },
              ]},
            ].map((section) => (
              <div key={section.title}>
                <h4 className="font-display font-semibold mb-4 text-sm uppercase tracking-wider opacity-60">{section.title}</h4>
                <div className="space-y-3">
                  {section.links.map((l) => (
                    <Link key={l.to} to={l.to} className="group flex items-center gap-1 text-sm opacity-50 hover:opacity-100 transition-opacity">
                      {l.label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="h-px bg-background/10 mb-6" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs opacity-30">
            <span>© {new Date().getFullYear()} SoftwareHub. All rights reserved.</span>
            <span>Made with precision & care.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
