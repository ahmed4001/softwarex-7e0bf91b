import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SeoHead } from "@/components/SeoHead";
import { CalendarDays, ArrowLeft } from "lucide-react";

export default function BlogPostPage() {
  const { slug } = useParams();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data } = await supabase.from("blog_posts").select("*").eq("slug", slug!).eq("status", "published").single();
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) return <div className="container py-16 text-center text-muted-foreground">Loading...</div>;
  if (!post) return <div className="container py-16 text-center text-muted-foreground">Post not found.</div>;

  return (
    <>
      <SeoHead title={post.seo_title || post.title} description={post.seo_description || post.excerpt || ""} />
      <article className="container py-12 max-w-3xl">
        <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Blog
        </Link>

        {post.category && <span className="text-xs font-semibold text-primary uppercase">{post.category}</span>}
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4">{post.title}</h1>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b border-border">
          <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" />{post.published_at ? new Date(post.published_at).toLocaleDateString() : ""}</span>
          {post.reading_time && <span>{post.reading_time} min read</span>}
        </div>

        {post.featured_image && (
          <img src={post.featured_image} alt={post.title} className="w-full rounded-xl mb-8" />
        )}

        <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: post.body || "" }} />
      </article>
    </>
  );
}
