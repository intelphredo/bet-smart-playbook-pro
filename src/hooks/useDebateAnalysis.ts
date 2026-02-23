/**
 * Hook for AI Debate Analysis
 * 
 * Fetches LLM-powered debate synthesis for a match's predictions.
 * Layers qualitative reasoning on top of quantitative consensus.
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Match } from "@/types/sports";
import { PredictionResult } from "@/domain/prediction/interfaces";
import { AlgorithmWeight } from "@/domain/prediction/consensusEngine";
import { requestDebateAnalysis, DebateResult } from "@/services/prediction/debateService";

interface UseDebateAnalysisOptions {
  match: Match | null;
  predictions: PredictionResult[];
  weights: AlgorithmWeight[];
  enabled?: boolean;
}

export function useDebateAnalysis(options: UseDebateAnalysisOptions) {
  const { match, predictions, weights, enabled = true } = options;

  const hasPredictions = predictions.length > 0;
  const predictionKey = predictions.map(p => `${p.algorithmId}:${p.recommended}:${p.confidence}`).join('|');

  const query = useQuery({
    queryKey: ['debate-analysis', match?.id, predictionKey],
    queryFn: async (): Promise<DebateResult> => {
      if (!match) throw new Error('No match provided');

      const homeTeam = match.homeTeam?.name ?? 'Home';
      const awayTeam = match.awayTeam?.name ?? 'Away';
      const matchTitle = `${homeTeam} vs ${awayTeam}`;

      return requestDebateAnalysis({
        matchTitle,
        league: match.league ?? 'Unknown',
        homeTeam,
        awayTeam,
        predictions,
        weights,
      });
    },
    enabled: enabled && !!match && hasPredictions,
    staleTime: 15 * 60 * 1000, // 15 min — debate results don't change often
    retry: 1, // Only retry once for AI calls
  });

  return {
    debate: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    isDebateAvailable: hasPredictions,
  };
}

export type { DebateResult };
