-- Create weather_cache table for caching weather API responses
CREATE TABLE public.weather_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_key TEXT NOT NULL,
  latitude DECIMAL(10, 6),
  longitude DECIMAL(10, 6),
  temperature DECIMAL(5, 2) NOT NULL,
  temperature_celsius DECIMAL(5, 2) NOT NULL,
  feels_like DECIMAL(5, 2),
  condition TEXT NOT NULL,
  condition_description TEXT,
  humidity INTEGER,
  wind_speed DECIMAL(5, 2),
  wind_direction TEXT,
  wind_gust DECIMAL(5, 2),
  precipitation DECIMAL(5, 2) DEFAULT 0,
  visibility DECIMAL(5, 2),
  uv_index DECIMAL(4, 2),
  pressure INTEGER,
  is_outdoor_playable BOOLEAN DEFAULT true,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '60 minutes'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for venue lookups and cache expiry
CREATE INDEX idx_weather_cache_venue_key ON public.weather_cache(venue_key);
CREATE INDEX idx_weather_cache_expires_at ON public.weather_cache(expires_at);

-- Create venue_coordinates table for mapping venues to lat/long
CREATE TABLE public.venue_coordinates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_name TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT DEFAULT 'USA',
  latitude DECIMAL(10, 6) NOT NULL,
  longitude DECIMAL(10, 6) NOT NULL,
  is_outdoor BOOLEAN NOT NULL DEFAULT true,
  league TEXT NOT NULL,
  capacity INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for venue lookups
CREATE INDEX idx_venue_coordinates_team_name ON public.venue_coordinates(team_name);
CREATE INDEX idx_venue_coordinates_league ON public.venue_coordinates(league);
CREATE UNIQUE INDEX idx_venue_coordinates_unique ON public.venue_coordinates(team_name, venue_name);

-- Enable RLS
ALTER TABLE public.weather_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_coordinates ENABLE ROW LEVEL SECURITY;

-- Weather cache is read-only for public (edge function writes)
CREATE POLICY "Weather cache is publicly readable" 
ON public.weather_cache 
FOR SELECT 
USING (true);

-- Venue coordinates are publicly readable
CREATE POLICY "Venue coordinates are publicly readable" 
ON public.venue_coordinates 
FOR SELECT 
USING (true);

