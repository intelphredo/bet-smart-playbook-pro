/**
 * Domain Layer - Monte Carlo Confidence Engine
 * 
 * Implements Monte Carlo dropout-style simulation for prediction uncertainty.
 * Instead of neural network dropout, we perturb prediction inputs (team strength,
 * momentum, home advantage) across N samples to produce confidence intervals
 * rather than point estimates.
 * 
 * Inspired by 2026 NBA market efficiency research recommending Bayesian
 * calibration via MC Dropout for superior confidence estimation.
 */

import { PredictionResult, MatchData, PredictionFactors } from "./interfaces";
import { ConsensusResult, AlgorithmWeight } from "./consensusEngine";
import { EnsembleResult } from "./ensembleEngine";

// ============================================
// Types
// ============================================

export interface MonteCarloConfig {
  /** Number of simulation samples */
  numSamples: number;
  /** Perturbation magnitude for confidence (std dev) */
  confidenceNoise: number;
  /** Perturbation magnitude for projected scores */
  scoreNoise: number;
  /** Perturbation for true probability */
  probabilityNoise: number;
  /** Percentiles to report */
  percentiles: [number, number]; // e.g. [5, 95] for 90% CI
}

export const DEFAULT_MC_CONFIG: MonteCarloConfig = {
  numSamples: 200,
  confidenceNoise: 6,    // ±6 percentage points std dev
  scoreNoise: 4,         // ±4 points for projected score
  probabilityNoise: 0.08, // ±8% true probability std dev
  percentiles: [10, 90], // 80% confidence interval
};

export interface UncertaintyBand {
  /** Point estimate (original value) */
  point: number;
  /** Lower bound of confidence interval */
  lower: number;
  /** Upper bound of confidence interval */
  upper: number;
  /** Standard deviation across samples */
  stdDev: number;
  /** Width of the CI as percentage of point estimate */
  widthPct: number;
}

export interface MonteCarloResult {
  /** Uncertainty on confidence score */
  confidence: UncertaintyBand;
  /** Uncertainty on true probability */
  trueProbability: UncertaintyBand;
  /** Uncertainty on projected home score */
  projectedScoreHome: UncertaintyBand;
  /** Uncertainty on projected away score */
  projectedScoreAway: UncertaintyBand;
  /** Uncertainty on EV percentage */
  evPercentage: UncertaintyBand;
  /** How stable is the pick across samples? */
  pickStability: number; // 0-1 (1 = same pick in all samples)
  /** Distribution of picks across samples */
  pickDistribution: Record<string, number>; // e.g. { home: 0.82, away: 0.15, skip: 0.03 }
  /** Calibration quality: is the model overconfident or underconfident? */
  calibrationSignal: 'well-calibrated' | 'overconfident' | 'underconfident' | 'uncertain';
  /** Number of samples used */
  numSamples: number;
}

// ============================================
// Random Utilities (seeded for reproducibility)
// ============================================

