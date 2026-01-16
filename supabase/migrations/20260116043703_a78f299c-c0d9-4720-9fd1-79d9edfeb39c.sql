-- Fix Security Issues from Audit
-- 1. clv_leaderboard view - already has security_invoker but needs explicit RLS on underlying tables
-- 2. sharp_money_stats view - same as above
-- 3. cron_job_status view - restrict to service role only

-- Drop and recreate cron_job_status view with security_invoker = true
DROP VIEW IF EXISTS public.cron_job_status;
CREATE VIEW public.cron_job_status WITH (security_invoker = true) AS
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  active
FROM cron.job
WHERE database = current_database();

-- Note: Views clv_leaderboard and sharp_money_stats were already fixed with security_invoker = true
-- But we need to add RLS policies to protect access to these views

-- Add RLS policy for weather_cache write protection
CREATE POLICY "Service role can insert weather cache"
ON public.weather_cache
FOR INSERT
WITH CHECK (((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role') = 'service_role');

CREATE POLICY "Service role can update weather cache"
ON public.weather_cache
FOR UPDATE
USING (((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role') = 'service_role');

CREATE POLICY "Service role can delete weather cache"
ON public.weather_cache
FOR DELETE
USING (((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role') = 'service_role');

-- Add RLS policy for venue_coordinates write protection
CREATE POLICY "Service role can insert venue coordinates"
ON public.venue_coordinates
FOR INSERT
WITH CHECK (((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role') = 'service_role');

CREATE POLICY "Service role can update venue coordinates"
ON public.venue_coordinates
FOR UPDATE
USING (((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role') = 'service_role');

CREATE POLICY "Service role can delete venue coordinates"
ON public.venue_coordinates
FOR DELETE
USING (((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role') = 'service_role');

-- Add push_subscriptions update policy (was missing)
CREATE POLICY "Users can update their own subscriptions"
ON public.push_subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

-- Ensure algorithm_predictions has proper delete policy for service role
CREATE POLICY "Service role can delete predictions"
ON public.algorithm_predictions
FOR DELETE
USING (((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role') = 'service_role');