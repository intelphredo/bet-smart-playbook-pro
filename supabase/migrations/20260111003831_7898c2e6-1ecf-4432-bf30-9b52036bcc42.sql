-- Create a view for CLV leaderboard (aggregates user CLV performance)
CREATE OR REPLACE VIEW public.clv_leaderboard AS
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

-- Create RLS policy for the view (views inherit from underlying tables)
-- The view is readable because user_bets and profiles have SELECT policies

-- Create a table to track line movement history for alerts
CREATE TABLE public.line_movement_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id TEXT NOT NULL,
  match_title TEXT,
  league TEXT,
  sportsbook_id TEXT NOT NULL,
  market_type TEXT NOT NULL DEFAULT 'moneyline',
  previous_odds JSONB NOT NULL,
  current_odds JSONB NOT NULL,
  movement_percentage NUMERIC,
  movement_direction TEXT CHECK (movement_direction IN ('steam', 'reverse', 'stable')),
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  alerts_sent BOOLEAN NOT NULL DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE public.line_movement_tracking ENABLE ROW LEVEL SECURITY;

-- Anyone can read line movements
CREATE POLICY "Anyone can view line movements"
  ON public.line_movement_tracking
  FOR SELECT
  USING (true);

-- Service role can insert
CREATE POLICY "Service role can insert line movements"
  ON public.line_movement_tracking
  FOR INSERT
  WITH CHECK (true);

-- Service role can update
CREATE POLICY "Service role can update line movements"
  ON public.line_movement_tracking
  FOR UPDATE
  USING (true);

-- Add index for faster lookups
CREATE INDEX idx_line_movement_match_id ON public.line_movement_tracking(match_id);
CREATE INDEX idx_line_movement_detected_at ON public.line_movement_tracking(detected_at DESC);