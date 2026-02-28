-- =============================================
-- COMPLETE DATABASE SCHEMA FOR SUPABASE MIGRATION
-- Generated from Lovable Cloud PostgreSQL
-- 81 tables, all functions, triggers, indexes
-- Target: External Supabase project (supabase.com)
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- CUSTOM ENUM TYPES
-- =============================================
CREATE TYPE public.ad_placement AS ENUM ('homepage', 'category', 'product', 'blog');
CREATE TYPE public.ad_type AS ENUM ('banner', 'sidebar', 'featured_slot');
CREATE TYPE public.app_role AS ENUM ('user', 'vendor', 'admin', 'superadmin');
CREATE TYPE public.blog_status AS ENUM ('draft', 'scheduled', 'published', 'archived');
CREATE TYPE public.pricing_model AS ENUM ('free', 'freemium', 'paid', 'subscription', 'one-time');
CREATE TYPE public.review_source AS ENUM ('organic', 'invited', 'imported');
CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected', 'spam', 'flagged');
CREATE TYPE public.sponsor_tier AS ENUM ('bronze', 'silver', 'gold');
CREATE TYPE public.submission_status AS ENUM ('pending', 'approved', 'rejected');

-- =============================================
-- TABLES (ordered by dependency)
-- =============================================

-- 1. Categories
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#4F46E5',
  banner_image TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  product_count INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Products
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  demo_url TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  pricing_model public.pricing_model DEFAULT 'free',
  starting_price NUMERIC,
  pricing_tiers JSONB DEFAULT '[]'::jsonb,
  pricing_description TEXT,
  founded_year INTEGER,
  company_size TEXT,
  headquarters TEXT,
  employee_count INTEGER,
  avg_rating NUMERIC DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_users INTEGER DEFAULT 0,
  monthly_visitors INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  integrations JSONB DEFAULT '[]'::jsonb,
  screenshots JSONB DEFAULT '[]'::jsonb,
  pros_summary TEXT,
  cons_summary TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_sponsored BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_claimed BOOLEAN DEFAULT FALSE,
  sponsor_start_date DATE,
  sponsor_end_date DATE,
  sponsor_tier public.sponsor_tier,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  canonical_url TEXT,
  meta_og_image TEXT,
  schema_org JSONB,
  view_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  comparison_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ,
  info_score INTEGER NOT NULL DEFAULT 0,
  affiliate_url TEXT
);

-- 3. Reviews
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  overall_rating INTEGER NOT NULL,
  ease_of_use INTEGER,
  customer_support INTEGER,
  value_for_money INTEGER,
  features_rating INTEGER,
  title TEXT,
  pros TEXT,
  cons TEXT,
  body TEXT,
  reviewer_role TEXT,
  company_size TEXT,
  industry TEXT,
  usage_duration TEXT,
  use_case TEXT,
  recommendation_likelihood INTEGER,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  verified_purchase BOOLEAN DEFAULT FALSE,
  verified_reviewer BOOLEAN DEFAULT FALSE,
  status public.review_status DEFAULT 'pending',
  rejection_reason TEXT,
  moderation_note TEXT,
  moderated_by UUID REFERENCES auth.users(id),
  moderated_at TIMESTAMPTZ,
  is_featured_review BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  source public.review_source DEFAULT 'organic',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  pros_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  cons_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  verification_method TEXT,
  is_verified_purchase BOOLEAN DEFAULT FALSE
);

-- 4. Comparisons
CREATE TABLE public.comparisons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  title TEXT,
  slug TEXT UNIQUE,
  summary TEXT,
  winner_verdict TEXT,
  winner_product_id UUID REFERENCES public.products(id),
  category_id UUID REFERENCES public.categories(id),
  product_a_score NUMERIC DEFAULT 0,
  product_b_score NUMERIC DEFAULT 0,
  feature_scores JSONB DEFAULT '[]'::jsonb,
  pros_a JSONB DEFAULT '[]'::jsonb,
  cons_a JSONB DEFAULT '[]'::jsonb,
  pros_b JSONB DEFAULT '[]'::jsonb,
  cons_b JSONB DEFAULT '[]'::jsonb,
  best_for_a TEXT,
  best_for_b TEXT,
  seo_title TEXT,
  seo_description TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Alternatives
