-- Drop the view since it triggers security definer warning
-- The function approach is sufficient and more secure
DROP VIEW IF EXISTS public.clv_leaderboard;

-- The view was created to reference the SECURITY DEFINER function
-- which causes the linter to flag it. We'll just use the function directly.

-- Recreate a simple SECURITY INVOKER view for backward compatibility
-- that just aggregates anonymized public data (no user identification)
CREATE OR REPLACE VIEW public.clv_leaderboard 
WITH (security_invoker = true)
AS
SELECT 
  NULL::uuid AS user_id,
  CASE
    WHEN p.full_name IS NOT NULL THEN LEFT(p.full_name, 1) || '***'
    ELSE 'Anonymous'
  END AS display_name,
  NULL::text AS full_name,
  NULL::text AS avatar_url,
  ub.total_bets_with_clv,
  ub.avg_clv,
  ub.median_clv,
  ub.positive_clv_bets,
  ub.positive_clv_rate,
  ub.best_clv,
  ub.worst_clv,
  ub.total_profit,
  ub.roi_percentage
FROM (
  SELECT 
    user_bets.user_id,
    COUNT(*) FILTER (WHERE user_bets.clv_percentage IS NOT NULL) AS total_bets_with_clv,
    ROUND(AVG(user_bets.clv_percentage), 2) AS avg_clv,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY user_bets.clv_percentage)::numeric, 2) AS median_clv,
    COUNT(*) FILTER (WHERE user_bets.clv_percentage > 0) AS positive_clv_bets,
    ROUND(
      (COUNT(*) FILTER (WHERE user_bets.clv_percentage > 0)::numeric / 
       NULLIF(COUNT(*) FILTER (WHERE user_bets.clv_percentage IS NOT NULL), 0)::numeric) * 100, 
      1
    ) AS positive_clv_rate,
    MAX(user_bets.clv_percentage) AS best_clv,
    MIN(user_bets.clv_percentage) AS worst_clv,
    ROUND(SUM(user_bets.result_profit), 2) AS total_profit,
    ROUND(
      (SUM(user_bets.result_profit) / NULLIF(SUM(user_bets.stake), 0)) * 100, 
      2
    ) AS roi_percentage
  FROM user_bets
  WHERE user_bets.status IN ('won', 'lost')
  GROUP BY user_bets.user_id
  HAVING COUNT(*) FILTER (WHERE user_bets.clv_percentage IS NOT NULL) >= 5
) ub
LEFT JOIN profiles p ON p.id = ub.user_id
ORDER BY ub.avg_clv DESC NULLS LAST
LIMIT 100;

-- Add comment explaining the security measures
COMMENT ON VIEW public.clv_leaderboard IS 'Anonymized CLV leaderboard. User IDs, full names, and avatars are nulled out. Display names show only first initial for privacy.';