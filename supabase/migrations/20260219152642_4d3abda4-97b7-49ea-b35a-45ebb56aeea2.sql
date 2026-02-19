
-- Create user savings accounts table
CREATE TABLE public.user_savings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  savings_rate NUMERIC NOT NULL DEFAULT 10.0, -- percentage (0-100)
  balance NUMERIC NOT NULL DEFAULT 0.00,
  total_contributed NUMERIC NOT NULL DEFAULT 0.00,
  total_saved_from_bets INTEGER NOT NULL DEFAULT 0, -- count of bets that contributed
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT savings_rate_check CHECK (savings_rate >= 0 AND savings_rate <= 100),
  CONSTRAINT balance_non_negative CHECK (balance >= 0)
);

-- Create savings transactions table
CREATE TABLE public.savings_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_bet_id UUID, -- reference to the bet that triggered this contribution (nullable for manual)
  amount NUMERIC NOT NULL,
  original_stake NUMERIC NOT NULL, -- the original bet amount before split
  actual_wager NUMERIC NOT NULL,   -- what actually went to the bet after deduction
  savings_rate_applied NUMERIC NOT NULL, -- the rate at the time of contribution
  match_title TEXT,
  league TEXT,
  type TEXT NOT NULL DEFAULT 'contribution', -- 'contribution'
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT amount_positive CHECK (amount > 0)
);

-- Enable RLS
ALTER TABLE public.user_savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_savings
CREATE POLICY "Users can view their own savings"
  ON public.user_savings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own savings account"
  ON public.user_savings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own savings account"
  ON public.user_savings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage savings"
  ON public.user_savings FOR ALL
  USING (((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role'::text) = 'service_role'::text)
  WITH CHECK (((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role'::text) = 'service_role'::text);

-- RLS Policies for savings_transactions
CREATE POLICY "Users can view their own savings transactions"
  ON public.savings_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own savings transactions"
  ON public.savings_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage savings transactions"
  ON public.savings_transactions FOR ALL
  USING (((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role'::text) = 'service_role'::text)
  WITH CHECK (((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role'::text) = 'service_role'::text);

-- Auto-update updated_at on user_savings
CREATE TRIGGER update_user_savings_updated_at
  BEFORE UPDATE ON public.user_savings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast transaction lookups
CREATE INDEX idx_savings_transactions_user_id ON public.savings_transactions(user_id);
CREATE INDEX idx_savings_transactions_created_at ON public.savings_transactions(created_at DESC);
