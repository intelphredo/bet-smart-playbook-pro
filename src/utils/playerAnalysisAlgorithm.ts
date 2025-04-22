import { PlayerProp, PlayerTrendAnalysis } from "@/types";

/**
 * Analyzes a player prop to determine if the over or under is more likely
 * based on historical data, recent performance, and matchup analysis
 */
export function analyzePlayerProp(prop: PlayerProp): PlayerTrendAnalysis {
  // Default values
  let confidence = 50;
  let recommendation: 'over' | 'under' = 'over';
  let streakImpact = 0;
  let matchupImpact = 0;
  let reasoning = "";

  // Calculate average of last games
  const recentAverage = prop.lastGames && prop.lastGames.length > 0
    ? prop.lastGames.reduce((sum, val) => sum + val, 0) / prop.lastGames.length
    : 0;

  // Compare recent average to the line
  if (recentAverage > 0 && prop.line > 0) {
    const difference = recentAverage - prop.line;
    
    // Determine recommendation based on recent performance vs line
    if (difference > 0) {
      recommendation = 'over';
      confidence += Math.min(20, Math.round(difference * 10));
      reasoning = `Recent average (${recentAverage.toFixed(1)}) is above the line (${prop.line})`;
    } else {
      recommendation = 'under';
      confidence += Math.min(20, Math.round(Math.abs(difference) * 10));
      reasoning = `Recent average (${recentAverage.toFixed(1)}) is below the line (${prop.line})`;
    }
    
    // Check for streak patterns
    if (prop.lastGames && prop.lastGames.length >= 3) {
      const lastThree = prop.lastGames.slice(0, 3);
      
      // Check if all recent games are above the line (hot streak)
      if (lastThree.every(game => game > prop.line)) {
        streakImpact = 10;
        confidence += 10;
        reasoning += `. Player is on a hot streak, exceeding the line in ${lastThree.length} consecutive games`;
      }
      // Check if all recent games are below the line (cold streak)
      else if (lastThree.every(game => game < prop.line)) {
        streakImpact = -10;
        confidence += 10; // Still add confidence because we're more certain about the under
        reasoning += `. Player is on a cold streak, falling short of the line in ${lastThree.length} consecutive games`;
      }
      
      // Check for increasing or decreasing trend
      if (lastThree[0] > lastThree[1] && lastThree[1] > lastThree[2]) {
        // Increasing trend
        streakImpact += 5;
        confidence += 5;
        reasoning += `. Performance is trending upward`;
      } else if (lastThree[0] < lastThree[1] && lastThree[1] < lastThree[2]) {
        // Decreasing trend
        streakImpact -= 5;
        confidence += 5;
        reasoning += `. Performance is trending downward`;
      }
    }
    
    // Compare to season average if available
    if (prop.seasonAverage) {
      const seasonDiff = recentAverage - prop.seasonAverage;
      
      if (Math.abs(seasonDiff) > 1) {
        if (seasonDiff > 0) {
          confidence += 5;
          reasoning += `. Recent performance (${recentAverage.toFixed(1)}) is above season average (${prop.seasonAverage.toFixed(1)})`;
        } else {
          confidence -= 5;
          reasoning += `. Recent performance (${recentAverage.toFixed(1)}) is below season average (${prop.seasonAverage.toFixed(1)})`;
        }
      }
    }
    
    // Simulate matchup impact (in a real app, this would use actual matchup data)
    matchupImpact = simulateMatchupImpact(prop);
    confidence += matchupImpact;
    
    if (matchupImpact > 0) {
      reasoning += `. Favorable matchup history against this opponent`;
    } else if (matchupImpact < 0) {
      reasoning += `. Historically struggles against this opponent`;
    }
  }
  
  // Adjust for odds value
  const oddsEdge = getOddsEdge(prop, recommendation);
  confidence += oddsEdge;
  
  if (oddsEdge > 0) {
    reasoning += `. Odds provide additional value`;
  }
  
  // Cap confidence between 35-95%
  confidence = Math.max(35, Math.min(95, confidence));
  
  return {
    playerId: prop.playerId,
    playerName: prop.playerName,
    propType: prop.propType,
    confidence,
    recommendation,
    reasoning,
    line: prop.line,
    historicalAvg: prop.seasonAverage,
    streakImpact,
    matchupImpact
  };
}

/**
 * Simulates matchup impact - in a real app this would use actual historical data
 */
function simulateMatchupImpact(prop: PlayerProp): number {
  // This is a placeholder that would normally use real matchup data
  // Returns a value between -10 and +10 to adjust confidence
  
  // For demo purposes, use a deterministic but seemingly random value based on playerId
  const playerIdSum = prop.playerId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return Math.round((playerIdSum % 21) - 10);
}

/**
 * Calculates if the odds provide additional edge
 */
function getOddsEdge(prop: PlayerProp, recommendation: 'over' | 'under'): number {
  if (!prop.odds) return 0;
  
  const { over, under } = prop.odds;
  
  // If the odds favor the opposite of our recommendation, that's additional value
  if (recommendation === 'over' && over > under) {
    return 5;
  } else if (recommendation === 'under' && under > over) {
    return 5;
  }
  
  return 0;
}
