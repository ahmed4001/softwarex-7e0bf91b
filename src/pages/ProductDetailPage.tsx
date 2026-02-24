import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SeoHead } from "@/components/SeoHead";
import { StarRating } from "@/components/StarRating";
import { ReviewCard } from "@/components/ReviewCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, CheckCircle, Globe, Calendar, Users, Building2 } from "lucide-react";

export default function ProductDetailPage() {
  const { slug } = useParams();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*, categories(name, slug)").eq("slug", slug!).single();
      return data;
    },
    enabled: !!slug,
  });

  const { data: reviews } = useQuery({
    queryKey: ["reviews", product?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*, profiles(name, avatar_url)")
        .eq("product_id", product!.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!product?.id,
  });

  if (isLoading) return <div className="container py-16 text-center text-muted-foreground">Loading...</div>;
  if (!product) return <div className="container py-16 text-center text-muted-foreground">Product not found.</div>;

  const features = Array.isArray(product.features) ? product.features : [];
  const screenshots = Array.isArray(product.screenshots) ? product.screenshots : [];

  return (
    <>
      <SeoHead
        title={product.seo_title || product.name}
        description={product.seo_description || product.tagline || ""}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.tagline,
          aggregateRating: { "@type": "AggregateRating", ratingValue: product.avg_rating, reviewCount: product.total_reviews },
        }}
      />

      <div className="container py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          {product.categories && <><Link to={`/category/${(product.categories as any).slug}`} className="hover:text-foreground">{(product.categories as any).name}</Link><span>/</span></>}
          <span className="text-foreground">{product.name}</span>
        </div>

        {/* Header */}
        <div className="product-card mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              {product.logo_url ? <img src={product.logo_url} alt={product.name} className="h-full w-full object-cover" /> : <span className="text-3xl font-bold text-primary">{product.name.charAt(0)}</span>}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
                {product.is_verified && <Badge className="bg-success/10 text-success border-0 gap-1"><CheckCircle className="h-3 w-3" />Verified</Badge>}
                {product.is_sponsored && <Badge variant="secondary">Sponsored</Badge>}
              </div>
              {product.tagline && <p className="text-muted-foreground mb-3">{product.tagline}</p>}
              <div className="flex items-center gap-4 mb-4">
                <StarRating rating={Number(product.avg_rating)} size="md" showValue />
                <span className="text-sm text-muted-foreground">({product.total_reviews} reviews)</span>
                {product.pricing_model && <Badge variant="outline" className="capitalize">{product.pricing_model}</Badge>}
                {product.starting_price && <span className="text-sm font-semibold text-foreground">From ${product.starting_price}/mo</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {product.website_url && (
                  <a href={product.website_url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="gap-1"><Globe className="h-3.5 w-3.5" />Visit Website</Button>
                  </a>
                )}
                <Link to={`/product/${slug}/write-review`}><Button size="sm" variant="outline">Write a Review</Button></Link>
                <Link to={`/compare?products=${product.id}`}><Button size="sm" variant="ghost">Compare</Button></Link>
              </div>
            </div>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground flex-shrink-0">
              {product.headquarters && <div className="flex items-center gap-2"><Building2 className="h-4 w-4" />{product.headquarters}</div>}
              {product.founded_year && <div className="flex items-center gap-2"><Calendar className="h-4 w-4" />Founded {product.founded_year}</div>}
              {product.company_size && <div className="flex items-center gap-2"><Users className="h-4 w-4" />{product.company_size}</div>}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({product.total_reviews})</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="alternatives">Alternatives</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {product.description && (
              <div className="product-card">
                <h2 className="text-lg font-semibold mb-3">About {product.name}</h2>
                <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>
              </div>
            )}
            {features.length > 0 && (
              <div className="product-card">
                <h2 className="text-lg font-semibold mb-3">Features</h2>
                <div className="flex flex-wrap gap-2">
                  {features.map((f: string, i: number) => (
                    <Badge key={i} variant="outline">{f}</Badge>
                  ))}
                </div>
              </div>
            )}
            {product.pros_summary && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="product-card">
                  <h3 className="font-semibold text-success mb-2">Pros</h3>
                  <p className="text-sm text-muted-foreground">{product.pros_summary}</p>
                </div>
                <div className="product-card">
                  <h3 className="font-semibold text-destructive mb-2">Cons</h3>
                  <p className="text-sm text-muted-foreground">{product.cons_summary}</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            {reviews?.map((r: any) => (
              <ReviewCard
                key={r.id}
                title={r.title} body={r.body} pros={r.pros} cons={r.cons}
                overall_rating={r.overall_rating}
                reviewer_name={r.profiles?.name}
                reviewer_role={r.reviewer_role}
                company_size={r.company_size}
                helpful_count={r.helpful_count}
                verified_reviewer={r.verified_reviewer}
                created_at={r.created_at}
              />
            ))}
            {(!reviews || reviews.length === 0) && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No reviews yet. Be the first to write one!</p>
                <Link to={`/product/${slug}/write-review`}><Button className="mt-4">Write a Review</Button></Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pricing">
            <div className="product-card">
              <h2 className="text-lg font-semibold mb-3">Pricing</h2>
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="outline" className="capitalize">{product.pricing_model}</Badge>
                {product.starting_price && <span className="text-2xl font-bold text-foreground">${product.starting_price}<span className="text-sm font-normal text-muted-foreground">/mo</span></span>}
              </div>
              {product.pricing_description && <p className="text-muted-foreground">{product.pricing_description}</p>}
            </div>
          </TabsContent>

          <TabsContent value="alternatives">
            <div className="text-center py-12 text-muted-foreground">
              <p>Alternative products will appear here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
