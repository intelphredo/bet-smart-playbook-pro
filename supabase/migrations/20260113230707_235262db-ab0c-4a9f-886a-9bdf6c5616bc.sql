-- Backfill result_updated_at for predictions that are already graded but missing the timestamp
UPDATE public.algorithm_predictions
SET result_updated_at = predicted_at
WHERE status IN ('won', 'lost')
  AND result_updated_at IS NULL;