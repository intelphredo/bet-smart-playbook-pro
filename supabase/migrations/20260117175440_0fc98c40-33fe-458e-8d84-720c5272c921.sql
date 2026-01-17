-- Fix: Add authorization check to increment_usage function
-- This ensures users can only increment their own usage, not other users'

CREATE OR REPLACE FUNCTION public.increment_usage(
  p_user_id UUID,
  p_feature_name TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usage_count INTEGER;
BEGIN
  -- Security check: Verify the caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Security check: Users can only increment their own usage
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot modify another user''s usage';
  END IF;
  
  -- Insert or update the usage record
  INSERT INTO public.usage_tracking (user_id, feature_name, usage_count, usage_date)
  VALUES (p_user_id, p_feature_name, 1, CURRENT_DATE)
  ON CONFLICT (user_id, feature_name, usage_date)
  DO UPDATE SET 
    usage_count = usage_tracking.usage_count + 1,
    updated_at = now()
  RETURNING usage_count INTO v_usage_count;
  
  RETURN v_usage_count;
END;
$$;

-- Fix: Restrict algorithm_stats management to service role only
DROP POLICY IF EXISTS "Authenticated users can manage stats" ON public.algorithm_stats;

CREATE POLICY "Service role can manage algorithm stats" 
ON public.algorithm_stats 
FOR ALL 
USING (
  (SELECT auth.jwt() ->> 'role') = 'service_role'
);

-- Fix: Restrict algorithm creation to service role only (algorithms are system-managed)
DROP POLICY IF EXISTS "Authenticated users can create algorithms" ON public.algorithms;

CREATE POLICY "Service role can create algorithms" 
ON public.algorithms 
FOR INSERT 
WITH CHECK (
  (SELECT auth.jwt() ->> 'role') = 'service_role'
);