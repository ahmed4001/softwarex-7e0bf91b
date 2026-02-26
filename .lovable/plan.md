

# Add Product Logos to the Comparisons Directory Page

## Problem
The `/compare` directory page shows only a single letter initial (e.g., "A", "L") for each comparison card instead of actual product logos/photos.

## Solution
Fetch product logos from the `products` table using the `product_ids` stored in each comparison, then display two overlapping logos per card using the existing `ProductLogo` component -- matching the style already used on the homepage.

## Changes

### File: `src/pages/ComparePage.tsx`

1. **Import `ProductLogo`** component at the top of the file

2. **Add a query to fetch product logos** for the current page of comparisons. Extract all `product_ids` from the loaded comparisons, then batch-fetch `id, name, logo_url` from `products`. Build a lookup map (same pattern used in `PopularComparisonsSection`).

3. **Replace the single-letter avatar** (lines 533-536) with two overlapping `ProductLogo` components showing the logos for Product A and Product B:
   - Use `-space-x-2` overlap with `ring-2 ring-background` styling
   - Fall back to the letter initial if logos aren't found

This is a UI-only change with one additional lightweight query. No database changes needed.
