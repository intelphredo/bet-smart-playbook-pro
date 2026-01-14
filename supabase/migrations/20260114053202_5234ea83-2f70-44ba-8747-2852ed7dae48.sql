-- Create a scheduled job to save predictions every 6 hours
SELECT cron.schedule(
  'save-predictions-job',
  '0 */6 * * *',  -- Every 6 hours at minute 0
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/save-predictions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object(
      'leagues', ARRAY['NBA', 'NFL', 'MLB', 'NHL', 'NCAAB', 'NCAAF', 'SOCCER']
    )
  );
  $$
);