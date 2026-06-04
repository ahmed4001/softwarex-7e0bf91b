import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tag, Flame, Clock, Search, Mail, ExternalLink, Copy, Check, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

type Deal = {
  id: string;
  product_name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  deal_url: string;
  discount_amount: string | null;
  discount_type: string | null;
  coupon_code: string | null;
  category: string | null;
  start_date: string | null;
  end_date: string | null;
  is_featured: boolean;
  is_trending: boolean;
};

function useCountdown(endDate: string | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!endDate) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [endDate]);
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - now;
  if (diff <= 0) return "Expired";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${d}d ${h}h ${m}m ${s}s`;
}

function DealCard({ deal, featured }: { deal: Deal; featured?: boolean }) {
  const countdown = useCountdown(deal.end_date);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (!deal.coupon_code) return;
    navigator.clipboard.writeText(deal.coupon_code);
    setCopied(true);
    toast.success("Coupon copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className={`group h-full overflow-hidden border-border/60 hover:border-primary/40 hover:shadow-xl transition-all ${featured ? "ring-1 ring-primary/30 bg-gradient-to-br from-card to-primary/5" : ""}`}>
        <CardContent className="p-5 flex flex-col h-full">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              {deal.logo_url ? (
                <img src={deal.logo_url} alt={deal.product_name} className="h-12 w-12 rounded-lg object-contain bg-muted p-1" />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {deal.product_name[0]}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-semibold text-base truncate">{deal.product_name}</h3>
                {deal.category && <p className="text-xs text-muted-foreground truncate">{deal.category}</p>}
              </div>
            </div>
            {deal.discount_amount && (
              <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold whitespace-nowrap">
                {deal.discount_type === "amount" ? "$" : ""}{deal.discount_amount}{deal.discount_type === "percent" ? "% OFF" : deal.discount_type === "amount" ? " OFF" : ""}
              </Badge>
            )}
          </div>

          {deal.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">{deal.description}</p>
          )}

          {deal.coupon_code && (
            <button onClick={copy} className="w-full flex items-center justify-between gap-2 border border-dashed border-primary/50 rounded-lg px-3 py-2 mb-3 bg-primary/5 hover:bg-primary/10 transition">
              <span className="font-mono font-semibold text-sm tracking-wider">{deal.coupon_code}</span>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
            </button>
          )}

          {countdown && (
            <div className={`flex items-center gap-1.5 text-xs mb-3 ${countdown === "Expired" ? "text-destructive" : "text-amber-600 dark:text-amber-400"}`}>
              <Clock className="h-3.5 w-3.5" />
              <span className="font-medium">{countdown === "Expired" ? "Expired" : `Ends in ${countdown}`}</span>
            </div>
          )}

          <Button asChild className="w-full mt-auto">
            <a href={deal.deal_url} target="_blank" rel="noopener noreferrer sponsored">
              Get Deal <ExternalLink className="h-3.5 w-3.5 ml-1" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function DealsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [email, setEmail] = useState("");

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["deals-public"],
    queryFn: async () => {
      const { data } = await supabase
        .from("deals" as any)
        .select("*")
        .eq("is_visible", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as Deal[];
    },
  });

  const categories = useMemo(() => {
    const s = new Set<string>();
    deals.forEach((d) => d.category && s.add(d.category));
    return Array.from(s);
  }, [deals]);

  const filtered = useMemo(() => {
    return deals.filter((d) => {
      if (category !== "all" && d.category !== category) return false;
      if (search && !d.product_name.toLowerCase().includes(search.toLowerCase()) && !d.description?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [deals, search, category]);

  const featured = filtered.filter((d) => d.is_featured).slice(0, 6);
  const trending = filtered.filter((d) => d.is_trending).slice(0, 8);
  const endingSoon = [...filtered]
    .filter((d) => d.end_date && new Date(d.end_date).getTime() > Date.now())
    .sort((a, b) => new Date(a.end_date!).getTime() - new Date(b.end_date!).getTime())
    .slice(0, 8);
  const latest = filtered.slice(0, 12);

  const byCategory = useMemo(() => {
    const m: Record<string, Deal[]> = {};
    filtered.forEach((d) => {
      const c = d.category || "Other";
      if (!m[c]) m[c] = [];
      m[c].push(d);
    });
    return m;
  }, [filtered]);

  const subscribe = useMutation({
    mutationFn: async (e: string) => {
      const { error } = await supabase.from("deal_alert_subscribers" as any).insert({ email: e });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Subscribed! You'll get deal alerts soon.");
      setEmail("");
    },
    onError: (e: any) => toast.error(e?.message?.includes("duplicate") ? "Already subscribed" : "Failed to subscribe"),
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: filtered.slice(0, 20).map((d, i) => ({
      "@type": "Offer",
      position: i + 1,
      name: `${d.product_name} Deal`,
      description: d.description,
      url: d.deal_url,
      priceCurrency: "USD",
      ...(d.end_date && { validThrough: d.end_date }),
    })),
  };

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Software Deals & Coupons | ReviewHunts</title>
        <meta name="description" content="Discover exclusive software deals, discount codes, and lifetime offers on the best SaaS tools. Updated daily." />
        <link rel="canonical" href="/deals" />
        <meta property="og:title" content="Software Deals & Coupons" />
        <meta property="og:description" content="Exclusive SaaS deals, coupons, and lifetime offers." />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container py-12 md:py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-primary/15 text-primary border-primary/20" variant="outline">
              <Tag className="h-3 w-3 mr-1" /> Exclusive Deals
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Save big on the best software
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Handpicked coupons, lifetime deals, and discounts on top SaaS tools — updated daily.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search deals..." className="pl-10 h-11" />
              </div>
            </div>

            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                <button onClick={() => setCategory("all")} className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${category === "all" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}>All</button>
                {categories.map((c) => (
                  <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${category === c ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}>{c}</button>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <div className="container py-10 space-y-14">
        {isLoading && <p className="text-center text-muted-foreground">Loading deals...</p>}

        {!isLoading && filtered.length === 0 && (
          <Card><CardContent className="py-16 text-center">
            <Tag className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No deals found. Check back soon!</p>
          </CardContent></Card>
        )}

        {featured.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <Flame className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Featured Deals</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featured.map((d) => <DealCard key={d.id} deal={d} featured />)}
            </div>
          </section>
        )}

        {trending.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Trending Now</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {trending.map((d) => <DealCard key={d.id} deal={d} />)}
            </div>
          </section>
        )}

        {endingSoon.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <Clock className="h-5 w-5 text-amber-500" />
              <h2 className="text-2xl font-bold">Ending Soon</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {endingSoon.map((d) => <DealCard key={d.id} deal={d} />)}
            </div>
          </section>
        )}

        {latest.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-5">Latest Deals</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {latest.map((d) => <DealCard key={d.id} deal={d} />)}
            </div>
          </section>
        )}

        {Object.keys(byCategory).length > 1 && (
          <section className="space-y-10">
            <h2 className="text-2xl font-bold">Browse by Category</h2>
            {Object.entries(byCategory).map(([cat, ds]) => (
              <div key={cat}>
                <h3 className="text-lg font-semibold mb-4 text-muted-foreground">{cat}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {ds.slice(0, 8).map((d) => <DealCard key={d.id} deal={d} />)}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Email signup */}
        <section>
          <Card className="bg-gradient-to-br from-primary/10 via-card to-card border-primary/20">
            <CardContent className="p-8 md:p-12 text-center">
              <Mail className="h-10 w-10 mx-auto text-primary mb-4" />
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Get exclusive deal alerts</h2>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                Be the first to know about new software deals, lifetime offers, and limited-time coupons.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); if (email) subscribe.mutate(email); }} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="h-11" />
                <Button type="submit" disabled={subscribe.isPending} className="h-11">
                  {subscribe.isPending ? "..." : "Subscribe"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
