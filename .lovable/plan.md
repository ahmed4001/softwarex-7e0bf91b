

# Fix: Reviews Not Loading on Product Detail Page + Test AI Summary

## Problem Found

The Reviews tab on product detail pages shows "No reviews yet" even when approved reviews exist in the database. The root cause is a **missing foreign key relationship** between the `reviews` and `profiles` tables.

The reviews query in `ProductDetailPage.tsx` uses a PostgREST join:
```
.from("reviews").select("*, profiles(name, avatar_url)")
```

PostgREST returns a 400 error:
> "Could not find a relationship between 'reviews' and 'profiles' in the schema cache"

The `reviews` table has a `user_id` column and `profiles` has a `user_id` column, but there is **no foreign key constraint** linking them. Without this, PostgREST cannot perform the join.

## Fix

### 1. Add foreign key constraint (database migration)

Add a FK from `reviews.user_id` to `profiles.user_id` so PostgREST can resolve the relationship:

```sql
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);
```

This also needs a similar FK from `reviews.product_id` to `products.id` if missing (the existing query also joins `products`).

### 2. No code changes needed

The existing `ProductDetailPage.tsx` query is correct -- it just needs the FK to exist.

## After Fix: Testing AI Summary

Once reviews load correctly:
1. Sign in as an admin user
2. Navigate to a product with reviews (e.g., Monday.com)
3. Click the "Reviews" tab
4. Click "Generate AI Summary" button
5. Verify the pros/cons summary appears on the product

The button is admin-only (`isAdmin && reviews && reviews.length > 0`), so the user must be logged in with admin privileges.

## Technical Notes

- The `profiles` table uses `user_id` (not `id`) as the column referenced by reviews
- The `generate-review-summary` edge function fetches approved reviews, calls the AI gateway, and updates the product's `pros_summary` and `cons_summary` columns
- Both `pros_summary` and `cons_summary` columns already exist on the `products` table

