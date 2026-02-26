

# Add Review Filtering & Sorting to Product Reviews Tab

## Overview

Add client-side filtering and sorting controls to the reviews tab on ProductDetailPage. Currently reviews are fetched ordered by `created_at DESC` with a limit of 10. We'll increase the limit, add sorting options, and add a rating filter -- all handled client-side for simplicity.

## Changes

### File: `src/pages/ProductDetailPage.tsx`

1. **Add state variables** for sort and filter:
   - `reviewSort`: "newest" | "oldest" | "highest" | "lowest" | "most_helpful" (default: "newest")
   - `reviewRatingFilter`: number | null (null = all, 1-5 = specific star)

2. **Increase review fetch limit** from 10 to 50 to have enough data for filtering to be useful.

3. **Add filter/sort UI bar** above the review list inside the "reviews" TabsContent:
   - A `Select` dropdown for sort order with options: Newest, Oldest, Highest Rated, Lowest Rated, Most Helpful
   - A row of small star-filter buttons (All, 5, 4, 3, 2, 1) to filter by specific rating
   - Show count of filtered results

4. **Apply filtering and sorting client-side** using `useMemo`:
   - Filter: if `reviewRatingFilter` is set, only show reviews matching that `overall_rating`
   - Sort by the selected option:
     - newest/oldest: by `created_at`
     - highest/lowest: by `overall_rating`
     - most_helpful: by `helpful_count` descending

5. **Render the filtered/sorted list** instead of the raw `reviews` array.

## UI Layout

```text
+--------------------------------------------------+
| Sort: [Newest v]    Rating: [All] [5] [4] [3]... |
| Showing 8 of 12 reviews                          |
+--------------------------------------------------+
| ReviewCard ...                                   |
| ReviewCard ...                                   |
```

## Technical Details

- No database changes needed -- all client-side
- Imports needed: `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` (already available), `useMemo` from React
- The `helpful_count` column already exists on the `reviews` table
- Star filter buttons will use small `Button` components with `variant="outline"` or `variant="default"` for the active one
- Filter state resets when switching products (tied to component lifecycle)

