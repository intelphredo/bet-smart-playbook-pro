-- Fix: schedule prediction tasks via pg_cron (correct dollar-quoting)

CREATE OR REPLACE FUNCTION public.trigger_save_predictions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  backend_url TEXT;
  service_key TEXT;
BEGIN
  backend_url := current_setting('app.settings.supabase_url', true);
  service_key := current_setting('app.settings.service_role_key', true);

  IF backend_url IS NULL THEN
    backend_url := 'https://pyknizknsygpmodoioae.supabase.co';
  END IF;

  PERFORM net.http_post(
    url := backend_url || '/functions/v1/save-predictions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_key, current_setting('request.jwt.claim.sub', true))
    ),
    body := '{}'::jsonb
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_grade_predictions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  backend_url TEXT;
  service_key TEXT;
BEGIN
  backend_url := current_setting('app.settings.supabase_url', true);
  service_key := current_setting('app.settings.service_role_key', true);

  IF backend_url IS NULL THEN
    backend_url := 'https://pyknizknsygpmodoioae.supabase.co';
  END IF;

  PERFORM net.http_post(
    url := backend_url || '/functions/v1/grade-predictions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_key, current_setting('request.jwt.claim.sub', true))
    ),
    body := '{}'::jsonb
  );
END;
$$;

DO $do$
DECLARE
  existing_jobid integer;
BEGIN
  -- Save predictions hourly
  SELECT jobid INTO existing_jobid FROM cron.job WHERE jobname = 'save-predictions-hourly';
  IF existing_jobid IS NOT NULL THEN
    PERFORM cron.unschedule(existing_jobid);
  END IF;
  PERFORM cron.schedule(
    'save-predictions-hourly',
    '0 * * * *',
    $job$SELECT public.trigger_save_predictions();$job$
  );

  -- Grade predictions every 15 minutes
  SELECT jobid INTO existing_jobid FROM cron.job WHERE jobname = 'grade-predictions-15min';
  IF existing_jobid IS NOT NULL THEN
    PERFORM cron.unschedule(existing_jobid);
  END IF;
  PERFORM cron.schedule(
    'grade-predictions-15min',
    '*/15 * * * *',
    $job$SELECT public.trigger_grade_predictions();$job$
  );
END;
$do$;