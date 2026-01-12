import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SavePredictionsResult {
  saved: number;
  skipped: number;
  leagues: string[];
  duration_ms?: number;
}

interface GradePredictionsResult {
  graded: number;
  checked: number;
  algorithms_updated: number;
  duration_ms?: number;
}

interface SyncState {
  isSaving: boolean;
  isGrading: boolean;
  lastSaveResult: SavePredictionsResult | null;
  lastGradeResult: GradePredictionsResult | null;
  lastError: string | null;
}

export function usePredictionSync() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<SyncState>({
    isSaving: false,
    isGrading: false,
    lastSaveResult: null,
    lastGradeResult: null,
    lastError: null,
  });

  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["algorithmPerformance"] });
    queryClient.invalidateQueries({ queryKey: ["historicalPredictions"] });
    queryClient.invalidateQueries({ queryKey: ["algorithmAccuracy"] });
    queryClient.invalidateQueries({ queryKey: ["recentPredictions"] });
  }, [queryClient]);

  const savePredictions = useCallback(async (leagues?: string[]): Promise<SavePredictionsResult | null> => {
    setState(prev => ({ ...prev, isSaving: true, lastError: null }));
    
    try {
      const { data, error } = await supabase.functions.invoke('save-predictions', {
        body: leagues ? { leagues } : undefined,
      });

      if (error) {
        const errorMessage = error.message || 'Failed to save predictions';
        console.error('Error saving predictions:', error);
        setState(prev => ({ ...prev, lastError: errorMessage }));
        toast.error(errorMessage);
        return null;
      }

      if (data?.success) {
        const result = data.data as SavePredictionsResult;
        setState(prev => ({ ...prev, lastSaveResult: result }));
        
        if (result.saved > 0) {
          toast.success(`Saved ${result.saved} new predictions`);
        } else {
          toast.info('No new predictions to save');
        }
        
        invalidateQueries();
        return result;
      }

      const errorMessage = data?.error || 'Failed to save predictions';
      setState(prev => ({ ...prev, lastError: errorMessage }));
      toast.error(errorMessage);
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save predictions';
      console.error('Error in savePredictions:', error);
      setState(prev => ({ ...prev, lastError: errorMessage }));
      toast.error(errorMessage);
      return null;
    } finally {
      setState(prev => ({ ...prev, isSaving: false }));
    }
  }, [invalidateQueries]);

  const gradePredictions = useCallback(async (): Promise<GradePredictionsResult | null> => {
    setState(prev => ({ ...prev, isGrading: true, lastError: null }));
    
    try {
      const { data, error } = await supabase.functions.invoke('grade-predictions');

      if (error) {
        const errorMessage = error.message || 'Failed to grade predictions';
        console.error('Error grading predictions:', error);
        setState(prev => ({ ...prev, lastError: errorMessage }));
        toast.error(errorMessage);
        return null;
      }

      if (data?.success) {
        const result = data.data as GradePredictionsResult;
        setState(prev => ({ ...prev, lastGradeResult: result }));
        
        if (result.graded > 0) {
          toast.success(`Graded ${result.graded} predictions`);
        } else {
          toast.info('No predictions ready to grade');
        }
        
        invalidateQueries();
        return result;
      }

      const errorMessage = data?.error || 'Failed to grade predictions';
      setState(prev => ({ ...prev, lastError: errorMessage }));
      toast.error(errorMessage);
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to grade predictions';
      console.error('Error in gradePredictions:', error);
      setState(prev => ({ ...prev, lastError: errorMessage }));
      toast.error(errorMessage);
      return null;
    } finally {
      setState(prev => ({ ...prev, isGrading: false }));
    }
  }, [invalidateQueries]);

  const syncAll = useCallback(async (): Promise<{
    save: SavePredictionsResult | null;
    grade: GradePredictionsResult | null;
  }> => {
    // Run save and grade in sequence (save first, then grade)
    const saveResult = await savePredictions();
    const gradeResult = await gradePredictions();
    
    return { save: saveResult, grade: gradeResult };
  }, [savePredictions, gradePredictions]);

  const reset = useCallback(() => {
    setState({
      isSaving: false,
      isGrading: false,
      lastSaveResult: null,
      lastGradeResult: null,
      lastError: null,
    });
  }, []);

  return {
    savePredictions,
    gradePredictions,
    syncAll,
    reset,
    isSaving: state.isSaving,
    isGrading: state.isGrading,
    isLoading: state.isSaving || state.isGrading,
    lastSaveResult: state.lastSaveResult,
    lastGradeResult: state.lastGradeResult,
    lastError: state.lastError,
  };
}
