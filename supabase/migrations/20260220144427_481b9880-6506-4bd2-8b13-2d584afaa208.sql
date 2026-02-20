
-- Add savings_goal column to user_savings table
ALTER TABLE public.user_savings 
ADD COLUMN IF NOT EXISTS savings_goal numeric DEFAULT NULL;

-- Add milestones_celebrated column to track which milestones have been shown
ALTER TABLE public.user_savings
ADD COLUMN IF NOT EXISTS milestones_celebrated integer[] DEFAULT '{}';
