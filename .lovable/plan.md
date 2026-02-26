

# Review Analytics Dashboard for Vendors

## Overview

Enhance the existing `VendorAnalyticsPage.tsx` with three new analytics sections: a detailed rating breakdown with sub-criteria, sentiment trend analysis over time, and response rate metrics. This builds on the existing charts and stat cards already present.

## What Gets Built

### 1. Sub-Criteria Rating Breakdown
A horizontal bar chart showing average scores across the multi-criteria ratings: Ease of Use, Customer Support, Value for Money, Features, and Recommendation Likelihood. This gives vendors deeper insight beyond the overall star rating.

### 2. Sentiment Trend Over Time (Monthly)
A line/area chart showing the monthly average rating trend and review volume, giving vendors a view of how satisfaction is changing over time. Reviews are bucketed by month from the `created_at` timestamp. This uses existing review data (no AI sentiment API call needed -- that's an admin-only feature).

### 3. Response Rate Analytics
- **Response Rate**: percentage of reviews that have a vendor response (responses / total reviews)
- **Avg Response Time**: average time between review `created_at` and response `created_at`
- **Response Rate Over Time**: a small bar chart showing monthly responded vs unresponded review counts
- A "response streak" indicator showing how many consecutive recent reviews have been responded to

## Technical Details

### File Changes

**`src/pages/vendor/VendorAnalyticsPage.tsx`** (modify):

1. Expand the reviews query to include sub-criteria fields: `ease_of_use, customer_support, value_for_money, features_rating, recommendation_likelihood`
2. Fetch `vendor_responses` with `created_at` and `review_id` (not just count) to compute response times
3. Add `useMemo` computations for:
   - Sub-criteria averages across all reviews
   - Monthly sentiment trend (group reviews by month, compute avg rating per month)
   - Response rate percentage and average response time
   - Monthly response vs unresponded breakdown
4. Add three new chart sections after the existing charts:
   - Horizontal BarChart for sub-criteria averages (5 bars, labeled)
   - AreaChart for monthly rating trend with review count overlay
   - Stacked BarChart for monthly responded/unresponded reviews
5. Add two new StatCards in the existing grid: "Response Rate" (percentage) and "Avg Response Time" (e.g., "2.3 days")

### Data Flow
- All data comes from existing tables (`reviews`, `vendor_responses`, `products`) -- no new tables or migrations needed
- All computations are client-side using `useMemo`
- Uses existing Recharts components already imported in the file

### UI Layout
```text
[Existing 6 stat cards row -- add Response Rate % + Avg Response Time]

[Existing 3 charts: Rating Dist | Reviews by Product | Review Status]

[NEW ROW: Sub-Criteria Breakdown | Monthly Rating Trend]

[NEW ROW: Response Rate Over Time (full width)]

[Existing ProductAnalyticsDashboard]
```

### No Database Changes
All required data already exists in the `reviews` and `vendor_responses` tables.

