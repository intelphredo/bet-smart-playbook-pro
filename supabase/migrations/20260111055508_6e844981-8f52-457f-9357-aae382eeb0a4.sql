-- Create scheduled job logs table for tracking execution history
CREATE TABLE public.scheduled_job_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  records_processed INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_scheduled_job_logs_job_name ON public.scheduled_job_logs(job_name);
CREATE INDEX idx_scheduled_job_logs_started_at ON public.scheduled_job_logs(started_at DESC);
CREATE INDEX idx_scheduled_job_logs_status ON public.scheduled_job_logs(status);

-- Enable RLS
ALTER TABLE public.scheduled_job_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (edge functions use service role)
CREATE POLICY "Service role can manage job logs"
ON public.scheduled_job_logs
FOR ALL
USING (true)
WITH CHECK (true);

-- Allow authenticated users to view job logs
CREATE POLICY "Authenticated users can view job logs"
ON public.scheduled_job_logs
FOR SELECT
TO authenticated
USING (true);

-- Function to clean up old job logs (keep last 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_job_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.scheduled_job_logs
  WHERE started_at < now() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;