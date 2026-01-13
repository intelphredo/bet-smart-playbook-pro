-- 1. Drop and recreate the cron_job_status view with SECURITY INVOKER (default)
DROP VIEW IF EXISTS public.cron_job_status;
CREATE VIEW public.cron_job_status WITH (security_invoker = true) AS
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  active
FROM cron.job;

-- 2. Fix "always true" INSERT/UPDATE policies for service-role only tables
--    These should use a proper service-role check instead of bare `true`

-- line_movement_tracking: make INSERT/UPDATE service-role only (use request.jwt.claim check)
DROP POLICY IF EXISTS "Service role can insert line movements" ON public.line_movement_tracking;
DROP POLICY IF EXISTS "Service role can update line movements" ON public.line_movement_tracking;

CREATE POLICY "Service role can insert line movements"
  ON public.line_movement_tracking FOR INSERT
  WITH CHECK (
    current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role'
  );

CREATE POLICY "Service role can update line movements"
  ON public.line_movement_tracking FOR UPDATE
  USING (
    current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role'
  );

-- odds_history: make INSERT service-role only
DROP POLICY IF EXISTS "Service role can insert odds history" ON public.odds_history;
CREATE POLICY "Service role can insert odds history"
  ON public.odds_history FOR INSERT
  WITH CHECK (
    current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role'
  );

-- scheduled_job_logs: make INSERT/UPDATE service-role only
DROP POLICY IF EXISTS "Service role can manage job logs" ON public.scheduled_job_logs;
CREATE POLICY "Service role can manage job logs"
  ON public.scheduled_job_logs FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role'
  )
  WITH CHECK (
    current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role'
  );

-- user_alerts: make INSERT service-role only
DROP POLICY IF EXISTS "Service role can insert alerts" ON public.user_alerts;
CREATE POLICY "Service role can insert alerts"
  ON public.user_alerts FOR INSERT
  WITH CHECK (
    current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role'
  );