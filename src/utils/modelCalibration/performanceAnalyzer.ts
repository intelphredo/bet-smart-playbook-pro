/**
 * Analyzes algorithm performance to detect underperforming/overperforming models
 */

import { 
  AlgorithmPerformanceWindow, 
  CalibrationConfig, 
  DEFAULT_CALIBRATION_CONFIG 
} from './types';

interface PredictionRecord {
  algorithmId: string;
  algorithmName: string;
  confidence: number;
  status: 'won' | 'lost' | 'pending';
  predictedAt: string;
}

/**
 * Calculate expected win rate based on confidence levels
 * If model says 70% confidence, we expect ~70% win rate at that level
 */
function calculateExpectedWinRate(predictions: PredictionRecord[]): number {
  if (predictions.length === 0) return 50;
  
  const settledPredictions = predictions.filter(p => p.status !== 'pending');
  if (settledPredictions.length === 0) return 50;
  
  // Expected win rate is the average confidence (as a probability)
  const avgConfidence = settledPredictions.reduce((sum, p) => sum + p.confidence, 0) / settledPredictions.length;
  return avgConfidence;
}

/**
 * Calculate current streak (positive = winning, negative = losing)
 */
function calculateStreak(predictions: PredictionRecord[]): number {
  const settled = predictions
    .filter(p => p.status !== 'pending')
    .sort((a, b) => new Date(b.predictedAt).getTime() - new Date(a.predictedAt).getTime());
  
  if (settled.length === 0) return 0;
  
  const firstResult = settled[0].status;
  let streak = 0;
  
  for (const pred of settled) {
    if (pred.status === firstResult) {
      streak++;
    } else {
      break;
    }
  }
  
  return firstResult === 'won' ? streak : -streak;
}

/**
 * Analyze performance for a single algorithm over a time window
 */
export function analyzeAlgorithmPerformance(
  algorithmId: string,
  algorithmName: string,
  predictions: PredictionRecord[],
  windowDays: number,
  config: CalibrationConfig = DEFAULT_CALIBRATION_CONFIG
): AlgorithmPerformanceWindow {
  const settledPredictions = predictions.filter(p => p.status !== 'pending');
  const wins = settledPredictions.filter(p => p.status === 'won').length;
  const losses = settledPredictions.filter(p => p.status === 'lost').length;
  const totalBets = wins + losses;
  
  const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0;
  const expectedWinRate = calculateExpectedWinRate(predictions);
  const performanceVsExpected = winRate - expectedWinRate;
  
  const streak = calculateStreak(predictions);
  const avgConfidence = predictions.length > 0
    ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
    : 0;
  
  // Get recent results (last 10)
  const recentResults = settledPredictions
    .sort((a, b) => new Date(b.predictedAt).getTime() - new Date(a.predictedAt).getTime())
    .slice(0, 10)
    .map(p => p.status === 'won' ? 'W' : 'L') as ('W' | 'L')[];
  
  return {
    algorithmId,
    algorithmName,
    windowDays,
    totalBets,
    wins,
    losses,
    winRate,
    expectedWinRate,
    performanceVsExpected,
    isUnderperforming: totalBets >= config.minBetsForCalibration && 
                       performanceVsExpected < -config.underperformanceThreshold,
    isOverperforming: totalBets >= config.minBetsForCalibration && 
                      performanceVsExpected > config.overperformanceThreshold,
    streak,
    avgConfidence,
    recentResults,
  };
}

/**
 * Calculate a health score for an algorithm (0-100)
 */
export function calculateAlgorithmHealthScore(performance: AlgorithmPerformanceWindow): number {
  let score = 50; // Start neutral
  
  // Win rate contribution (up to +/- 25 points)
  if (performance.totalBets >= 5) {
    const winRateBonus = ((performance.winRate - 50) / 50) * 25;
    score += winRateBonus;
  }
  
  // Performance vs expected contribution (up to +/- 15 points)
  const expectedBonus = (performance.performanceVsExpected / 20) * 15;
  score += expectedBonus;
  
  // Streak contribution (up to +/- 10 points)
  const streakBonus = Math.min(Math.max(performance.streak * 2, -10), 10);
  score += streakBonus;
  
  // Clamp to 0-100
  return Math.min(Math.max(Math.round(score), 0), 100);
}

/**
 * Determine if an algorithm should be paused due to severe underperformance
 */
export function shouldPauseAlgorithm(performance: AlgorithmPerformanceWindow): boolean {
  // Severe underperformance: >20% below expected with 15+ bets
  if (performance.totalBets >= 15 && performance.performanceVsExpected < -20) {
    return true;
  }
  
  // Extended cold streak
  if (performance.streak <= -8) {
    return true;
  }
  
  // Very low win rate with significant sample
  if (performance.totalBets >= 20 && performance.winRate < 35) {
    return true;
  }
  
  return false;
}
