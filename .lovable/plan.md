

# Add Pricing Comparison Widget to Product Detail Pages

## Overview
Create a self-contained `PricingComparisonWidget` component that appears on the Pricing tab of each product detail page. It lets users quickly pick 1-3 competitor products and see a side-by-side price/feature comparison without leaving the page.

## What it does
- Renders below the existing pricing tiers and TCO calculator on the Pricing tab
- Shows a compact search bar to add up to 3 competitor products
- Displays a condensed comparison table: product name, pricing model, starting price, plan count
- Includes a "Full Comparison" link to `/compare-pricing?products=...` for the deep-dive view

## Technical Plan

### 1. Create `src/components/PricingComparisonWidget.tsx`

A new component accepting the current product as a prop:

```typescript
interface PricingComparisonWidgetProps {
  currentProduct: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    pricing_model: string | null;
    starting_price: number | null;
    pricing_tiers: any;
  };
}
```

**Behavior:**
- The current product is always shown as the first column (non-removable)
- A search input allows adding up to 3 more products (same search query pattern as `PricingComparisonPage`)
- Uses `useQuery` to search products by name from the `products` table
- Fetches `product_pricing_tiers` for all selected products to show normalized tier counts
- Renders a compact comparison table with rows: Pricing Model, Starting Price, Plans Available
- A prominent "Compare in Detail" button links to `/compare-pricing?products=id1,id2,...`
- Also pre-populates from `alternatives` table: auto-suggest the top 2-3 alternatives as quick-add chips

### 2. Update `src/pages/ProductDetailPage.tsx`

- Import the new `PricingComparisonWidget`
- Add it to the Pricing tab (lines 540-554), between the TCO calculator and the existing "Compare with Other Products" link
- Replace the standalone link with the widget, which includes its own "Full Comparison" CTA
- Pass the current product data as props

### 3. No database changes needed
All required tables (`products`, `product_pricing_tiers`, `alternatives`) already exist with appropriate public SELECT RLS policies.

## Component Structure

```text
+--------------------------------------------------+
| Compare Pricing                                   |
| [Current Product] is always shown                 |
|                                                   |
| Quick add: [Alt 1] [Alt 2] [+ Search...]         |
|                                                   |
| +------+----------+--------+-------+------+       |
| |      | Current  | Comp 1 | Comp 2| Comp3|       |
| +------+----------+--------+-------+------+       |
| |Model | Freemium | SaaS   | ...   |      |       |
| |Price | $0/mo    | $29/mo | ...   |      |       |
| |Plans | 4        | 3      | ...   |      |       |
| +------+----------+--------+-------+------+       |
|                                                   |
| [Compare in Detail ->]                            |
+--------------------------------------------------+
```

## Files Changed
- **New**: `src/components/PricingComparisonWidget.tsx`
- **Modified**: `src/pages/ProductDetailPage.tsx` (add widget to pricing tab)
