/**
 * Kelly Criterion Calculator
 * 
 * The Kelly Criterion is a formula for optimal bet sizing that maximizes
 * long-term bankroll growth while minimizing risk of ruin.
 * 
 * Formula: f* = (bp - q) / b
 * Where:
 *   f* = fraction of bankroll to bet
 *   b = decimal odds - 1 (net odds)
 *   p = probability of winning (your model's prediction)
 *   q = probability of losing (1 - p)
 */

export interface KellyResult {
  fullKelly: number;              // Full Kelly fraction (0-1)
  adjustedKelly: number;          // Fractional Kelly (usually 1/4 or 1/2 of full)
  recommendedStake: number;       // Dollar amount to bet
  recommendedStakePercentage: number; // Percentage of bankroll
  recommendedStakeUnits: number;  // In betting units
  expectedValue: number;          // Expected value of the bet
  evPercentage: number;           // EV as percentage
  expectedGrowth: number;         // Expected bankroll growth rate
  isPositiveEV: boolean;          // Whether bet has positive expected value
  riskLevel: 'low' | 'medium' | 'high'; // Risk assessment
}

export interface KellyConfig {
  trueProbability: number;        // Your model's win probability (0-1)
  bookmakerOdds: number;          // Decimal odds from bookmaker
  bankroll: number;               // Current bankroll
  kellyFraction?: number;         // Fraction of full Kelly to use (default 0.25)
  unitSize?: number;              // Size of one unit in dollars
  minEVThreshold?: number;        // Minimum EV% to bet (default 3%)
  maxBetPercentage?: number;      // Maximum bet as % of bankroll (default 5%)
}

/**
 * Calculate Kelly Criterion stake for a bet
 */
export function calculateKellyStake(config: KellyConfig): KellyResult {
  const {
    trueProbability,
    bookmakerOdds,
    bankroll,
    kellyFraction = 0.25,  // Default to 1/4 Kelly for safety
    unitSize = bankroll / 100, // Default 1 unit = 1% of bankroll
    minEVThreshold = 3.0,
    maxBetPercentage = 5.0
  } = config;

  // Validate inputs
  if (trueProbability <= 0 || trueProbability >= 1) {
    throw new Error('True probability must be between 0 and 1');
  }
  if (bookmakerOdds <= 1) {
    throw new Error('Bookmaker odds must be greater than 1');
  }
  if (bankroll <= 0) {
    throw new Error('Bankroll must be positive');
  }

  // Calculate components
  const b = bookmakerOdds - 1;  // Net odds (profit on $1 bet)
  const p = trueProbability;    // Win probability
  const q = 1 - p;              // Loss probability

  // Calculate Expected Value (EV)
  // EV = (probability of win × profit if win) - (probability of loss × loss if loss)
  // EV = (p × b) - q
  const expectedValue = (p * b) - q;
  const evPercentage = expectedValue * 100;
  const isPositiveEV = expectedValue > 0;

  // Only bet if EV is positive and above threshold
  if (!isPositiveEV || evPercentage < minEVThreshold) {
    return {
      fullKelly: 0,
      adjustedKelly: 0,
      recommendedStake: 0,
      recommendedStakePercentage: 0,
      recommendedStakeUnits: 0,
      expectedValue,
      evPercentage,
      expectedGrowth: 0,
      isPositiveEV,
      riskLevel: 'low'
    };
  }

  // Calculate Full Kelly Criterion
  // f* = (bp - q) / b
  const fullKelly = ((b * p) - q) / b;

  // Apply fractional Kelly for safety (reduces variance)
  // Professional bettors typically use 1/4 Kelly or 1/2 Kelly
  const adjustedKelly = Math.max(0, fullKelly * kellyFraction);

  // Cap at maximum bet percentage for additional safety
  const maxBetFraction = maxBetPercentage / 100;
  const finalKelly = Math.min(adjustedKelly, maxBetFraction);

  // Calculate recommended stake
  const recommendedStake = bankroll * finalKelly;
  const recommendedStakePercentage = finalKelly * 100;
  const recommendedStakeUnits = recommendedStake / unitSize;

  // Calculate expected growth rate (Kelly's key insight)
  // Expected log growth = p × ln(1 + b×f) + q × ln(1 - f)
  const expectedGrowth = p * Math.log(1 + b * finalKelly) + q * Math.log(1 - finalKelly);

  // Assess risk level based on Kelly fraction
  let riskLevel: 'low' | 'medium' | 'high';
  if (finalKelly < 0.02) {
    riskLevel = 'low';
  } else if (finalKelly < 0.05) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }

  return {
    fullKelly: Math.round(fullKelly * 10000) / 10000,
    adjustedKelly: Math.round(finalKelly * 10000) / 10000,
    recommendedStake: Math.round(recommendedStake * 100) / 100,
    recommendedStakePercentage: Math.round(recommendedStakePercentage * 100) / 100,
    recommendedStakeUnits: Math.round(recommendedStakeUnits * 100) / 100,
    expectedValue: Math.round(expectedValue * 10000) / 10000,
    evPercentage: Math.round(evPercentage * 100) / 100,
    expectedGrowth: Math.round(expectedGrowth * 10000) / 10000,
    isPositiveEV,
    riskLevel
  };
}

