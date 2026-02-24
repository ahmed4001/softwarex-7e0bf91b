

# Populate Database with Real Product Data via Web Scraping

## Overview
Scrape real software product data from public websites (G2, Capterra, product homepages) using Firecrawl, then insert it into your database. This will give you 200+ real products with accurate names, descriptions, pricing, features, and ratings.

## Approach

### Step 1: Connect Firecrawl
Link the existing Firecrawl connection to this project so the scraping API is available.

### Step 2: Build a Scraping Backend Function
Create a backend function (`scrape-products`) that:
1. Takes a list of product names + their website URLs as input
2. Uses Firecrawl to scrape each product's website for real data (description, tagline, pricing, features)
3. Also scrapes G2/Capterra pages for that product to get real ratings, review counts, pros/cons
4. Inserts the scraped data into the `products` table, matched to the correct category

### Step 3: Build a Seed Data File
Create a curated list of ~200 real software products organized by your 57 categories. Each entry includes:
- Product name
- Website URL
- G2 URL (for ratings/reviews)
- Category slug mapping

Example entries:
```text
Project Management: Asana, Monday.com, Trello, Basecamp, ClickUp, Wrike
CRM: Salesforce, HubSpot, Pipedrive, Zoho CRM, Freshsales
Communication: Slack, Microsoft Teams, Discord, Zoom, Google Meet
E-Commerce: Shopify, WooCommerce, BigCommerce, Squarespace, Wix
...and so on for all 57 categories
```

### Step 4: Admin Seed Page
Create an admin page at `/admin/seed` with:
- A "Start Scraping" button that triggers the backend function
- Progress indicator showing which products have been processed
- Results summary when complete
- Option to scrape individual categories

### Step 5: Auto-Create Comparisons
After products are inserted, create comparison entries for popular matchups within the same category (e.g., Slack vs Teams, Asana vs Monday.com).

## What Gets Built

| Action | File | Purpose |
|--------|------|---------|
| Create | `supabase/functions/scrape-products/index.ts` | Backend function that scrapes real product data via Firecrawl and inserts into DB |
| Create | `src/pages/admin/AdminSeedPage.tsx` | Admin UI to trigger and monitor scraping |
| Create | `src/lib/seed-products.ts` | Curated list of ~200 real products with URLs and category mappings |
| Modify | `src/App.tsx` | Add `/admin/seed` route |

## How the Scraping Works

```text
Admin clicks "Start Scraping"
  --> Frontend sends batch of product URLs to backend function
  --> Backend function calls Firecrawl to scrape each product's website
      - Extracts: name, tagline, description, pricing, features from homepage
  --> Backend function calls Firecrawl to scrape G2 page for that product
      - Extracts: rating, review count, pros summary, cons summary
  --> Inserts into products table with correct category_id
  --> Returns progress to frontend
  --> Repeats for next batch
```

## Data Sources Per Product

| Data Field | Source |
|------------|--------|
| Name, tagline, description | Product website |
| Website URL, logo | Product website |
| Pricing model, starting price | Product website pricing page |
| Features list | Product website features page |
| Average rating, review count | G2 product page |
| Pros summary, cons summary | G2 product page |
| Founded year, headquarters, company size | Product website about page |

## Prerequisites
- Firecrawl connector must be linked to the project (will be done first)
- No database changes needed -- existing `products` table has all required columns

## Technical Details

The scrape function will:
1. Accept a batch of products (max 5 at a time to stay within rate limits)
2. For each product, make 2-3 Firecrawl scrape calls (homepage, pricing page, G2 page)
3. Use Firecrawl's JSON extraction format with a schema to pull structured data
4. Skip products that already exist (matched by slug)
5. Insert new products with the service role key
6. After all products are inserted, create comparison entries for products in the same category