CREATE TABLE public.alternatives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  alternative_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  similarity_score NUMERIC DEFAULT 0
);

-- 6. Alternative Pages
CREATE TABLE public.alternative_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  meta_description TEXT,
  intro_text TEXT,
  faq_schema JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Advertisements
CREATE TABLE public.advertisements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type public.ad_type NOT NULL,
  placement public.ad_placement NOT NULL,
  image_url TEXT,
  target_url TEXT,
  alt_text TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Activity Logs
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Price Alerts
CREATE TABLE public.price_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  alert_type TEXT DEFAULT 'price_change',
  threshold_value NUMERIC,
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id, alert_type)
);

-- 10. Alert History
CREATE TABLE public.alert_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID NOT NULL REFERENCES public.price_alerts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  old_value NUMERIC,
  new_value NUMERIC,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Award Categories
CREATE TABLE public.award_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  year INTEGER DEFAULT 2026,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Award Nominations
CREATE TABLE public.award_nominations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  award_category_id UUID NOT NULL REFERENCES public.award_categories(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  nominated_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(award_category_id, product_id)
);

-- 13. Award Votes
CREATE TABLE public.award_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  award_category_id UUID NOT NULL REFERENCES public.award_categories(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(award_category_id, user_id)
);

-- 14. Badges
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT 'award',
  color TEXT DEFAULT '#4F46E5',
  tier TEXT DEFAULT 'bronze',
  criteria_type TEXT NOT NULL,
  criteria_threshold INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. Blog Posts
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  body TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  featured_image TEXT,
  reading_time INTEGER DEFAULT 0,
  status public.blog_status DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  og_image TEXT,
  canonical_url TEXT,
  view_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 16. Brevo Accounts
CREATE TABLE public.brevo_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  api_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  daily_credit_limit INTEGER DEFAULT 300,
  credits_used_today INTEGER DEFAULT 0,
  credits_reset_at TIMESTAMPTZ DEFAULT now(),
  total_emails_sent INTEGER DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 17. Brevo Campaigns
CREATE TABLE public.brevo_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brevo_account_id UUID NOT NULL REFERENCES public.brevo_accounts(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_name TEXT DEFAULT 'SoftwareHub',
  html_content TEXT,
  brevo_campaign_id TEXT,
  status TEXT DEFAULT 'draft',
  recipients_count INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 18. Buyer Guides
CREATE TABLE public.buyer_guides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  steps JSONB DEFAULT '[]'::jsonb,
  result_product_ids JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 19. Buyer Guide Completions
CREATE TABLE public.buyer_guide_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guide_id UUID NOT NULL REFERENCES public.buyer_guides(id) ON DELETE CASCADE,
  user_id UUID,
  answers JSONB DEFAULT '[]'::jsonb,
  recommended_product_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 20. Category Trend Reports
CREATE TABLE public.category_trend_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  period TEXT DEFAULT 'monthly',
  report_date DATE DEFAULT CURRENT_DATE,
  summary TEXT,
  rising_products JSONB DEFAULT '[]'::jsonb,
  falling_products JSONB DEFAULT '[]'::jsonb,
  stats JSONB DEFAULT '{}'::jsonb,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 21. Changelog Subscriptions
CREATE TABLE public.changelog_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 22. Competitive Battlecards
CREATE TABLE public.competitive_battlecards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  competitor_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  vendor_user_id UUID NOT NULL,
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  talking_points JSONB DEFAULT '[]'::jsonb,
  objection_handling JSONB DEFAULT '[]'::jsonb,
  win_rate NUMERIC DEFAULT 0,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 23. Digest Logs
CREATE TABLE public.digest_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT DEFAULT 'sent',
  recipient_count INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- 24. Discussions
CREATE TABLE public.discussions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  upvote_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 25. Discussion Replies
CREATE TABLE public.discussion_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discussion_id UUID NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  body TEXT NOT NULL,
  parent_id UUID REFERENCES public.discussion_replies(id) ON DELETE CASCADE,
  is_vendor_answer BOOLEAN DEFAULT FALSE,
  upvote_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 26. Discussion Votes
CREATE TABLE public.discussion_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  discussion_id UUID REFERENCES public.discussions(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES public.discussion_replies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, discussion_id),
  UNIQUE(user_id, reply_id)
);

