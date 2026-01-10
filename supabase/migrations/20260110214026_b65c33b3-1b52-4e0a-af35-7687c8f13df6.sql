-- Enable the pg_net extension for HTTP requests from database
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to call the record-odds edge function
CREATE OR REPLACE FUNCTION public.trigger_record_odds()
RETURNS void AS $$
DECLARE
  supabase_url TEXT;
  service_key TEXT;
BEGIN
  -- Get environment variables (these are set in Supabase)
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_key := current_setting('app.settings.service_role_key', true);
  
  -- If settings aren't available, try to construct URL from project ref
  IF supabase_url IS NULL THEN
    supabase_url := 'https://pyknizknsygpmodoioae.supabase.co';
  END IF;
  
  -- Make HTTP request to the edge function using pg_net
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/record-odds',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_key, current_setting('request.jwt.claim.sub', true))
    ),
    body := '{}'::jsonb
  );
  
  RAISE NOTICE 'Triggered record-odds function at %', now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Schedule the cron job to run every 15 minutes
SELECT cron.schedule(
  'record-odds-every-15-min',
  '*/15 * * * *',
  $$SELECT public.trigger_record_odds()$$
);

-- Also create a function to manually trigger recording (useful for testing)
CREATE OR REPLACE FUNCTION public.manual_record_odds()
RETURNS jsonb AS $$
BEGIN
  PERFORM public.trigger_record_odds();
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Record odds triggered',
    'triggered_at', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to authenticated users for manual trigger
GRANT EXECUTE ON FUNCTION public.manual_record_odds() TO authenticated;

-- Create a view to check cron job status
CREATE OR REPLACE VIEW public.cron_job_status AS
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