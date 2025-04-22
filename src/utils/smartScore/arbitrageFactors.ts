
import { ArbitrageOpportunity, Match } from "@/types/sports";
import { arbitrageOpportunities } from "@/data/arbitrageData";

/**
 * Calculate arbitrage impact score based on opportunity quality
 * Returns a score from 0-100 and factors that influenced the score
 */
export function calculateArbitrageImpact(match: Match) {
  let arbitrageScore = 50;
  const arbitrageFactors = [];
  
  // Find arbitrage opportunities related to this match
  const opportunities = findArbitrageOpportunities(match);
  
  if (opportunities.length > 0) {
    // Sort by potential profit
    opportunities.sort((a, b) => b.potentialProfit - a.potentialProfit);
    const bestOpportunity = opportunities[0];
    
    // Calculate score based on arbitrage percentage and potential profit
    if (bestOpportunity.arbitragePercentage < 97) {
      arbitrageScore += 40;
      arbitrageFactors.push(`High-value arbitrage opportunity (${bestOpportunity.arbitragePercentage.toFixed(1)}%)`);
    } else if (bestOpportunity.arbitragePercentage < 98.5) {
      arbitrageScore += 25;
      arbitrageFactors.push(`Medium-value arbitrage opportunity (${bestOpportunity.arbitragePercentage.toFixed(1)}%)`);
    } else {
      arbitrageScore += 10;
      arbitrageFactors.push(`Low-value arbitrage opportunity (${bestOpportunity.arbitragePercentage.toFixed(1)}%)`);
    }
    
    // Adjust based on potential profit
    if (bestOpportunity.potentialProfit > 20) {
      arbitrageScore += 10;
      arbitrageFactors.push(`High potential profit ($${bestOpportunity.potentialProfit.toFixed(2)})`);
    }
    
    // Add bookmaker information
    const bookmakers = bestOpportunity.bookmakers.map(b => b.name).join(", ");
    arbitrageFactors.push(`Available on ${bookmakers}`);
  } else {
    arbitrageScore = 0;
    arbitrageFactors.push("No arbitrage opportunities detected");
  }
  
  return { arbitrageScore, arbitrageFactors };
}

/**
 * Find arbitrage opportunities for a specific match
 */
function findArbitrageOpportunities(match: Match): ArbitrageOpportunity[] {
  // In a real implementation, this would check live odds APIs
  // For now, we'll use the mock data and match by teams
  return arbitrageOpportunities.filter(
    opp => 
      (opp.match.homeTeam === match.homeTeam.shortName || 
       opp.match.homeTeam === match.homeTeam.name) &&
      (opp.match.awayTeam === match.awayTeam.shortName || 
       opp.match.awayTeam === match.awayTeam.name)
  );
}

/**
 * Check if a match has any arbitrage opportunities
 */
export function hasArbitrageOpportunity(match: Match): boolean {
  const { arbitrageScore } = calculateArbitrageImpact(match);
  return arbitrageScore > 0;
}