-- 27. Email Templates
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  blocks JSONB DEFAULT '[]'::jsonb,
  thumbnail_html TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 28. Glossary Terms
CREATE TABLE public.glossary_terms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  term TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  definition TEXT NOT NULL,
  extended_description TEXT,
  category TEXT,
  related_terms JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 29. Lists
CREATE TABLE public.lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_image TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  product_count INTEGER DEFAULT 0,
  upvote_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 30. List Items
CREATE TABLE public.list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  note TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(list_id, product_id)
);

-- 31. List Votes
CREATE TABLE public.list_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(list_id, user_id)
);

-- 32. Media Library
CREATE TABLE public.media_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  original_name TEXT,
  mime_type TEXT,
  file_type TEXT,
  file_size INTEGER,
  alt_text TEXT,
  caption TEXT,
  folder TEXT DEFAULT 'general',
  thumbnail_url TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 33. Moderation Queue
CREATE TABLE public.moderation_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  reason TEXT DEFAULT 'flagged',
  status TEXT DEFAULT 'pending',
  reported_by UUID,
  moderator_id UUID,
  moderator_note TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 34. Newsletter Subscribers
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 35. Notification Preferences
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  review_replies BOOLEAN DEFAULT TRUE,
  badge_earned BOOLEAN DEFAULT TRUE,
  new_followers BOOLEAN DEFAULT TRUE,
  product_updates BOOLEAN DEFAULT FALSE,
  weekly_digest BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 36. Notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 37. Pages
CREATE TABLE public.pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body TEXT,
  template TEXT DEFAULT 'default',
  is_active BOOLEAN DEFAULT TRUE,
  show_in_nav BOOLEAN DEFAULT FALSE,
  show_in_footer BOOLEAN DEFAULT FALSE,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  canonical_url TEXT,
  og_image TEXT,
  robots TEXT DEFAULT 'index, follow',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 38. Point Transactions
CREATE TABLE public.point_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  entity_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 39. Pricing Features
CREATE TABLE public.pricing_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 40. Product Pricing Tiers
CREATE TABLE public.product_pricing_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC,
  billing_period TEXT DEFAULT 'monthly',
  is_popular BOOLEAN DEFAULT FALSE,
  cta_text TEXT DEFAULT 'Get Started',
  cta_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 41. Pricing Tier Features
CREATE TABLE public.pricing_tier_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_id UUID NOT NULL REFERENCES public.product_pricing_tiers(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES public.pricing_features(id) ON DELETE CASCADE,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tier_id, feature_id)
);

-- 42. Product Changelogs
CREATE TABLE public.product_changelogs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  version TEXT,
  change_type TEXT DEFAULT 'update',
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 43. Profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  job_title TEXT,
  company TEXT,
  industry TEXT,
  company_size TEXT,
  is_verified_reviewer BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  review_count INTEGER DEFAULT 0,
  helpful_votes_received INTEGER DEFAULT 0,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  preferred_language TEXT DEFAULT 'en',
  linkedin_verified BOOLEAN DEFAULT FALSE,
  total_points INTEGER NOT NULL DEFAULT 0,
  display_title TEXT,
  referral_code TEXT,
  referred_by UUID,
  verification_type TEXT,
  verified_domain TEXT,
  verified_at TIMESTAMPTZ
);

-- 44. Affiliate Clicks
CREATE TABLE public.affiliate_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID,
  referrer_url TEXT,
  destination_url TEXT NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 45. Partner Applications
CREATE TABLE public.partner_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  website_name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 46. Partner Links
CREATE TABLE public.partner_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 47. Product Claims
CREATE TABLE public.product_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  evidence TEXT,
  admin_note TEXT,
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE(product_id, user_id)
);

