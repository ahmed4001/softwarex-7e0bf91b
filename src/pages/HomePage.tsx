import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SeoHead } from "@/components/SeoHead";
import { SearchBar } from "@/components/SearchBar";
import { ProductCard } from "@/components/ProductCard";
import { CategoryCard } from "@/components/CategoryCard";
import { ProductCardSkeleton } from "@/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, CheckCircle, BarChart3, Users, Star, Package, TrendingUp, Sparkles, Zap, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Hero3DScene } from "@/components/Hero3DScene";
import { motion } from "framer-motion";

function AnimatedCounter({ value, suffix = "" }: { value: number | string; suffix?: string }) {
  return <span className="tabular-nums">{value}{suffix}</span>;
}

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
      return { products: products.count || 0, reviews: reviews.count || 0, categories: categories.count || 0 };
    },
  });

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: email.trim() });
    if (error) {
      if (error.code === "23505") toast.info("You're already subscribed!");
      else toast.error("Failed to subscribe.");
    } else { toast.success("Welcome aboard!"); setEmail(""); }
  };

  return (
    <>
      <SeoHead
        title="Find the Best Software for Your Business"
        description="Read honest reviews, compare features, and discover the right tools. Trusted by thousands."
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "SoftwareHub",
          description: "Find the best software for your business",
        }}
      />

      {/* Hero Section - 3D */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 noise-overlay" />
        
        {/* 3D Scene */}
        <Hero3DScene />
        
        {/* Content */}
        <div className="container relative z-10 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 backdrop-blur-sm text-primary-foreground/90 text-sm font-medium mb-8"
            >
              <Sparkles className="h-4 w-4" />
              Trusted by 10,000+ professionals
            </motion.div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-black text-primary-foreground leading-[0.95] mb-6 tracking-tight">
              Find the
              <br />
              <span className="opacity-80">Perfect Software</span>
            </h1>

            <p className="text-lg md:text-xl text-primary-foreground/70 mb-10 max-w-2xl mx-auto leading-relaxed">
              Real reviews from verified users. Compare features, pricing, and more — all in one place.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <SearchBar variant="hero" className="max-w-2xl mx-auto mb-10" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-6 md:gap-8 text-primary-foreground/60 text-sm"
            >
              {[
                { icon: CheckCircle, text: "Free to use" },
                { icon: Shield, text: "Verified reviews" },
                { icon: Zap, text: "Instant comparisons" },
              ].map(({ icon: Icon, text }) => (
                <span key={text} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" /> {text}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Stats Bar */}
      <section className="relative -mt-16 z-10">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8 max-w-4xl mx-auto"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { icon: Package, label: "Products Listed", value: stats?.products || 0, color: "text-primary" },
                { icon: Star, label: "Reviews Written", value: stats?.reviews || 0, color: "text-star" },
                { icon: BarChart3, label: "Categories", value: stats?.categories || 0, color: "text-secondary" },
                { icon: Users, label: "Active Users", value: "10K+", color: "text-success" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="text-center">
                  <Icon className={`h-6 w-6 mx-auto mb-2 ${color}`} />
                  <p className="text-3xl font-display font-bold text-foreground mb-0.5">
                    <AnimatedCounter value={value} />
                  </p>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Browse by Category */}
      <section className="py-24 relative">
        <div className="absolute inset-0 mesh-gradient" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4"
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2 block">Explore</span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">Browse by Category</h2>
              <p className="text-muted-foreground mt-2">Discover software across every industry</p>
            </div>
            <Link to="/category/all">
              <Button variant="ghost" className="gap-1.5 font-medium group">
                View All <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories?.map((cat, i) => (
              <CategoryCard key={cat.id} slug={cat.slug} name={cat.name} icon={cat.icon || ""} product_count={cat.product_count || 0} color={cat.color || "#6366f1"} index={i} />
            ))}
            {(!categories || categories.length === 0) && (
              <div className="col-span-full text-center py-12 text-muted-foreground">No categories yet.</div>
            )}
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="section-gradient-divider" />

      {/* Featured Products */}
      <section className="py-24 animated-gradient-bg">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4"
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Featured
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">Hand-Picked Software</h2>
              <p className="text-muted-foreground mt-2">Curated by our team of experts</p>
            </div>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
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
              <div className="col-span-full text-center py-12 text-muted-foreground">No featured products yet.</div>
            )}
          </div>
        </div>
      </section>

      <div className="section-gradient-divider" />

      {/* Top Rated */}
      <section className="py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4"
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-star mb-2 flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 fill-star" /> Top Rated
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">Highest Rated Software</h2>
              <p className="text-muted-foreground mt-2">Loved by our community of reviewers</p>
            </div>
            <Link to="/category/all"><Button variant="ghost" className="gap-1.5 font-medium group">View All <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></Button></Link>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
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

      <div className="section-gradient-divider" />

      {/* How It Works */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-50" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2 block">Simple Process</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">How It Works</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Search & Discover", desc: "Find software by category, features, or search. Filter by pricing, rating, and more.", icon: "🔍" },
              { step: "02", title: "Compare & Read", desc: "Side-by-side comparisons with real reviews from verified users who've actually used the products.", icon: "⚡" },
              { step: "03", title: "Decide & Act", desc: "Make confident decisions backed by data. Visit the vendor directly or save for later.", icon: "🚀" },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass-card p-8 text-center relative group"
              >
                <div className="text-4xl mb-4">{s.icon}</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-3">Step {s.step}</div>
                <h3 className="font-display font-bold text-lg text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-gradient-divider" />

      {/* Newsletter */}
      <section className="py-24 relative">
        <div className="container max-w-2xl text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="h-16 w-16 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
              <TrendingUp className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">Stay Ahead of the Curve</h2>
            <p className="text-muted-foreground mb-8 text-lg">Get the latest software reviews and industry insights delivered weekly.</p>
            <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@company.com"
                className="h-12 rounded-xl bg-card text-base flex-1"
                required
              />
              <Button type="submit" className="btn-premium h-12 px-8 rounded-xl text-primary-foreground font-semibold">Subscribe</Button>
            </form>
            <p className="text-xs text-muted-foreground mt-4">No spam. Unsubscribe anytime.</p>
          </motion.div>
        </div>
      </section>
    </>
  );
}
