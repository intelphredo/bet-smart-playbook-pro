-- Strengthen user_bets RLS policies to explicitly require authentication
-- This adds an extra layer of protection against anonymous access

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own bets" ON public.user_bets;
DROP POLICY IF EXISTS "Users can create their own bets" ON public.user_bets;
DROP POLICY IF EXISTS "Users can update their own bets" ON public.user_bets;
DROP POLICY IF EXISTS "Users can delete their own bets" ON public.user_bets;

-- Recreate policies with explicit authentication check
-- SELECT policy - must be authenticated AND own the record
CREATE POLICY "Users can view their own bets" 
ON public.user_bets 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- INSERT policy - must be authenticated AND creating for themselves
CREATE POLICY "Users can create their own bets" 
ON public.user_bets 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- UPDATE policy - must be authenticated AND own the record
CREATE POLICY "Users can update their own bets" 
ON public.user_bets 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- DELETE policy - must be authenticated AND own the record
CREATE POLICY "Users can delete their own bets" 
ON public.user_bets 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- Also add service role policy for backend operations (grading bets, etc.)
CREATE POLICY "Service role can manage all bets" 
ON public.user_bets 
FOR ALL 
USING (
  ((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role') = 'service_role'
)
WITH CHECK (
  ((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role') = 'service_role'
);

-- Add comment for documentation
COMMENT ON TABLE public.user_bets IS 'User betting records with explicit authentication requirements. Anonymous access is explicitly blocked.';