-- 48. Product Integrations
CREATE TABLE public.product_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  integrates_with_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  description TEXT,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, integrates_with_product_id)
);

-- 49. Product Watches
CREATE TABLE public.product_watches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  watch_type TEXT NOT NULL DEFAULT 'product',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 50. Referral Links
CREATE TABLE public.referral_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 51. Referral Events
CREATE TABLE public.referral_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_link_id UUID NOT NULL REFERENCES public.referral_links(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  ip_hash TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 52. Referral Payouts
CREATE TABLE public.referral_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  referral_count INTEGER NOT NULL DEFAULT 0,
  admin_note TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 53. Referrals
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_email TEXT,
  referred_user_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted_at TIMESTAMPTZ
);

-- 54. Review Comments
CREATE TABLE public.review_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES public.review_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 55. Review Digests
CREATE TABLE public.review_digests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
  overall_verdict TEXT,
  pros_summary TEXT,
  cons_summary TEXT,
  top_themes JSONB DEFAULT '[]'::jsonb,
  sentiment_pct JSONB DEFAULT '{"neutral": 0, "negative": 0, "positive": 0}'::jsonb,
  avg_sub_ratings JSONB DEFAULT '{}'::jsonb,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 56. Review Media
CREATE TABLE public.review_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 57. Review QA
CREATE TABLE public.review_qa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES public.review_qa(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_vendor_answer BOOLEAN NOT NULL DEFAULT FALSE,
  upvote_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 58. Review QA Votes
CREATE TABLE public.review_qa_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  qa_id UUID NOT NULL REFERENCES public.review_qa(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(qa_id, user_id)
);

-- 59. Review Reactions
CREATE TABLE public.review_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id, emoji)
);

-- 60. Review Votes
CREATE TABLE public.review_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- 61. Reviewer Verifications
CREATE TABLE public.reviewer_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  evidence TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, method)
);

-- 62. Saved Products
CREATE TABLE public.saved_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 63. SEO Landing Pages
CREATE TABLE public.seo_landing_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  meta_description TEXT,
  body TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  audience TEXT,
  product_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 64. Site Settings
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB,
  "group" TEXT,
  label TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 65. Sponsored Bids
CREATE TABLE public.sponsored_bids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  bid_amount NUMERIC NOT NULL DEFAULT 0,
  daily_budget NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  start_date DATE,
  end_date DATE,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 66. Tech Stacks
CREATE TABLE public.tech_stacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  upvote_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 67. Tech Stack Items
CREATE TABLE public.tech_stack_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stack_id UUID NOT NULL REFERENCES public.tech_stacks(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  role_description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 68. Tech Stack Votes
CREATE TABLE public.tech_stack_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stack_id UUID NOT NULL REFERENCES public.tech_stacks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, stack_id)
);

-- 69. UI Translations
CREATE TABLE public.ui_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lang_code TEXT NOT NULL UNIQUE,
  translations JSONB NOT NULL DEFAULT '{}'::jsonb,
  version TEXT NOT NULL DEFAULT '1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 70. User Achievements
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'trophy',
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

-- 71. User Badges
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- 72. User Follows
CREATE TABLE public.user_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- 73. User Recommendations
CREATE TABLE public.user_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL DEFAULT 0,
  reason TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 74. User Roles
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);

-- 75. Vendor Deals
CREATE TABLE public.vendor_deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  competitor_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  deal_name TEXT NOT NULL,
  outcome TEXT NOT NULL DEFAULT 'pending',
  deal_value NUMERIC,
  loss_reason TEXT,
  notes TEXT,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 76. Vendor Leads
CREATE TABLE public.vendor_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  vendor_user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  message TEXT,
  source TEXT NOT NULL DEFAULT 'product_page',
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  intent_score INTEGER DEFAULT 0,
  intent_signals JSONB DEFAULT '[]'::jsonb
);

