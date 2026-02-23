/**
 * Domain Layer - Advanced Ensemble Engine
 * 
 * Implements multi-level ensemble learning inspired by the
 * Google Prediction API + Ensemble Learning framework (97%+ AUC 0.98).
 * 
 * Layers:
 * 1. Base learners (existing algorithms: ML Power Index, Value Pick, Statistical Edge)
 * 2. Gradient Boosting Meta-Layer — adaptive error correction
 * 3. LSTM-inspired Sequential Pattern Layer — captures ordering/streaks
 * 4. Stacking Meta-Model — combines all signals with learned weights
 */

import {
  PredictionResult,
  PredictionFactors,
  MatchData,
} from "./interfaces";
import { AlgorithmWeight, ConsensusResult } from "./consensusEngine";

// ============================================
// Types
// ============================================

export interface EnsembleConfig {
  /** Learning rate for gradient boosting (0-1) */
  boostingLearningRate: number;
  /** Number of boosting iterations */
  boostingRounds: number;
  /** Decay for sequential memory */
  sequentialDecayRate: number;
  /** Diversity bonus weight */
  diversityWeight: number;
  /** Confidence calibration strength */
  calibrationStrength: number;
}

export const DEFAULT_ENSEMBLE_CONFIG: EnsembleConfig = {
  boostingLearningRate: 0.15,
  boostingRounds: 5,
  sequentialDecayRate: 0.9,
  diversityWeight: 0.12,
  calibrationStrength: 0.3,
};

export interface GradientBoostingState {
  /** Residual errors per algorithm */
  residuals: Map<string, number>;
  /** Boosted weight adjustments */
  boostAdjustments: Map<string, number>;
  /** Current round */
  round: number;
}

export interface SequentialPattern {
  /** Detected pattern type */
  type: 'streak' | 'alternating' | 'regression' | 'breakout' | 'none';
  /** Pattern strength 0-1 */
  strength: number;
  /** Predicted next outcome probability adjustment */
  adjustment: number;
  /** Description for UI/debug */
  description: string;
}

export interface EnsembleResult extends ConsensusResult {
  /** Ensemble-specific metadata */
  ensemble: {
    /** Gradient boosting adjustments applied */
    boostingAdjustments: Record<string, number>;
    /** Sequential pattern detected */
    sequentialPattern: SequentialPattern;
    /** Diversity score (higher = more diverse base learners = more robust) */
    diversityScore: number;
    /** Calibrated confidence vs raw */
    calibrationDelta: number;
    /** Meta-model layer contributions */
    layerContributions: {
      baseLearners: number;
      gradientBoosting: number;
      sequentialPattern: number;
      diversityBonus: number;
    };
    /** Final stacked confidence */
    stackedConfidence: number;
  };
}

// ============================================
// Layer 1: Gradient Boosting Meta-Layer
// ============================================

/**
 * Simulate gradient boosting over base learner predictions.
 * In a real ML system this would train on historical residuals;
 * here we approximate using the consensus disagreement as a proxy for error.
 */
export function applyGradientBoosting(
  predictions: PredictionResult[],
  weights: AlgorithmWeight[],
  config: EnsembleConfig = DEFAULT_ENSEMBLE_CONFIG
): GradientBoostingState {
  const weightMap = new Map(weights.map(w => [w.algorithmId, w]));
  const residuals = new Map<string, number>();
  const boostAdjustments = new Map<string, number>();

  // Compute consensus target as weighted mean confidence
  let consensusTarget = 0;
  let totalWeight = 0;
  predictions.forEach(p => {
    const w = weightMap.get(p.algorithmId)?.weight ?? 1 / predictions.length;
    consensusTarget += p.confidence * w;
    totalWeight += w;
  });
  if (totalWeight > 0) consensusTarget /= totalWeight;

  // Initial residuals: difference from consensus
  predictions.forEach(p => {
    residuals.set(p.algorithmId, consensusTarget - p.confidence);
  });

  // Iterative boosting: adjust weights to minimize residuals
  for (let round = 0; round < config.boostingRounds; round++) {
    predictions.forEach(p => {
      const residual = residuals.get(p.algorithmId) ?? 0;
      const currentAdj = boostAdjustments.get(p.algorithmId) ?? 0;

      // Gradient step: move toward reducing residual
      const step = residual * config.boostingLearningRate;
      boostAdjustments.set(p.algorithmId, currentAdj + step);

      // Update residual (shrink it)
      residuals.set(p.algorithmId, residual * (1 - config.boostingLearningRate));
    });
  }

  return {
    residuals,
    boostAdjustments,
    round: config.boostingRounds,
  };
}

// ============================================
// Layer 2: Sequential Pattern Recognition
// ============================================

