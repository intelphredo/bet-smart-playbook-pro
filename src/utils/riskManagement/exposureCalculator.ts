/**
 * Utilities for calculating risk exposure and generating warnings
 */

import { UserBet } from '@/types/betting';
import { RiskExposure, ExposureWarning } from '@/types/riskManagement';

interface ExposureConfig {
  bankroll: number;
  maxLeagueExposurePercent: number;
  maxSingleBetPercent: number;
  maxTotalExposurePercent: number;
}

const DEFAULT_CONFIG: ExposureConfig = {
  bankroll: 1000,
  maxLeagueExposurePercent: 30,
  maxSingleBetPercent: 5,
  maxTotalExposurePercent: 25,
};

export function calculateRiskExposure(
  openBets: UserBet[],
  config: Partial<ExposureConfig> = {}
): RiskExposure {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const warnings: ExposureWarning[] = [];
  
  // Calculate total exposure
  const totalExposure = openBets.reduce((sum, bet) => sum + bet.stake, 0);
  const exposurePercent = (totalExposure / cfg.bankroll) * 100;
  
  // Group by league
  const exposureByLeague: Record<string, { amount: number; count: number; percentage: number }> = {};
  for (const bet of openBets) {
    const league = bet.league || 'Unknown';
    if (!exposureByLeague[league]) {
      exposureByLeague[league] = { amount: 0, count: 0, percentage: 0 };
    }
    exposureByLeague[league].amount += bet.stake;
    exposureByLeague[league].count++;
  }
  // Calculate percentages
  for (const league of Object.keys(exposureByLeague)) {
    exposureByLeague[league].percentage = (exposureByLeague[league].amount / cfg.bankroll) * 100;
    
    // Check for over-exposure
    if (exposureByLeague[league].percentage > cfg.maxLeagueExposurePercent) {
      warnings.push({
        type: 'over_exposure_league',
        severity: exposureByLeague[league].percentage > cfg.maxLeagueExposurePercent * 1.5 ? 'danger' : 'warning',
        message: `${league} exposure is ${exposureByLeague[league].percentage.toFixed(1)}% of bankroll`,
        value: exposureByLeague[league].percentage,
        threshold: cfg.maxLeagueExposurePercent,
      });
    }
  }
  
  // Group by outcome type (home/away/over/under)
  const exposureByOutcome: Record<string, { amount: number; count: number; percentage: number }> = {};
  for (const bet of openBets) {
    const outcome = bet.bet_type || 'Unknown';
    if (!exposureByOutcome[outcome]) {
      exposureByOutcome[outcome] = { amount: 0, count: 0, percentage: 0 };
    }
    exposureByOutcome[outcome].amount += bet.stake;
    exposureByOutcome[outcome].count++;
  }
  for (const outcome of Object.keys(exposureByOutcome)) {
    exposureByOutcome[outcome].percentage = (exposureByOutcome[outcome].amount / cfg.bankroll) * 100;
  }
  
  // Group by bet type (moneyline/spread/total)
  const exposureByBetType: Record<string, { amount: number; count: number; percentage: number }> = {};
  for (const bet of openBets) {
    const betType = bet.selection?.includes('Spread') ? 'Spread' : 
                    bet.selection?.includes('Over') || bet.selection?.includes('Under') ? 'Total' : 'Moneyline';
    if (!exposureByBetType[betType]) {
      exposureByBetType[betType] = { amount: 0, count: 0, percentage: 0 };
    }
    exposureByBetType[betType].amount += bet.stake;
    exposureByBetType[betType].count++;
  }
  for (const betType of Object.keys(exposureByBetType)) {
    exposureByBetType[betType].percentage = (exposureByBetType[betType].amount / cfg.bankroll) * 100;
  }
  
  // Find largest single bet
  let largestSingleBet: RiskExposure['largestSingleBet'] = null;
  if (openBets.length > 0) {
    const largest = openBets.reduce((max, bet) => bet.stake > max.stake ? bet : max);
    const largestPercent = (largest.stake / cfg.bankroll) * 100;
    largestSingleBet = {
      matchTitle: largest.match_title,
      amount: largest.stake,
      percentage: largestPercent,
    };
    
    if (largestPercent > cfg.maxSingleBetPercent) {
      warnings.push({
        type: 'single_bet_too_large',
        severity: largestPercent > cfg.maxSingleBetPercent * 2 ? 'danger' : 'warning',
        message: `Largest bet is ${largestPercent.toFixed(1)}% of bankroll`,
        value: largestPercent,
        threshold: cfg.maxSingleBetPercent,
      });
    }
  }
  
  // Check total exposure
  if (exposurePercent > cfg.maxTotalExposurePercent) {
    warnings.push({
      type: 'total_exposure_high',
      severity: exposurePercent > cfg.maxTotalExposurePercent * 1.5 ? 'danger' : 'warning',
      message: `Total exposure is ${exposurePercent.toFixed(1)}% of bankroll`,
      value: exposurePercent,
      threshold: cfg.maxTotalExposurePercent,
    });
  }
  
  // Determine overall risk level
  const dangerCount = warnings.filter(w => w.severity === 'danger').length;
  const warningCount = warnings.filter(w => w.severity === 'warning').length;
  
  let riskLevel: RiskExposure['riskLevel'] = 'low';
  if (dangerCount >= 2 || exposurePercent > 40) {
    riskLevel = 'critical';
  } else if (dangerCount >= 1 || warningCount >= 2) {
    riskLevel = 'high';
  } else if (warningCount >= 1 || exposurePercent > 15) {
    riskLevel = 'moderate';
  }
  
  return {
    totalExposure,
    openBetsCount: openBets.length,
    exposureByLeague,
    exposureByOutcome,
    exposureByBetType,
    largestSingleBet,
    warnings,
    riskLevel,
  };
}

