/**
 * Ensemble Service
 * 
 * Orchestrates the full advanced ensemble pipeline:
 * 1. Runs local ensemble layers (gradient boosting, sequential patterns, diversity)
 * 2. Optionally calls the AI meta-learner for qualitative synthesis
 */

import { supabase } from "@/integrations/supabase/client";
import { MatchData } from "@/domain/prediction/interfaces";
import { ConsensusResult } from "@/domain/prediction/consensusEngine";
import { runAdvancedEnsemble, EnsembleResult } from "@/domain/prediction/ensembleEngine";

// ============================================
// Types
// ============================================

export interface MetaSynthesis {
  metaPick: 'home' | 'away' | 'skip';
  metaConfidence: number;
  synthesis: string;
  boostingAssessment: string;
  patternReliability: 'high' | 'moderate' | 'low' | 'unreliable';
  blindSpots: string[];
  edgeStrength: 'strong' | 'moderate' | 'slight' | 'none';
  regressionRisk: 'high' | 'moderate' | 'low';
}

export interface FullEnsembleResult {
  ensemble: EnsembleResult;
  metaSynthesis?: MetaSynthesis;
}

// ============================================
// Service
// ============================================

/**
 * Run the local ensemble engine (no AI calls, instant)
 */
export function runLocalEnsemble(
  consensus: ConsensusResult,
  match: MatchData
): EnsembleResult {
  return runAdvancedEnsemble(consensus, match);
}

/**
 * Run the full ensemble with AI meta-synthesis
 */
export async function runFullEnsemble(
  consensus: ConsensusResult,
  match: MatchData
): Promise<FullEnsembleResult> {
  // Step 1: Local ensemble
  const ensemble = runAdvancedEnsemble(consensus, match);

  // Step 2: AI meta-synthesis
  const temporalFactors = consensus.componentPredictions[0]?.factors?.temporal;

  const payload: Record<string, unknown> = {
    matchTitle: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
    league: match.league,
    homeTeam: match.homeTeam.name,
    awayTeam: match.awayTeam.name,
    predictions: consensus.componentPredictions.map(p => ({
      algorithmName: p.algorithmName,
      recommended: p.recommended,
      confidence: p.confidence,
      evPercentage: p.evPercentage,
      kellyStakeUnits: p.kellyStakeUnits,
    })),
    ensembleMetadata: ensemble.ensemble,
  };

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

  try {
    const { data, error } = await supabase.functions.invoke('ensemble-synthesize', {
      body: payload,
    });

    if (error) {
      console.warn('AI meta-synthesis failed, using local ensemble only:', error.message);
      return { ensemble };
    }

    if (data?.error) {
      console.warn('AI meta-synthesis returned error:', data.error);
      return { ensemble };
    }

    return {
      ensemble,
      metaSynthesis: data as MetaSynthesis,
    };
  } catch (e) {
    console.warn('AI meta-synthesis exception, using local ensemble only:', e);
    return { ensemble };
  }
}
