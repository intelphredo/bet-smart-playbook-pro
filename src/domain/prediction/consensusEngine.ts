/**
 * Domain Layer - Weighted Consensus Engine
 * 
 * Multi-algorithm consensus framework that weights predictions
 * by historical accuracy and calibrated probabilities.
 * Inspired by the W-5 multi-agent debate framework.
 */

import { PredictionResult, PredictionFactors, MatchData } from "./interfaces";
import { supabase } from "@/integrations/supabase/client";
import { ALGORITHM_IDS } from "./algorithms";

// ============================================
// Types
// ============================================

export interface AlgorithmWeight {
  algorithmId: string;
  algorithmName: string;
  weight: number;       // Normalized 0-1
  winRate: number;       // Historical win rate
  totalPredictions: number;
  avgConfidence: number;
  reliability: number;   // Confidence in the weight itself
}

export interface ConsensusResult extends PredictionResult {
  /** Individual algorithm predictions used */
  componentPredictions: PredictionResult[];
  /** Weights applied to each algorithm */
  weights: AlgorithmWeight[];
  /** Agreement level 0-1 */
  agreement: number;
  /** Whether all algorithms agree */
  unanimous: boolean;
  /** Weighted confidence (vs simple average) */
  weightedConfidence: number;
}

// ============================================
// Weight Calculation from Historical Stats
// ============================================

/**
 * Fetch algorithm performance stats from database
 * and compute normalized weights
 */
export async function fetchAlgorithmWeights(): Promise<AlgorithmWeight[]> {
  try {
    const { data, error } = await supabase
      .from('algorithm_stats')
      .select('algorithm_id, win_rate, total_predictions, correct_predictions, avg_confidence');

    if (error || !data || data.length === 0) {
      return getDefaultWeights();
    }

    const stats = data.map(row => ({
      algorithmId: row.algorithm_id,
      winRate: row.win_rate ?? 50,
      totalPredictions: row.total_predictions ?? 0,
      correctPredictions: row.correct_predictions ?? 0,
      avgConfidence: row.avg_confidence ?? 50,
    }));

    return computeWeights(stats);
  } catch {
    return getDefaultWeights();
  }
}

interface RawStats {
  algorithmId: string;
  winRate: number;
  totalPredictions: number;
  correctPredictions: number;
  avgConfidence: number;
}

/**
 * Compute normalized weights using a Bayesian-inspired approach:
 * - Base weight from win rate (performance signal)
 * - Reliability from sample size (confidence in the signal)
 * - Calibration bonus if predicted confidence matches actual win rate
 */
function computeWeights(stats: RawStats[]): AlgorithmWeight[] {
  const algorithmNames: Record<string, string> = {
    [ALGORITHM_IDS.ML_POWER_INDEX]: "ML Power Index",
    [ALGORITHM_IDS.VALUE_PICK_FINDER]: "Value Pick Finder",
    [ALGORITHM_IDS.STATISTICAL_EDGE]: "Statistical Edge",
  };

  const MIN_SAMPLES_FOR_FULL_WEIGHT = 30;

  const rawWeights = stats.map(s => {
    // Reliability: how much we trust this algorithm's track record
    const reliability = Math.min(1, s.totalPredictions / MIN_SAMPLES_FOR_FULL_WEIGHT);

    // Performance score: win rate with Bayesian shrinkage toward 50%
    const shrunkWinRate = reliability * s.winRate + (1 - reliability) * 50;

    // Calibration bonus: reward algorithms whose confidence matches reality
    const calibrationError = Math.abs(s.winRate - s.avgConfidence);
    const calibrationBonus = Math.max(0, 1 - calibrationError / 50); // 0-1

    // Combined raw weight
    const rawWeight = (shrunkWinRate / 100) * (0.7 + 0.3 * calibrationBonus);

    return {
      algorithmId: s.algorithmId,
      algorithmName: algorithmNames[s.algorithmId] ?? "Unknown",
      rawWeight,
      winRate: s.winRate,
      totalPredictions: s.totalPredictions,
      avgConfidence: s.avgConfidence,
      reliability,
    };
  });

  // Normalize weights to sum to 1
  const totalWeight = rawWeights.reduce((sum, w) => sum + w.rawWeight, 0);

  return rawWeights.map(w => ({
    algorithmId: w.algorithmId,
    algorithmName: w.algorithmName,
    weight: totalWeight > 0 ? w.rawWeight / totalWeight : 1 / rawWeights.length,
    winRate: w.winRate,
    totalPredictions: w.totalPredictions,
    avgConfidence: w.avgConfidence,
    reliability: w.reliability,
  }));
}

/**
 * Default equal weights when no historical data is available
 */
function getDefaultWeights(): AlgorithmWeight[] {
  return [
    {
      algorithmId: ALGORITHM_IDS.ML_POWER_INDEX,
      algorithmName: "ML Power Index",
      weight: 1 / 3,
      winRate: 50,
      totalPredictions: 0,
      avgConfidence: 50,
      reliability: 0,
    },
    {
      algorithmId: ALGORITHM_IDS.VALUE_PICK_FINDER,
      algorithmName: "Value Pick Finder",
      weight: 1 / 3,
      winRate: 50,
      totalPredictions: 0,
      avgConfidence: 50,
      reliability: 0,
    },
    {
      algorithmId: ALGORITHM_IDS.STATISTICAL_EDGE,
      algorithmName: "Statistical Edge",
      weight: 1 / 3,
      winRate: 50,
      totalPredictions: 0,
      avgConfidence: 50,
      reliability: 0,
    },
  ];
}

