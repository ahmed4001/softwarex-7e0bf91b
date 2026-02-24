
# Fix Site-Wide Data Display Issues

After browsing the populated site, three bugs were identified that need fixing.

## Issues Found

### 1. Product Detail Pages Are Broken (Critical)
Every product page shows "Product not found." The query in `ProductDetailPage.tsx` uses `categories(name, slug)` without specifying which foreign key to use. Since `products` has two foreign keys to `categories` (`category_id` and `subcategory_id`), PostgREST returns a 300 ambiguity error.

**Fix:** Change the join to `categories!products_category_id_fkey(name, slug)`.

### 2. Category Page Title Doubles "Software"
The heading reads "Best CRM Software Software" because the template is `Best {category.name} Software` and many category names already end in "Software."

**Fix:** Update the title logic in `CategoryPage.tsx` to check if the category name already ends with "Software" and skip appending it again.

### 3. Product Ratings Showing 0.0 on Category Pages
AI-imported products (e.g., HubSpot CRM, Pipedrive) show `0.0` ratings on the category page even though they have reviews. The `avg_rating` column is not being recalculated after bulk review generation.

**Fix:** Create a database migration that adds a trigger to automatically recalculate `avg_rating` and `total_reviews` on the `products` table whenever a review is inserted, updated, or deleted. Also run a one-time update to sync current values.

---

## Technical Details

### File Changes

**`src/pages/ProductDetailPage.tsx`** (line 19)
- Change: `categories(name, slug)` to `categories!products_category_id_fkey(name, slug)`

**`src/pages/CategoryPage.tsx`**
- Update the page title to avoid doubling "Software" (e.g., use conditional logic: if `name.endsWith("Software")`, use `Best ${name}` instead of `Best ${name} Software`)

**Database Migration**
- Create a function `update_product_rating()` that recalculates `avg_rating` and `total_reviews` from the `reviews` table for the affected product
- Create triggers `AFTER INSERT OR UPDATE OR DELETE ON reviews` to call this function
- Run a one-time update: `UPDATE products SET avg_rating = (SELECT AVG(rating) FROM reviews WHERE reviews.product_id = products.id AND reviews.status = 'approved'), total_reviews = (SELECT COUNT(*) FROM reviews WHERE reviews.product_id = products.id AND reviews.status = 'approved')`

### Verification
- Product detail pages will load correctly with category info
- Category page titles will read properly (e.g., "Best CRM Software" not "Best CRM Software Software")
- Product ratings will reflect actual review averages across the site
