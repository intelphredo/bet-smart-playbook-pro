import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SavePredictionsResult {
  saved: number;
  skipped: number;
  leagues: string[];
}

interface GradePredictionsResult {
  graded: number;
  checked: number;
  algorithms_updated: number;
}

export function usePredictionSync() {
  const [isSaving, setIsSaving] = useState(false);
  const [isGrading, setIsGrading] = useState(false);

  const savePredictions = useCallback(async (leagues?: string[]): Promise<SavePredictionsResult | null> => {
    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('save-predictions', {
        body: leagues ? { leagues } : undefined,
      });

      if (error) {
        console.error('Error saving predictions:', error);
        toast.error('Failed to save predictions');
        return null;
      }

      if (data?.success) {
        const result = data.data as SavePredictionsResult;
        if (result.saved > 0) {
          toast.success(`Saved ${result.saved} new predictions`);
        } else {
          toast.info('No new predictions to save');
        }
        return result;
      }

      toast.error(data?.error || 'Failed to save predictions');
      return null;
    } catch (error) {
      console.error('Error in savePredictions:', error);
      toast.error('Failed to save predictions');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const gradePredictions = useCallback(async (): Promise<GradePredictionsResult | null> => {
    setIsGrading(true);
    try {
      const { data, error } = await supabase.functions.invoke('grade-predictions');

      if (error) {
        console.error('Error grading predictions:', error);
        toast.error('Failed to grade predictions');
        return null;
      }

      if (data?.success) {
        const result = data.data as GradePredictionsResult;
        if (result.graded > 0) {
          toast.success(`Graded ${result.graded} predictions`);
        } else {
          toast.info('No predictions ready to grade');
        }
        return result;
      }

      toast.error(data?.error || 'Failed to grade predictions');
      return null;
    } catch (error) {
      console.error('Error in gradePredictions:', error);
      toast.error('Failed to grade predictions');
      return null;
    } finally {
      setIsGrading(false);
    }
  }, []);

  const syncAll = useCallback(async () => {
    // Save new predictions first, then grade finished ones
    await savePredictions();
    await gradePredictions();
  }, [savePredictions, gradePredictions]);

  return {
    savePredictions,
    gradePredictions,
    syncAll,
    isSaving,
    isGrading,
    isLoading: isSaving || isGrading,
  };
}
