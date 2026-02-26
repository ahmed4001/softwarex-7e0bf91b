
-- Create notification_preferences table
CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  review_replies boolean NOT NULL DEFAULT true,
  new_followers boolean NOT NULL DEFAULT true,
  product_updates boolean NOT NULL DEFAULT false,
  weekly_digest boolean NOT NULL DEFAULT true,
  badge_earned boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can read own preferences
CREATE POLICY "Users can read own notification preferences"
ON public.notification_preferences FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert own preferences
CREATE POLICY "Users can insert own notification preferences"
ON public.notification_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update own preferences
CREATE POLICY "Users can update own notification preferences"
ON public.notification_preferences FOR UPDATE
USING (auth.uid() = user_id);