-- 77. Vendor Responses
CREATE TABLE public.vendor_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL UNIQUE REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 78. Vendor Sponsored Requests
CREATE TABLE public.vendor_sponsored_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  tier TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  budget NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 79. Vendor Submissions
CREATE TABLE public.vendor_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_data JSONB NOT NULL,
  status public.submission_status DEFAULT 'pending',
  review_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 80. Vendor Subscriptions
CREATE TABLE public.vendor_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_info_score ON public.products(info_score DESC);
CREATE INDEX idx_reviews_product ON public.reviews(product_id);
CREATE INDEX idx_reviews_status ON public.reviews(status);
CREATE INDEX idx_reviews_user ON public.reviews(user_id);
CREATE INDEX idx_comparisons_slug ON public.comparisons(slug);
CREATE INDEX idx_comparisons_published ON public.comparisons(is_published);
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_glossary_slug ON public.glossary_terms(slug);
CREATE INDEX idx_discussions_product ON public.discussions(product_id);
CREATE INDEX idx_affiliate_clicks_product ON public.affiliate_clicks(product_id);
CREATE INDEX idx_review_comments_review ON public.review_comments(review_id);
CREATE INDEX idx_review_qa_product ON public.review_qa(product_id);
CREATE INDEX idx_saved_products_user ON public.saved_products(user_id);
CREATE INDEX idx_vendor_leads_product ON public.vendor_leads(product_id);
CREATE INDEX idx_tech_stacks_slug ON public.tech_stacks(slug);

-- =============================================
-- DATABASE FUNCTIONS
-- =============================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Product info score calculator
CREATE OR REPLACE FUNCTION public.update_product_info_score()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.info_score := 
    (CASE WHEN NEW.description IS NOT NULL AND NEW.description != '' THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.tagline IS NOT NULL AND NEW.tagline != '' THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.logo_url IS NOT NULL AND NEW.logo_url != '' THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.website_url IS NOT NULL AND NEW.website_url != '' THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.screenshots IS NOT NULL AND NEW.screenshots != '[]'::jsonb AND NEW.screenshots != 'null'::jsonb THEN 1 ELSE 0 END);
  RETURN NEW;
END; $$;

-- Product rating updater
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target_product_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN target_product_id := OLD.product_id;
  ELSE target_product_id := NEW.product_id; END IF;
  UPDATE products SET
    avg_rating = COALESCE((SELECT AVG(overall_rating)::numeric FROM reviews WHERE product_id = target_product_id AND status = 'approved'), 0),
    total_reviews = COALESCE((SELECT COUNT(*) FROM reviews WHERE product_id = target_product_id AND status = 'approved'), 0)
  WHERE id = target_product_id;
  IF TG_OP = 'UPDATE' AND OLD.product_id IS DISTINCT FROM NEW.product_id THEN
    UPDATE products SET
      avg_rating = COALESCE((SELECT AVG(overall_rating)::numeric FROM reviews WHERE product_id = OLD.product_id AND status = 'approved'), 0),
      total_reviews = COALESCE((SELECT COUNT(*) FROM reviews WHERE product_id = OLD.product_id AND status = 'approved'), 0)
    WHERE id = OLD.product_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;

-- Increment product click count
CREATE OR REPLACE FUNCTION public.increment_product_click()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE products SET click_count = COALESCE(click_count, 0) + 1 WHERE id = NEW.product_id;
  RETURN NEW;
END; $$;

-- List upvote count
CREATE OR REPLACE FUNCTION public.update_list_upvote_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE lists SET upvote_count = (SELECT COUNT(*) FROM list_votes WHERE list_id = OLD.list_id) WHERE id = OLD.list_id;
    RETURN OLD;
  ELSE
    UPDATE lists SET upvote_count = (SELECT COUNT(*) FROM list_votes WHERE list_id = NEW.list_id) WHERE id = NEW.list_id;
    RETURN NEW;
  END IF;
END; $$;

-- Discussion reply count
CREATE OR REPLACE FUNCTION public.update_discussion_reply_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE discussions SET reply_count = (SELECT COUNT(*) FROM discussion_replies WHERE discussion_id = OLD.discussion_id) WHERE id = OLD.discussion_id;
    RETURN OLD;
  ELSE
    UPDATE discussions SET reply_count = (SELECT COUNT(*) FROM discussion_replies WHERE discussion_id = NEW.discussion_id) WHERE id = NEW.discussion_id;
    RETURN NEW;
  END IF;
