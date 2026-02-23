-- Fix: Drop the restrictive SELECT policy and recreate as permissive
DROP POLICY IF EXISTS "Anyone can view predictions" ON public.algorithm_predictions;
CREATE POLICY "Anyone can view predictions"
  ON public.algorithm_predictions
  FOR SELECT
  USING (true);
