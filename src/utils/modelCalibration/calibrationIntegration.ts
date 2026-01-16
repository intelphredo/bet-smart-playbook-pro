/**
 * Integration layer that applies recalibration weights to predictions
 * This module bridges the recalibration system with the prediction algorithms
 */

import { ModelWeight, DEFAULT_CALIBRATION_CONFIG } from './types';
import { ALGORITHM_IDS } from '@/utils/predictions/algorithms';
import { 
  applyBinCalibration, 
  getBinCalibrationSummary,
  type BinCalibrationResult 
} from './binCalibration';

// In-memory cache for model weights (updated by the recalibration hook)
let cachedWeights: ModelWeight[] | null = null;
let lastWeightUpdate: Date | null = null;

/**
 * Update the cached weights from the recalibration system
 * This is called by the useModelRecalibration hook when new data is available
 */
export function updateCachedWeights(weights: ModelWeight[]): void {
  cachedWeights = weights;
  lastWeightUpdate = new Date();
  console.log('[Calibration] Weights updated:', weights.map(w => 
    `${w.algorithmName}: ${(w.adjustedWeight * 100).toFixed(1)}% (×${w.confidenceMultiplier.toFixed(2)})`
  ));
}

/**
 * Get the current cached weights
 */
export function getCachedWeights(): ModelWeight[] | null {
  return cachedWeights;
}

/**
 * Check if weights are stale (older than 30 minutes)
 */
export function areWeightsStale(): boolean {
  if (!lastWeightUpdate) return true;
  const thirtyMinutes = 30 * 60 * 1000;
  return (new Date().getTime() - lastWeightUpdate.getTime()) > thirtyMinutes;
}

/**
 * Get calibration data for a specific algorithm
 */
export function getAlgorithmCalibration(algorithmId: string): {
  confidenceMultiplier: number;
  minConfidenceThreshold: number;
  weight: number;
  isPaused: boolean;
} {
  if (!cachedWeights) {
    // Return default values if no calibration data
    return {
      confidenceMultiplier: 1.0,
      minConfidenceThreshold: DEFAULT_CALIBRATION_CONFIG.minConfidenceFloor,
      weight: 0.33,
      isPaused: false,
    };
  }

  const weight = cachedWeights.find(w => w.algorithmId === algorithmId);
  
  if (!weight) {
    return {
      confidenceMultiplier: 1.0,
      minConfidenceThreshold: DEFAULT_CALIBRATION_CONFIG.minConfidenceFloor,
      weight: 0.33,
      isPaused: false,
    };
  }

  return {
    confidenceMultiplier: weight.confidenceMultiplier,
    minConfidenceThreshold: weight.minConfidenceThreshold,
    weight: weight.adjustedWeight,
    isPaused: weight.adjustedWeight < 0.1,
  };
}

/**
 * Apply calibration adjustment to a confidence score
 * Returns the adjusted confidence and whether it meets the minimum threshold
 * Now includes bin-level calibration for more precise adjustments
 */
export function applyConfidenceCalibration(
  rawConfidence: number,
  algorithmId: string
): {
  adjustedConfidence: number;
  rawConfidence: number;
  meetsThreshold: boolean;
  multiplier: number;
  isPaused: boolean;
  binAdjustment: {
    factor: number;
    binLabel: string;
    wasAdjusted: boolean;
  };
} {
  const calibration = getAlgorithmCalibration(algorithmId);
  
  // First apply algorithm-level calibration
  let adjustedConfidence = rawConfidence * calibration.confidenceMultiplier;
  
  // Then apply bin-level calibration for fine-tuning
  const binResult = applyBinCalibration(adjustedConfidence);
  adjustedConfidence = binResult.calibratedConfidence;
  
  // Check against minimum threshold
  const meetsThreshold = adjustedConfidence >= calibration.minConfidenceThreshold;
  
  return {
    adjustedConfidence: Math.max(35, Math.min(95, Math.round(adjustedConfidence))),
    rawConfidence,
    meetsThreshold,
    multiplier: calibration.confidenceMultiplier,
    isPaused: calibration.isPaused,
    binAdjustment: {
      factor: binResult.adjustmentFactor,
      binLabel: binResult.binLabel,
      wasAdjusted: binResult.wasAdjusted,
    },
  };
}

