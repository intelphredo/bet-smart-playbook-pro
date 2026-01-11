-- Insert demo algorithms if they don't exist
INSERT INTO public.algorithms (id, name, description, created_at)
VALUES 
  ('f4ce9fdc-c41a-4a5c-9f18-5d732674c5b8', 'ML Power Index', 'Machine learning algorithm that analyzes historical data, player stats, and team performance trends to predict match outcomes with advanced statistical modeling.', now()),
  ('3a7e2d9b-8c5f-4b1f-9e17-7b31a4dce6c2', 'Value Pick Finder', 'Specialized algorithm that focuses on finding betting value through odds analysis, line movements, and market inefficiencies to identify the most profitable opportunities.', now()),
  ('85c48bbe-5b1a-4c1e-a0d5-e284e9e952f1', 'Statistical Edge', 'Pure statistics-based algorithm that considers situational spots, weather impacts, injuries, and matchup advantages to find edges in the betting markets.', now())
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Insert algorithm stats for demo data
INSERT INTO public.algorithm_stats (algorithm_id, total_predictions, correct_predictions, win_rate, avg_confidence)
VALUES 
  ('f4ce9fdc-c41a-4a5c-9f18-5d732674c5b8', 145, 90, 62.07, 68.5),
  ('3a7e2d9b-8c5f-4b1f-9e17-7b31a4dce6c2', 167, 97, 58.08, 65.2),
  ('85c48bbe-5b1a-4c1e-a0d5-e284e9e952f1', 189, 104, 55.03, 62.8)
ON CONFLICT (algorithm_id) DO UPDATE SET 
  total_predictions = EXCLUDED.total_predictions,
  correct_predictions = EXCLUDED.correct_predictions,
  win_rate = EXCLUDED.win_rate,
  avg_confidence = EXCLUDED.avg_confidence;

-- Insert sample algorithm predictions for chart visualization
INSERT INTO public.algorithm_predictions (id, algorithm_id, match_id, league, prediction, confidence, status, predicted_at)
VALUES 
  -- ML Power Index predictions
  (gen_random_uuid(), 'f4ce9fdc-c41a-4a5c-9f18-5d732674c5b8', 'demo-nba-1', 'NBA', 'Lakers Win', 72, 'won', now() - interval '1 day'),
  (gen_random_uuid(), 'f4ce9fdc-c41a-4a5c-9f18-5d732674c5b8', 'demo-nfl-1', 'NFL', 'Chiefs -3.5', 68, 'won', now() - interval '2 days'),
  (gen_random_uuid(), 'f4ce9fdc-c41a-4a5c-9f18-5d732674c5b8', 'demo-nhl-1', 'NHL', 'Over 5.5', 65, 'lost', now() - interval '3 days'),
  (gen_random_uuid(), 'f4ce9fdc-c41a-4a5c-9f18-5d732674c5b8', 'demo-nba-2', 'NBA', 'Celtics Win', 70, 'won', now() - interval '4 days'),
  (gen_random_uuid(), 'f4ce9fdc-c41a-4a5c-9f18-5d732674c5b8', 'demo-mlb-1', 'MLB', 'Yankees ML', 66, 'won', now() - interval '5 days'),
  
  -- Value Pick Finder predictions
  (gen_random_uuid(), '3a7e2d9b-8c5f-4b1f-9e17-7b31a4dce6c2', 'demo-nfl-2', 'NFL', 'Bills +7', 64, 'won', now() - interval '1 day'),
  (gen_random_uuid(), '3a7e2d9b-8c5f-4b1f-9e17-7b31a4dce6c2', 'demo-nba-3', 'NBA', 'Warriors ML', 62, 'lost', now() - interval '2 days'),
  (gen_random_uuid(), '3a7e2d9b-8c5f-4b1f-9e17-7b31a4dce6c2', 'demo-nhl-2', 'NHL', 'Under 6.0', 58, 'won', now() - interval '3 days'),
  (gen_random_uuid(), '3a7e2d9b-8c5f-4b1f-9e17-7b31a4dce6c2', 'demo-soccer-1', 'Soccer', 'Draw', 55, 'won', now() - interval '4 days'),
  (gen_random_uuid(), '3a7e2d9b-8c5f-4b1f-9e17-7b31a4dce6c2', 'demo-mlb-2', 'MLB', 'Red Sox +1.5', 60, 'lost', now() - interval '5 days'),
  
  -- Statistical Edge predictions
  (gen_random_uuid(), '85c48bbe-5b1a-4c1e-a0d5-e284e9e952f1', 'demo-nba-4', 'NBA', 'Bucks -5.5', 58, 'won', now() - interval '1 day'),
  (gen_random_uuid(), '85c48bbe-5b1a-4c1e-a0d5-e284e9e952f1', 'demo-nfl-3', 'NFL', 'Over 48.5', 56, 'lost', now() - interval '2 days'),
  (gen_random_uuid(), '85c48bbe-5b1a-4c1e-a0d5-e284e9e952f1', 'demo-nhl-3', 'NHL', 'Bruins ML', 54, 'won', now() - interval '3 days'),
  (gen_random_uuid(), '85c48bbe-5b1a-4c1e-a0d5-e284e9e952f1', 'demo-soccer-2', 'Soccer', 'Home Win', 52, 'lost', now() - interval '4 days'),
  (gen_random_uuid(), '85c48bbe-5b1a-4c1e-a0d5-e284e9e952f1', 'demo-mlb-3', 'MLB', 'Dodgers -1.5', 60, 'won', now() - interval '5 days')
ON CONFLICT DO NOTHING;

-- Insert sample line movements for the Line Movements card
INSERT INTO public.line_movement_tracking (id, match_id, match_title, league, sportsbook_id, market_type, previous_odds, current_odds, movement_percentage, movement_direction, detected_at, alerts_sent)
VALUES 
  (gen_random_uuid(), 'demo-nfl-chiefs', 'Chiefs vs Bills', 'NFL', 'draftkings', 'spread', '{"spread_home": -3.5}'::jsonb, '{"spread_home": -4.5}'::jsonb, -1, 'steam', now() - interval '30 minutes', false),
  (gen_random_uuid(), 'demo-nba-lakers', 'Lakers vs Celtics', 'NBA', 'fanduel', 'total', '{"total": 218.5}'::jsonb, '{"total": 221}'::jsonb, 2.5, 'reverse', now() - interval '2 hours', false),
  (gen_random_uuid(), 'demo-mlb-yankees', 'Yankees vs Red Sox', 'MLB', 'betmgm', 'moneyline_home', '{"home": -145}'::jsonb, '{"home": -165}'::jsonb, -20, 'steam', now() - interval '5 hours', false)
ON CONFLICT DO NOTHING;