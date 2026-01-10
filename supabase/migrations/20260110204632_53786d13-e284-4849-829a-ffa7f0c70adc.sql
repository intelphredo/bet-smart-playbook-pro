-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create algorithms table
CREATE TABLE public.algorithms (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create algorithm_predictions table
CREATE TABLE public.algorithm_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id TEXT NOT NULL,
  league TEXT,
  algorithm_id TEXT REFERENCES public.algorithms(id),
  prediction TEXT,
  confidence INTEGER,
  projected_score_home INTEGER,
  projected_score_away INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  actual_score_home INTEGER,
  actual_score_away INTEGER,
  accuracy_rating INTEGER,
  predicted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  result_updated_at TIMESTAMP WITH TIME ZONE
);

-- Create algorithm_stats table for performance tracking
CREATE TABLE public.algorithm_stats (
  algorithm_id TEXT NOT NULL PRIMARY KEY REFERENCES public.algorithms(id) ON DELETE CASCADE,
  total_predictions INTEGER NOT NULL DEFAULT 0,
  correct_predictions INTEGER NOT NULL DEFAULT 0,
  win_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  avg_confidence NUMERIC(5,2) NOT NULL DEFAULT 0
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.algorithms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.algorithm_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.algorithm_stats ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Algorithms policies (public read, authenticated write)
CREATE POLICY "Anyone can view algorithms" ON public.algorithms FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create algorithms" ON public.algorithms FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Algorithm predictions policies (public read, authenticated write)
CREATE POLICY "Anyone can view predictions" ON public.algorithm_predictions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create predictions" ON public.algorithm_predictions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update predictions" ON public.algorithm_predictions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Service role can manage predictions" ON public.algorithm_predictions FOR ALL USING (true);

-- Algorithm stats policies (public read)
CREATE POLICY "Anyone can view algorithm stats" ON public.algorithm_stats FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage stats" ON public.algorithm_stats FOR ALL USING (auth.role() = 'authenticated');

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default algorithm
INSERT INTO public.algorithms (id, name, description) VALUES 
  ('default-algorithm', 'Smart Score Algorithm', 'Primary prediction algorithm using multi-factor analysis including team strength, momentum, and value factors.');

-- Insert default stats for the algorithm
INSERT INTO public.algorithm_stats (algorithm_id, total_predictions, correct_predictions, win_rate, avg_confidence) VALUES
  ('default-algorithm', 0, 0, 0, 0);

-- Enable realtime for algorithm_predictions
ALTER PUBLICATION supabase_realtime ADD TABLE public.algorithm_predictions;