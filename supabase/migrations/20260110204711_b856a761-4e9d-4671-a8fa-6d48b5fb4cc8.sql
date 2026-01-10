-- Remove the overly permissive policy
DROP POLICY IF EXISTS "Service role can manage predictions" ON public.algorithm_predictions;