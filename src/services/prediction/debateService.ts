/**
 * AI Debate Service
 * 
 * Calls the prediction-debate edge function to get LLM-powered
 * qualitative analysis layered on top of quantitative predictions.
 */

import { supabase } from "@/integrations/supabase/client";
import { PredictionResult } from "@/domain/prediction/interfaces";
import { AlgorithmWeight } from "@/domain/prediction/consensusEngine";

// ============================================
// Types
// ============================================

export interface DebateResult {
  finalPick: 'home' | 'away' | 'skip';
  adjustedConfidence: number;
  reasoning: string;
  biasesIdentified: string[];
  keyFactor: string;
  agreementLevel: 'unanimous' | 'strong' | 'split' | 'contested';
  riskFlag?: string;
}

interface DebateInput {
  matchTitle: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  predictions: PredictionResult[];
  weights: AlgorithmWeight[];
}

// ============================================
// Service
// ============================================

export async function requestDebateAnalysis(input: DebateInput): Promise<DebateResult> {
  const payload = {
    matchTitle: input.matchTitle,
    league: input.league,
    homeTeam: input.homeTeam,
    awayTeam: input.awayTeam,
    predictions: input.predictions.map(p => ({
      algorithmName: p.algorithmName,
      recommended: p.recommended,
      confidence: p.confidence,
      projectedScore: p.projectedScore,
      evPercentage: p.evPercentage,
      kellyStakeUnits: p.kellyStakeUnits,
      trueProbability: p.trueProbability,
    })),
    weights: input.weights.map(w => ({
      algorithmName: w.algorithmName,
      weight: w.weight,
      winRate: w.winRate,
    })),
  };

  const { data, error } = await supabase.functions.invoke('prediction-debate', {
    body: payload,
  });

  if (error) {
    throw new Error(error.message || 'Debate analysis failed');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as DebateResult;
}
