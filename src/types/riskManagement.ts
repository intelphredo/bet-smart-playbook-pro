/**
 * Extended bankroll types for advanced risk management
 */

export interface RiskExposure {
  totalExposure: number;
  openBetsCount: number;
  exposureByLeague: Record<string, { amount: number; count: number; percentage: number }>;
  exposureByOutcome: Record<string, { amount: number; count: number; percentage: number }>;
  exposureByBetType: Record<string, { amount: number; count: number; percentage: number }>;
  largestSingleBet: { matchTitle: string; amount: number; percentage: number } | null;
  warnings: ExposureWarning[];
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
}

export interface ExposureWarning {
  type: 'over_exposure_league' | 'over_exposure_outcome' | 'single_bet_too_large' | 'total_exposure_high';
  severity: 'warning' | 'danger';
  message: string;
  value: number;
  threshold: number;
}

export interface WithdrawalRecommendation {
  recommendedAmount: number;
  safeAmount: number;
  aggressiveAmount: number;
  reasoning: string;
  monthlyIncomeTarget: number;
  expectedEdge: number;
  sustainabilityScore: number; // 0-100
  protectedBankroll: number;
  growthReserve: number;
}

export interface PsychologicalGuardrail {
  id: string;
  type: 'loss_streak_lockout' | 'max_bet_limit' | 'daily_loss_limit' | 'session_time_limit' | 'cool_down_period';
  enabled: boolean;
  threshold: number;
  action: 'warn' | 'block' | 'lockout';
  lockoutDuration?: number; // in hours
  description: string;
  currentValue: number;
  isTriggered: boolean;
}

export interface GuardrailsConfig {
  maxSingleBetPercent: number;
  maxLossStreak: number;
  lockoutHours: number;
  dailyLossLimit: number;
  dailyBetLimit: number;
  sessionTimeLimit: number; // in minutes
  coolDownAfterLoss: number; // in minutes
  enableAutoLockout: boolean;
  enableBetSizeWarnings: boolean;
}

export interface GoalProgress {
  targetAmount: number;
  currentProgress: number;
  progressPercent: number;
  remainingAmount: number;
  daysRemaining: number;
  daysElapsed: number;
  currentROI: number;
  projectedDaysToGoal: number;
  isOnTrack: boolean;
  dailyTargetRequired: number;
  recommendation: string;
}

export interface SpotlightPick {
  id: string;
  matchId: string;
  matchTitle: string;
  league: string;
  team: string;
  market: string;
  odds: number;
  confidence: number;
  evPercentage: number;
  reasoning: string;
  startTime: string;
  algorithmId?: string;
}

export interface UpcomingAlert {
  id: string;
  type: 'high_value' | 'injury' | 'line_movement' | 'sharp_money';
  priority: 'normal' | 'high' | 'critical';
  matchId: string;
  matchTitle: string;
  league: string;
  message: string;
  details: string;
  startTime: string;
  timestamp: string;
}

export const DEFAULT_GUARDRAILS_CONFIG: GuardrailsConfig = {
  maxSingleBetPercent: 5,
  maxLossStreak: 3,
  lockoutHours: 24,
  dailyLossLimit: 100,
  dailyBetLimit: 10,
  sessionTimeLimit: 180, // 3 hours
  coolDownAfterLoss: 15,
  enableAutoLockout: true,
  enableBetSizeWarnings: true,
};
