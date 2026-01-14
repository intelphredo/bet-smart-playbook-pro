-- Fix security issues for views and tables

-- 1. Recreate clv_leaderboard view with proper type casting and security
DROP VIEW IF EXISTS public.clv_leaderboard;

CREATE OR REPLACE VIEW public.clv_leaderboard 
WITH (security_invoker = true)
AS
SELECT 
  NULL::uuid as user_id,
  ub.total_bets_with_clv,
  ub.avg_clv,
  ub.median_clv,
  ub.positive_clv_bets,
  ub.positive_clv_rate,
  ub.best_clv,
  ub.worst_clv,
  ub.total_profit,
  ub.roi_percentage,
  CASE 
    WHEN p.full_name IS NOT NULL THEN LEFT(p.full_name, 1) || '***'
    ELSE 'User'
  END as display_name,
  NULL::text as full_name,
  NULL::text as avatar_url
FROM (
  SELECT 
    user_id,
    COUNT(*) FILTER (WHERE clv_percentage IS NOT NULL) as total_bets_with_clv,
    ROUND(AVG(clv_percentage)::numeric, 2) as avg_clv,
    ROUND((PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY clv_percentage))::numeric, 2) as median_clv,
    COUNT(*) FILTER (WHERE clv_percentage > 0) as positive_clv_bets,
    ROUND(COUNT(*) FILTER (WHERE clv_percentage > 0)::numeric / NULLIF(COUNT(*) FILTER (WHERE clv_percentage IS NOT NULL), 0) * 100, 1) as positive_clv_rate,
    MAX(clv_percentage) as best_clv,
    MIN(clv_percentage) as worst_clv,
    ROUND(SUM(result_profit)::numeric, 2) as total_profit,
    ROUND(SUM(result_profit)::numeric / NULLIF(SUM(stake), 0) * 100, 2) as roi_percentage
  FROM public.user_bets
  WHERE status IN ('won', 'lost')
  GROUP BY user_id
  HAVING COUNT(*) FILTER (WHERE clv_percentage IS NOT NULL) >= 5
) ub
LEFT JOIN public.profiles p ON p.id = ub.user_id
ORDER BY ub.avg_clv DESC NULLS LAST
LIMIT 100;

-- 2. Recreate sharp_money_stats view with security invoker
DROP VIEW IF EXISTS public.sharp_money_stats;

CREATE OR REPLACE VIEW public.sharp_money_stats
WITH (security_invoker = true)
AS
SELECT 
  league,
  signal_type,
  signal_strength,
  market_type,
  COUNT(*) as total_predictions,
  COUNT(*) FILTER (WHERE game_result = 'won') as wins,
  COUNT(*) FILTER (WHERE game_result = 'lost') as losses,
  COUNT(*) FILTER (WHERE game_result = 'push') as pushes,
  COUNT(*) FILTER (WHERE game_result = 'pending' OR game_result IS NULL) as pending,
  ROUND(AVG(confidence)::numeric, 1) as avg_confidence,
  ROUND(
    COUNT(*) FILTER (WHERE game_result = 'won')::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE game_result IN ('won', 'lost')), 0) * 100, 
    1
  ) as win_rate,
  COUNT(*) FILTER (WHERE beat_closing_line = true) as beat_closing_count,
  ROUND(
    COUNT(*) FILTER (WHERE beat_closing_line = true)::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE beat_closing_line IS NOT NULL), 0) * 100,
    1
  ) as clv_rate
FROM public.sharp_money_predictions
GROUP BY league, signal_type, signal_strength, market_type;

-- 3. Create secure wrapper function for cron_job_status
CREATE OR REPLACE FUNCTION public.get_cron_job_status()
RETURNS TABLE (
  jobname text,
  schedule text,
  active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: service role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    cjs.jobname::text,
    cjs.schedule::text,
    cjs.active
  FROM public.cron_job_status cjs;
END;
$$;

-- 4. Revoke direct access to cron_job_status view from public
REVOKE ALL ON public.cron_job_status FROM anon, authenticated;