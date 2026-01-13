-- Fix remaining views with SECURITY INVOKER

-- Recreate clv_leaderboard with security_invoker
DROP VIEW IF EXISTS public.clv_leaderboard;
CREATE VIEW public.clv_leaderboard WITH (security_invoker = true) AS
SELECT 
    ub.user_id,
    p.full_name,
    COALESCE((left(p.full_name, 1) || '***'::text) || right(p.full_name, 1), 'Anonymous'::text) AS display_name,
    p.avatar_url,
    count(*) AS total_bets_with_clv,
    round(avg(ub.clv_percentage), 2) AS avg_clv,
    round(percentile_cont(0.5::double precision) WITHIN GROUP (ORDER BY (ub.clv_percentage::double precision))::numeric, 2) AS median_clv,
    count(*) FILTER (WHERE ub.clv_percentage > 0::numeric) AS positive_clv_bets,
    round(count(*) FILTER (WHERE ub.clv_percentage > 0::numeric)::numeric / count(*)::numeric * 100::numeric, 1) AS positive_clv_rate,
    max(ub.clv_percentage) AS best_clv,
    min(ub.clv_percentage) AS worst_clv,
    sum(ub.result_profit) AS total_profit,
    round(sum(ub.result_profit) / NULLIF(sum(ub.stake), 0::numeric) * 100::numeric, 2) AS roi_percentage
FROM user_bets ub
JOIN profiles p ON ub.user_id = p.id
WHERE ub.clv_percentage IS NOT NULL
GROUP BY ub.user_id, p.full_name, p.avatar_url
HAVING count(*) >= 5
ORDER BY avg(ub.clv_percentage) DESC;

-- Recreate sharp_money_stats with security_invoker
DROP VIEW IF EXISTS public.sharp_money_stats;
CREATE VIEW public.sharp_money_stats WITH (security_invoker = true) AS
SELECT 
    signal_type,
    league,
    market_type,
    signal_strength,
    count(*) AS total_predictions,
    count(*) FILTER (WHERE game_result = 'won') AS wins,
    count(*) FILTER (WHERE game_result = 'lost') AS losses,
    count(*) FILTER (WHERE game_result = 'push') AS pushes,
    count(*) FILTER (WHERE game_result = 'pending') AS pending,
    round(
        CASE
            WHEN count(*) FILTER (WHERE game_result IN ('won', 'lost')) > 0 
            THEN count(*) FILTER (WHERE game_result = 'won')::numeric / 
                 count(*) FILTER (WHERE game_result IN ('won', 'lost'))::numeric * 100
            ELSE 0
        END, 1) AS win_rate,
    round(avg(confidence), 1) AS avg_confidence,
    count(*) FILTER (WHERE beat_closing_line = true) AS beat_closing_count,
    round(
        CASE
            WHEN count(*) FILTER (WHERE closing_line IS NOT NULL) > 0 
            THEN count(*) FILTER (WHERE beat_closing_line = true)::numeric / 
                 count(*) FILTER (WHERE closing_line IS NOT NULL)::numeric * 100
            ELSE 0
        END, 1) AS clv_rate
FROM sharp_money_predictions
GROUP BY signal_type, league, market_type, signal_strength;