-- Insert MLB outdoor venues
INSERT INTO public.venue_coordinates (team_name, venue_name, city, state, latitude, longitude, is_outdoor, league) VALUES
('Yankees', 'Yankee Stadium', 'Bronx', 'NY', 40.8296, -73.9262, true, 'MLB'),
('Red Sox', 'Fenway Park', 'Boston', 'MA', 42.3467, -71.0972, true, 'MLB'),
('Cubs', 'Wrigley Field', 'Chicago', 'IL', 41.9484, -87.6553, true, 'MLB'),
('Dodgers', 'Dodger Stadium', 'Los Angeles', 'CA', 34.0739, -118.2400, true, 'MLB'),
('Giants', 'Oracle Park', 'San Francisco', 'CA', 37.7786, -122.3893, true, 'MLB'),
('Cardinals', 'Busch Stadium', 'St. Louis', 'MO', 38.6226, -90.1928, true, 'MLB'),
('Mets', 'Citi Field', 'Queens', 'NY', 40.7571, -73.8458, true, 'MLB'),
('Phillies', 'Citizens Bank Park', 'Philadelphia', 'PA', 39.9061, -75.1665, true, 'MLB'),
('Braves', 'Truist Park', 'Atlanta', 'GA', 33.8907, -84.4677, true, 'MLB'),
('Nationals', 'Nationals Park', 'Washington', 'DC', 38.8730, -77.0074, true, 'MLB'),
('White Sox', 'Guaranteed Rate Field', 'Chicago', 'IL', 41.8299, -87.6338, true, 'MLB'),
('Tigers', 'Comerica Park', 'Detroit', 'MI', 42.3390, -83.0485, true, 'MLB'),
('Twins', 'Target Field', 'Minneapolis', 'MN', 44.9817, -93.2776, true, 'MLB'),
('Guardians', 'Progressive Field', 'Cleveland', 'OH', 41.4962, -81.6852, true, 'MLB'),
('Royals', 'Kauffman Stadium', 'Kansas City', 'MO', 39.0517, -94.4803, true, 'MLB'),
('Orioles', 'Camden Yards', 'Baltimore', 'MD', 39.2839, -76.6217, true, 'MLB'),
('Pirates', 'PNC Park', 'Pittsburgh', 'PA', 40.4469, -80.0057, true, 'MLB'),
('Reds', 'Great American Ball Park', 'Cincinnati', 'OH', 39.0979, -84.5082, true, 'MLB'),
('Rockies', 'Coors Field', 'Denver', 'CO', 39.7559, -104.9942, true, 'MLB'),
('Padres', 'Petco Park', 'San Diego', 'CA', 32.7076, -117.1570, true, 'MLB'),
('Mariners', 'T-Mobile Park', 'Seattle', 'WA', 47.5914, -122.3326, true, 'MLB'),
('Athletics', 'Oakland Coliseum', 'Oakland', 'CA', 37.7516, -122.2005, true, 'MLB'),
('Angels', 'Angel Stadium', 'Anaheim', 'CA', 33.8003, -117.8827, true, 'MLB'),
('Brewers', 'American Family Field', 'Milwaukee', 'WI', 43.0280, -87.9712, false, 'MLB'),
-- MLB Indoor venues
('Rays', 'Tropicana Field', 'St. Petersburg', 'FL', 27.7682, -82.6534, false, 'MLB'),
('Blue Jays', 'Rogers Centre', 'Toronto', 'ON', 43.6414, -79.3894, false, 'MLB'),
('Diamondbacks', 'Chase Field', 'Phoenix', 'AZ', 33.4455, -112.0667, false, 'MLB'),
('Rangers', 'Globe Life Field', 'Arlington', 'TX', 32.7473, -97.0847, false, 'MLB'),
('Astros', 'Minute Maid Park', 'Houston', 'TX', 29.7573, -95.3555, false, 'MLB'),
('Marlins', 'loanDepot Park', 'Miami', 'FL', 25.7781, -80.2197, false, 'MLB');

