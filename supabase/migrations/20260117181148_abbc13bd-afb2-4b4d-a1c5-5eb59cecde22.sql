-- Drop the existing view
DROP VIEW IF EXISTS public.clv_leaderboard;

-- Create a materialized approach using a security definer function
-- that returns anonymized leaderboard data
CREATE OR REPLACE FUNCTION public.get_clv_leaderboard()
RETURNS TABLE (
  rank_position bigint,
  display_name text,
  total_bets_with_clv bigint,
  avg_clv numeric,
  median_clv numeric,
  positive_clv_bets bigint,
  positive_clv_rate numeric,
  best_clv numeric,
  worst_clv numeric,
  total_profit numeric,
  roi_percentage numeric,
  is_current_user boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current authenticated user (if any)
  current_user_id := auth.uid();
  
  RETURN QUERY
  WITH leaderboard_data AS (
    SELECT 
      ub.user_id,
      COUNT(*) FILTER (WHERE ub.clv_percentage IS NOT NULL) AS total_bets_with_clv,
      ROUND(AVG(ub.clv_percentage), 2) AS avg_clv,
      ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ub.clv_percentage)::numeric, 2) AS median_clv,
      COUNT(*) FILTER (WHERE ub.clv_percentage > 0) AS positive_clv_bets,
      ROUND(
        (COUNT(*) FILTER (WHERE ub.clv_percentage > 0)::numeric / 
         NULLIF(COUNT(*) FILTER (WHERE ub.clv_percentage IS NOT NULL), 0)::numeric) * 100, 
        1
      ) AS positive_clv_rate,
      MAX(ub.clv_percentage) AS best_clv,
      MIN(ub.clv_percentage) AS worst_clv,
      ROUND(SUM(ub.result_profit), 2) AS total_profit,
      ROUND(
        (SUM(ub.result_profit) / NULLIF(SUM(ub.stake), 0)) * 100, 
        2
      ) AS roi_percentage
    FROM user_bets ub
    WHERE ub.status IN ('won', 'lost')
    GROUP BY ub.user_id
    HAVING COUNT(*) FILTER (WHERE ub.clv_percentage IS NOT NULL) >= 5
  ),
  ranked_data AS (
    SELECT 
      ld.*,
      ROW_NUMBER() OVER (ORDER BY ld.avg_clv DESC NULLS LAST) AS rank_pos,
      p.full_name
    FROM leaderboard_data ld
    LEFT JOIN profiles p ON p.id = ld.user_id
  )
  SELECT 
    rd.rank_pos AS rank_position,
    CASE
      -- Show full name only to the user themselves
      WHEN rd.user_id = current_user_id THEN COALESCE(rd.full_name, 'You')
      -- Anonymize for others
      WHEN rd.full_name IS NOT NULL THEN LEFT(rd.full_name, 1) || '***'
      ELSE 'Anonymous'
    END AS display_name,
    rd.total_bets_with_clv,
    rd.avg_clv,
    rd.median_clv,
    rd.positive_clv_bets,
    rd.positive_clv_rate,
    rd.best_clv,
    rd.worst_clv,
    rd.total_profit,
    rd.roi_percentage,
    (rd.user_id = current_user_id) AS is_current_user
  FROM ranked_data rd
  ORDER BY rd.rank_pos
  LIMIT 100;
END;
$$;

-- Revoke direct access and only allow execution
REVOKE ALL ON FUNCTION public.get_clv_leaderboard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_clv_leaderboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_clv_leaderboard() TO anon;

-- Recreate the view for backward compatibility, but it will use the function
-- This ensures existing code continues to work
CREATE OR REPLACE VIEW public.clv_leaderboard AS
SELECT 
  NULL::uuid AS user_id,
  display_name,
  NULL::text AS full_name,
  NULL::text AS avatar_url,
  total_bets_with_clv,
  avg_clv,
  median_clv,
  positive_clv_bets,
  positive_clv_rate,
  best_clv,
  worst_clv,
  total_profit,
  roi_percentage
FROM public.get_clv_leaderboard();

-- Add comment for documentation
COMMENT ON FUNCTION public.get_clv_leaderboard() IS 'Returns anonymized CLV leaderboard data. User identities are masked except for the current authenticated user viewing their own data.';