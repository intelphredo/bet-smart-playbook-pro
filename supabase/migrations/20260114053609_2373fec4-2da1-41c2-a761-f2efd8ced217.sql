-- Fix SECURITY DEFINER functions to verify auth.uid() matches user_id_param

-- Fix get_user_preferences function
CREATE OR REPLACE FUNCTION public.get_user_preferences(user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  user_prefs JSONB;
  default_prefs JSONB := '{
    "bankroll": {
      "initialAmount": 1000,
      "currentAmount": 1000,
      "kellyFraction": 0.25,
      "maxBetPercentage": 5
    },
    "alerts": {
      "sharpMoney": true,
      "lineMovements": true,
      "injuryUpdates": true,
      "highValueBets": true
    },
    "display": {
      "oddsFormat": "american",
      "theme": "system",
      "defaultLeagues": ["NBA", "NFL", "MLB", "NHL"]
    },
    "notifications": {
      "push": false,
      "email": false,
      "frequency": "realtime"
    }
  }'::jsonb;
BEGIN
  -- Authorization check: verify caller matches requested user
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF auth.uid() != user_id_param THEN
    RAISE EXCEPTION 'Unauthorized: cannot access another user''s preferences';
  END IF;

  SELECT preferences INTO user_prefs
  FROM public.profiles
  WHERE id = user_id_param;
  
  IF user_prefs IS NULL THEN
    RETURN default_prefs;
  END IF;
  
  -- Merge with defaults to ensure all keys exist
  RETURN default_prefs || user_prefs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix update_user_preference function
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
  -- Authorization check: verify caller matches requested user
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF auth.uid() != user_id_param THEN
    RAISE EXCEPTION 'Unauthorized: cannot modify another user''s preferences';
  END IF;

  -- Get current preferences
  SELECT preferences INTO current_prefs
  FROM public.profiles
  WHERE id = user_id_param;
  
  IF current_prefs IS NULL THEN
    current_prefs := '{}'::jsonb;
  END IF;
  
  -- Build nested path and update
  result := jsonb_set(
    current_prefs,
    preference_path,
    new_value,
    true
  );
  
  -- Update the profile
  UPDATE public.profiles
  SET preferences = result, updated_at = now()
  WHERE id = user_id_param;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;