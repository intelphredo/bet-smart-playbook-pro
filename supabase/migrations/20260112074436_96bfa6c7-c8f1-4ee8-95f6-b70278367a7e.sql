-- Sharp Money Predictions Tracking Table
CREATE TABLE public.sharp_money_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id TEXT NOT NULL,
  match_title TEXT NOT NULL,
  league TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  
  -- Sharp prediction details
  signal_type TEXT NOT NULL, -- 'reverse_line', 'steam_move', 'line_freeze', 'whale_bet', 'syndicate_play'
  signal_strength TEXT NOT NULL DEFAULT 'moderate', -- 'weak', 'moderate', 'strong'
  sharp_side TEXT NOT NULL, -- 'home', 'away', 'over', 'under'
  market_type TEXT NOT NULL DEFAULT 'spread', -- 'spread', 'moneyline', 'total'
  confidence INTEGER NOT NULL DEFAULT 50,
  
  -- Odds at detection
  opening_line NUMERIC,
  detection_line NUMERIC,
  closing_line NUMERIC,
  
  -- Betting percentages
  public_pct_at_detection NUMERIC,
  sharp_pct_at_detection NUMERIC,
  
  -- Outcome tracking
  game_start_time TIMESTAMPTZ,
  game_result TEXT, -- 'pending', 'won', 'lost', 'push'
  result_verified_at TIMESTAMPTZ,
  actual_score_home INTEGER,
  actual_score_away INTEGER,
  beat_closing_line BOOLEAN,
  
  -- Metadata
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sharp_money_predictions ENABLE ROW LEVEL SECURITY;

-- Public read access for leaderboard
CREATE POLICY "Sharp money predictions are viewable by everyone"
ON public.sharp_money_predictions
FOR SELECT
USING (true);

-- Only service role can insert/update (edge functions)
CREATE POLICY "Service role can manage sharp money predictions"
ON public.sharp_money_predictions
FOR ALL
USING (auth.role() = 'service_role');

-- Create indexes
CREATE INDEX idx_sharp_predictions_match ON public.sharp_money_predictions(match_id);
CREATE INDEX idx_sharp_predictions_league ON public.sharp_money_predictions(league);
CREATE INDEX idx_sharp_predictions_signal ON public.sharp_money_predictions(signal_type);
CREATE INDEX idx_sharp_predictions_result ON public.sharp_money_predictions(game_result);
CREATE INDEX idx_sharp_predictions_detected ON public.sharp_money_predictions(detected_at DESC);

-- Sharp Money Stats View for leaderboard
CREATE OR REPLACE VIEW public.sharp_money_stats AS
SELECT 
  signal_type,
  league,
  market_type,
  signal_strength,
  COUNT(*) as total_predictions,
  COUNT(*) FILTER (WHERE game_result = 'won') as wins,
  COUNT(*) FILTER (WHERE game_result = 'lost') as losses,
  COUNT(*) FILTER (WHERE game_result = 'push') as pushes,
  COUNT(*) FILTER (WHERE game_result = 'pending') as pending,
  ROUND(
    CASE 
      WHEN COUNT(*) FILTER (WHERE game_result IN ('won', 'lost')) > 0 
      THEN (COUNT(*) FILTER (WHERE game_result = 'won')::NUMERIC / 
            COUNT(*) FILTER (WHERE game_result IN ('won', 'lost'))::NUMERIC) * 100
      ELSE 0 
    END, 1
  ) as win_rate,
  ROUND(AVG(confidence), 1) as avg_confidence,
  COUNT(*) FILTER (WHERE beat_closing_line = true) as beat_closing_count,
  ROUND(
    CASE 
      WHEN COUNT(*) FILTER (WHERE closing_line IS NOT NULL) > 0
      THEN (COUNT(*) FILTER (WHERE beat_closing_line = true)::NUMERIC /
            COUNT(*) FILTER (WHERE closing_line IS NOT NULL)::NUMERIC) * 100
      ELSE 0
    END, 1
  ) as clv_rate
FROM public.sharp_money_predictions
GROUP BY signal_type, league, market_type, signal_strength;

-- Trigger for updated_at
CREATE TRIGGER update_sharp_predictions_updated_at
BEFORE UPDATE ON public.sharp_money_predictions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();