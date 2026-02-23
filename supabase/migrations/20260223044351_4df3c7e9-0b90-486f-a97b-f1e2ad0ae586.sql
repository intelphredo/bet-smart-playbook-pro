
-- Add statement_timeout to heavy SQL functions

-- get_clv_leaderboard: complex aggregation with window functions
CREATE OR REPLACE FUNCTION public.get_clv_leaderboard()
 RETURNS TABLE(rank_position bigint, display_name text, total_bets_with_clv bigint, avg_clv numeric, median_clv numeric, positive_clv_bets bigint, positive_clv_rate numeric, best_clv numeric, worst_clv numeric, total_profit numeric, roi_percentage numeric, is_current_user boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 SET statement_timeout TO '10s'
 SET work_mem TO '8MB'
AS $function$
DECLARE
  current_user_id uuid;
BEGIN
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
      WHEN rd.user_id = current_user_id THEN COALESCE(rd.full_name, 'You')
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
$function$;

-- recalculate_user_betting_stats: iterates all user bets with streak calculation
CREATE OR REPLACE FUNCTION public.recalculate_user_betting_stats(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 SET statement_timeout TO '10s'
 SET work_mem TO '4MB'
AS $function$
DECLARE
  v_total_bets INTEGER;
  v_pending_bets INTEGER;
  v_wins INTEGER;
  v_losses INTEGER;
  v_pushes INTEGER;
  v_total_staked NUMERIC;
  v_total_profit NUMERIC;
  v_avg_odds NUMERIC;
  v_avg_clv NUMERIC;
  v_best_streak INTEGER := 0;
  v_current_streak INTEGER := 0;
  v_last_result TEXT;
  v_bet RECORD;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'won'),
    COUNT(*) FILTER (WHERE status = 'lost'),
    COUNT(*) FILTER (WHERE status = 'push'),
    COALESCE(SUM(stake), 0),
    COALESCE(SUM(result_profit), 0),
    COALESCE(AVG(odds_at_placement), 0),
    COALESCE(AVG(clv_percentage) FILTER (WHERE clv_percentage IS NOT NULL), 0)
  INTO v_total_bets, v_pending_bets, v_wins, v_losses, v_pushes, v_total_staked, v_total_profit, v_avg_odds, v_avg_clv
  FROM public.user_bets
  WHERE user_id = p_user_id;

  FOR v_bet IN 
    SELECT status FROM public.user_bets 
    WHERE user_id = p_user_id AND status IN ('won', 'lost')
    ORDER BY settled_at DESC NULLS LAST, placed_at DESC
  LOOP
    IF v_bet.status = 'won' THEN
      IF v_last_result IS NULL OR v_last_result = 'won' THEN
        v_current_streak := v_current_streak + 1;
        IF v_current_streak > v_best_streak THEN
          v_best_streak := v_current_streak;
        END IF;
      ELSE
        v_current_streak := 1;
      END IF;
      v_last_result := 'won';
    ELSE
      IF v_last_result IS NULL OR v_last_result = 'lost' THEN
        v_current_streak := v_current_streak - 1;
      ELSE
        v_current_streak := -1;
      END IF;
      v_last_result := 'lost';
    END IF;
  END LOOP;

  INSERT INTO public.user_betting_stats (
    user_id, total_bets, pending_bets, wins, losses, pushes,
    total_staked, total_profit, roi_percentage, avg_odds, avg_clv,
    best_streak, current_streak, last_updated
  ) VALUES (
    p_user_id, v_total_bets, v_pending_bets, v_wins, v_losses, v_pushes,
    v_total_staked, v_total_profit,
    CASE WHEN v_total_staked > 0 THEN (v_total_profit / v_total_staked) * 100 ELSE 0 END,
    v_avg_odds, v_avg_clv, v_best_streak, v_current_streak, now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_bets = EXCLUDED.total_bets,
    pending_bets = EXCLUDED.pending_bets,
    wins = EXCLUDED.wins,
    losses = EXCLUDED.losses,
    pushes = EXCLUDED.pushes,
    total_staked = EXCLUDED.total_staked,
    total_profit = EXCLUDED.total_profit,
    roi_percentage = EXCLUDED.roi_percentage,
    avg_odds = EXCLUDED.avg_odds,
    avg_clv = EXCLUDED.avg_clv,
    best_streak = EXCLUDED.best_streak,
    current_streak = EXCLUDED.current_streak,
    last_updated = now();
END;
$function$;

-- cleanup_old_job_logs: scans potentially large table
CREATE OR REPLACE FUNCTION public.cleanup_old_job_logs()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 SET statement_timeout TO '15s'
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  IF ((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role') != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: service role required';
  END IF;

  DELETE FROM public.scheduled_job_logs
  WHERE started_at < now() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$;

-- cleanup_old_odds_history: deletes from large table
CREATE OR REPLACE FUNCTION public.cleanup_old_odds_history()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 SET statement_timeout TO '30s'
AS $function$
BEGIN
  IF ((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role') != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: service role required';
  END IF;

  DELETE FROM public.odds_history
  WHERE recorded_at < now() - INTERVAL '7 days';
END;
$function$;

-- update_betting_stats trigger function
CREATE OR REPLACE FUNCTION public.update_betting_stats()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 SET statement_timeout TO '10s'
AS $function$
BEGIN
  INSERT INTO public.user_betting_stats (user_id, total_bets, pending_bets, wins, losses, pushes, total_staked, total_profit, roi_percentage, avg_odds, last_updated)
  SELECT 
    COALESCE(NEW.user_id, OLD.user_id),
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'won'),
    COUNT(*) FILTER (WHERE status = 'lost'),
    COUNT(*) FILTER (WHERE status = 'push'),
    COALESCE(SUM(stake), 0),
    COALESCE(SUM(result_profit), 0),
    CASE 
      WHEN SUM(stake) > 0 THEN ROUND((SUM(result_profit) / SUM(stake)) * 100, 2)
      ELSE 0
    END,
    ROUND(AVG(odds_at_placement), 2),
    now()
  FROM public.user_bets
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
  ON CONFLICT (user_id) 
  DO UPDATE SET
    total_bets = EXCLUDED.total_bets,
    pending_bets = EXCLUDED.pending_bets,
    wins = EXCLUDED.wins,
    losses = EXCLUDED.losses,
    pushes = EXCLUDED.pushes,
    total_staked = EXCLUDED.total_staked,
    total_profit = EXCLUDED.total_profit,
    roi_percentage = EXCLUDED.roi_percentage,
    avg_odds = EXCLUDED.avg_odds,
    last_updated = now();
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;