END; $$;

-- Discussion upvote count
CREATE OR REPLACE FUNCTION public.update_discussion_upvote_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target_discussion_id uuid; target_reply_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN target_discussion_id := OLD.discussion_id; target_reply_id := OLD.reply_id;
  ELSE target_discussion_id := NEW.discussion_id; target_reply_id := NEW.reply_id; END IF;
  IF target_discussion_id IS NOT NULL THEN
    UPDATE discussions SET upvote_count = (SELECT COUNT(*) FROM discussion_votes WHERE discussion_id = target_discussion_id) WHERE id = target_discussion_id;
  END IF;
  IF target_reply_id IS NOT NULL THEN
    UPDATE discussion_replies SET upvote_count = (SELECT COUNT(*) FROM discussion_votes WHERE reply_id = target_reply_id) WHERE id = target_reply_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;

-- QA upvote count
CREATE OR REPLACE FUNCTION public.update_qa_upvote_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE review_qa SET upvote_count = (SELECT COUNT(*) FROM review_qa_votes WHERE qa_id = OLD.qa_id) WHERE id = OLD.qa_id;
    RETURN OLD;
  ELSE
    UPDATE review_qa SET upvote_count = (SELECT COUNT(*) FROM review_qa_votes WHERE qa_id = NEW.qa_id) WHERE id = NEW.qa_id;
    RETURN NEW;
  END IF;
END; $$;

-- Tech stack upvote count
CREATE OR REPLACE FUNCTION public.update_stack_upvote_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE tech_stacks SET upvote_count = (SELECT COUNT(*) FROM tech_stack_votes WHERE stack_id = OLD.stack_id) WHERE id = OLD.stack_id;
    RETURN OLD;
  ELSE
    UPDATE tech_stacks SET upvote_count = (SELECT COUNT(*) FROM tech_stack_votes WHERE stack_id = NEW.stack_id) WHERE id = NEW.stack_id;
    RETURN NEW;
  END IF;
END; $$;