/**
 * Calculate EV without full Kelly calculation
 * Useful for quick EV screening
 */
export function calculateExpectedValue(
  trueProbability: number,
  bookmakerOdds: number
): { ev: number; evPercentage: number; isPositiveEV: boolean } {
  const b = bookmakerOdds - 1;
  const p = trueProbability;
  const q = 1 - p;
  
  const ev = (p * b) - q;
  const evPercentage = ev * 100;
  
  return {
    ev: Math.round(ev * 10000) / 10000,
    evPercentage: Math.round(evPercentage * 100) / 100,
    isPositiveEV: ev > 0
  };
}

/**
 * Convert American odds to decimal odds
 */
export function americanToDecimal(americanOdds: number): number {
  if (americanOdds > 0) {
    return (americanOdds / 100) + 1;
  } else {
    return (100 / Math.abs(americanOdds)) + 1;
  }
}

/**
 * Convert decimal odds to implied probability
 */
export function oddsToImpliedProbability(decimalOdds: number): number {
  return 1 / decimalOdds;
}

/**
 * Convert probability to fair decimal odds (no vig)
 */
export function probabilityToFairOdds(probability: number): number {
  return 1 / probability;
}

/**
 * Calculate the theoretical edge over the bookmaker
 */
export function calculateEdge(
  trueProbability: number,
  bookmakerOdds: number
): number {
  const impliedProbability = oddsToImpliedProbability(bookmakerOdds);
  return trueProbability - impliedProbability;
}

/**
 * Simulate multiple bets to show variance
 * Useful for understanding risk and expected outcomes
 */
export function simulateKellyBetting(
  config: KellyConfig,
  numBets: number = 1000,
  numSimulations: number = 100
): {
  averageFinalBankroll: number;
  medianFinalBankroll: number;
  bestCase: number;
  worstCase: number;
  probabilityOfProfit: number;
  probabilityOfRuin: number;
} {
  const results: number[] = [];
  const { trueProbability, bookmakerOdds, bankroll } = config;
  const kelly = calculateKellyStake(config);
  
  for (let sim = 0; sim < numSimulations; sim++) {
    let currentBankroll = bankroll;
    
    for (let bet = 0; bet < numBets; bet++) {
      if (currentBankroll <= 0) break;
      
      const stake = currentBankroll * kelly.adjustedKelly;
      const won = Math.random() < trueProbability;
      
      if (won) {
        currentBankroll += stake * (bookmakerOdds - 1);
      } else {
        currentBankroll -= stake;
      }
    }
    
    results.push(currentBankroll);
  }
  
  results.sort((a, b) => a - b);
  const median = results[Math.floor(results.length / 2)];
  const average = results.reduce((a, b) => a + b, 0) / results.length;
  const profitableRuns = results.filter(r => r > bankroll).length;
  const ruinedRuns = results.filter(r => r < bankroll * 0.1).length; // <10% of starting bankroll = ruin
  
  return {
    averageFinalBankroll: Math.round(average * 100) / 100,
    medianFinalBankroll: Math.round(median * 100) / 100,
    bestCase: Math.round(results[results.length - 1] * 100) / 100,
    worstCase: Math.round(results[0] * 100) / 100,
    probabilityOfProfit: profitableRuns / numSimulations,
    probabilityOfRuin: ruinedRuns / numSimulations
  };
}
