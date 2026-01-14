-- Create rate limiting table for API protection
CREATE TABLE IF NOT EXISTS public.rate_limit_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,  -- IP address or user_id
  endpoint text NOT NULL,     -- Which endpoint was accessed
  request_count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(identifier, endpoint, window_start)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_lookup 
ON public.rate_limit_tracking(identifier, endpoint, window_start);

-- Enable RLS
ALTER TABLE public.rate_limit_tracking ENABLE ROW LEVEL SECURITY;

-- Only service role can manage rate limits
CREATE POLICY "Service role manages rate limits"
ON public.rate_limit_tracking
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Function to check and update rate limit (returns true if allowed, false if rate limited)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_endpoint text,
  p_max_requests integer DEFAULT 60,
  p_window_minutes integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamp with time zone;
  v_current_count integer;
BEGIN
  -- Calculate window start (floor to the minute for the window)
  v_window_start := date_trunc('minute', now()) - 
    (EXTRACT(minute FROM now())::integer % p_window_minutes) * interval '1 minute';
  
  -- Try to insert or update the rate limit record
  INSERT INTO public.rate_limit_tracking (identifier, endpoint, request_count, window_start)
  VALUES (p_identifier, p_endpoint, 1, v_window_start)
  ON CONFLICT (identifier, endpoint, window_start)
  DO UPDATE SET request_count = rate_limit_tracking.request_count + 1
  RETURNING request_count INTO v_current_count;
  
  -- Check if over limit
  RETURN v_current_count <= p_max_requests;
END;
$$;

-- Function to clean up old rate limit records (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limit_tracking
  WHERE window_start < now() - interval '1 hour';
END;
$$;

-- Schedule cleanup every hour
SELECT cron.schedule(
  'cleanup-rate-limits',
  '0 * * * *',
  'SELECT public.cleanup_rate_limits();'
);