/**
 * Closing Line Value (CLV) Calculator
 * 
 * CLV is the MOST IMPORTANT metric for sharp bettors.
 * It measures how your predicted odds compare to the sharp closing line.
 * 
 * If you consistently beat the closing line, you have a genuine edge,
 * regardless of short-term win/loss results.
 * 
 * The closing line is the sharpest line because:
 * 1. It has the most information (all day of betting action)
 * 2. Sharp bettors have moved it to its most efficient price
 * 3. It's the hardest line to beat
 */

export interface CLVResult {
  predictedOdds: number;          // Your model's fair odds
  openingOdds: number;            // Opening line odds
  closingOdds: number;            // Closing line odds (sharp line)
  clvPercentage: number;          // How much better/worse than closing
  beatClosingLine: boolean;       // Did you beat the closing line?
  clvCategory: 'excellent' | 'good' | 'neutral' | 'poor'; // Quality rating
  impliedEdge: number;            // Your edge vs closing line (in %)
  dollarValue: number;            // Dollar value of CLV on $100 bet
}

export interface OddsSnapshot {
  timestamp: string;
  odds: number;
  source: string;
}

/**
 * Calculate Closing Line Value
 * 
 * This compares your predicted odds to the closing line to determine
 * if you have a genuine edge. Positive CLV = you beat the sharp line.
 */
export function calculateCLV(
  predictedOdds: number,
  closingOdds: number,
  openingOdds?: number
): CLVResult {
  // Calculate implied probabilities
  const predictedProb = 1 / predictedOdds;
  const closingProb = 1 / closingOdds;
  const openingProb = openingOdds ? 1 / openingOdds : closingProb;

  // CLV = difference between your odds and closing odds
  // Positive CLV = you got better odds than closing (GOOD)
  // Negative CLV = you got worse odds than closing (BAD)
  const clvPercentage = ((predictedOdds - closingOdds) / closingOdds) * 100;
  
  // Did you beat the closing line?
  // You beat it if your predicted odds are HIGHER than closing (longer odds = better value)
  const beatClosingLine = predictedOdds > closingOdds;
  
  // Calculate your implied edge vs the closing line
  const impliedEdge = (predictedProb - closingProb) * 100;
  
  // Dollar value: How much more/less you'd win on $100 bet
  const dollarValue = ((predictedOdds - 1) * 100) - ((closingOdds - 1) * 100);
  
  // Categorize CLV quality
  let clvCategory: 'excellent' | 'good' | 'neutral' | 'poor';
  if (clvPercentage > 5) {
    clvCategory = 'excellent';  // Beat closing by >5%
  } else if (clvPercentage > 2) {
    clvCategory = 'good';       // Beat closing by 2-5%
  } else if (clvPercentage > -2) {
    clvCategory = 'neutral';    // Within 2% of closing
  } else {
    clvCategory = 'poor';       // Worse than closing by >2%
  }

  return {
    predictedOdds: Math.round(predictedOdds * 100) / 100,
    openingOdds: Math.round((openingOdds || closingOdds) * 100) / 100,
    closingOdds: Math.round(closingOdds * 100) / 100,
    clvPercentage: Math.round(clvPercentage * 100) / 100,
    beatClosingLine,
    clvCategory,
    impliedEdge: Math.round(impliedEdge * 100) / 100,
    dollarValue: Math.round(dollarValue * 100) / 100
  };
}

/**
 * Track line movement from opening to closing
 */