/**
 * LSTM-inspired sequential pattern detection.
 * Analyzes the ordering of recent results to identify patterns
 * that simple win-rate averages miss.
 */
export function detectSequentialPattern(
  recentForm?: string[],
  decayRate: number = 0.9
): SequentialPattern {
  if (!recentForm || recentForm.length < 3) {
    return { type: 'none', strength: 0, adjustment: 0, description: 'Insufficient data' };
  }

  // Encode results as numbers: W=1, L=-1, D=0
  const encoded = recentForm.map(r => r === 'W' ? 1 : r === 'L' ? -1 : 0);

  // --- Streak detection ---
  let streakLen = 1;
  for (let i = 1; i < encoded.length; i++) {
    if (encoded[i] === encoded[0]) streakLen++;
    else break;
  }
  const streakStrength = Math.min(1, streakLen / 6);

  // --- Alternating pattern detection ---
  let alternatingCount = 0;
  for (let i = 1; i < encoded.length; i++) {
    if (encoded[i] !== encoded[i - 1] && encoded[i] !== 0 && encoded[i - 1] !== 0) {
      alternatingCount++;
    }
  }
  const alternatingRatio = alternatingCount / (encoded.length - 1);

  // --- Regression to mean detection ---
  // If a strong streak is followed by opposite results, detect regression
  const firstHalf = encoded.slice(0, Math.floor(encoded.length / 2));
  const secondHalf = encoded.slice(Math.floor(encoded.length / 2));
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const regressionSignal = Math.abs(firstAvg - secondAvg);

  // --- Breakout detection ---
  // Recent results significantly different from older results
  const recentThree = encoded.slice(0, 3);
  const olderResults = encoded.slice(3);
  const recentAvg = recentThree.reduce((a, b) => a + b, 0) / recentThree.length;
  const olderAvg = olderResults.length > 0
    ? olderResults.reduce((a, b) => a + b, 0) / olderResults.length
    : 0;
  const breakoutSignal = recentAvg - olderAvg;

  // Determine dominant pattern
  if (streakLen >= 4 && streakStrength > 0.5) {
    const direction = encoded[0] === 1 ? 1 : -1;
    // Streaks regress: apply dampening
    const adj = direction * streakStrength * 3 * decayRate;
    return {
      type: 'streak',
      strength: streakStrength,
      adjustment: Math.max(-8, Math.min(8, adj)),
      description: `${streakLen}-game ${encoded[0] === 1 ? 'win' : 'loss'} streak (dampened for regression)`,
    };
  }

  if (alternatingRatio > 0.7) {
    // Alternating: next result likely opposite of most recent
    const nextLikely = -encoded[0];
    return {
      type: 'alternating',
      strength: alternatingRatio,
      adjustment: nextLikely * 2,
      description: `Alternating pattern detected (${Math.round(alternatingRatio * 100)}% alternation rate)`,
    };
  }

  if (regressionSignal > 0.6 && secondAvg * firstAvg < 0) {
    return {
      type: 'regression',
      strength: regressionSignal,
      adjustment: -secondAvg * 3, // Push toward mean
      description: `Regression to mean: reversing from ${secondAvg > 0 ? 'hot' : 'cold'} streak`,
    };
  }

  if (Math.abs(breakoutSignal) > 0.5 && olderResults.length >= 2) {
    return {
      type: 'breakout',
      strength: Math.abs(breakoutSignal),
      adjustment: breakoutSignal * 4,
      description: `Breakout ${breakoutSignal > 0 ? 'upward' : 'downward'}: recent form diverging from baseline`,
    };
  }

  return { type: 'none', strength: 0, adjustment: 0, description: 'No strong sequential pattern' };
}

// ============================================
// Layer 3: Diversity Measurement
// ============================================

/**
 * Measure prediction diversity across base learners.
 * High diversity = ensemble is more robust (less correlated errors).
 * Low diversity = may be overfitting to same signal.
 */
export function calculateDiversityScore(predictions: PredictionResult[]): number {
  if (predictions.length < 2) return 0;

  // Variance of confidence scores
  const confidences = predictions.map(p => p.confidence);
  const mean = confidences.reduce((a, b) => a + b, 0) / confidences.length;
  const variance = confidences.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / confidences.length;

  // Recommendation disagreement
  const recommendations = predictions.map(p => p.recommended);
  const uniqueRecs = new Set(recommendations);
  const recDiversity = (uniqueRecs.size - 1) / Math.max(1, predictions.length - 1);

  // EV spread
  const evs = predictions.map(p => p.evPercentage);
  const evMean = evs.reduce((a, b) => a + b, 0) / evs.length;
  const evVariance = evs.reduce((sum, e) => sum + Math.pow(e - evMean, 2), 0) / evs.length;

  // Combine: higher variance + more disagreement = higher diversity
  const confidenceDiversity = Math.min(1, Math.sqrt(variance) / 15);
  const evDiversity = Math.min(1, Math.sqrt(evVariance) / 10);

  return (confidenceDiversity * 0.4 + recDiversity * 0.35 + evDiversity * 0.25);
}

