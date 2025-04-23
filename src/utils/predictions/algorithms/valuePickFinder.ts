
import { Match } from "@/types/sports";
import { generateAdvancedPrediction } from "../core/predictionEngine";
import { hasArbitrageOpportunity } from "../../smartScore/factors/arbitrageFactors";
import { calculateValueImpact } from "../../smartScore/factors/valueFactors";

/**
 * Value Pick Finder Algorithm
 * 
 * This algorithm specializes in finding betting value with:
 * - Odds discrepancy analysis
 * - Line movement tracking
 * - Public betting percentage consideration
 * - Market inefficiency detection
 * - Probability calibration against closing lines
 */
export function generateValuePickPrediction(match: Match): Match {
  // Clone the match to avoid mutation
  const enhancedMatch = { ...match };
  
  // Start with the base prediction
  const basePrediction = generateAdvancedPrediction(match);
  
  // Extract the prediction from the base prediction
  const { prediction } = basePrediction;
  if (!prediction) {
    return basePrediction; // Return the base prediction if no prediction is available
  }
  
  // Apply Value Pick specific adjustments
  const adjustedConfidence = applyValuePickAdjustments(basePrediction);
  
  // Create the Value Pick algorithm-specific prediction
  enhancedMatch.prediction = {
    ...prediction,
    confidence: Math.round(adjustedConfidence),
    algorithmId: "3a7e2d9b-8c5f-4b1f-9e17-7b31a4dce6c2" // Value Pick Finder algorithm UUID
  };
  
  return enhancedMatch;
}

function applyValuePickAdjustments(match: Match): number {
  if (!match.prediction) return 50;
  
  // Start with the base confidence
  let confidence = match.prediction.confidence;
  
  // Track feature contributions for debugging
  const featureContributions: Record<string, number> = {};
  
  // 1. Enhanced odds value analysis
  if (match.odds) {
    // Calculate value score (already emphasized value in this algorithm)
    const { valueScore, valueFactors } = calculateValueImpact(match);
    
    // Apply stronger influence from value score
    const valueImpact = (valueScore - 50) * 0.6;
    confidence += valueImpact;
    featureContributions.valueScore = valueImpact;
    
    // Enhanced closing line value analysis
    if (match.liveOdds && match.liveOdds.length > 1) {
      const openingOdds = match.liveOdds[0];
      const closingOdds = match.liveOdds[match.liveOdds.length - 1];
      
      // Calculate closing line value (a key predictor of long-term profitability)
      const clvImpact = calculateClosingLineValue(match.prediction.recommended, openingOdds, closingOdds);
      confidence += clvImpact;
      featureContributions.closingLineValue = clvImpact;
    }
  }
  
  // 2. Improved line movement analysis with regression
  if (match.liveOdds && match.liveOdds.length > 2) {
    const lineMovementImpact = analyzeLineMovementTrend(match);
    confidence += lineMovementImpact;
    featureContributions.lineMovement = lineMovementImpact;
  }
  
  // 3. Reverse line movement detection (smart money indicator)
  if (match.odds && match.liveOdds && match.liveOdds.length > 1) {
    const reverseLineMovementImpact = detectReverseLineMovement(match);
    confidence += reverseLineMovementImpact;
    featureContributions.reverseLineMovement = reverseLineMovementImpact;
  }
  
  // 4. Market efficiency factors
  // Different markets have different efficiency levels
  const marketEfficiencyImpact = calculateMarketEfficiency(match.league);
  confidence += marketEfficiencyImpact;
  featureContributions.marketEfficiency = marketEfficiencyImpact;
  
  // 5. Check for potential arbitrage - this algorithm values arbitrage highly
  if (hasArbitrageOpportunity(match)) {
    // Substantial boost for arbitrage opportunities
    confidence += 8;
    featureContributions.arbitrage = 8;
  }
  
  // 6. Simulated public betting percentages with fade the public strategy
  // This would use real data in a production environment
  const publicBettingImpact = simulatePublicBettingEffect(match);
  confidence += publicBettingImpact;
  featureContributions.publicBetting = publicBettingImpact;

  // Log feature contributions to global object for debugging
  if (typeof window !== "undefined" && window.__BetSmart) {
    window.__BetSmart.addLog(`Value Pick feature contributions: ${JSON.stringify(featureContributions)}`);
  }
  
  // Ensure confidence stays within reasonable bounds
  return Math.max(40, Math.min(85, confidence));
}

/**
 * Calculate the closing line value - a key predictor of long-term profitability
 */
function calculateClosingLineValue(
  recommended: string,
  openingOdds: any,
  closingOdds: any
): number {
  if (!openingOdds || !closingOdds) return 0;
  
  let openingValue = 0;
  let closingValue = 0;
  
  if (recommended === 'home') {
    openingValue = openingOdds.homeWin;
    closingValue = closingOdds.homeWin;
  } else if (recommended === 'away') {
    openingValue = openingOdds.awayWin;
    closingValue = closingOdds.awayWin;
  } else if (recommended === 'draw' && openingOdds.draw && closingOdds.draw) {
    openingValue = openingOdds.draw;
    closingValue = closingOdds.draw;
  }
  
  // If odds improved (decreased in probability), that's positive closing line value
  if (openingValue && closingValue) {
    // Convert odds to implied probability
    const openingProb = 1 / openingValue;
    const closingProb = 1 / closingValue;
    
    // Calculate CLV in percentage points
    const clvPercentage = (openingProb - closingProb) * 100;
    
    // CLV is positive when the implied probability decreased (odds improved)
    return clvPercentage * 1.5;  // Scale for impact
  }
  
  return 0;
}

