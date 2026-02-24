import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SeoHead } from "@/components/SeoHead";
import { SearchBar } from "@/components/SearchBar";
import { ProductCard } from "@/components/ProductCard";
import { CategoryCard } from "@/components/CategoryCard";
import { ProductCardSkeleton } from "@/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, CheckCircle, BarChart3, Users, Star, Package, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function HomePage() {
  const [email, setEmail] = useState("");

  const { data: categories } = useQuery({
    queryKey: ["categories-featured"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").eq("is_active", true).order("sort_order").limit(8);
      return data || [];
    },
  });

  const { data: featuredProducts, isLoading: loadingFeatured } = useQuery({
    queryKey: ["products-featured"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("avg_rating", { ascending: false })
        .limit(6);
      return data || [];
    },
  });

  const { data: topProducts, isLoading: loadingTop } = useQuery({
    queryKey: ["products-top"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("is_active", true)
        .order("avg_rating", { ascending: false })
        .limit(8);
      return data || [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["site-stats"],
    queryFn: async () => {
      const [products, reviews, categories] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("reviews").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
      ]);
      return {
        products: products.count || 0,
        reviews: reviews.count || 0,
        categories: categories.count || 0,
      };
    },
  });

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: email.trim() });
    if (error) {
      if (error.code === "23505") toast.info("You're already subscribed!");
      else toast.error("Failed to subscribe. Try again.");
    } else {
      toast.success("Successfully subscribed!");
      setEmail("");
    }
  };

  return (
    <>
      <SeoHead
        title="Find the Best Software for Your Business"
        description="Read honest reviews, compare features, and discover the right tools. Trusted by thousands of professionals."
        keywords="software reviews, SaaS comparison, business tools, product reviews"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "SoftwareHub",
          description: "Find the best software for your business",
          potentialAction: { "@type": "SearchAction", target: "{search_term_string}", "query-input": "required name=search_term_string" },
        }}
      />

      {/* Hero Section */}
      <section className="gradient-hero py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.08),transparent_50%)]" />
        <div className="container relative text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-primary-foreground mb-4 leading-tight">
            Find the <span className="opacity-90">Perfect Software</span><br />for Your Business
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Read honest reviews from verified users. Compare features, pricing, and more.
          </p>
          <SearchBar variant="hero" className="max-w-2xl mx-auto mb-8" />
          <div className="flex items-center justify-center gap-6 text-primary-foreground/70 text-sm">
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> Free to use</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> Verified reviews</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> Unbiased ratings</span>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-border bg-card py-6">
        <div className="container flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {[
            { icon: Package, label: "Products", value: stats?.products || 0 },
            { icon: Star, label: "Reviews", value: stats?.reviews || 0 },
            { icon: BarChart3, label: "Categories", value: stats?.categories || 0 },
            { icon: Users, label: "Users", value: "10K+" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <s.icon className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Browse by Category */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Browse by Category</h2>
              <p className="text-muted-foreground mt-1">Explore software across all categories</p>
            </div>
            <Link to="/category/all">
              <Button variant="ghost" className="gap-1">View All <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories?.map((cat) => (
              <CategoryCard key={cat.id} slug={cat.slug} name={cat.name} icon={cat.icon || ""} product_count={cat.product_count || 0} color={cat.color || "#4F46E5"} />
            ))}
            {(!categories || categories.length === 0) && (
              <div className="col-span-full text-center py-8 text-muted-foreground">No categories yet. Seed data to see them here.</div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-muted/40">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Featured Products</h2>
              <p className="text-muted-foreground mt-1">Hand-picked software recommended by our team</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingFeatured ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />) :
              featuredProducts?.map((p: any) => (
                <ProductCard
                  key={p.id} id={p.id} slug={p.slug} name={p.name} tagline={p.tagline}
                  logo_url={p.logo_url} avg_rating={Number(p.avg_rating)} total_reviews={p.total_reviews}
                  pricing_model={p.pricing_model} category_name={p.categories?.name}
                  is_featured={p.is_featured} is_sponsored={p.is_sponsored}
                />
              ))
            }
            {!loadingFeatured && (!featuredProducts || featuredProducts.length === 0) && (
              <div className="col-span-full text-center py-8 text-muted-foreground">No featured products yet.</div>
            )}
          </div>
        </div>
      </section>

      {/* Top Rated */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Top Rated Software</h2>
              <p className="text-muted-foreground mt-1">Highest rated products by our community</p>
            </div>
            <Link to="/category/all"><Button variant="ghost" className="gap-1">View All <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {loadingTop ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />) :
              topProducts?.map((p: any) => (
                <ProductCard
                  key={p.id} id={p.id} slug={p.slug} name={p.name} tagline={p.tagline}
                  logo_url={p.logo_url} avg_rating={Number(p.avg_rating)} total_reviews={p.total_reviews}
                  pricing_model={p.pricing_model} category_name={p.categories?.name}
                />
              ))
            }
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-muted/40">
        <div className="container">
          <h2 className="text-2xl font-bold text-foreground text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { step: "1", title: "Search", desc: "Find software that matches your needs by browsing categories or searching." },
              { step: "2", title: "Compare", desc: "Read reviews, compare features, and see side-by-side pricing breakdowns." },
              { step: "3", title: "Decide", desc: "Make confident decisions backed by real user experiences and ratings." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="h-12 w-12 rounded-full gradient-hero flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold text-primary-foreground">{s.step}</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16">
        <div className="container max-w-xl text-center">
          <TrendingUp className="h-8 w-8 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Stay Updated</h2>
          <p className="text-muted-foreground mb-6">Get the latest software reviews and industry insights delivered to your inbox.</p>
          <form onSubmit={handleNewsletter} className="flex gap-2 max-w-md mx-auto">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Enter your email" className="flex-1" required />
            <Button type="submit">Subscribe</Button>
          </form>
        </div>
      </section>
    </>
  );
}
