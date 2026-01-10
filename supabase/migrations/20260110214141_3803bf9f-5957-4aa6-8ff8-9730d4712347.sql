-- Add preferences JSONB column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{
  "display": {
    "odds_format": "american",
    "theme": "system"
  },
  "favorites": {
    "leagues": [],
    "teams": [],
    "sportsbooks": []
  },
  "notifications": {
    "line_movements": true,
    "positive_ev": true,
    "arbitrage": true,
    "game_start": false,
    "bet_results": true
  },
  "bankroll": {
    "current_bankroll": 1000,
    "unit_size": 10,
    "kelly_fraction": 0.25,
    "max_bet_percentage": 5
  },
  "betting": {
    "default_stake": 10,
    "auto_kelly": false,
    "show_ev_threshold": 3,
    "hide_negative_ev": false
  }
}'::jsonb;

-- Create index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_profiles_preferences ON public.profiles USING GIN (preferences);

-- Function to update specific preference paths
CREATE OR REPLACE FUNCTION public.update_user_preference(
  user_id_param UUID,
  preference_path TEXT[],
  new_value JSONB
)
RETURNS JSONB AS $$
DECLARE
  current_prefs JSONB;
  result JSONB;
BEGIN
  -- Get current preferences
  SELECT preferences INTO current_prefs
  FROM public.profiles
  WHERE id = user_id_param;
  
  -- If no preferences exist, use defaults
  IF current_prefs IS NULL THEN
    current_prefs := '{}'::jsonb;
  END IF;
  
  -- Update the nested path
  result := jsonb_set(current_prefs, preference_path, new_value, true);
  
  -- Save back to database
  UPDATE public.profiles
  SET preferences = result, updated_at = now()
  WHERE id = user_id_param;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.update_user_preference(UUID, TEXT[], JSONB) TO authenticated;

-- Function to get user preferences with defaults merged
CREATE OR REPLACE FUNCTION public.get_user_preferences(user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  user_prefs JSONB;
  default_prefs JSONB := '{
    "display": {
      "odds_format": "american",
      "theme": "system"
    },
    "favorites": {
      "leagues": [],
      "teams": [],
      "sportsbooks": []
    },
    "notifications": {
      "line_movements": true,
      "positive_ev": true,
      "arbitrage": true,
      "game_start": false,
      "bet_results": true
    },
    "bankroll": {
      "current_bankroll": 1000,
      "unit_size": 10,
      "kelly_fraction": 0.25,
      "max_bet_percentage": 5
    },
    "betting": {
      "default_stake": 10,
      "auto_kelly": false,
      "show_ev_threshold": 3,
      "hide_negative_ev": false
    }
  }'::jsonb;
BEGIN
  SELECT preferences INTO user_prefs
  FROM public.profiles
  WHERE id = user_id_param;
  
  -- Merge user prefs over defaults
  RETURN default_prefs || COALESCE(user_prefs, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_preferences(UUID) TO authenticated;