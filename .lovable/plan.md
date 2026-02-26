

# Advanced Review System Overhaul

## Current State Analysis

After thorough exploration, most requested features **already exist**:
- Multi-criteria ratings (Ease of Use, Support, Value, Features) -- built in WriteReviewPage and ReviewCard
- Pros/cons fields -- built as free-text in reviews table and form
- Media attachments -- review_media table, upload UI, and display all working
- AI-generated review summaries -- generate-review-summary edge function + display on ProductDetailPage
- Review comments/threads -- review_comments table with nested replies
- Vendor responses -- vendor_responses table with display

## What Will Be Built

The genuinely missing pieces are:

### 1. Product Q&A System (review_qa table)
A dedicated question-and-answer section on product pages where users can ask questions and community members or vendors can answer.

**New table: `review_qa`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| product_id | uuid NOT NULL | which product |
| user_id | uuid NOT NULL | who asked/answered |
| parent_id | uuid | null = question, set = answer |
| body | text NOT NULL | the question or answer text |
| is_vendor_answer | boolean | default false |
| upvote_count | integer | default 0 |
| status | text | default 'active' (active/hidden/flagged) |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

**RLS**: Public SELECT (active only); authenticated INSERT (own user_id); owner UPDATE/DELETE; admin ALL.

### 2. Q&A Votes Table (review_qa_votes)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| qa_id | uuid NOT NULL | FK to review_qa |
| user_id | uuid NOT NULL | voter |
| created_at | timestamptz | |

Unique constraint on (qa_id, user_id). Trigger to sync upvote_count on review_qa.

**RLS**: Public SELECT; authenticated INSERT/DELETE own votes.

### 3. Pros/Cons Tag System
Enhance the existing free-text pros/cons with structured tags. Add a `pros_tags` and `cons_tags` JSONB column to the reviews table so users can pick from common tags (e.g., "Easy to use", "Great support", "Expensive") in addition to free text.

### 4. Q&A UI Components
- **ProductQASection** component: displayed as a new tab on the ProductDetailPage
- Question form with authentication gate
- Threaded answers under each question
- Upvote buttons on questions and answers
- Vendor answer badge highlighting

## Database Migration

Single migration creating:
- `review_qa` table with RLS
- `review_qa_votes` table with unique constraint and RLS
- Trigger `update_qa_upvote_count` to sync vote counts
- Add `pros_tags` and `cons_tags` JSONB columns to `reviews` table (default '[]')
- `update_updated_at_column` trigger on `review_qa`

## Files to Create/Modify

| File | Action |
|------|--------|
| Migration SQL | New -- 2 tables, columns, RLS, triggers |
| `src/components/ProductQASection.tsx` | New -- Q&A display with question form, answers, votes |
| `src/hooks/useProductQA.ts` | New -- queries and mutations for Q&A CRUD and voting |
| `src/pages/ProductDetailPage.tsx` | Modified -- add "Q&A" tab rendering ProductQASection |
| `src/pages/WriteReviewPage.tsx` | Modified -- add pros/cons tag picker alongside existing text fields |
| `src/components/ReviewCard.tsx` | Modified -- display pros_tags/cons_tags as badges |

## Technical Notes

- Q&A uses a self-referencing `parent_id` pattern (same as review_comments) for question/answer threading
- Vendor answers are highlighted with a badge; determined by checking if the answerer has an approved claim on the product (checked client-side)
- The trigger for upvote_count follows the same pattern as the existing `update_list_upvote_count` function
- Pros/cons tags are stored as JSONB arrays alongside the existing free-text fields for backward compatibility
- Common tag suggestions will be hardcoded in the frontend (e.g., "Easy Setup", "Good Value", "Steep Learning Curve")

