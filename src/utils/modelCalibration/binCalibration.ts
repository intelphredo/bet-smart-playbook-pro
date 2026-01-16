/**
 * Bin-level calibration system that automatically adjusts confidence scores
 * based on historical performance within specific confidence ranges.
 * 
 * This applies the tuning recommendations in real-time to new predictions.
 */

import { HistoricalPrediction } from '@/hooks/useHistoricalPredictions';

export interface CalibrationBin {
  minConfidence: number;
  maxConfidence: number;
  label: string;
  actualWinRate: number;
  expectedWinRate: number; // midpoint of the bin
  calibrationError: number;
  sampleSize: number;
  adjustmentFactor: number; // multiplier to apply to confidence
  isOverconfident: boolean;
  isUnderconfident: boolean;
}

export interface BinCalibrationResult {
  bins: CalibrationBin[];
  overallAdjustmentFactor: number;
  isCalibrated: boolean;
  recommendations: BinRecommendation[];
}

export interface BinRecommendation {
  bin: string;
  issue: 'overconfident' | 'underconfident' | 'low_sample' | 'well_calibrated';
  adjustmentApplied: number;
  description: string;
}

// Cache for bin calibration data
let cachedBinCalibration: BinCalibrationResult | null = null;
let lastBinUpdate: Date | null = null;

/**
 * Analyze predictions and create bin-level calibration adjustments
 */
export function analyzeBinCalibration(predictions: HistoricalPrediction[]): BinCalibrationResult {
  const bins: CalibrationBin[] = [];
  const recommendations: BinRecommendation[] = [];
  
  // Create bins from 50-95 in 5% increments
  for (let i = 50; i <= 95; i += 5) {
    const minConf = i;
    const maxConf = i + 4;
    const expectedWinRate = (minConf + maxConf) / 2; // midpoint
    
    // Filter predictions in this confidence range
    const binPredictions = predictions.filter(p => {
      const conf = p.confidence || 50;
      return conf >= minConf && conf <= maxConf && (p.status === 'won' || p.status === 'lost');
    });
    
    const won = binPredictions.filter(p => p.status === 'won').length;
    const total = binPredictions.length;
    const actualWinRate = total > 0 ? (won / total) * 100 : expectedWinRate;
    const calibrationError = actualWinRate - expectedWinRate;
    
    // Calculate adjustment factor
    let adjustmentFactor = 1.0;
    const isOverconfident = calibrationError < -5 && total >= 3;
    const isUnderconfident = calibrationError > 5 && total >= 3;
    
    if (total >= 5) { // Only adjust with sufficient data
      if (isOverconfident) {
        // Model is overconfident - reduce future confidence scores
        // If actual is 50% but we said 70%, we should multiply by 50/70 = 0.71
        const targetRatio = Math.max(0.7, actualWinRate / expectedWinRate);
        adjustmentFactor = 0.7 + (targetRatio - 0.7) * 0.8; // Dampen the adjustment
      } else if (isUnderconfident) {
        // Model is underconfident - boost future confidence scores
        const targetRatio = Math.min(1.15, actualWinRate / expectedWinRate);
        adjustmentFactor = 1.0 + (targetRatio - 1.0) * 0.5; // More conservative boost
      }
    }
    
    bins.push({
      minConfidence: minConf,
      maxConfidence: maxConf,
      label: `${minConf}-${maxConf}%`,
      actualWinRate: Math.round(actualWinRate * 10) / 10,
      expectedWinRate,
      calibrationError: Math.round(calibrationError * 10) / 10,
      sampleSize: total,
      adjustmentFactor: Math.round(adjustmentFactor * 100) / 100,
      isOverconfident,
      isUnderconfident,
    });
    
    // Generate recommendations
    if (total < 5 && total > 0) {
      recommendations.push({
        bin: `${minConf}-${maxConf}%`,
        issue: 'low_sample',
        adjustmentApplied: 1.0,
        description: `Only ${total} predictions - need more data for reliable calibration`,
      });
    } else if (isOverconfident) {
      recommendations.push({
        bin: `${minConf}-${maxConf}%`,
        issue: 'overconfident',
        adjustmentApplied: adjustmentFactor,
        description: `Reducing confidence by ${((1 - adjustmentFactor) * 100).toFixed(0)}% (actual: ${actualWinRate.toFixed(1)}% vs expected: ${expectedWinRate}%)`,
      });
    } else if (isUnderconfident) {
      recommendations.push({
        bin: `${minConf}-${maxConf}%`,
        issue: 'underconfident',
        adjustmentApplied: adjustmentFactor,
        description: `Boosting confidence by ${((adjustmentFactor - 1) * 100).toFixed(0)}% (actual: ${actualWinRate.toFixed(1)}% vs expected: ${expectedWinRate}%)`,
      });
    } else if (total >= 5) {
      recommendations.push({
        bin: `${minConf}-${maxConf}%`,
        issue: 'well_calibrated',
        adjustmentApplied: 1.0,
        description: `Well calibrated (${actualWinRate.toFixed(1)}% actual, ${total} picks)`,
      });
    }
  }
  
  // Calculate overall metrics
  const binsWithData = bins.filter(b => b.sampleSize >= 3);
  const overallAdjustment = binsWithData.length > 0
    ? binsWithData.reduce((sum, b) => sum + b.adjustmentFactor * b.sampleSize, 0) / 
      binsWithData.reduce((sum, b) => sum + b.sampleSize, 0)
    : 1.0;
  
  const problematicBins = bins.filter(b => 
    (b.isOverconfident || b.isUnderconfident) && b.sampleSize >= 5
  ).length;
  
  const isCalibrated = problematicBins <= Math.ceil(bins.length * 0.3);
  
  return {
    bins,
    overallAdjustmentFactor: Math.round(overallAdjustment * 100) / 100,
    isCalibrated,
    recommendations,
  };
}

