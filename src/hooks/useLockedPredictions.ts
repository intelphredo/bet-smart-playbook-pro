/**
 * Hook to fetch locked predictions from the database
 * These predictions are immutable and should be used instead of regenerating
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Match } from '@/types/sports';

export interface LockedPrediction {
  id: string;
  match_id: string;
  algorithm_id: string;
  prediction: string;
  confidence: number;
  projected_score_home: number | null;
  projected_score_away: number | null;
  predicted_at: string;
  status: string;
  is_live_prediction: boolean;
  home_team: string | null;
  away_team: string | null;
  match_title: string | null;
  league: string | null;
}

// In-memory cache of locked predictions for quick lookup
const lockedPredictionsCache = new Map<string, LockedPrediction>();

/**
 * Fetch all pending predictions for upcoming matches
 */
export function useLockedPredictions(matchIds?: string[]) {
  return useQuery({
    queryKey: ['lockedPredictions', matchIds?.join(',')],
    queryFn: async () => {
      let query = supabase
        .from('algorithm_predictions')
        .select('*')
        .eq('status', 'pending')
        .order('predicted_at', { ascending: false });
      
      if (matchIds && matchIds.length > 0) {
        query = query.in('match_id', matchIds);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching locked predictions:', error);
        throw error;
      }
      
      // Update the in-memory cache
      const predictions = (data || []) as LockedPrediction[];
      predictions.forEach(p => {
        const key = `${p.match_id}-${p.algorithm_id}`;
        lockedPredictionsCache.set(key, p);
      });
      
      console.log(`[LockedPredictions] Cached ${predictions.length} locked predictions`);
      
      return predictions;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

/**
 * Check if a prediction is locked (exists in database)
 */
export function isPredicitionLocked(matchId: string, algorithmId?: string): boolean {
  if (algorithmId) {
    return lockedPredictionsCache.has(`${matchId}-${algorithmId}`);
  }
  
  // Check if any algorithm has a locked prediction for this match
  for (const key of lockedPredictionsCache.keys()) {
    if (key.startsWith(`${matchId}-`)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get a locked prediction from cache
 */
export function getLockedPrediction(matchId: string, algorithmId: string): LockedPrediction | undefined {
  return lockedPredictionsCache.get(`${matchId}-${algorithmId}`);
}

/**
 * Get all locked predictions for a match (all algorithms)
 */
export function getLockedPredictionsForMatch(matchId: string): LockedPrediction[] {
  const predictions: LockedPrediction[] = [];
  
  for (const [key, prediction] of lockedPredictionsCache.entries()) {
    if (key.startsWith(`${matchId}-`)) {
      predictions.push(prediction);
    }
  }
  
  return predictions;
}

/**
 * Apply locked prediction to a match object
 * Returns the match with the locked prediction data if available
 */
export function applyLockedPredictionToMatch(match: Match, algorithmId?: string): Match {
  const predictions = getLockedPredictionsForMatch(match.id);
  
  if (predictions.length === 0) {
    return match;
  }
  
  // Use specific algorithm if provided, otherwise use the first one (usually Statistical Edge)
  const lockedPrediction = algorithmId 
    ? predictions.find(p => p.algorithm_id === algorithmId)
    : predictions[0];
  
  if (!lockedPrediction) {
    return match;
  }
  
  // Apply the locked prediction to the match
  return {
    ...match,
    prediction: {
      ...match.prediction,
      recommended: lockedPrediction.prediction as 'home' | 'away',
      confidence: lockedPrediction.confidence,
      projectedScore: {
        home: lockedPrediction.projected_score_home ?? match.prediction?.projectedScore?.home ?? 0,
        away: lockedPrediction.projected_score_away ?? match.prediction?.projectedScore?.away ?? 0,
      },
      algorithmId: lockedPrediction.algorithm_id,
      isLocked: true,
      lockedAt: lockedPrediction.predicted_at,
    },
  };
}

/**
 * Check database for locked prediction (async version for use in prediction engine)
 */
export async function checkLockedPredictionAsync(
  matchId: string, 
  algorithmId: string
): Promise<LockedPrediction | null> {
  // First check cache
  const cached = getLockedPrediction(matchId, algorithmId);
  if (cached) {
    return cached;
  }
  
  // Query database
  const { data, error } = await supabase
    .from('algorithm_predictions')
    .select('*')
    .eq('match_id', matchId)
    .eq('algorithm_id', algorithmId)
    .maybeSingle();
  
  if (error) {
    console.error('Error checking locked prediction:', error);
    return null;
  }
  
  if (data) {
    // Update cache
    const prediction = data as LockedPrediction;
    lockedPredictionsCache.set(`${matchId}-${algorithmId}`, prediction);
    return prediction;
  }
  
  return null;
}

/**
 * Bulk check for locked predictions
 */
export async function getLockedPredictionsBulk(
  matchIds: string[]
): Promise<Map<string, LockedPrediction[]>> {
  const result = new Map<string, LockedPrediction[]>();
  
  if (matchIds.length === 0) {
    return result;
  }
  
  const { data, error } = await supabase
    .from('algorithm_predictions')
    .select('*')
    .in('match_id', matchIds);
  
  if (error) {
    console.error('Error fetching locked predictions bulk:', error);
    return result;
  }
  
  // Group by match_id
  (data || []).forEach(p => {
    const prediction = p as LockedPrediction;
    const existing = result.get(prediction.match_id) || [];
    existing.push(prediction);
    result.set(prediction.match_id, existing);
    
    // Also update cache
    lockedPredictionsCache.set(`${prediction.match_id}-${prediction.algorithm_id}`, prediction);
  });
  
  return result;
}

/**
 * Clear the locked predictions cache (should rarely be used)
 */
export function clearLockedPredictionsCache(): void {
  lockedPredictionsCache.clear();
}

/**
 * Get cache statistics
 */
export function getLockedPredictionsCacheStats(): { size: number } {
  return { size: lockedPredictionsCache.size };
}