export function analyzeLineMovement(
  oddsHistory: OddsSnapshot[]
): {
  openingOdds: number;
  closingOdds: number;
  highOdds: number;
  lowOdds: number;
  totalMovement: number;
  movementDirection: 'up' | 'down' | 'stable';
  velocityPerHour: number;
  sharpMoneyIndicator: boolean;
} {
  if (oddsHistory.length === 0) {
    throw new Error('No odds history provided');
  }

  // Sort by timestamp
  const sorted = [...oddsHistory].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const opening = sorted[0].odds;
  const closing = sorted[sorted.length - 1].odds;
  const high = Math.max(...sorted.map(s => s.odds));
  const low = Math.min(...sorted.map(s => s.odds));

  // Calculate total movement
  const totalMovement = Math.abs(closing - opening);
  const movementPercentage = (totalMovement / opening) * 100;

  // Determine direction
  let movementDirection: 'up' | 'down' | 'stable';
  if (movementPercentage < 1) {
    movementDirection = 'stable';
  } else if (closing > opening) {
    movementDirection = 'up';
  } else {
    movementDirection = 'down';
  }

  // Calculate velocity (movement per hour)
  const timeSpan = new Date(sorted[sorted.length - 1].timestamp).getTime() - 
                   new Date(sorted[0].timestamp).getTime();
  const hours = timeSpan / (1000 * 60 * 60);
  const velocityPerHour = totalMovement / Math.max(hours, 0.1); // Prevent division by zero

  // Sharp money indicator: large, fast movement
  const sharpMoneyIndicator = movementPercentage > 3 && velocityPerHour > 0.5;

  return {
    openingOdds: Math.round(opening * 100) / 100,
    closingOdds: Math.round(closing * 100) / 100,
    highOdds: Math.round(high * 100) / 100,
    lowOdds: Math.round(low * 100) / 100,
    totalMovement: Math.round(totalMovement * 100) / 100,
    movementDirection,
    velocityPerHour: Math.round(velocityPerHour * 1000) / 1000,
    sharpMoneyIndicator
  };
}

/**
 * Calculate aggregate CLV performance over multiple bets
 */
export function calculateAggregateClv(
  bets: { predictedOdds: number; closingOdds: number }[]
): {
  averageClv: number;
  medianClv: number;
  positiveClvPercentage: number;
  totalClvValue: number;
  clvConsistency: number; // Standard deviation
} {
  if (bets.length === 0) {
    return {
      averageClv: 0,
      medianClv: 0,
      positiveClvPercentage: 0,
      totalClvValue: 0,
      clvConsistency: 0
    };
  }

  const clvValues = bets.map(bet => {
    const clv = calculateCLV(bet.predictedOdds, bet.closingOdds);
    return clv.clvPercentage;
  });

  // Sort for median
  const sorted = [...clvValues].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  // Average
  const average = clvValues.reduce((a, b) => a + b, 0) / clvValues.length;

  // Positive CLV percentage
  const positiveCount = clvValues.filter(v => v > 0).length;
  const positivePercentage = (positiveCount / clvValues.length) * 100;

  // Total CLV value (sum of all CLV)
  const totalValue = clvValues.reduce((a, b) => a + b, 0);

  // Consistency (standard deviation)
  const variance = clvValues.reduce((sum, value) => {
    return sum + Math.pow(value - average, 2);
  }, 0) / clvValues.length;
  const stdDev = Math.sqrt(variance);

  return {
    averageClv: Math.round(average * 100) / 100,
    medianClv: Math.round(median * 100) / 100,
    positiveClvPercentage: Math.round(positivePercentage * 100) / 100,
    totalClvValue: Math.round(totalValue * 100) / 100,
    clvConsistency: Math.round(stdDev * 100) / 100
  };
}

/**
 * Determine if a bet is worth placing based on CLV and EV
 */
export function shouldPlaceBet(
  predictedOdds: number,
  currentOdds: number,
  minClv: number = 2.0,
  minEv: number = 3.0
): {
  shouldBet: boolean;
  reason: string;
  clvCheck: boolean;
  evCheck: boolean;
} {
  // Calculate CLV (comparing predicted odds to current odds)
  const clv = calculateCLV(predictedOdds, currentOdds);
  const clvCheck = clv.clvPercentage >= minClv;

  // Calculate EV
  const predictedProb = 1 / predictedOdds;
  const ev = ((predictedProb * (currentOdds - 1)) - (1 - predictedProb)) * 100;
  const evCheck = ev >= minEv;

  // Decision logic
  const shouldBet = clvCheck && evCheck;

  let reason = '';
  if (!shouldBet) {
    if (!clvCheck && !evCheck) {
      reason = `CLV (${clv.clvPercentage.toFixed(2)}%) and EV (${ev.toFixed(2)}%) both below thresholds`;
    } else if (!clvCheck) {
      reason = `CLV (${clv.clvPercentage.toFixed(2)}%) below ${minClv}% threshold`;
    } else {
      reason = `EV (${ev.toFixed(2)}%) below ${minEv}% threshold`;
    }
  } else {
    reason = `Good bet: CLV ${clv.clvPercentage.toFixed(2)}%, EV ${ev.toFixed(2)}%`;
  }

  return {
    shouldBet,
    reason,
    clvCheck,
    evCheck
  };
}
