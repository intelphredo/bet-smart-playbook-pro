/**
 * Adjusts model weights and confidence thresholds based on performance analysis
 */

import { 
  AlgorithmPerformanceWindow, 
  ModelWeight, 
  RecalibrationAction,
  RecalibrationRecommendation,
  CalibrationConfig,
  DEFAULT_CALIBRATION_CONFIG 
} from './types';
import { shouldPauseAlgorithm, calculateAlgorithmHealthScore } from './performanceAnalyzer';

// Base weights for each algorithm (equal by default)
const BASE_WEIGHTS: Record<string, number> = {
  'f4ce9fdc-c41a-4a5c-9f18-5d732674c5b8': 0.34, // ML Power Index
  '3a7e2d9b-8c5f-4b1f-9e17-7b31a4dce6c2': 0.33, // Value Pick Finder
  '85c48bbe-5b1a-4c1e-a0d5-e284e9e952f1': 0.33, // Statistical Edge
};

const ALGORITHM_NAMES: Record<string, string> = {
  'f4ce9fdc-c41a-4a5c-9f18-5d732674c5b8': 'ML Power Index',
  '3a7e2d9b-8c5f-4b1f-9e17-7b31a4dce6c2': 'Value Pick Finder',
  '85c48bbe-5b1a-4c1e-a0d5-e284e9e952f1': 'Statistical Edge',
};

/**
 * Calculate adjusted weight based on performance
 */
function calculateAdjustedWeight(
  performance: AlgorithmPerformanceWindow,
  baseWeight: number,
  config: CalibrationConfig
): { weight: number; reason: string } {
  if (performance.totalBets < config.minBetsForCalibration) {
    return { weight: baseWeight, reason: 'Insufficient data for adjustment' };
  }
  
  // Check if should pause
  if (shouldPauseAlgorithm(performance)) {
    return { weight: 0.05, reason: 'Paused due to severe underperformance' };
  }
  
  let adjustment = 0;
  let reason = '';
  
  // Adjust based on performance vs expected
  if (performance.isUnderperforming) {
    // Reduce weight proportionally to underperformance
    const underperformanceLevel = Math.abs(performance.performanceVsExpected) / 100;
    adjustment = -Math.min(underperformanceLevel * 0.3, config.maxWeightChange);
    reason = `Reduced: ${performance.performanceVsExpected.toFixed(1)}% below expected`;
  } else if (performance.isOverperforming) {
    // Increase weight proportionally to overperformance
    const overperformanceLevel = performance.performanceVsExpected / 100;
    adjustment = Math.min(overperformanceLevel * 0.2, config.maxWeightChange);
    reason = `Boosted: ${performance.performanceVsExpected.toFixed(1)}% above expected`;
  } else {
    reason = 'Performing as expected';
  }
  
  // Apply streak adjustments
  if (performance.streak <= -config.coldStreakThreshold) {
    adjustment -= 0.05;
    reason += ` (cold streak: ${Math.abs(performance.streak)} losses)`;
  } else if (performance.streak >= config.hotStreakThreshold) {
    adjustment += 0.03;
    reason += ` (hot streak: ${performance.streak} wins)`;
  }
  
  const adjustedWeight = Math.max(0.05, Math.min(0.6, baseWeight + adjustment));
  return { weight: adjustedWeight, reason };
}

/**
 * Calculate confidence multiplier based on recent performance
 */
function calculateConfidenceMultiplier(
  performance: AlgorithmPerformanceWindow,
  config: CalibrationConfig
): number {
  if (performance.totalBets < config.minBetsForCalibration) {
    return 1.0; // No adjustment
  }
  
  let multiplier = 1.0;
  
  // Adjust based on calibration (actual vs expected)
  const calibrationError = performance.performanceVsExpected / 100;
  
  if (performance.isUnderperforming) {
    // Model is overconfident - reduce confidence
    const reduction = Math.min(Math.abs(calibrationError) * 0.5, config.maxConfidenceReduction / 100);
    multiplier = 1 - reduction;
  } else if (performance.isOverperforming) {
    // Model is underconfident - could boost slightly
    const boost = Math.min(calibrationError * 0.3, config.maxConfidenceBoost / 100);
    multiplier = 1 + boost;
  }
  
  // Streak adjustments
  if (performance.streak <= -3) {
    multiplier *= 0.95; // Further reduce during cold streaks
  } else if (performance.streak >= 3) {
    multiplier *= 1.02; // Slight boost during hot streaks
  }
  
  return Math.max(0.7, Math.min(1.15, multiplier));
}

/**
 * Calculate adjusted minimum confidence threshold
 */
function calculateMinConfidenceThreshold(
  performance: AlgorithmPerformanceWindow,
  config: CalibrationConfig
): number {
  const baseThreshold = 55; // Default minimum
  
  if (performance.totalBets < config.minBetsForCalibration) {
    return baseThreshold;
  }
  
  // Raise threshold for underperforming algorithms
  if (performance.isUnderperforming) {
    const thresholdIncrease = Math.min(Math.abs(performance.performanceVsExpected) * 0.3, 15);
    return Math.min(baseThreshold + thresholdIncrease, 75);
  }
  
  // Lower threshold for overperforming algorithms
  if (performance.isOverperforming) {
    const thresholdDecrease = Math.min(performance.performanceVsExpected * 0.2, 10);
    return Math.max(baseThreshold - thresholdDecrease, config.minConfidenceFloor);
  }
  
  return baseThreshold;
}

