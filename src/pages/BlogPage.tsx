import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SeoHead } from "@/components/SeoHead";
import { Link } from "react-router-dom";
import { CalendarDays, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function BlogPage() {
  const { t } = useTranslation();
  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      return data || [];
    },
  });

  return (
    <>
      <SeoHead title={t("blog.title")} description={t("blog.subtitle")} />
      <div className="container py-12">
        <h1 className="text-3xl font-bold text-foreground mb-2">{t("blog.title")}</h1>
        <p className="text-muted-foreground mb-8">{t("blog.subtitle")}</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts?.map((post) => (
            <Link key={post.id} to={`/blog/${post.slug}`} className="product-card group block">
              {post.featured_image && (
                <div className="aspect-video rounded-lg bg-muted mb-4 overflow-hidden">
                  <img src={post.featured_image} alt={post.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              )}
              {post.category && <span className="text-xs font-semibold text-primary uppercase">{post.category}</span>}
              <h2 className="text-lg font-semibold text-foreground mt-1 mb-2 group-hover:text-primary transition-colors">{post.title}</h2>
              {post.excerpt && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{post.published_at ? new Date(post.published_at).toLocaleDateString() : t("blog.draft")}</span>
                {post.reading_time && <span>{t("blog.minRead", { count: post.reading_time })}</span>}
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.view_count}</span>
              </div>
            </Link>
          ))}
        </div>

        {!isLoading && (!posts || posts.length === 0) && (
          <div className="text-center py-16 text-muted-foreground">{t("blog.noPosts")}</div>
        )}
      </div>
    </>
  );
}
