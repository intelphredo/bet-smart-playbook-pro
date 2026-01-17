-- Add proper authorization checks to SECURITY DEFINER functions

-- Fix get_daily_usage: Users should only query their own usage
CREATE OR REPLACE FUNCTION public.get_daily_usage(p_user_id uuid, p_feature_name text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Security check: Verify the caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Security check: Users can only query their own usage
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot access another user''s usage';
  END IF;

  SELECT usage_count INTO v_count
  FROM public.usage_tracking
  WHERE user_id = p_user_id 
    AND feature_name = p_feature_name 
    AND usage_date = CURRENT_DATE;
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Fix cleanup_old_job_logs: Should only be callable by service role
CREATE OR REPLACE FUNCTION public.cleanup_old_job_logs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Security check: Only service role can run cleanup
  IF ((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role') != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: service role required';
  END IF;

  DELETE FROM public.scheduled_job_logs
  WHERE started_at < now() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Fix cleanup_old_odds_history: Should only be callable by service role
CREATE OR REPLACE FUNCTION public.cleanup_old_odds_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security check: Only service role can run cleanup
  IF ((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role') != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: service role required';
  END IF;

  DELETE FROM public.odds_history
  WHERE recorded_at < now() - INTERVAL '7 days';
END;
$$;

-- Fix cleanup_rate_limits: Should only be callable by service role
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security check: Only service role can run cleanup
  IF ((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role') != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: service role required';
  END IF;

  DELETE FROM public.rate_limit_tracking
  WHERE window_start < now() - interval '1 hour';
END;
$$;

-- Fix clean_expired_weather_cache: Should only be callable by service role
CREATE OR REPLACE FUNCTION public.clean_expired_weather_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security check: Only service role can run cleanup
  IF ((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role') != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: service role required';
  END IF;

  DELETE FROM public.weather_cache WHERE expires_at < now();
END;
$$;

-- Drop existing check_rate_limit function to recreate with auth checks
DROP FUNCTION IF EXISTS public.check_rate_limit(text, text, integer, integer);

-- Recreate check_rate_limit with proper auth checks
CREATE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_endpoint text,
  p_max_requests integer DEFAULT 100,
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
  -- Security check: Require authentication OR service role
  -- Allow service role for backend-initiated checks
  IF auth.uid() IS NULL AND ((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role') != 'service_role' THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

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

-- Add comments for documentation
COMMENT ON FUNCTION public.get_daily_usage IS 'Get daily usage count for a specific feature. Requires authentication and can only query own usage.';
COMMENT ON FUNCTION public.cleanup_old_job_logs IS 'Clean up old job logs. Requires service role.';
COMMENT ON FUNCTION public.cleanup_old_odds_history IS 'Clean up old odds history. Requires service role.';
COMMENT ON FUNCTION public.cleanup_rate_limits IS 'Clean up old rate limit records. Requires service role.';
COMMENT ON FUNCTION public.clean_expired_weather_cache IS 'Clean expired weather cache entries. Requires service role.';
COMMENT ON FUNCTION public.check_rate_limit IS 'Check and update rate limit for an identifier. Requires authentication or service role.';