-- Award points
CREATE OR REPLACE FUNCTION public.award_points(_user_id uuid, _points integer, _reason text, _entity_id text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO point_transactions (user_id, points, reason, entity_id) VALUES (_user_id, _points, _reason, _entity_id);
  UPDATE profiles SET total_points = total_points + _points WHERE user_id = _user_id;
END; $$;

-- Points triggers
CREATE OR REPLACE FUNCTION public.trigger_award_review_points()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM award_points(NEW.user_id, 50, 'review_posted', NEW.id::text); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.trigger_award_comment_points()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM award_points(NEW.user_id, 10, 'comment_added', NEW.id::text); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.trigger_award_qa_points()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM award_points(NEW.user_id, 10, 'qa_posted', NEW.id::text); RETURN NEW; END; $$;

-- Notify product watchers
CREATE OR REPLACE FUNCTION public.notify_product_watchers()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT pw.user_id,
    'New review on a watched product',
    'A new review was posted on a product you are watching.',
    'product_watch',
    '/product/' || (SELECT slug FROM products WHERE id = NEW.product_id)
  FROM product_watches pw
  WHERE pw.product_id = NEW.product_id AND pw.user_id != NEW.user_id;
  RETURN NEW;
END; $$;

-- Blog view increment
CREATE OR REPLACE FUNCTION public.increment_blog_view(post_slug text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE blog_posts SET view_count = COALESCE(view_count, 0) + 1 WHERE slug = post_slug AND status = 'published';
END; $$;

-- Role checker
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- New user handler (creates profile + assigns role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END; $$;

-- Brevo account selector
CREATE OR REPLACE FUNCTION public.get_best_brevo_account()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE best_id uuid;
BEGIN
  UPDATE brevo_accounts SET credits_used_today = 0, credits_reset_at = now()
  WHERE credits_reset_at < now() - interval '24 hours';
  SELECT id INTO best_id FROM brevo_accounts
  WHERE is_active = true AND credits_used_today < COALESCE(daily_credit_limit, 300)
  ORDER BY (COALESCE(daily_credit_limit, 300) - COALESCE(credits_used_today, 0)) DESC LIMIT 1;
  RETURN best_id;
END; $$;

CREATE OR REPLACE FUNCTION public.reset_brevo_daily_credits()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE brevo_accounts SET credits_used_today = 0, credits_reset_at = now()
  WHERE credits_reset_at < now() - interval '24 hours';
END; $$;

-- =============================================
-- TRIGGERS
-- =============================================

-- Updated at triggers
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brevo_accounts_updated_at BEFORE UPDATE ON public.brevo_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brevo_campaigns_updated_at BEFORE UPDATE ON public.brevo_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discussions_updated_at BEFORE UPDATE ON public.discussions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discussion_replies_updated_at BEFORE UPDATE ON public.discussion_replies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lists_updated_at BEFORE UPDATE ON public.lists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pricing_tiers_updated_at BEFORE UPDATE ON public.product_pricing_tiers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_review_comments_updated_at BEFORE UPDATE ON public.review_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_review_digests_updated_at BEFORE UPDATE ON public.review_digests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Business logic triggers
CREATE TRIGGER trg_update_product_info_score BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_product_info_score();
CREATE TRIGGER trg_update_product_rating AFTER INSERT OR UPDATE OR DELETE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_product_rating();
CREATE TRIGGER trg_increment_product_click AFTER INSERT ON public.affiliate_clicks FOR EACH ROW EXECUTE FUNCTION increment_product_click();
CREATE TRIGGER update_list_upvote_count_trigger AFTER INSERT OR DELETE ON public.list_votes FOR EACH ROW EXECUTE FUNCTION update_list_upvote_count();
CREATE TRIGGER trg_update_discussion_reply_count AFTER INSERT OR DELETE ON public.discussion_replies FOR EACH ROW EXECUTE FUNCTION update_discussion_reply_count();
CREATE TRIGGER trg_update_discussion_upvote_count AFTER INSERT OR DELETE ON public.discussion_votes FOR EACH ROW EXECUTE FUNCTION update_discussion_upvote_count();
CREATE TRIGGER trg_update_qa_upvote_count AFTER INSERT OR DELETE ON public.review_qa_votes FOR EACH ROW EXECUTE FUNCTION update_qa_upvote_count();
CREATE TRIGGER trg_update_stack_upvote_count AFTER INSERT OR DELETE ON public.tech_stack_votes FOR EACH ROW EXECUTE FUNCTION update_stack_upvote_count();
CREATE TRIGGER trg_award_review_points AFTER INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION trigger_award_review_points();
CREATE TRIGGER trg_award_comment_points AFTER INSERT ON public.review_comments FOR EACH ROW EXECUTE FUNCTION trigger_award_comment_points();
CREATE TRIGGER trg_award_qa_points AFTER INSERT ON public.review_qa FOR EACH ROW EXECUTE FUNCTION trigger_award_qa_points();
CREATE TRIGGER trg_notify_product_watchers AFTER INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION notify_product_watchers();

-- Auth trigger (new user → profile + role)
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- STORAGE BUCKETS
-- =============================================
-- Run these in the Supabase SQL editor:
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('review-media', 'review-media', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('email-assets', 'email-assets', true) ON CONFLICT DO NOTHING;

-- Public read policies for storage
CREATE POLICY "Public read product-images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Public read review-media" ON storage.objects FOR SELECT USING (bucket_id = 'review-media');
CREATE POLICY "Public read email-assets" ON storage.objects FOR SELECT USING (bucket_id = 'email-assets');

-- =============================================
-- DONE! Next steps:
-- 1. Run this SQL in your Supabase SQL Editor
-- 2. Use the export-database edge function to get INSERT statements
-- 3. Import the data
-- 4. Download storage files and re-upload
-- 5. Update .env with your new Supabase URL and keys
-- =============================================
