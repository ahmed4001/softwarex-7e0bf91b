

# Add AI-Generated Comparison Content

Enrich the existing 1,204 comparison entries with detailed, AI-generated content and create dedicated VS pages for each.

## What Changes

### 1. Extend the comparisons table with new columns

Add columns to store rich comparison content:

| Column | Type | Purpose |
|--------|------|---------|
| `slug` | text (unique) | URL-friendly slug, e.g. "salesforce-vs-hubspot-crm" |
| `summary` | text | 2-3 paragraph overview of the comparison |
| `winner_verdict` | text | Which product wins overall and why |
| `winner_product_id` | uuid | The winning product's ID |
| `category_id` | uuid | Category both products belong to |
| `product_a_score` | numeric | Overall score for product A (1-10) |
| `product_b_score` | numeric | Overall score for product B (1-10) |
| `feature_scores` | jsonb | Per-feature scoring breakdown |
| `pros_a` | jsonb | Array of pros for product A |
| `cons_a` | jsonb | Array of cons for product A |
| `pros_b` | jsonb | Array of pros for product B |
| `cons_b` | jsonb | Array of cons for product B |
| `best_for_a` | text | "Best for..." summary for product A |
| `best_for_b` | text | "Best for..." summary for product B |
| `seo_title` | text | SEO-optimized page title |
| `seo_description` | text | Meta description |

Also backfill slugs for all existing comparisons using a migration.

### 2. Create AI content generation edge function

A new `generate-comparison-content` edge function that:
- Fetches comparisons that have no `summary` yet (in batches of 10)
- For each, loads both products' data (name, tagline, description, features, pricing, ratings, pros/cons summaries)
- Calls Lovable AI (gemini-3-flash-preview) with a structured prompt to generate all comparison fields
- Uses tool calling to get structured JSON output
- Saves the generated content back to the comparisons table
- Processes in batches to avoid timeouts (configurable batch size)

### 3. Create a dedicated VS comparison page

New route: `/compare/:slug` (e.g., `/compare/salesforce-vs-hubspot-crm`)

The page will display:
- Hero section with both product logos, names, and overall scores
- Winner verdict banner
- Side-by-side feature score comparison (bar chart style)
- Pros and cons cards for each product
- "Best for" recommendations
- Full summary narrative
- Existing feature matrix from the current compare page
- Pricing calculator
- Links to individual product pages

### 4. Update the existing compare page and homepage links

- Add a "Browse Comparisons" section or listing to `/compare` that shows popular/recent comparisons
- Update `PopularComparisonsSection` to link to actual comparison detail pages instead of just `/compare`
- Add the new route to `App.tsx`

## Technical Details

### Database Migration

```sql
ALTER TABLE comparisons
  ADD COLUMN slug text UNIQUE,
  ADD COLUMN summary text,
  ADD COLUMN winner_verdict text,
  ADD COLUMN winner_product_id uuid,
  ADD COLUMN category_id uuid,
  ADD COLUMN product_a_score numeric DEFAULT 0,
  ADD COLUMN product_b_score numeric DEFAULT 0,
  ADD COLUMN feature_scores jsonb DEFAULT '[]',
  ADD COLUMN pros_a jsonb DEFAULT '[]',
  ADD COLUMN cons_a jsonb DEFAULT '[]',
  ADD COLUMN pros_b jsonb DEFAULT '[]',
  ADD COLUMN cons_b jsonb DEFAULT '[]',
  ADD COLUMN best_for_a text,
  ADD COLUMN best_for_b text,
  ADD COLUMN seo_title text,
  ADD COLUMN seo_description text;
```

Then backfill slugs from existing titles (e.g., "Salesforce vs HubSpot CRM" becomes "salesforce-vs-hubspot-crm").

### New Files

- `supabase/functions/generate-comparison-content/index.ts` -- AI content generation
- `src/pages/ComparisonDetailPage.tsx` -- dedicated VS page

### Modified Files

- `src/App.tsx` -- add `/compare/:slug` route
- `src/components/home/PopularComparisonsSection.tsx` -- link to actual comparison pages
- `supabase/config.toml` -- register new edge function

### AI Prompt Strategy

The edge function will use tool calling to extract structured output. The system prompt will instruct the model to act as a SaaS analyst producing a fair, data-driven comparison. Input includes both products' real data (features, pricing, ratings, reviews summary). Output is the structured comparison fields above.

### Execution Plan

1. Run the database migration to add columns and backfill slugs
2. Deploy the `generate-comparison-content` edge function
3. Call it to process all 1,204 comparisons (in batches of ~10, multiple invocations)
4. Create the `ComparisonDetailPage.tsx` component
5. Wire up routing and update homepage links

