import { Link } from "react-router-dom";

export function PublicFooter() {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg gradient-hero flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">S</span>
              </div>
              <span className="text-lg font-bold">SoftwareHub</span>
            </div>
            <p className="text-sm opacity-60">Find the best software for your business. Read real reviews from verified users.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Browse</h4>
            <div className="space-y-2 text-sm opacity-60">
              <Link to="/category/all" className="block hover:opacity-100 transition-opacity">All Categories</Link>
              <Link to="/compare" className="block hover:opacity-100 transition-opacity">Compare</Link>
              <Link to="/blog" className="block hover:opacity-100 transition-opacity">Blog</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Company</h4>
            <div className="space-y-2 text-sm opacity-60">
              <Link to="/page/about" className="block hover:opacity-100 transition-opacity">About</Link>
              <Link to="/page/contact" className="block hover:opacity-100 transition-opacity">Contact</Link>
              <Link to="/submit-product" className="block hover:opacity-100 transition-opacity">List Your Product</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Legal</h4>
            <div className="space-y-2 text-sm opacity-60">
              <Link to="/page/privacy" className="block hover:opacity-100 transition-opacity">Privacy Policy</Link>
              <Link to="/page/terms" className="block hover:opacity-100 transition-opacity">Terms of Service</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-background/10 pt-6 text-sm text-center opacity-40">
          © {new Date().getFullYear()} SoftwareHub. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
