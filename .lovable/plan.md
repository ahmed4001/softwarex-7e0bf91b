

# User-Generated Lists & Collections

## Overview
Allow authenticated users to create, share, and vote on curated software lists (e.g., "Best Tools for Startups 2026"). Lists are public and browsable, with upvote/downvote support and a dedicated browse page.

## Database Schema (Migration)

### Table: `lists`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | default gen_random_uuid() |
| user_id | uuid NOT NULL | creator |
| title | text NOT NULL | e.g. "Best Tools for Startups 2026" |
| slug | text NOT NULL UNIQUE | URL-friendly |
| description | text | optional longer description |
| cover_image | text | optional |
| is_published | boolean | default true |
| upvote_count | integer | default 0 (denormalized) |
| product_count | integer | default 0 (denormalized) |
| view_count | integer | default 0 |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### Table: `list_items`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| list_id | uuid NOT NULL | FK to lists |
| product_id | uuid NOT NULL | FK to products |
| note | text | optional curator note |
| sort_order | integer | default 0 |
| created_at | timestamptz | default now() |
| UNIQUE(list_id, product_id) | | prevent duplicates |

### Table: `list_votes`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| list_id | uuid NOT NULL | FK to lists |
| user_id | uuid NOT NULL | voter |
| created_at | timestamptz | default now() |
| UNIQUE(list_id, user_id) | | one vote per user |

### RLS Policies
- **lists**: Public SELECT where `is_published = true`; authenticated INSERT with `auth.uid() = user_id`; owner UPDATE/DELETE
- **list_items**: Public SELECT (via published list join); owner INSERT/UPDATE/DELETE
- **list_votes**: Public SELECT; authenticated INSERT/DELETE for own votes
- Admin override on all three tables

### Trigger
- `update_updated_at_column` trigger on `lists`

## New Pages & Routes

### 1. Browse Lists Page (`/lists`)
- Grid of published lists sorted by upvotes/newest
- Each card shows: title, description snippet, product count, upvote count, creator name/avatar
- Search/filter bar
- "Create New List" CTA button (links to `/lists/new`)

### 2. List Detail Page (`/lists/:slug`)
- Header with title, description, creator info, upvote button, share button
- Product grid showing all items in the list with curator notes
- Owner sees edit/delete controls inline
- Visitors can upvote the list (toggle)

### 3. Create/Edit List Page (`/lists/new` and `/lists/:slug/edit`)
- Form: title, description, cover image URL
- Product picker (search products, add with optional note, drag to reorder)
- Save as draft or publish
- Protected route (requires auth)

## New Components

### `ListCard.tsx`
Card component for the browse grid showing list title, description, product thumbnails (first 3-4), upvote count, and creator badge.

### `ListVoteButton.tsx`
Toggle upvote button that checks auth state, optimistically updates count, and syncs with `list_votes` table.

## Hooks

### `useListVote(listId)`
Manages vote state: checks if user voted, handles toggle with optimistic updates, invalidates queries.

## Route Registration (App.tsx)
Add within the PublicLayout routes:
```
/lists              -> ListsPage
/lists/new          -> ListEditorPage (auth required)
/lists/:slug        -> ListDetailPage
/lists/:slug/edit   -> ListEditorPage (auth required, owner only)
```

## Dashboard Integration
Add a "My Lists" tab to the existing DashboardPage tabs so users can manage their lists alongside saved products and reviews.

## Files Changed/Created

| File | Action |
|------|--------|
| Migration SQL | New (3 tables, RLS, trigger) |
| `src/pages/ListsPage.tsx` | New |
| `src/pages/ListDetailPage.tsx` | New |
| `src/pages/ListEditorPage.tsx` | New |
| `src/components/ListCard.tsx` | New |
| `src/components/ListVoteButton.tsx` | New |
| `src/hooks/useListVote.ts` | New |
| `src/App.tsx` | Modified (add 4 routes) |
| `src/pages/DashboardPage.tsx` | Modified (add My Lists tab) |

