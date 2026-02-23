
-- User engagement table for XP, streaks, achievements, challenges
CREATE TABLE public.user_engagement (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  achievements JSONB NOT NULL DEFAULT '[]'::jsonb,
  daily_challenges JSONB NOT NULL DEFAULT '[]'::jsonb,
  daily_challenges_date DATE,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_engagement ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own engagement"
ON public.user_engagement FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own engagement"
ON public.user_engagement FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own engagement"
ON public.user_engagement FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage engagement"
ON public.user_engagement FOR ALL
USING (((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role'::text) = 'service_role'::text)
WITH CHECK (((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role'::text) = 'service_role'::text);

-- Trigger for updated_at
CREATE TRIGGER update_user_engagement_updated_at
BEFORE UPDATE ON public.user_engagement
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
