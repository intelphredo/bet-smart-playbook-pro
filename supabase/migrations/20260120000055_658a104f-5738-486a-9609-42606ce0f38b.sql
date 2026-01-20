-- Add a policy to allow the trigger function (running as SECURITY DEFINER) to insert profiles
-- The trigger runs as the function owner, which bypasses RLS if it has elevated privileges
-- But to be safe, let's also add a service role policy

-- Drop existing restrictive insert policy and replace with a permissive one
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create a permissive policy for users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Add service role policy for the trigger
CREATE POLICY "Service role can insert profiles"
  ON public.profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);