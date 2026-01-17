-- Fix overly permissive INSERT policy on calibration_history
-- Drop the existing policy
DROP POLICY IF EXISTS "Authenticated users can insert calibration history" ON public.calibration_history;

-- Create a proper policy that checks the user is authenticated
-- Since calibration_history doesn't have a user_id column, we restrict to service role
-- which is appropriate for system-generated calibration data
CREATE POLICY "Service role can insert calibration history" 
ON public.calibration_history 
FOR INSERT 
WITH CHECK (
  ((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role') = 'service_role'
);

-- Add comment for documentation
COMMENT ON POLICY "Service role can insert calibration history" ON public.calibration_history IS 'Only service role can insert calibration history records. This data is system-generated.';