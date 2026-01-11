-- Fix the security definer view issue by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.clv_leaderboard;

CREATE VIEW public.clv_leaderboard
WITH (security_invoker = true) AS
SELECT 
  ub.user_id,
  p.full_name,
  COALESCE(LEFT(p.full_name, 1) || '***' || RIGHT(p.full_name, 1), 'Anonymous') as display_name,
  p.avatar_url,
  COUNT(*) as total_bets_with_clv,
  ROUND(AVG(ub.clv_percentage)::numeric, 2) as avg_clv,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ub.clv_percentage)::numeric, 2) as median_clv,
  COUNT(*) FILTER (WHERE ub.clv_percentage > 0) as positive_clv_bets,
  ROUND((COUNT(*) FILTER (WHERE ub.clv_percentage > 0)::numeric / COUNT(*)::numeric * 100), 1) as positive_clv_rate,
  MAX(ub.clv_percentage) as best_clv,
  MIN(ub.clv_percentage) as worst_clv,
  SUM(ub.result_profit) as total_profit,
  ROUND((SUM(ub.result_profit) / NULLIF(SUM(ub.stake), 0) * 100)::numeric, 2) as roi_percentage
FROM public.user_bets ub
JOIN public.profiles p ON ub.user_id = p.id
WHERE ub.clv_percentage IS NOT NULL
GROUP BY ub.user_id, p.full_name, p.avatar_url
HAVING COUNT(*) >= 5
ORDER BY AVG(ub.clv_percentage) DESC;