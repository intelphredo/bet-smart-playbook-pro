-- Schedule odds recorder to run every 15 minutes
SELECT cron.schedule(
  'record-odds-job',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://pyknizknsygpmodoioae.supabase.co/functions/v1/scheduled-odds-recorder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Also add the scheduler-master job that can orchestrate multiple tasks (every 30 minutes)
SELECT cron.schedule(
  'scheduler-master-job',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://pyknizknsygpmodoioae.supabase.co/functions/v1/scheduler-master',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{"tasks": ["record-odds", "line-detector"]}'::jsonb
  );
  $$
);