// ============================================
// Consensus Synthesis
// ============================================

/**
 * Synthesize multiple algorithm predictions into a weighted consensus.
 * 
 * Key improvements over simple majority vote:
 * 1. Weights by historical accuracy (better algorithms get more say)
 * 2. Calibrated probability averaging (not just vote counting)
 * 3. Agreement-adjusted confidence (higher when unanimous)
 * 4. Weighted score projections
 */
export function synthesizeConsensus(
  predictions: Map<string, PredictionResult>,
  weights: AlgorithmWeight[],
  matchId: string
): ConsensusResult {
  const predArray = Array.from(predictions.values());
  const weightMap = new Map(weights.map(w => [w.algorithmId, w]));

  // ---- Weighted vote ----
  let homeScore = 0;
  let awayScore = 0;
  let drawScore = 0;
  let totalWeight = 0;

  // ---- Weighted probability & confidence ----
  let weightedConfidence = 0;
  let weightedTrueProb = 0;
  let weightedHomeProjected = 0;
  let weightedAwayProjected = 0;
  let weightedEV = 0;
  let weightedEVPct = 0;
  let weightedKelly = 0;
  let weightedKellyStake = 0;

  predArray.forEach(pred => {
    const w = weightMap.get(pred.algorithmId)?.weight ?? (1 / predArray.length);
    totalWeight += w;

    // Weighted vote
    if (pred.recommended === 'home') homeScore += w;
    else if (pred.recommended === 'away') awayScore += w;
    else if (pred.recommended === 'draw') drawScore += w;

    // Weighted averages
    weightedConfidence += pred.confidence * w;
    weightedTrueProb += pred.trueProbability * w;
    weightedHomeProjected += pred.projectedScore.home * w;
    weightedAwayProjected += pred.projectedScore.away * w;
    weightedEV += pred.expectedValue * w;
    weightedEVPct += pred.evPercentage * w;
    weightedKelly += pred.kellyFraction * w;
    weightedKellyStake += pred.kellyStakeUnits * w;
  });

  // Normalize
  if (totalWeight > 0) {
    weightedConfidence /= totalWeight;
    weightedTrueProb /= totalWeight;
    weightedHomeProjected /= totalWeight;
    weightedAwayProjected /= totalWeight;
    weightedEV /= totalWeight;
    weightedEVPct /= totalWeight;
    weightedKelly /= totalWeight;
    weightedKellyStake /= totalWeight;
  }

  // Determine recommendation from weighted votes
  const maxVote = Math.max(homeScore, awayScore, drawScore);
  let recommended: 'home' | 'away' | 'draw' | 'skip';
  if (maxVote === 0) {
    recommended = 'skip';
  } else if (homeScore === maxVote) {
    recommended = 'home';
  } else if (awayScore === maxVote) {
    recommended = 'away';
  } else {
    recommended = 'draw';
  }

  // Calculate agreement
  const votes = predArray.map(p => p.recommended);
  const agreeing = votes.filter(v => v === recommended).length;
  const agreement = predArray.length > 0 ? agreeing / predArray.length : 0;
  const unanimous = agreement === 1;

  // Agreement-adjusted confidence: boost when unanimous, penalize when split
  const agreementMultiplier = 0.85 + (agreement * 0.15); // Range: 0.85 - 1.0
  const finalConfidence = Math.round(weightedConfidence * agreementMultiplier);

  // Build consensus factors by averaging
  const consensusFactors: PredictionFactors = predArray[0]?.factors ?? {
    teamStrength: { home: { offense: 50, defense: 50, momentum: 50, overall: 50 }, away: { offense: 50, defense: 50, momentum: 50, overall: 50 }, differential: 0 },
    homeAdvantage: 2,
    momentum: { home: 50, away: 50, differential: 0 },
  };

  return {
    matchId,
    recommended,
    confidence: Math.max(40, Math.min(95, finalConfidence)),
    trueProbability: Math.max(0.01, Math.min(0.99, weightedTrueProb)),
    projectedScore: {
      home: Math.round(weightedHomeProjected * 10) / 10,
      away: Math.round(weightedAwayProjected * 10) / 10,
    },
    impliedOdds: weightedTrueProb > 0 ? Math.round((1 / weightedTrueProb) * 100) / 100 : 2,
    expectedValue: Math.round(weightedEV * 10000) / 10000,
    evPercentage: Math.round(weightedEVPct * 100) / 100,
    kellyFraction: Math.round(weightedKelly * 10000) / 10000,
    kellyStakeUnits: Math.round(weightedKellyStake * 100) / 100,
    factors: consensusFactors,
    algorithmId: 'consensus',
    algorithmName: 'AI Consensus',
    generatedAt: new Date().toISOString(),
    // Consensus-specific fields
    componentPredictions: predArray,
    weights,
    agreement,
    unanimous,
    weightedConfidence: Math.round(weightedConfidence),
  };
}