// ============================================
// Layer 4: Stacking Meta-Model
// ============================================

/**
 * Stack all layers into a final ensemble prediction.
 * This is the meta-model that combines:
 * - Weighted consensus (base learners)
 * - Gradient boosting corrections
 * - Sequential pattern adjustments
 * - Diversity-based confidence calibration
 */
export function stackEnsemble(
  consensus: ConsensusResult,
  boostingState: GradientBoostingState,
  homePattern: SequentialPattern,
  awayPattern: SequentialPattern,
  diversityScore: number,
  config: EnsembleConfig = DEFAULT_ENSEMBLE_CONFIG
): EnsembleResult {
  // --- Base layer contribution ---
  let stackedConfidence = consensus.weightedConfidence;

  // --- Gradient boosting contribution ---
  // Apply average boost adjustment to consensus
  let totalBoostAdj = 0;
  let boostCount = 0;
  const boostingAdjustments: Record<string, number> = {};

  boostingState.boostAdjustments.forEach((adj, algId) => {
    boostingAdjustments[algId] = Math.round(adj * 100) / 100;
    totalBoostAdj += adj;
    boostCount++;
  });
  const avgBoostAdj = boostCount > 0 ? totalBoostAdj / boostCount : 0;
  stackedConfidence += avgBoostAdj * 0.5; // Dampen boosting impact

  // --- Sequential pattern contribution ---
  // Combine home and away patterns: home pattern boosts confidence, away dampens
  const patternImpact = (homePattern.adjustment - awayPattern.adjustment) * 0.4;
  stackedConfidence += patternImpact;

  // Choose the more significant pattern for reporting
  const primaryPattern = Math.abs(homePattern.strength) >= Math.abs(awayPattern.strength)
    ? homePattern
    : awayPattern;

  // --- Diversity bonus ---
  // Higher diversity = more confidence in the ensemble (uncorrelated errors cancel)
  const diversityBonus = diversityScore * config.diversityWeight * 10;
  stackedConfidence += diversityBonus;

  // --- Calibration ---
  // Pull extreme confidences toward center (Platt scaling approximation)
  const rawConfidence = stackedConfidence;
  const center = 55;
  const calibrationDelta = (center - stackedConfidence) * config.calibrationStrength * 0.1;
  stackedConfidence += calibrationDelta;

  // Clamp
  stackedConfidence = Math.max(40, Math.min(95, Math.round(stackedConfidence)));

  // Compute layer contributions for transparency
  const layerContributions = {
    baseLearners: Math.round(consensus.weightedConfidence * 100) / 100,
    gradientBoosting: Math.round(avgBoostAdj * 0.5 * 100) / 100,
    sequentialPattern: Math.round(patternImpact * 100) / 100,
    diversityBonus: Math.round(diversityBonus * 100) / 100,
  };

  return {
    ...consensus,
    confidence: stackedConfidence,
    algorithmId: 'ensemble',
    algorithmName: 'Advanced Ensemble',
    ensemble: {
      boostingAdjustments,
      sequentialPattern: primaryPattern,
      diversityScore: Math.round(diversityScore * 100) / 100,
      calibrationDelta: Math.round(calibrationDelta * 100) / 100,
      layerContributions,
      stackedConfidence,
    },
  };
}

// ============================================
// Main Orchestrator
// ============================================

/**
 * Run the full advanced ensemble pipeline:
 * 1. Take base learner predictions + consensus
 * 2. Apply gradient boosting corrections
 * 3. Detect sequential patterns
 * 4. Measure diversity
 * 5. Stack into final meta-model output
 */
export function runAdvancedEnsemble(
  consensus: ConsensusResult,
  match: MatchData,
  config: EnsembleConfig = DEFAULT_ENSEMBLE_CONFIG
): EnsembleResult {
  const { componentPredictions, weights } = consensus;

  // Layer 1: Gradient Boosting
  const boostingState = applyGradientBoosting(componentPredictions, weights, config);

  // Layer 2: Sequential Pattern Recognition
  const homePattern = detectSequentialPattern(
    match.homeTeam.recentForm,
    config.sequentialDecayRate
  );
  const awayPattern = detectSequentialPattern(
    match.awayTeam.recentForm,
    config.sequentialDecayRate
  );

  // Layer 3: Diversity
  const diversityScore = calculateDiversityScore(componentPredictions);

  // Layer 4: Stacking Meta-Model
  return stackEnsemble(
    consensus,
    boostingState,
    homePattern,
    awayPattern,
    diversityScore,
    config
  );
}
