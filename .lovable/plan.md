

# Wire Default SEO Settings into SeoHead Component

## Overview
Update the `SeoHead` component to automatically fetch and apply default SEO settings from the `site_settings` database table as fallbacks. This means every page will inherit the admin-configured defaults (title suffix, description, keywords, OG image, verification tags) without requiring changes to any of the 47+ pages that use `SeoHead`.

## Approach

### 1. Create a `useSeoSettings` hook (`src/hooks/useSeoSettings.ts`)
A shared hook that fetches SEO-related settings from `site_settings` once and caches them via TanStack Query with a long `staleTime` (since these rarely change).

Fetched keys:
- `site_name` -- used as the title suffix (replacing hardcoded "SoftwareHub")
- `seo_default_title` -- fallback page title
- `seo_default_description` -- fallback meta description
- `seo_default_keywords` -- fallback keywords
- `seo_default_og_image` -- fallback OG image
- `seo_google_verification` -- Google Search Console verification tag
- `seo_bing_verification` -- Bing Webmaster verification tag

### 2. Update `SeoHead` component (`src/components/SeoHead.tsx`)
- Import and call the `useSeoSettings` hook
- Replace the hardcoded `"SoftwareHub"` suffix with the `site_name` setting
- Replace the hardcoded `"SoftwareHub"` in `og:site_name` similarly
- Apply fallbacks: if no `description` prop is passed, use `seo_default_description`; same for `keywords` and `ogImage`
- Render Google/Bing verification meta tags when configured
- All changes are backward-compatible -- existing props always take priority

### 3. No changes needed to individual pages
Since `SeoHead` already receives optional props, the fallback logic lives entirely inside the component. All 47+ pages that use `<SeoHead>` will automatically benefit.

## Technical Details

**`useSeoSettings` hook:**
```typescript
// Fetches all SEO keys in a single query using .in()
// Returns { siteName, defaultDescription, defaultKeywords, defaultOgImage, googleVerification, bingVerification }
// staleTime: 10 minutes, to avoid refetching on every navigation
```

**`SeoHead` changes:**
- `const fullTitle = \`\${title} | \${settings.siteName || "SoftwareHub"}\``
- `const effectiveDescription = description || settings.defaultDescription`
- `const effectiveKeywords = keywords || settings.defaultKeywords`
- `const effectiveOgImage = ogImage || settings.defaultOgImage`
- Add `<meta name="google-site-verification">` and `<meta name="msvalidate.01">` when values exist

**Files changed:**
1. `src/hooks/useSeoSettings.ts` (new)
2. `src/components/SeoHead.tsx` (modified)

No database changes required -- uses existing `site_settings` table with public read RLS.

