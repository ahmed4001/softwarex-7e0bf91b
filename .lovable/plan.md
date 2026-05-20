# Ghost-style Blog & CMS Upgrade Plan

You already have a substantial blog system. This plan **enhances** it rather than rebuilding. Work ships in 4 phases — confirm and I'll start Phase 1.

## What you already have (no rebuild needed)

- `blog_posts` table with SEO fields (title, description, keywords, og_image, canonical, reading_time, view_count)
- Public `/blog` (Ghost-style hero + list) and `/blog/:slug` (serif typography, Article JSON-LD, view counter)
- `/admin/blog` + `AdminBlogEditorPage` (rich editor, SEO tab, keyword analyzer)
- Sitemap/robots edge function (`seo-files`), `SeoHead` with global fallbacks
- Newsletter (Brevo), subscribers dashboard, broadcast composer
- User roles (admin/editor/author/user), media library bucket
- AI: `ai-playground`, sentiment, summary, recommendations via Lovable AI gateway

## Gap analysis vs. your spec

**Missing reader features**: Table of contents, related articles, social share buttons, breadcrumbs, sticky sidebar, comments, author profile pages, infinite scroll, tag pages, category pages (blog-specific).

**Missing CMS features**: Revision history, autosave, scheduled publishing UI, duplicate post, bulk actions, sticky posts, media folders, drag-drop upload, focus keyword density on save.

**Missing SEO dashboard**: Dedicated `/admin/seo` audit (missing meta, broken links, duplicate content, readability score), redirect manager, GSC integration UI, top-ranking posts.

**Missing AI assistant**: AI title/meta/outline/content generator inline in the editor (you have AI infra but not editor-integrated).

**Missing monetization**: Membership tiers, premium content lock, paid subscriptions (Paddle is wired but no membership UI).

## Phased delivery

### Phase 1 — Reader experience + public polish
- Auto-generated **Table of Contents** (parses H2/H3 from post body, sticky on desktop)
- **Related posts** (same category/tags, ranked by view_count)
- **Breadcrumbs** with BreadcrumbList JSON-LD
- **Social share buttons** (Twitter/X, LinkedIn, Facebook, copy-link)
- **Author profile pages** at `/author/:slug` (bio, avatar, social links, post list) — uses `profiles` table
- **Tag pages** `/blog/tag/:tag` and **category pages** `/blog/category/:category`
- **Reading progress bar** + scroll-to-top
- **Comments** (lightweight, uses `discussions` infra you already have, scoped to post)

### Phase 2 — Admin CMS polish
- **Autosave drafts** (debounced, every 10s) + "Saved Xs ago" indicator
- **Revision history** table + restore-from-revision UI
- **Scheduled publishing**: status=`scheduled` + `scheduled_at` + cron edge function `publish-scheduled-posts`
- **Duplicate post** action, **bulk actions** (publish/unpublish/delete/move-category)
- **Sticky/featured post** toggle, surfaced on `/blog`
- **Media library upgrades**: folders, drag-drop upload, search, alt-text editor
- **Focus keyword analysis** integrated into editor SEO tab (density, in title/H1/meta/slug/first paragraph)

### Phase 3 — Dedicated SEO dashboard
- New `/admin/seo` route with tabs:
  - **Audit**: posts missing meta, missing alt text, missing OG image, missing focus keyword, weak readability
  - **Redirects**: `redirects` table (from_path → to_path, status code), edge function applies them
  - **Broken links**: edge function scrapes published posts, flags 4xx links
  - **Top content**: posts sorted by view_count + CTR (uses existing `view_count`)
  - **GSC integration**: OAuth connector + impressions/clicks/position per URL (you have Google Search Console connector knowledge)
- **Sitemap**: extend `seo-files` to include `/author/*`, `/blog/tag/*`, `/blog/category/*`

### Phase 4 — AI assistant + monetization
- **AI editor toolbar**: generate title, meta description, excerpt, outline, "improve this paragraph", "expand", "summarize" — calls a new `ai-blog-assistant` edge function (Lovable AI gateway, `google/gemini-3-flash-preview`)
- **AI alt-text** for uploaded images
- **AI internal linking suggestions** based on existing post corpus
- **Memberships**: `membership_tiers` table, gated content (`premium_only` flag on posts), paywall component, Paddle checkout for subscriptions

## Database additions

```text
post_revisions (post_id, body, title, editor_id, created_at)
redirects (from_path, to_path, status_code, hits)
post_comments (post_id, user_id, body, parent_id, status)
membership_tiers (name, price, paddle_product_id, perks)
user_memberships (user_id, tier_id, status, expires_at)
blog_posts: add scheduled_at, is_sticky, premium_only, autosave_body, last_autosave_at
profiles: add bio_long, twitter_handle, linkedin_url, website (some exist)
```

All with RLS: public read for published content; admin/editor write; comments user-scoped.

## Out of scope (not building unless you ask)

- AMP support (Google deprecated it)
- PWA + web push (separate effort)
- Two-factor auth (Supabase doesn't ship MFA UI; needs custom flow)
- Multi-language **content** translation (UI i18n already exists; post translation is a big separate feature)
- Mailchimp/ConvertKit (Brevo is already wired — switching providers is its own task)
- Full GA4 integration (your `view_count` + Supabase analytics cover most needs)

## Recommendation

Start with **Phase 1** — biggest visible upgrade for readers, no risky migrations, ships in one round. Then we evaluate before Phase 2.

Approve this plan to start, or tell me to reorder/cut/expand any phase.