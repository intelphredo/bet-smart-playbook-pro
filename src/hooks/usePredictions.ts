/**
 * Presentation Layer - usePredictions Hook
 * 
 * React hook that consumes the prediction service.
 * Clean separation from data fetching and business logic.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback } from "react";
import { Match } from "@/types/sports";
import { PredictionResult } from "@/domain/prediction/interfaces";
import { getPredictionService } from "@/services/prediction/predictionService";
import { ALGORITHM_IDS, ALGORITHM_REGISTRY } from "@/domain/prediction/algorithms";

// ============================================
// Hook Options
// ============================================

interface UsePredictionsOptions {
  matches: Match[];
  algorithmId?: string;
  enabled?: boolean;
  staleTime?: number;
}

// ============================================
// Main Hook
// ============================================

export function usePredictions(options: UsePredictionsOptions) {
  const {
    matches,
    algorithmId = ALGORITHM_IDS.ML_POWER_INDEX,
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
  } = options;

  const queryClient = useQueryClient();
  const service = useMemo(() => getPredictionService(), []);

  // Generate predictions query
  const matchIds = useMemo(() => matches.map(m => m.id).sort().join(','), [matches]);
  
  const predictionsQuery = useQuery({
    queryKey: ['predictions', algorithmId, matchIds],
    queryFn: async () => {
      const predictions = await service.predictBatch(matches, algorithmId);
      return predictions;
    },
    enabled: enabled && matches.length > 0,
    staleTime,
    placeholderData: (prev) => prev,
  });

  // Enhanced matches with predictions
  const enhancedMatches = useMemo(() => {
    if (!predictionsQuery.data) return matches;

    return matches.map(match => {
      const prediction = predictionsQuery.data.get(match.id);
      if (!prediction) return match;

      return {
        ...match,
        prediction: {
          recommended: prediction.recommended,
          confidence: prediction.confidence,
          projectedScore: prediction.projectedScore,
          trueProbability: prediction.trueProbability,
          impliedOdds: prediction.impliedOdds,
          expectedValue: prediction.expectedValue,
          evPercentage: prediction.evPercentage,
          kellyFraction: prediction.kellyFraction,
          kellyStakeUnits: prediction.kellyStakeUnits,
          algorithmId: prediction.algorithmId,
          algorithmName: prediction.algorithmName,
        },
      };
    });
  }, [matches, predictionsQuery.data]);

  // Get prediction for specific match
  const getPrediction = useCallback((matchId: string): PredictionResult | undefined => {
    return predictionsQuery.data?.get(matchId);
  }, [predictionsQuery.data]);

  // Refresh predictions
  const refresh = useCallback(() => {
    service.clearCache();
    queryClient.invalidateQueries({ queryKey: ['predictions'] });
  }, [service, queryClient]);

  return {
    predictions: predictionsQuery.data ?? new Map<string, PredictionResult>(),
    enhancedMatches,
    getPrediction,
    isLoading: predictionsQuery.isLoading,
    isFetching: predictionsQuery.isFetching,
    error: predictionsQuery.error,
    refresh,
    algorithms: ALGORITHM_REGISTRY,
  };
}

// ============================================
// Single Match Prediction Hook
// ============================================

interface UseSinglePredictionOptions {
  match: Match | null;
  algorithmId?: string;
  enabled?: boolean;
}

export function useSinglePrediction(options: UseSinglePredictionOptions) {
  const { match, algorithmId, enabled = true } = options;
  const service = useMemo(() => getPredictionService(), []);

  const query = useQuery({
    queryKey: ['prediction', match?.id, algorithmId],
    queryFn: async () => {
      if (!match) return null;
      return service.predict(match, algorithmId);
    },
    enabled: enabled && !!match,
    staleTime: 5 * 60 * 1000,
  });

  return {
    prediction: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}

// ============================================
// All Algorithms Comparison Hook
// ============================================

interface UseAlgorithmComparisonOptions {
  match: Match | null;
  enabled?: boolean;
}

export function useAlgorithmComparison(options: UseAlgorithmComparisonOptions) {
  const { match, enabled = true } = options;
  const service = useMemo(() => getPredictionService(), []);

  const query = useQuery({
    queryKey: ['algorithm-comparison', match?.id],
    queryFn: async () => {
      if (!match) return new Map<string, PredictionResult>();
      return service.getAllAlgorithmPredictions(match);
    },
    enabled: enabled && !!match,
    staleTime: 10 * 60 * 1000,
  });

  // Find consensus
  const consensus = useMemo(() => {
    if (!query.data || query.data.size === 0) return null;

    let homeVotes = 0;
    let awayVotes = 0;
    
    query.data.forEach(p => {
      if (p.recommended === 'home') homeVotes++;
      if (p.recommended === 'away') awayVotes++;
    });

    return {
      unanimous: homeVotes === query.data.size || awayVotes === query.data.size,
      recommendation: homeVotes > awayVotes ? 'home' : 'away',
      agreement: Math.max(homeVotes, awayVotes) / query.data.size,
    };
  }, [query.data]);

  return {
    predictions: query.data ?? new Map<string, PredictionResult>(),
    consensus,
    isLoading: query.isLoading,
    error: query.error,
    algorithms: ALGORITHM_REGISTRY,
  };
}

export default usePredictions;