/**
 * Generate recommendations based on performance analysis
 */
function generateRecommendation(
  performance: AlgorithmPerformanceWindow,
  config: CalibrationConfig
): RecalibrationRecommendation {
  const healthScore = calculateAlgorithmHealthScore(performance);
  
  // Check for critical issues first
  if (shouldPauseAlgorithm(performance)) {
    return {
      type: 'pause_algorithm',
      algorithmId: performance.algorithmId,
      algorithmName: performance.algorithmName,
      severity: 'critical',
      message: `${performance.algorithmName} is severely underperforming and should be paused`,
      suggestedAction: 'Temporarily pause this algorithm until performance improves',
      impact: `Currently ${performance.winRate.toFixed(1)}% win rate vs ${performance.expectedWinRate.toFixed(1)}% expected`,
    };
  }
  
  if (performance.isUnderperforming) {
    const severity = performance.performanceVsExpected < -15 ? 'high' : 'medium';
    return {
      type: 'decrease_confidence',
      algorithmId: performance.algorithmId,
      algorithmName: performance.algorithmName,
      severity,
      message: `${performance.algorithmName} is underperforming expectations`,
      suggestedAction: 'Reduce confidence weight and increase minimum threshold',
      impact: `${performance.performanceVsExpected.toFixed(1)}% below expected win rate`,
    };
  }
  
  if (performance.isOverperforming) {
    return {
      type: 'boost_algorithm',
      algorithmId: performance.algorithmId,
      algorithmName: performance.algorithmName,
      severity: 'low',
      message: `${performance.algorithmName} is exceeding expectations`,
      suggestedAction: 'Consider increasing weight for this algorithm',
      impact: `+${performance.performanceVsExpected.toFixed(1)}% above expected win rate`,
    };
  }
  
  return {
    type: 'no_change',
    algorithmId: performance.algorithmId,
    algorithmName: performance.algorithmName,
    severity: 'low',
    message: `${performance.algorithmName} is performing as expected`,
    suggestedAction: 'No adjustment needed',
    impact: `Within ${config.underperformanceThreshold}% of expected performance`,
  };
}

/**
 * Calculate model weights for all algorithms based on performance
 */
export function calculateModelWeights(
  performances: AlgorithmPerformanceWindow[],
  config: CalibrationConfig = DEFAULT_CALIBRATION_CONFIG
): { weights: ModelWeight[]; actions: RecalibrationAction[]; recommendations: RecalibrationRecommendation[] } {
  const weights: ModelWeight[] = [];
  const actions: RecalibrationAction[] = [];
  const recommendations: RecalibrationRecommendation[] = [];
  
  for (const performance of performances) {
    const baseWeight = BASE_WEIGHTS[performance.algorithmId] || 0.33;
    const { weight: adjustedWeight, reason } = calculateAdjustedWeight(performance, baseWeight, config);
    const confidenceMultiplier = calculateConfidenceMultiplier(performance, config);
    const minConfidenceThreshold = calculateMinConfidenceThreshold(performance, config);
    
    weights.push({
      algorithmId: performance.algorithmId,
      algorithmName: performance.algorithmName,
      baseWeight,
      adjustedWeight,
      adjustmentReason: reason,
      confidenceMultiplier,
      minConfidenceThreshold,
      lastUpdated: new Date(),
    });
    
    // Track significant changes
    if (Math.abs(adjustedWeight - baseWeight) > 0.05) {
      actions.push({
        algorithmId: performance.algorithmId,
        action: adjustedWeight > baseWeight ? 'Weight increased' : 'Weight decreased',
        previousValue: baseWeight,
        newValue: adjustedWeight,
        reason,
      });
    }
    
    if (confidenceMultiplier !== 1.0) {
      actions.push({
        algorithmId: performance.algorithmId,
        action: 'Confidence multiplier adjusted',
        previousValue: 1.0,
        newValue: confidenceMultiplier,
        reason: `Based on ${performance.performanceVsExpected.toFixed(1)}% calibration error`,
      });
    }
    
    recommendations.push(generateRecommendation(performance, config));
  }
  
  // Normalize weights to sum to 1
  const totalWeight = weights.reduce((sum, w) => sum + w.adjustedWeight, 0);
  if (totalWeight > 0) {
    for (const w of weights) {
      w.adjustedWeight = w.adjustedWeight / totalWeight;
    }
  }
  
  return { weights, actions, recommendations };
}

/**
 * Apply weight adjustments to a confidence score
 */
export function applyWeightAdjustment(
  confidence: number,
  algorithmId: string,
  weights: ModelWeight[]
): { adjustedConfidence: number; meetsThreshold: boolean; weight: number } {
  const weight = weights.find(w => w.algorithmId === algorithmId);
  
  if (!weight) {
    return { adjustedConfidence: confidence, meetsThreshold: confidence >= 55, weight: 0.33 };
  }
  
  const adjustedConfidence = confidence * weight.confidenceMultiplier;
  const meetsThreshold = adjustedConfidence >= weight.minConfidenceThreshold;
  
  return { 
    adjustedConfidence: Math.round(adjustedConfidence * 10) / 10, 
    meetsThreshold, 
    weight: weight.adjustedWeight 
  };
}
