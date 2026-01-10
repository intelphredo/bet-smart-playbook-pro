-- Fix security definer view by dropping and recreating without security definer
DROP VIEW IF EXISTS public.cron_job_status;

-- Recreate as a regular view with explicit security invoker (default)
CREATE VIEW public.cron_job_status 
WITH (security_invoker = true) AS
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  active
FROM cron.job
WHERE jobname LIKE 'record-odds%';

-- Grant select on the view to authenticated users
GRANT SELECT ON public.cron_job_status TO authenticated;