/**
 * Update the cached bin calibration
 */
export function updateBinCalibration(predictions: HistoricalPrediction[]): BinCalibrationResult {
  cachedBinCalibration = analyzeBinCalibration(predictions);
  lastBinUpdate = new Date();
  
  console.log('[BinCalibration] Updated:', {
    overallFactor: cachedBinCalibration.overallAdjustmentFactor,
    isCalibrated: cachedBinCalibration.isCalibrated,
    adjustedBins: cachedBinCalibration.bins.filter(b => b.adjustmentFactor !== 1.0).length,
  });
  
  return cachedBinCalibration;
}

/**
 * Get the cached bin calibration
 */
export function getCachedBinCalibration(): BinCalibrationResult | null {
  return cachedBinCalibration;
}

/**
 * Check if bin calibration is stale (older than 30 minutes)
 */
export function isBinCalibrationStale(): boolean {
  if (!lastBinUpdate) return true;
  const thirtyMinutes = 30 * 60 * 1000;
  return (new Date().getTime() - lastBinUpdate.getTime()) > thirtyMinutes;
}

/**
 * Apply bin-level calibration to a raw confidence score
 * This is the main function called by prediction algorithms
 */
export function applyBinCalibration(rawConfidence: number): {
  calibratedConfidence: number;
  adjustmentFactor: number;
  binLabel: string;
  wasAdjusted: boolean;
} {
  if (!cachedBinCalibration) {
    return {
      calibratedConfidence: rawConfidence,
      adjustmentFactor: 1.0,
      binLabel: 'N/A',
      wasAdjusted: false,
    };
  }
  
  // Find the appropriate bin
  const binIndex = Math.floor((rawConfidence - 50) / 5);
  const bin = cachedBinCalibration.bins[Math.max(0, Math.min(binIndex, cachedBinCalibration.bins.length - 1))];
  
  if (!bin) {
    return {
      calibratedConfidence: rawConfidence,
      adjustmentFactor: 1.0,
      binLabel: 'N/A',
      wasAdjusted: false,
    };
  }
  
  // Apply the adjustment
  let calibratedConfidence = rawConfidence * bin.adjustmentFactor;
  
  // Clamp to valid range
  calibratedConfidence = Math.max(45, Math.min(95, calibratedConfidence));
  
  return {
    calibratedConfidence: Math.round(calibratedConfidence * 10) / 10,
    adjustmentFactor: bin.adjustmentFactor,
    binLabel: bin.label,
    wasAdjusted: bin.adjustmentFactor !== 1.0,
  };
}

/**
 * Get bin calibration summary for display
 */
export function getBinCalibrationSummary(): {
  isActive: boolean;
  lastUpdate: Date | null;
  overallFactor: number;
  adjustedBinsCount: number;
  isCalibrated: boolean;
  worstBin: { label: string; error: number } | null;
  bestBin: { label: string; accuracy: number } | null;
} {
  if (!cachedBinCalibration) {
    return {
      isActive: false,
      lastUpdate: null,
      overallFactor: 1.0,
      adjustedBinsCount: 0,
      isCalibrated: true,
      worstBin: null,
      bestBin: null,
    };
  }
  
  const adjustedBins = cachedBinCalibration.bins.filter(b => b.adjustmentFactor !== 1.0);
  const binsWithData = cachedBinCalibration.bins.filter(b => b.sampleSize >= 5);
  
  // Find worst and best bins
  let worstBin: { label: string; error: number } | null = null;
  let bestBin: { label: string; accuracy: number } | null = null;
  
  if (binsWithData.length > 0) {
    const sortedByError = [...binsWithData].sort((a, b) => 
      Math.abs(b.calibrationError) - Math.abs(a.calibrationError)
    );
    
    if (sortedByError[0] && Math.abs(sortedByError[0].calibrationError) > 5) {
      worstBin = {
        label: sortedByError[0].label,
        error: sortedByError[0].calibrationError,
      };
    }
    
    const sortedByAccuracy = [...binsWithData].sort((a, b) => 
      Math.abs(a.calibrationError) - Math.abs(b.calibrationError)
    );
    
    if (sortedByAccuracy[0]) {
      bestBin = {
        label: sortedByAccuracy[0].label,
        accuracy: 100 - Math.abs(sortedByAccuracy[0].calibrationError),
      };
    }
  }
  
  return {
    isActive: true,
    lastUpdate: lastBinUpdate,
    overallFactor: cachedBinCalibration.overallAdjustmentFactor,
    adjustedBinsCount: adjustedBins.length,
    isCalibrated: cachedBinCalibration.isCalibrated,
    worstBin,
    bestBin,
  };
}
