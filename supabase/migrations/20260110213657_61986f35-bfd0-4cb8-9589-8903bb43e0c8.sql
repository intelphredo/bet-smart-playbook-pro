-- Odds history table for tracking odds changes over time
CREATE TABLE public.odds_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id TEXT NOT NULL,
  match_title TEXT,
  league TEXT,
  sportsbook_id TEXT NOT NULL,
  sportsbook_name TEXT NOT NULL,
  market_type TEXT NOT NULL DEFAULT 'moneyline' CHECK (market_type IN ('moneyline', 'spread', 'total')),
  home_odds DECIMAL,
  away_odds DECIMAL,
  draw_odds DECIMAL,
  spread_home DECIMAL,
  spread_away DECIMAL,
  spread_home_odds DECIMAL,
  spread_away_odds DECIMAL,
  total_line DECIMAL,
  over_odds DECIMAL,
  under_odds DECIMAL,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (public read for odds data)
ALTER TABLE public.odds_history ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read odds history (public data)
CREATE POLICY "Anyone can read odds history"
  ON public.odds_history FOR SELECT
  USING (true);

-- Only service role can insert (edge function)
CREATE POLICY "Service role can insert odds history"
  ON public.odds_history FOR INSERT
  WITH CHECK (true);

-- Indexes for efficient querying
CREATE INDEX idx_odds_history_match_id ON public.odds_history(match_id);
CREATE INDEX idx_odds_history_recorded_at ON public.odds_history(recorded_at DESC);
CREATE INDEX idx_odds_history_match_sportsbook ON public.odds_history(match_id, sportsbook_id, recorded_at DESC);
CREATE INDEX idx_odds_history_league ON public.odds_history(league);

-- Function to clean up old odds history (keep last 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_odds_history()
RETURNS void AS $$
BEGIN
  DELETE FROM public.odds_history
  WHERE recorded_at < now() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;