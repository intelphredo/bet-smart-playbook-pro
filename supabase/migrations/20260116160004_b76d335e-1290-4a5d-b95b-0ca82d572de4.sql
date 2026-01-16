-- Create table to track calibration history over time
CREATE TABLE public.calibration_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Overall metrics
  brier_score NUMERIC(5,4),
  mean_absolute_error NUMERIC(5,2),
  is_well_calibrated BOOLEAN DEFAULT false,
  overall_adjustment_factor NUMERIC(4,2) DEFAULT 1.00,
  
  -- Bin-level summary
  total_bins INTEGER DEFAULT 0,
  adjusted_bins INTEGER DEFAULT 0,
  overconfident_bins INTEGER DEFAULT 0,
  underconfident_bins INTEGER DEFAULT 0,
  
  -- Algorithm-level summary
  total_algorithms INTEGER DEFAULT 3,
  adjusted_algorithms INTEGER DEFAULT 0,
  paused_algorithms INTEGER DEFAULT 0,
  avg_confidence_multiplier NUMERIC(4,2) DEFAULT 1.00,
  
  -- Sample size
  total_predictions INTEGER DEFAULT 0,
  settled_predictions INTEGER DEFAULT 0,
  
  -- Health score (0-100)
  overall_health_score INTEGER DEFAULT 50,
  
  -- Detailed bin data as JSON for drill-down
  bin_details JSONB,
  algorithm_details JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for time-based queries
CREATE INDEX idx_calibration_history_recorded_at ON public.calibration_history(recorded_at DESC);

-- Enable RLS
ALTER TABLE public.calibration_history ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read calibration history (public data)
CREATE POLICY "Calibration history is publicly readable"
ON public.calibration_history
FOR SELECT
USING (true);

-- Only allow inserts from authenticated users or service role
CREATE POLICY "Authenticated users can insert calibration history"
ON public.calibration_history
FOR INSERT
WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.calibration_history IS 'Tracks model calibration metrics over time to monitor auto-tuning effectiveness';