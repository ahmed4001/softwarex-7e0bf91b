# Migration Guide: Lovable Cloud → Supabase.com

## Overview
- **81 tables**, 11,000+ rows of data
- **3 storage buckets** (product-images, review-media, email-assets)
- **20+ edge functions**
- **16 database functions** + triggers

---

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **Anon Key** from Settings → API
3. Note your **Service Role Key** (keep secret!)

---

## Step 2: Run the Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `public/supabase-migration-schema.sql`
3. Paste and run it — this creates all 81 tables, functions, triggers, indexes, and storage buckets

---

## Step 3: Export Data from Lovable Cloud

### Option A: Export All (small-medium datasets)
```bash
curl -X POST https://ffeimjfunghzxgeqiwma.supabase.co/functions/v1/export-database \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"mode": "all"}'
```

### Option B: Export Table by Table (recommended for large datasets)
```bash
# First, get a summary of all tables
curl -X POST .../export-database -d '{"mode": "summary"}'

# Then export each table with pagination
curl -X POST .../export-database \
  -d '{"mode": "table", "table": "products", "offset": 0, "limit": 5000}'

# If has_more is true, get next page:
curl -X POST .../export-database \
  -d '{"mode": "table", "table": "products", "offset": 5000, "limit": 5000}'
```

### Option C: List Storage Files
```bash
curl -X POST .../export-database -d '{"mode": "list_storage"}'
```

---

## Step 4: Import Data

1. Take the SQL output from Step 3
2. Go to your new Supabase project's **SQL Editor**
3. Paste and run the INSERT statements
4. For large datasets, split into batches of ~1000 statements

---

## Step 5: Migrate Storage Files

1. Get the file list using `{"mode": "list_storage"}`
2. Download each file from the public URLs
3. Upload to your new Supabase project's storage buckets
4. Script example:
```bash
# Download all product images
for url in $(cat storage-files.json | jq -r '.files[].url'); do
  filename=$(basename "$url")
  curl -o "downloads/$filename" "$url"
done

# Upload to new Supabase (use Supabase CLI or dashboard)
```

---

## Step 6: Deploy Edge Functions

1. Install Supabase CLI: `npm install -g supabase`
2. Link to your new project: `supabase link --project-ref YOUR_PROJECT_ID`
3. Deploy all functions:
```bash
supabase functions deploy scrape-products
supabase functions deploy discover-products
supabase functions deploy ai-generate-products
# ... deploy each function from supabase/functions/
```

---

## Step 7: Set Edge Function Secrets

In your new Supabase dashboard → Edge Functions → Secrets, add:
- `LOVABLE_API_KEY` — for AI features (or replace with your own OpenAI/Gemini key)
- `FIRECRAWL_API_KEY` — for web scraping
- `GOOGLE_GEMINI_API_KEY` — if using Gemini directly

---

## Step 8: Update Frontend Config

Update your `.env` file (or hosting environment variables):
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_new_anon_key
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_ID
```

---

## Step 9: Set Up RLS Policies

The schema creates tables but you'll need to configure RLS policies based on your security needs. Key tables that need RLS:
- `profiles` — users can only edit their own
- `reviews` — users can create, admins can moderate
- `saved_products`, `product_watches` — user-specific
- `user_roles` — admin-only management

---

## Step 10: Build & Deploy Frontend

```bash
npm run build
# Upload dist/ folder to your hosting provider
```

---

## Data Summary

| Table | Rows |
|-------|------|
| products | ~9,600 |
| comparisons | ~1,200 |
| categories | ~138 |
| reviews | ~65 |
| glossary_terms | ~25 |
| badges | 8 |
| pages | 7 |
| Other tables | mostly empty |

Total: ~11,050 rows across 81 tables