/**
 * Calculate weighted consensus confidence from multiple algorithms
 * Uses recalibrated weights instead of equal weighting
 */
export function calculateWeightedConsensus(
  algorithmPredictions: Array<{
    algorithmId: string;
    prediction: string;
    confidence: number;
  }>
): {
  consensusPrediction: string;
  consensusConfidence: number;
  algorithmWeights: Record<string, number>;
  isHighConsensus: boolean;
} {
  // Group predictions by their recommendation
  const predictionGroups = new Map<string, Array<{ algorithmId: string; confidence: number; weight: number }>>();
  const algorithmWeights: Record<string, number> = {};
  
  for (const pred of algorithmPredictions) {
    const calibration = getAlgorithmCalibration(pred.algorithmId);
    
    // Skip paused algorithms
    if (calibration.isPaused) {
      algorithmWeights[pred.algorithmId] = 0;
      continue;
    }
    
    algorithmWeights[pred.algorithmId] = calibration.weight;
    
    const group = predictionGroups.get(pred.prediction) || [];
    group.push({
      algorithmId: pred.algorithmId,
      confidence: pred.confidence * calibration.confidenceMultiplier,
      weight: calibration.weight,
    });
    predictionGroups.set(pred.prediction, group);
  }
  
  // Find the prediction with highest weighted confidence
  let consensusPrediction = '';
  let maxWeightedConfidence = 0;
  
  for (const [prediction, group] of predictionGroups) {
    const totalWeight = group.reduce((sum, p) => sum + p.weight, 0);
    const weightedConfidence = group.reduce((sum, p) => sum + p.confidence * p.weight, 0) / totalWeight;
    
    if (weightedConfidence > maxWeightedConfidence) {
      maxWeightedConfidence = weightedConfidence;
      consensusPrediction = prediction;
    }
  }
  
  // Check if it's high consensus (all non-paused algorithms agree)
  const activePredictions = algorithmPredictions.filter(p => {
    const cal = getAlgorithmCalibration(p.algorithmId);
    return !cal.isPaused;
  });
  const uniquePredictions = new Set(activePredictions.map(p => p.prediction));
  const isHighConsensus = uniquePredictions.size === 1 && activePredictions.length >= 2;
  
  return {
    consensusPrediction,
    consensusConfidence: Math.round(maxWeightedConfidence),
    algorithmWeights,
    isHighConsensus,
  };
}

/**
 * Get a summary of current calibration status for display
 */
export function getCalibrationSummary(): {
  isActive: boolean;
  lastUpdate: Date | null;
  adjustedAlgorithms: number;
  pausedAlgorithms: number;
  averageMultiplier: number;
  binCalibration: {
    isActive: boolean;
    adjustedBinsCount: number;
    overallFactor: number;
    isCalibrated: boolean;
  };
} {
  const binSummary = getBinCalibrationSummary();
  
  if (!cachedWeights) {
    return {
      isActive: binSummary.isActive,
      lastUpdate: binSummary.lastUpdate,
      adjustedAlgorithms: 0,
      pausedAlgorithms: 0,
      averageMultiplier: 1.0,
      binCalibration: {
        isActive: binSummary.isActive,
        adjustedBinsCount: binSummary.adjustedBinsCount,
        overallFactor: binSummary.overallFactor,
        isCalibrated: binSummary.isCalibrated,
      },
    };
  }

  const adjusted = cachedWeights.filter(w => Math.abs(w.confidenceMultiplier - 1.0) > 0.02);
  const paused = cachedWeights.filter(w => w.adjustedWeight < 0.1);
  const avgMultiplier = cachedWeights.reduce((sum, w) => sum + w.confidenceMultiplier, 0) / cachedWeights.length;

  return {
    isActive: true,
    lastUpdate: lastWeightUpdate,
    adjustedAlgorithms: adjusted.length,
    pausedAlgorithms: paused.length,
    averageMultiplier: avgMultiplier,
    binCalibration: {
      isActive: binSummary.isActive,
      adjustedBinsCount: binSummary.adjustedBinsCount,
      overallFactor: binSummary.overallFactor,
      isCalibrated: binSummary.isCalibrated,
    },
  };
}
