

# Round-Robin Sending for Brevo Accounts

## Overview
Add automatic round-robin account selection when sending campaigns. Instead of manually picking an account, the system will automatically choose the active account with the most remaining daily credits (300 limit per account). The admin can still override manually if desired.

## Changes

### 1. Database: Add a credit reset function
Create a database function `get_best_brevo_account` that returns the active account with the highest remaining credits (`daily_credit_limit - credits_used_today`). Also add a daily credit reset function.

**SQL Migration:**
- `get_best_brevo_account()` -- returns the active account ID with the most remaining credits
- `reset_brevo_daily_credits()` -- resets `credits_used_today` to 0 for all accounts where `credits_reset_at` is older than 24 hours

### 2. Edge Function: New `send-campaign-roundrobin` action
Add a new action in `supabase/functions/brevo-api/index.ts`:

- **`send-campaign-roundrobin`**: Does NOT require `accountId`. Instead, queries all active accounts ordered by remaining credits descending, picks the first one with credits > 0, and sends via that account. If no accounts have credits left, returns an error. After sending, increments `credits_used_today` for the chosen account.
- Also update the existing `send-campaign` action to check credit limits before sending (reject if `credits_used_today >= daily_credit_limit`).

### 3. Frontend: Add "Auto (Round-Robin)" option in CampaignComposer
Update `src/components/admin/CampaignComposer.tsx`:

- Add a special "Auto - Best Available" option in the account selector dropdown (value: `"auto"`)
- When `accountId === "auto"`, call the edge function with `action: "send-campaign-roundrobin"` instead of `"send-campaign"`
- Show which account was used in the success toast (returned from the edge function response)
- Update the confirmation dialog to say "via best available account" when auto is selected

### 4. Frontend: Credit usage visualization
Update `src/pages/admin/AdminBrevoPage.tsx`:

- Add a small progress bar under each account's credit cell showing usage percentage
- Color-code: green (< 50%), yellow (50-80%), red (> 80%)

## Technical Details

```text
+------------------+       +-------------------+       +-------------+
| CampaignComposer | ----> | brevo-api (edge)  | ----> | Brevo API   |
| accountId="auto" |       | round-robin logic |       |             |
+------------------+       +-------------------+       +-------------+
                                    |
                                    v
                           +------------------+
                           | brevo_accounts   |
                           | (pick best one)  |
                           +------------------+
```

**Round-robin algorithm:**
1. Query all active accounts where `credits_used_today < daily_credit_limit`
2. Reset credits if `credits_reset_at` is older than 24 hours
3. Order by `(daily_credit_limit - credits_used_today) DESC`
4. Pick the first account (most remaining credits)
5. Send campaign, increment credits, log with the chosen account ID

### Files to modify:
- `supabase/functions/brevo-api/index.ts` -- add round-robin action + credit check
- `src/components/admin/CampaignComposer.tsx` -- add auto option + update send logic
- `src/pages/admin/AdminBrevoPage.tsx` -- add credit progress bars
- New database migration -- add helper functions