-- Insert NFL outdoor venues
INSERT INTO public.venue_coordinates (team_name, venue_name, city, state, latitude, longitude, is_outdoor, league) VALUES
('Packers', 'Lambeau Field', 'Green Bay', 'WI', 44.5013, -88.0622, true, 'NFL'),
('Bears', 'Soldier Field', 'Chicago', 'IL', 41.8623, -87.6167, true, 'NFL'),
('Bills', 'Highmark Stadium', 'Orchard Park', 'NY', 42.7738, -78.7870, true, 'NFL'),
('Patriots', 'Gillette Stadium', 'Foxborough', 'MA', 42.0909, -71.2643, true, 'NFL'),
('Eagles', 'Lincoln Financial Field', 'Philadelphia', 'PA', 39.9008, -75.1675, true, 'NFL'),
('Steelers', 'Acrisure Stadium', 'Pittsburgh', 'PA', 40.4468, -80.0158, true, 'NFL'),
('Chiefs', 'Arrowhead Stadium', 'Kansas City', 'MO', 39.0489, -94.4839, true, 'NFL'),
('Ravens', 'M&T Bank Stadium', 'Baltimore', 'MD', 39.2780, -76.6227, true, 'NFL'),
('Browns', 'Cleveland Browns Stadium', 'Cleveland', 'OH', 41.5061, -81.6995, true, 'NFL'),
('Bengals', 'Paycor Stadium', 'Cincinnati', 'OH', 39.0955, -84.5160, true, 'NFL'),
('Broncos', 'Empower Field', 'Denver', 'CO', 39.7439, -105.0201, true, 'NFL'),
('Dolphins', 'Hard Rock Stadium', 'Miami Gardens', 'FL', 25.9580, -80.2389, true, 'NFL'),
('Buccaneers', 'Raymond James Stadium', 'Tampa', 'FL', 27.9759, -82.5033, true, 'NFL'),
('Panthers', 'Bank of America Stadium', 'Charlotte', 'NC', 35.2258, -80.8528, true, 'NFL'),
('Titans', 'Nissan Stadium', 'Nashville', 'TN', 36.1665, -86.7713, true, 'NFL'),
('Jaguars', 'TIAA Bank Field', 'Jacksonville', 'FL', 30.3239, -81.6373, true, 'NFL'),
('Jets', 'MetLife Stadium', 'East Rutherford', 'NJ', 40.8128, -74.0742, true, 'NFL'),
('Giants', 'MetLife Stadium', 'East Rutherford', 'NJ', 40.8128, -74.0742, true, 'NFL'),
('Washington', 'FedExField', 'Landover', 'MD', 38.9076, -76.8645, true, 'NFL'),
('49ers', 'Levis Stadium', 'Santa Clara', 'CA', 37.4033, -121.9694, true, 'NFL'),
('Seahawks', 'Lumen Field', 'Seattle', 'WA', 47.5952, -122.3316, true, 'NFL'),
('Chargers', 'SoFi Stadium', 'Inglewood', 'CA', 33.9535, -118.3390, false, 'NFL'),
('Rams', 'SoFi Stadium', 'Inglewood', 'CA', 33.9535, -118.3390, false, 'NFL'),
-- NFL Indoor venues
('Saints', 'Caesars Superdome', 'New Orleans', 'LA', 29.9511, -90.0812, false, 'NFL'),
('Vikings', 'U.S. Bank Stadium', 'Minneapolis', 'MN', 44.9737, -93.2575, false, 'NFL'),
('Falcons', 'Mercedes-Benz Stadium', 'Atlanta', 'GA', 33.7553, -84.4006, false, 'NFL'),
('Lions', 'Ford Field', 'Detroit', 'MI', 42.3400, -83.0456, false, 'NFL'),
('Colts', 'Lucas Oil Stadium', 'Indianapolis', 'IN', 39.7601, -86.1639, false, 'NFL'),
('Raiders', 'Allegiant Stadium', 'Las Vegas', 'NV', 36.0909, -115.1833, false, 'NFL'),
('Cardinals', 'State Farm Stadium', 'Glendale', 'AZ', 33.5276, -112.2626, false, 'NFL'),
('Cowboys', 'AT&T Stadium', 'Arlington', 'TX', 32.7473, -97.0945, false, 'NFL'),
('Texans', 'NRG Stadium', 'Houston', 'TX', 29.6847, -95.4107, false, 'NFL');

-- Insert Premier League venues (all outdoor)
INSERT INTO public.venue_coordinates (team_name, venue_name, city, state, latitude, longitude, is_outdoor, league, country) VALUES
('Arsenal', 'Emirates Stadium', 'London', NULL, 51.5549, -0.1084, true, 'SOCCER', 'UK'),
('Chelsea', 'Stamford Bridge', 'London', NULL, 51.4817, -0.1910, true, 'SOCCER', 'UK'),
('Liverpool', 'Anfield', 'Liverpool', NULL, 53.4308, -2.9609, true, 'SOCCER', 'UK'),
('Manchester United', 'Old Trafford', 'Manchester', NULL, 53.4631, -2.2913, true, 'SOCCER', 'UK'),
('Manchester City', 'Etihad Stadium', 'Manchester', NULL, 53.4831, -2.2004, true, 'SOCCER', 'UK'),
('Tottenham', 'Tottenham Hotspur Stadium', 'London', NULL, 51.6043, -0.0664, true, 'SOCCER', 'UK'),
('Newcastle', 'St James Park', 'Newcastle', NULL, 54.9756, -1.6217, true, 'SOCCER', 'UK'),
('Aston Villa', 'Villa Park', 'Birmingham', NULL, 52.5091, -1.8847, true, 'SOCCER', 'UK'),
('West Ham', 'London Stadium', 'London', NULL, 51.5387, -0.0166, true, 'SOCCER', 'UK'),
('Everton', 'Goodison Park', 'Liverpool', NULL, 53.4389, -2.9664, true, 'SOCCER', 'UK');

-- Create function to clean expired weather cache
CREATE OR REPLACE FUNCTION public.clean_expired_weather_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM public.weather_cache WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for venue_coordinates updated_at
CREATE TRIGGER update_venue_coordinates_updated_at
BEFORE UPDATE ON public.venue_coordinates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();