export function calculateWithdrawalRecommendation(
  currentBankroll: number,
  startingBankroll: number,
  monthlyIncomeTarget: number,
  expectedEdge: number, // as decimal, e.g., 0.03 for 3%
  currentROI: number
): {
  recommendedAmount: number;
  safeAmount: number;
  aggressiveAmount: number;
  reasoning: string;
  sustainabilityScore: number;
  protectedBankroll: number;
  growthReserve: number;
} {
  const profit = currentBankroll - startingBankroll;
  
  // Calculate sustainable withdrawal based on expected edge
  // Rule: Only withdraw a portion of expected edge to allow for variance
  const monthlyExpectedProfit = currentBankroll * expectedEdge * 20; // ~20 betting days/month
  const sustainableWithdrawal = monthlyExpectedProfit * 0.5; // 50% of expected monthly profit
  
  // Safe amount: Never withdraw more than 25% of profits
  const safeAmount = Math.max(0, Math.min(profit * 0.25, sustainableWithdrawal));
  
  // Recommended: Balance between income goal and bankroll protection
  const recommendedAmount = Math.min(
    monthlyIncomeTarget,
    safeAmount,
    profit * 0.4 // Never more than 40% of total profit
  );
  
  // Aggressive: Up to 60% of profits but never below starting bankroll
  const aggressiveAmount = Math.max(0, Math.min(profit * 0.6, currentBankroll - startingBankroll));
  
  // Calculate sustainability score
  let sustainabilityScore = 50;
  if (currentROI > 10) sustainabilityScore += 20;
  else if (currentROI > 5) sustainabilityScore += 10;
  else if (currentROI < 0) sustainabilityScore -= 20;
  
  if (recommendedAmount <= sustainableWithdrawal) sustainabilityScore += 15;
  if (currentBankroll > startingBankroll * 1.2) sustainabilityScore += 15;
  
  sustainabilityScore = Math.max(0, Math.min(100, sustainabilityScore));
  
  // Protected bankroll (never go below this)
  const protectedBankroll = startingBankroll * 0.9;
  
  // Growth reserve (keep this for compounding)
  const growthReserve = profit * 0.5;
  
  let reasoning = '';
  if (profit <= 0) {
    reasoning = 'Your bankroll is at or below starting amount. Focus on rebuilding before withdrawing.';
  } else if (recommendedAmount >= monthlyIncomeTarget) {
    reasoning = `You can sustainably withdraw your target of $${monthlyIncomeTarget} while protecting your bankroll.`;
  } else if (recommendedAmount > 0) {
    reasoning = `Recommended withdrawal of $${recommendedAmount.toFixed(0)} balances income needs with bankroll growth.`;
  } else {
    reasoning = 'Build more profit before withdrawing to ensure long-term sustainability.';
  }
  
  return {
    recommendedAmount: Math.max(0, recommendedAmount),
    safeAmount: Math.max(0, safeAmount),
    aggressiveAmount: Math.max(0, aggressiveAmount),
    reasoning,
    sustainabilityScore,
    protectedBankroll,
    growthReserve,
  };
}

export function calculateGoalProgress(
  currentBankroll: number,
  startingBankroll: number,
  targetProfit: number,
  periodDays: number, // e.g., 30 for monthly
  daysElapsed: number,
  currentROI: number
): {
  currentProgress: number;
  progressPercent: number;
  remainingAmount: number;
  daysRemaining: number;
  projectedDaysToGoal: number;
  isOnTrack: boolean;
  dailyTargetRequired: number;
  recommendation: string;
} {
  const currentProfit = currentBankroll - startingBankroll;
  const progressPercent = Math.min(100, Math.max(0, (currentProfit / targetProfit) * 100));
  const remainingAmount = Math.max(0, targetProfit - currentProfit);
  const daysRemaining = periodDays - daysElapsed;
  
  // Calculate daily rate needed
  const dailyTargetRequired = daysRemaining > 0 ? remainingAmount / daysRemaining : remainingAmount;
  
  // Calculate projected days based on current performance
  const dailyRate = daysElapsed > 0 ? currentProfit / daysElapsed : 0;
  const projectedDaysToGoal = dailyRate > 0 ? remainingAmount / dailyRate : 999;
  
  const isOnTrack = projectedDaysToGoal <= daysRemaining;
  
  let recommendation = '';
  if (progressPercent >= 100) {
    recommendation = '🎉 Congratulations! You\'ve hit your goal. Consider setting a new target or withdrawing profits.';
  } else if (isOnTrack && progressPercent >= 75) {
    recommendation = '🔥 Excellent pace! Stay disciplined and you\'ll exceed your goal.';
  } else if (isOnTrack) {
    recommendation = '✅ On track. Maintain your current strategy and bet sizing.';
  } else if (progressPercent >= 50) {
    recommendation = '⚠️ Slightly behind schedule. Focus on high-value picks only.';
  } else if (progressPercent >= 25) {
    recommendation = '📊 Behind target. Consider increasing selectivity or adjusting your goal.';
  } else {
    recommendation = '🎯 Significant ground to cover. Stay patient and avoid chasing losses.';
  }
  
  return {
    currentProgress: currentProfit,
    progressPercent,
    remainingAmount,
    daysRemaining,
    projectedDaysToGoal: Math.round(projectedDaysToGoal),
    isOnTrack,
    dailyTargetRequired,
    recommendation,
  };
}
