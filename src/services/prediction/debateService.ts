/**
 * AI Debate Service
 * 
 * Calls the prediction-debate edge function to get LLM-powered
 * qualitative analysis layered on top of quantitative predictions.
 */

import { supabase } from "@/integrations/supabase/client";
import { PredictionResult } from "@/domain/prediction/interfaces";
import { AlgorithmWeight } from "@/domain/prediction/consensusEngine";
import { ConsensusResult } from "@/domain/prediction/consensusEngine";

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
  temporalInsight?: string;
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
  // Extract temporal data from the first prediction's factors if available
  const temporalFactors = input.predictions[0]?.factors?.temporal;

  const payload: Record<string, unknown> = {
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

  // Add temporal context if available
  if (temporalFactors) {
    payload.temporal = {
      seasonSegment: temporalFactors.seasonSegment,
      homeFormWeighted: temporalFactors.recencyWeightedForm.home,
      awayFormWeighted: temporalFactors.recencyWeightedForm.away,
      homeMomentumDecay: temporalFactors.momentumDecay.home,
      awayMomentumDecay: temporalFactors.momentumDecay.away,
      homeTrajectory: temporalFactors.formTrajectory.home,
      awayTrajectory: temporalFactors.formTrajectory.away,
    };
  }

  const { data, error } = await supabase.functions.invoke('prediction-debate', {
    body: payload,
  });

  if (error) {
    throw new Error(error.message || 'Debate analysis failed');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  const result = data as DebateResult;

  // Persist debate result to database alongside algorithm predictions
  persistDebateResult(input, result).catch(err =>
    console.warn('[DebateService] Failed to persist debate result:', err)
  );

  return result;
}

/**
 * Persist debate analysis result to algorithm_predictions table
 * with debate-specific columns (agreement_level, biases, risk_flag, etc.)
 */
async function persistDebateResult(input: DebateInput, result: DebateResult): Promise<void> {
  // Derive a stable match_id from the first prediction if available
  const matchId = input.predictions[0]?.matchId;
  if (!matchId) return;

  const avgProjectedHome = Math.round(
    input.predictions.reduce((sum, p) => sum + p.projectedScore.home, 0) / input.predictions.length
  );
  const avgProjectedAway = Math.round(
    input.predictions.reduce((sum, p) => sum + p.projectedScore.away, 0) / input.predictions.length
  );

  const { error } = await supabase
    .from('algorithm_predictions')
    .upsert({
      match_id: matchId,
      algorithm_id: 'ai-debate-moderator',
      prediction: result.finalPick,
      confidence: Math.round(result.adjustedConfidence),
      projected_score_home: avgProjectedHome,
      projected_score_away: avgProjectedAway,
      home_team: input.homeTeam,
      away_team: input.awayTeam,
      match_title: input.matchTitle,
      league: input.league,
      status: 'pending',
      // Debate-specific columns
      agreement_level: result.agreementLevel,
      biases_identified: result.biasesIdentified,
      risk_flag: result.riskFlag ?? null,
      debate_reasoning: result.reasoning,
      key_factor: result.keyFactor,
      temporal_insight: result.temporalInsight ?? null,
      adjusted_confidence: result.adjustedConfidence,
    } as any, {
      onConflict: 'match_id,algorithm_id',
    });

  if (error) {
    console.error('[DebateService] Persist error:', error);
  }
}
