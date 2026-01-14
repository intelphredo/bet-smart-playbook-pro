/**
 * Types for the automatic model recalibration system
 */

export interface AlgorithmPerformanceWindow {
  algorithmId: string;
  algorithmName: string;
  windowDays: number;
  totalBets: number;
  wins: number;
  losses: number;
  winRate: number;
  expectedWinRate: number; // Based on confidence levels
  performanceVsExpected: number; // Actual - Expected
  isUnderperforming: boolean;
  isOverperforming: boolean;
  streak: number; // Positive = winning streak, negative = losing streak
  avgConfidence: number;
  recentResults: ('W' | 'L')[];
}

export interface ModelWeight {
  algorithmId: string;
  algorithmName: string;
  baseWeight: number; // Original weight (0-1)
  adjustedWeight: number; // After recalibration (0-1)
  adjustmentReason: string;
  confidenceMultiplier: number; // Applied to confidence scores
  minConfidenceThreshold: number; // Adjusted min confidence
  lastUpdated: Date;
}

export interface RecalibrationResult {
  timestamp: Date;
  windowDays: number;
  algorithmPerformance: AlgorithmPerformanceWindow[];
  modelWeights: ModelWeight[];
  recommendations: RecalibrationRecommendation[];
  overallHealthScore: number; // 0-100
  actionsTaken: RecalibrationAction[];
}

export interface RecalibrationRecommendation {
  type: 'increase_confidence' | 'decrease_confidence' | 'pause_algorithm' | 'boost_algorithm' | 'no_change';
  algorithmId: string;
  algorithmName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestedAction: string;
  impact: string;
}

export interface RecalibrationAction {
  algorithmId: string;
  action: string;
  previousValue: number;
  newValue: number;
  reason: string;
}

export interface CalibrationConfig {
  // Performance thresholds
  underperformanceThreshold: number; // % below expected to trigger adjustment
  overperformanceThreshold: number; // % above expected to consider boosting
  minBetsForCalibration: number; // Minimum bets needed to make adjustments
  
  // Adjustment limits
  maxConfidenceReduction: number; // Max % to reduce confidence by
  maxConfidenceBoost: number; // Max % to boost confidence by
  minConfidenceFloor: number; // Never go below this confidence
  maxWeightChange: number; // Max weight change per recalibration
  
  // Time windows for analysis
  shortTermDays: number; // Recent performance window
  mediumTermDays: number; // Medium-term window
  longTermDays: number; // Long-term baseline
  
  // Streak thresholds
  coldStreakThreshold: number; // Consecutive losses to flag
  hotStreakThreshold: number; // Consecutive wins to flag
}

export const DEFAULT_CALIBRATION_CONFIG: CalibrationConfig = {
  underperformanceThreshold: 10, // 10% below expected
  overperformanceThreshold: 10, // 10% above expected
  minBetsForCalibration: 10,
  
  maxConfidenceReduction: 15,
  maxConfidenceBoost: 10,
  minConfidenceFloor: 45,
  maxWeightChange: 0.15,
  
  shortTermDays: 7,
  mediumTermDays: 14,
  longTermDays: 30,
  
  coldStreakThreshold: 5,
  hotStreakThreshold: 5,
};
