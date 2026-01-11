-- Push subscriptions table for browser notifications
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  subscription jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, subscription)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for push_subscriptions
CREATE POLICY "Users can view their own subscriptions" 
  ON public.push_subscriptions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions" 
  ON public.push_subscriptions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions" 
  ON public.push_subscriptions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add game_started_at column to user_bets for tracking
ALTER TABLE public.user_bets ADD COLUMN IF NOT EXISTS game_started_at timestamptz;

-- Add graded_at column to track when bets were graded
ALTER TABLE public.user_bets ADD COLUMN IF NOT EXISTS graded_at timestamptz;

-- Create index for faster queries on pending bets
CREATE INDEX IF NOT EXISTS idx_user_bets_pending ON public.user_bets(status) WHERE status = 'pending';

-- Create index for game start detection
CREATE INDEX IF NOT EXISTS idx_user_bets_game_started ON public.user_bets(match_id, game_started_at) WHERE game_started_at IS NULL;

-- Add trigger for updated_at on push_subscriptions
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();