

## Fix Sponsored "AD" Badge Overlapping with Bookmark Button

**Problem**: In `ProductCard.tsx`, both the bookmark button (line 40) and the "AD" badge (line 52) are positioned at `absolute top-3 right-3`. When a logged-in user views a sponsored product, these two elements stack on top of each other.

**Solution**: Shift the "AD" badge position so it doesn't conflict with the bookmark button. When a user is logged in, the bookmark occupies the top-right corner, so the "AD" badge should move to the top-left or shift down.

### Changes

**File: `src/components/ProductCard.tsx`**

1. Move the "AD" badge from `top-3 right-3` to `top-3 left-3` (top-left corner of the card), which avoids any conflict with the bookmark button regardless of login state. This also visually separates the two elements cleanly.

Alternatively, we could conditionally offset the AD badge when the user is logged in, but a consistent top-left placement is simpler and more predictable.

### Technical Details

- Change line 52: `className="absolute top-3 right-3 ..."` to `className="absolute top-3 left-3 ..."`
- Single line change, no other files affected
