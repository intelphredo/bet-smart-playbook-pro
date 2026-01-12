
import { ArbitrageOpportunity, Match } from "@/types/sports";

/**
 * Calculate arbitrage impact score based on live odds from the match
 * Returns a score from 0-100 and factors that influenced the score
 * 
 * Note: This now uses real live odds data from the match instead of mock data.
 * Arbitrage detection requires odds from multiple sportsbooks to identify price discrepancies.
 */
export function calculateArbitrageImpact(match: Match) {
  let arbitrageScore = 0;
  const arbitrageFactors: string[] = [];
  
  // Check if match has live odds from multiple sportsbooks
  if (!match.liveOdds || match.liveOdds.length < 2) {
    return { 
      arbitrageScore: 0, 
      arbitrageFactors: ["Insufficient sportsbook data for arbitrage detection"] 
    };
  }
  
  // Calculate implied probabilities and check for arbitrage
  const opportunities = detectArbitrageFromLiveOdds(match);
  
  if (opportunities.length > 0) {
    // Sort by potential profit
    opportunities.sort((a, b) => b.potentialProfit - a.potentialProfit);
    const bestOpportunity = opportunities[0];
    
    // Calculate score based on arbitrage percentage and potential profit
    if (bestOpportunity.arbitragePercentage < 97) {
      arbitrageScore = 90;
      arbitrageFactors.push(`High-value arbitrage opportunity (${bestOpportunity.arbitragePercentage.toFixed(1)}%)`);
    } else if (bestOpportunity.arbitragePercentage < 98.5) {
      arbitrageScore = 75;
      arbitrageFactors.push(`Medium-value arbitrage opportunity (${bestOpportunity.arbitragePercentage.toFixed(1)}%)`);
    } else if (bestOpportunity.arbitragePercentage < 100) {
      arbitrageScore = 60;
      arbitrageFactors.push(`Low-value arbitrage opportunity (${bestOpportunity.arbitragePercentage.toFixed(1)}%)`);
    }
    
    // Adjust based on potential profit
    if (bestOpportunity.potentialProfit > 3) {
      arbitrageScore += 10;
      arbitrageFactors.push(`Potential profit: ${bestOpportunity.potentialProfit.toFixed(2)}%`);
    }
    
    // Add bookmaker information
    const bookmakers = bestOpportunity.bookmakers.join(", ");
    arbitrageFactors.push(`Available on ${bookmakers}`);
  } else {
    arbitrageFactors.push("No arbitrage opportunities detected in current odds");
  }
  
  return { arbitrageScore: Math.min(100, arbitrageScore), arbitrageFactors };
}

interface DetectedArbitrage {
  arbitragePercentage: number;
  potentialProfit: number;
  bookmakers: string[];
}

/**
 * Detect arbitrage opportunities from live odds data
 */
function detectArbitrageFromLiveOdds(match: Match): DetectedArbitrage[] {
  const opportunities: DetectedArbitrage[] = [];
  
  if (!match.liveOdds || match.liveOdds.length < 2) {
    return opportunities;
  }
  
  // Find best odds for each outcome
  let bestHomeOdds = { value: 0, sportsbook: '' };
  let bestAwayOdds = { value: 0, sportsbook: '' };
  let bestDrawOdds = { value: 0, sportsbook: '' };
  
  for (const odds of match.liveOdds) {
    const sportsbookName = odds.sportsbook?.name || 'Unknown';
    
    if (odds.homeWin && odds.homeWin > bestHomeOdds.value) {
      bestHomeOdds = { value: odds.homeWin, sportsbook: sportsbookName };
    }
    if (odds.awayWin && odds.awayWin > bestAwayOdds.value) {
      bestAwayOdds = { value: odds.awayWin, sportsbook: sportsbookName };
    }
    if (odds.draw && odds.draw > bestDrawOdds.value) {
      bestDrawOdds = { value: odds.draw, sportsbook: sportsbookName };
    }
  }
  
  // Calculate arbitrage for two-way market (moneyline without draw)
  if (bestHomeOdds.value > 0 && bestAwayOdds.value > 0) {
    const impliedProbSum = (1 / bestHomeOdds.value) + (1 / bestAwayOdds.value);
    const arbitragePercentage = impliedProbSum * 100;
    
    if (arbitragePercentage < 100) {
      const potentialProfit = ((100 / arbitragePercentage) - 1) * 100;
      opportunities.push({
        arbitragePercentage,
        potentialProfit,
        bookmakers: [bestHomeOdds.sportsbook, bestAwayOdds.sportsbook].filter((v, i, a) => a.indexOf(v) === i)
      });
    }
  }
  
  // Calculate arbitrage for three-way market (with draw)
  if (bestHomeOdds.value > 0 && bestAwayOdds.value > 0 && bestDrawOdds.value > 0) {
    const impliedProbSum = (1 / bestHomeOdds.value) + (1 / bestAwayOdds.value) + (1 / bestDrawOdds.value);
    const arbitragePercentage = impliedProbSum * 100;
    
    if (arbitragePercentage < 100) {
      const potentialProfit = ((100 / arbitragePercentage) - 1) * 100;
      opportunities.push({
        arbitragePercentage,
        potentialProfit,
        bookmakers: [bestHomeOdds.sportsbook, bestAwayOdds.sportsbook, bestDrawOdds.sportsbook].filter((v, i, a) => a.indexOf(v) === i)
      });
    }
  }
  
  return opportunities;
}

/**
 * Check if a match has any arbitrage opportunities
 */
export function hasArbitrageOpportunity(match: Match): boolean {
  const { arbitrageScore } = calculateArbitrageImpact(match);
  return arbitrageScore > 0;
}
