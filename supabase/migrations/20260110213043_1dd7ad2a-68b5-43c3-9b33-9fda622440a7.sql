-- User bets table for tracking all placed bets
CREATE TABLE public.user_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  match_id TEXT NOT NULL,
  match_title TEXT NOT NULL,
  league TEXT,
  bet_type TEXT NOT NULL CHECK (bet_type IN ('moneyline', 'spread', 'total')),
  selection TEXT NOT NULL,
  odds_at_placement DECIMAL NOT NULL,
  stake DECIMAL NOT NULL,
  potential_payout DECIMAL NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'push', 'cancelled')),
  result_profit DECIMAL,
  placed_at TIMESTAMPTZ DEFAULT now(),
  settled_at TIMESTAMPTZ,
  sportsbook TEXT,
  opening_odds DECIMAL,
  closing_odds DECIMAL,
  clv_percentage DECIMAL,
  model_confidence INTEGER,
  model_ev_percentage DECIMAL,
  kelly_stake_recommended DECIMAL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_bets ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_bets
CREATE POLICY "Users can view their own bets"
  ON public.user_bets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bets"
  ON public.user_bets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bets"
  ON public.user_bets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bets"
  ON public.user_bets FOR DELETE
  USING (auth.uid() = user_id);

-- User betting stats aggregate table
CREATE TABLE public.user_betting_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_bets INTEGER DEFAULT 0,
  pending_bets INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  pushes INTEGER DEFAULT 0,
  total_staked DECIMAL DEFAULT 0,
  total_profit DECIMAL DEFAULT 0,
  roi_percentage DECIMAL DEFAULT 0,
  avg_odds DECIMAL DEFAULT 0,
  avg_clv DECIMAL DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_betting_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_betting_stats
CREATE POLICY "Users can view their own stats"
  ON public.user_betting_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stats"
  ON public.user_betting_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
  ON public.user_betting_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_user_bets_user_id ON public.user_bets(user_id);
CREATE INDEX idx_user_bets_status ON public.user_bets(status);
CREATE INDEX idx_user_bets_placed_at ON public.user_bets(placed_at DESC);
CREATE INDEX idx_user_bets_match_id ON public.user_bets(match_id);

-- Function to update betting stats when bets change
CREATE OR REPLACE FUNCTION public.update_betting_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Upsert user betting stats
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-update stats
CREATE TRIGGER trigger_update_betting_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.user_bets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_betting_stats();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_user_bets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for updated_at
CREATE TRIGGER update_user_bets_timestamp
  BEFORE UPDATE ON public.user_bets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_bets_updated_at();