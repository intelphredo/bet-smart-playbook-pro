-- Add is_live_prediction column to algorithm_predictions table
ALTER TABLE public.algorithm_predictions
ADD COLUMN is_live_prediction BOOLEAN DEFAULT false;

-- Add an index for efficient filtering by prediction type
CREATE INDEX idx_algorithm_predictions_is_live ON public.algorithm_predictions(is_live_prediction);

-- Add a comment for documentation
COMMENT ON COLUMN public.algorithm_predictions.is_live_prediction IS 'True if prediction was made during a live game, false for pre-game predictions';