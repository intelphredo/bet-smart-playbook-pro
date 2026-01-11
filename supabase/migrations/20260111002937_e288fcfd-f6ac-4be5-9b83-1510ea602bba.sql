-- Create user_alerts table for notifications
CREATE TABLE public.user_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bet_result', 'line_movement', 'arbitrage', 'game_start', 'clv_update', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  match_id TEXT,
  bet_id UUID,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_alerts
ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_alerts
CREATE POLICY "Users can view their own alerts"
  ON public.user_alerts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
  ON public.user_alerts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
  ON public.user_alerts
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert alerts"
  ON public.user_alerts
  FOR INSERT
  WITH CHECK (true);

-- Enable realtime for user_alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_alerts;

-- Create function to recalculate user betting stats
CREATE OR REPLACE FUNCTION public.recalculate_user_betting_stats(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  -- Calculate aggregate stats
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

  -- Calculate streaks
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

  -- Upsert stats
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
$$;

-- Create trigger to auto-update stats when bets change
CREATE OR REPLACE FUNCTION public.trigger_update_betting_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_user_betting_stats(OLD.user_id);
    RETURN OLD;
  ELSE
    PERFORM public.recalculate_user_betting_stats(NEW.user_id);
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER update_betting_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.user_bets
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_betting_stats();

-- Add unique constraint on user_betting_stats.user_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_betting_stats_user_id_key'
  ) THEN
    ALTER TABLE public.user_betting_stats ADD CONSTRAINT user_betting_stats_user_id_key UNIQUE (user_id);
  END IF;
END $$;