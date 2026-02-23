
-- Add debate-specific columns to algorithm_predictions
ALTER TABLE public.algorithm_predictions
  ADD COLUMN IF NOT EXISTS agreement_level text,
  ADD COLUMN IF NOT EXISTS biases_identified jsonb,
  ADD COLUMN IF NOT EXISTS risk_flag text,
  ADD COLUMN IF NOT EXISTS debate_reasoning text,
  ADD COLUMN IF NOT EXISTS key_factor text,
  ADD COLUMN IF NOT EXISTS temporal_insight text,
  ADD COLUMN IF NOT EXISTS adjusted_confidence numeric;

-- Register AI Debate Moderator as an algorithm
INSERT INTO public.algorithms (id, name, description)
VALUES (
  'ai-debate-moderator',
  'AI Debate Moderator',
  'LLM-powered meta-synthesis that debates across all algorithm predictions to produce a final qualitative recommendation.'
)
ON CONFLICT (id) DO NOTHING;