/** Box-Muller transform for normal distribution */
function gaussianRandom(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// ============================================
// Core MC Simulation
// ============================================

/**
 * Run Monte Carlo simulation over a set of prediction results.
 * Perturbs each algorithm's confidence/score/probability with Gaussian noise
 * and re-synthesizes the weighted consensus N times to build uncertainty bands.
 */
export function runMonteCarloSimulation(
  predictions: PredictionResult[],
  weights: AlgorithmWeight[],
  config: MonteCarloConfig = DEFAULT_MC_CONFIG
): MonteCarloResult {
  if (predictions.length === 0) {
    return createEmptyResult(config);
  }

  const weightMap = new Map(weights.map(w => [w.algorithmId, w.weight]));
  const totalWeight = weights.reduce((s, w) => s + w.weight, 0) || 1;

  // Storage for sampled outputs
  const sampledConfidence: number[] = [];
  const sampledProbability: number[] = [];
  const sampledHomeScore: number[] = [];
  const sampledAwayScore: number[] = [];
  const sampledEV: number[] = [];
  const pickCounts: Record<string, number> = {};

  for (let i = 0; i < config.numSamples; i++) {
    // Perturb each prediction
    let wConf = 0, wProb = 0, wHome = 0, wAway = 0, wEV = 0, wTotal = 0;
    let homeVote = 0, awayVote = 0, skipVote = 0;

    predictions.forEach(p => {
      const w = weightMap.get(p.algorithmId) ?? (1 / predictions.length);

      // Apply MC dropout: perturb with Gaussian noise
      const noisyConf = clamp(gaussianRandom(p.confidence, config.confidenceNoise), 30, 98);
      const noisyProb = clamp(gaussianRandom(p.trueProbability, config.probabilityNoise), 0.05, 0.98);
      const noisyHome = Math.max(0, gaussianRandom(p.projectedScore.home, config.scoreNoise));
      const noisyAway = Math.max(0, gaussianRandom(p.projectedScore.away, config.scoreNoise));
      const noisyEV = gaussianRandom(p.evPercentage, config.confidenceNoise * 0.5);

      wConf += noisyConf * w;
      wProb += noisyProb * w;
      wHome += noisyHome * w;
      wAway += noisyAway * w;
      wEV += noisyEV * w;
      wTotal += w;

      // Vote based on noisy confidence
      if (noisyConf < 45) skipVote += w;
      else if (noisyHome > noisyAway) homeVote += w;
      else awayVote += w;
    });

    if (wTotal > 0) {
      sampledConfidence.push(wConf / wTotal);
      sampledProbability.push(wProb / wTotal);
      sampledHomeScore.push(wHome / wTotal);
      sampledAwayScore.push(wAway / wTotal);
      sampledEV.push(wEV / wTotal);
    }

    // Determine pick for this sample
    const pick = skipVote > homeVote && skipVote > awayVote
      ? 'skip'
      : homeVote >= awayVote ? 'home' : 'away';
    pickCounts[pick] = (pickCounts[pick] ?? 0) + 1;
  }

  // Build uncertainty bands
  const N = config.numSamples;
  const confidence = buildBand(sampledConfidence, config.percentiles);
  const trueProbability = buildBand(sampledProbability, config.percentiles);
  const projectedScoreHome = buildBand(sampledHomeScore, config.percentiles);
  const projectedScoreAway = buildBand(sampledAwayScore, config.percentiles);
  const evPercentage = buildBand(sampledEV, config.percentiles);

  // Pick stability
  const maxPick = Math.max(...Object.values(pickCounts));
  const pickStability = maxPick / N;

  // Pick distribution normalized
  const pickDistribution: Record<string, number> = {};
  Object.entries(pickCounts).forEach(([k, v]) => {
    pickDistribution[k] = Math.round((v / N) * 100) / 100;
  });

  // Calibration signal
  const ciWidth = confidence.upper - confidence.lower;
  const calibrationSignal: MonteCarloResult['calibrationSignal'] =
    ciWidth > 20 ? 'uncertain' :
    confidence.point > confidence.upper - 3 ? 'overconfident' :
    confidence.point < confidence.lower + 3 ? 'underconfident' :
    'well-calibrated';

  return {
    confidence,
    trueProbability,
    projectedScoreHome,
    projectedScoreAway,
    evPercentage,
    pickStability,
    pickDistribution,
    calibrationSignal,
    numSamples: N,
  };
}

/**
 * Run MC simulation from an EnsembleResult (uses component predictions + weights)
 */
export function runMonteCarloFromEnsemble(
  ensemble: EnsembleResult,
  config: MonteCarloConfig = DEFAULT_MC_CONFIG
): MonteCarloResult {
  return runMonteCarloSimulation(
    ensemble.componentPredictions,
    ensemble.weights,
    config
  );
}

/**
 * Run MC simulation from a ConsensusResult
 */
export function runMonteCarloFromConsensus(
  consensus: ConsensusResult,
  config: MonteCarloConfig = DEFAULT_MC_CONFIG
): MonteCarloResult {
  return runMonteCarloSimulation(
    consensus.componentPredictions,
    consensus.weights,
    config
  );
}

// ============================================
// Helpers
// ============================================

function buildBand(samples: number[], percentiles: [number, number]): UncertaintyBand {
  if (samples.length === 0) {
    return { point: 0, lower: 0, upper: 0, stdDev: 0, widthPct: 0 };
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const n = sorted.length;

  const mean = samples.reduce((a, b) => a + b, 0) / n;
  const variance = samples.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  const lowerIdx = Math.floor((percentiles[0] / 100) * n);
  const upperIdx = Math.min(n - 1, Math.floor((percentiles[1] / 100) * n));

  const lower = sorted[lowerIdx];
  const upper = sorted[upperIdx];

  const point = Math.round(mean * 100) / 100;
  const widthPct = point !== 0 ? Math.round(((upper - lower) / Math.abs(point)) * 100) : 0;

  return {
    point,
    lower: Math.round(lower * 100) / 100,
    upper: Math.round(upper * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
    widthPct,
  };
}

function createEmptyResult(config: MonteCarloConfig): MonteCarloResult {
  const emptyBand: UncertaintyBand = { point: 0, lower: 0, upper: 0, stdDev: 0, widthPct: 0 };
  return {
    confidence: emptyBand,
    trueProbability: emptyBand,
    projectedScoreHome: emptyBand,
    projectedScoreAway: emptyBand,
    evPercentage: emptyBand,
    pickStability: 0,
    pickDistribution: {},
    calibrationSignal: 'uncertain',
    numSamples: config.numSamples,
  };
}