/**
 * Analyze line movement trend using regression analysis
 */
function analyzeLineMovementTrend(match: Match): number {
  if (!match.liveOdds || !match.prediction) return 0;
  
  const sortedOdds = [...match.liveOdds].sort((a, b) => 
    new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
  );
  
  // Get odds for the recommended side
  const oddsMovement = sortedOdds.map(odds => {
    if (match.prediction?.recommended === 'home') return odds.homeWin;
    if (match.prediction?.recommended === 'away') return odds.awayWin;
    return odds.draw || 0;
  });
  
  // Calculate the slope of the line movement
  let slope = 0;
  if (oddsMovement.length > 2) {
    // Simple linear regression slope calculation
    const x = Array.from({length: oddsMovement.length}, (_, i) => i);
    const xMean = x.reduce((sum, val) => sum + val, 0) / x.length;
    const yMean = oddsMovement.reduce((sum, val) => sum + val, 0) / oddsMovement.length;
    
    const numerator = x.reduce((sum, val, i) => sum + (val - xMean) * (oddsMovement[i] - yMean), 0);
    const denominator = x.reduce((sum, val) => sum + Math.pow(val - xMean, 2), 0);
    
    slope = denominator !== 0 ? numerator / denominator : 0;
  }
  
  // Positive slope means odds are increasing (implied probability decreasing)
  // This is good for our prediction as betting value is improving
  return slope * -15; // Adjust impact factor based on the slope magnitude
}

/**
 * Detect reverse line movement (smart money indicator)
 * When the line moves against the public betting percentages, it's often sharp money
 */
function detectReverseLineMovement(match: Match): number {
  // In a production environment, this would use actual public betting percentage data
  // For now, we'll simulate using odds movement as a proxy
  
  if (!match.liveOdds || match.liveOdds.length < 2) return 0;
  
  // Get first and latest odds
  const firstOdds = match.liveOdds[0];
  const latestOdds = match.liveOdds[match.liveOdds.length - 1];
  
  // Simulate public betting sides (in production this would come from a real data source)
  const favoredTeam = firstOdds.homeWin < firstOdds.awayWin ? 'home' : 'away';
  
  // Check if line moved against the favored team (reverse line movement)
  if (favoredTeam === 'home') {
    if (latestOdds.homeWin > firstOdds.homeWin) {
      // Line moved against public - potential sharp money on away team
      if (match.prediction?.recommended === 'away') return 6;
    }
  } else {
    if (latestOdds.awayWin > firstOdds.awayWin) {
      // Line moved against public - potential sharp money on home team
      if (match.prediction?.recommended === 'home') return 6;
    }
  }
  
  return 0;
}

/**
 * Calculate market efficiency factor by league
 * Different markets have different efficiency levels
 */
function calculateMarketEfficiency(league: string): number {
  // Lower efficiency markets have more opportunity for value
  switch (league) {
    case 'NFL':
      return -2; // Highest efficiency, harder to find value
    case 'NBA':
      return 0; // Medium efficiency
    case 'MLB':
      return 2; // Lower efficiency, more value opportunities
    case 'NHL':
      return 3; // Lower efficiency, more value opportunities
    default:
      return 1; // Default for other leagues
  }
}

/**
 * Simulate public betting effect (fade the public when heavily skewed)
 * In production this would use actual public betting percentage data
 */
function simulatePublicBettingEffect(match: Match): number {
  if (!match.odds) return 0;
  
  // Simulate public betting percentages based on odds
  // In reality, this would come from a real data source
  let homePublicPercentage = 50;
  let awayPublicPercentage = 50;
  
  // Public tends to bet favorites and overs
  if (match.odds.homeWin < match.odds.awayWin) {
    // Home team is the favorite, public likely skews that way
    homePublicPercentage = Math.min(90, 50 + (1 / match.odds.homeWin) * 30);
    awayPublicPercentage = 100 - homePublicPercentage;
  } else {
    // Away team is the favorite
    awayPublicPercentage = Math.min(90, 50 + (1 / match.odds.awayWin) * 30);
    homePublicPercentage = 100 - awayPublicPercentage;
  }
  
  // Fade the public when it's heavily skewed (contrarian strategy)
  if (homePublicPercentage > 70 && match.prediction?.recommended === 'away') {
    return 4; // Public heavily on home, we're on away - good contrarian spot
  }
  
  if (awayPublicPercentage > 70 && match.prediction?.recommended === 'home') {
    return 4; // Public heavily on away, we're on home - good contrarian spot
  }
  
  return 0;
}

// Function to apply Value Pick Finder to a collection of matches
export function applyValuePickPredictions(matches: Match[]): Match[] {
  return matches.map(match => generateValuePickPrediction(match));
}
