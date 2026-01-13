-- Add team name columns to algorithm_predictions for better display
ALTER TABLE public.algorithm_predictions 
ADD COLUMN IF NOT EXISTS home_team TEXT,
ADD COLUMN IF NOT EXISTS away_team TEXT,
ADD COLUMN IF NOT EXISTS match_title TEXT;