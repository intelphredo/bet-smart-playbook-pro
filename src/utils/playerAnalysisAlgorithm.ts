import { PlayerProp, PropType } from "@/types/sports";
import { 
  PlayerHistoricalData, 
  PlayerTrendAnalysis, 
  TeamMatchupHistory,
  PlayerStreak 
} from "@/types/playerAnalytics";
import { playerHistoricalData } from "@/data/playerHistoricalData";

// Weight factors for our algorithm
const FACTORS = {
  RECENT_FORM: 0.4,      // Recent performance weight
  HISTORICAL_MATCHUP: 0.3, // Historical performance against team
  SEASON_AVERAGE: 0.2,    // Season average weight
  TEAM_DEFENSE: 0.1       // Team defensive strength weight
};

/**
 * Main algorithm to analyze a player prop and generate confident pick recommendations
 */
export function analyzePlayerProp(prop: PlayerProp): PlayerTrendAnalysis {
  // Get historical data for the player
  const playerData = findPlayerData(prop.playerId);
  
  if (!playerData) {
    return generateDefaultAnalysis(prop);
  }

  // Find the matchup history against the current opponent
  const matchup = getMatchupFromPropId(prop.matchId, playerData.matchups);
  
  // Calculate streak impact (-10 to +10)
  const streakImpact = calculateStreakImpact(playerData.currentStreak, prop.propType);
  
  // Calculate matchup impact (-10 to +10)
  const matchupImpact = calculateMatchupImpact(matchup, prop.propType);
  
  // Calculate base confidence from historical data
  const baseConfidence = calculateBaseConfidence(prop, playerData, matchup);
  
  // Adjust confidence based on streak and matchup impacts
  let adjustedConfidence = Math.min(100, Math.max(30, baseConfidence + streakImpact + matchupImpact));
  
  // Determine recommendation based on adjusted confidence and line
  const recommendation = determineRecommendation(prop, playerData, adjustedConfidence, matchup);
  
  // Generate reasoning for the recommendation
  const reasoning = generateReasoning(prop, playerData, matchup, streakImpact, matchupImpact, recommendation);
  
  // Get historical average for this property type
  const historicalAvg = calculateHistoricalAverage(playerData, prop.propType, matchup);

  return {
    playerId: prop.playerId,
    playerName: prop.playerName,
    propType: prop.propType,
    confidence: adjustedConfidence,
    recommendation,
    reasoning,
    line: prop.line,
    historicalAvg,
    streakImpact,
    matchupImpact
  };
}

/**
 * Find player historical data by ID
 */
function findPlayerData(playerId: string): PlayerHistoricalData | undefined {
  return playerHistoricalData.find(player => player.playerId === playerId);
}

/**
 * Get matchup data for a specific game
 */
function getMatchupFromPropId(matchId: string, matchups: TeamMatchupHistory[]): TeamMatchupHistory | undefined {
  // In a real implementation, we'd parse the matchId to find the opponent team
  // For now we'll just return the first matchup if exists
  return matchups.length > 0 ? matchups[0] : undefined;
}

/**
 * Calculate the impact of a player's current streak on confidence
 */
function calculateStreakImpact(streak: PlayerStreak, propType: PropType): number {
  if (streak.type === 'neutral') return 0;
  
  const statTrend = streak.stats[propType];
  if (!statTrend) return 0;
  
  // Hot streaks with increasing trends boost confidence for over picks
  if (streak.type === 'hot' && statTrend.trend === 'increasing') {
    return Math.min(10, streak.length * 2);
  }
  
  // Cold streaks with decreasing trends boost confidence for under picks
  if (streak.type === 'cold' && statTrend.trend === 'decreasing') {
    return Math.min(10, streak.length * 2);
  }
  
  // Other combinations have less impact
  return Math.min(5, Math.max(-5, streak.length));
}

/**
 * Calculate the impact of historical matchups against a specific team
 */
function calculateMatchupImpact(matchup: TeamMatchupHistory | undefined, propType: PropType): number {
  if (!matchup) return 0;
  
  // Player struggles against this team
  if (matchup.struggles) {
    return -6;
  }
  
  // Check average performance in matchup for this prop type
  const avgPerformance = matchup.averagePerformance[propType];
  if (!avgPerformance) return 0;
  
  // Significant over-performance in this matchup
  if (avgPerformance > 1.2) {
    return 8;
  }
  
  // Significant under-performance in this matchup
  if (avgPerformance < 0.8) {
    return -8;
  }
  
  return 0;
}

/**
 * Calculate base confidence from historical data
 */
function calculateBaseConfidence(
  prop: PlayerProp, 
  playerData: PlayerHistoricalData, 
  matchup: TeamMatchupHistory | undefined
): number {
  // Start with a medium confidence
  let confidence = 50;
  
  // Check if player has beaten this line in recent games
  if (prop.lastGames && prop.lastGames.length > 0) {
    const gamesOverLine = prop.lastGames.filter(value => value > prop.line).length;
    const percentOverLine = gamesOverLine / prop.lastGames.length;
    
    // Strong trend in recent games
    if (percentOverLine >= 0.8) confidence += 15;
    else if (percentOverLine >= 0.6) confidence += 10;
    else if (percentOverLine <= 0.2) confidence += 15; // Strong under trend
    else if (percentOverLine <= 0.4) confidence += 10; // Moderate under trend
  }
  
  // Check season average against the line
  if (prop.seasonAverage) {
    const ratio = prop.seasonAverage / prop.line;
    if (ratio >= 1.15) confidence += 10;
    else if (ratio >= 1.05) confidence += 5;
    else if (ratio <= 0.85) confidence += 10;
    else if (ratio <= 0.95) confidence += 5;
  }
  
  return confidence;
}

/**
 * Determine the recommendation based on all factors with improved data judgment logic.
 */
function determineRecommendation(
  prop: PlayerProp, 
  playerData: PlayerHistoricalData,
  confidence: number,
  matchup: TeamMatchupHistory | undefined
): 'over' | 'under' {
  // Gather evidence from different factors
  let overEvidence = 0;
  let underEvidence = 0;

  // Recent streaks
  if (playerData.currentStreak.type === 'hot' && playerData.currentStreak.stats[prop.propType]?.trend === 'increasing' && playerData.currentStreak.stats[prop.propType]?.average > prop.line) {
    overEvidence += 2;
  }
  if (playerData.currentStreak.type === 'cold' && playerData.currentStreak.stats[prop.propType]?.trend === 'decreasing' && playerData.currentStreak.stats[prop.propType]?.average < prop.line) {
    underEvidence += 2;
  }

  // Historical matchups
  if (matchup && matchup.struggles) {
    underEvidence += 2;
  }
  if (matchup && matchup.averagePerformance[prop.propType] !== undefined) {
    if (matchup.averagePerformance[prop.propType]! > prop.line * 1.1) {
      overEvidence += 1;
    } else if (matchup.averagePerformance[prop.propType]! < prop.line * 0.9) {
      underEvidence += 1;
    }
  }

  // Recent games trends
  if (prop.lastGames && prop.lastGames.length > 0) {
    const gamesOverLine = prop.lastGames.filter(v => v > prop.line).length;
    const percentOverLine = gamesOverLine / prop.lastGames.length;
    if (percentOverLine >= 0.7) overEvidence += 1;
    if (percentOverLine <= 0.3) underEvidence += 1;
  }

  // Season average
  if (prop.seasonAverage) {
    if (prop.seasonAverage > prop.line * 1.1) overEvidence += 1;
    if (prop.seasonAverage < prop.line * 0.9) underEvidence += 1;
  }

  // Confidence bonus
  if (confidence >= 70) {
    if (prop.prediction.recommended === 'over') overEvidence += 1;
    if (prop.prediction.recommended === 'under') underEvidence += 1;
  }

  // Decide recommendation based on evidence
  if (overEvidence > underEvidence && overEvidence >= 2) return 'over';
  if (underEvidence > overEvidence && underEvidence >= 2) return 'under';

  // If evidence is weak or balanced, use the baseline recommendation
  return prop.prediction.recommended;
}

/**
 * Generate a human-readable explanation for the recommendation
 */
function generateReasoning(
  prop: PlayerProp,
  playerData: PlayerHistoricalData,
  matchup: TeamMatchupHistory | undefined,
  streakImpact: number,
  matchupImpact: number,
  recommendation: 'over' | 'under'
): string {
  let reasons = [];
  
  // Current streak
  if (playerData.currentStreak.type === 'hot') {
    reasons.push(`${playerData.playerName} is on a ${playerData.currentStreak.length}-game hot streak`);
  } else if (playerData.currentStreak.type === 'cold') {
    reasons.push(`${playerData.playerName} is on a ${playerData.currentStreak.length}-game cold streak`);
  }
  
  // Historical matchup
  if (matchup) {
    if (matchup.struggles) {
      reasons.push(`Historically struggles against ${matchup.teamName}`);
    } else if (matchupImpact > 5) {
      reasons.push(`Excellent historical performance vs ${matchup.teamName}`);
    }
  }
  
  // Recent games trend
  if (prop.lastGames && prop.lastGames.length > 0) {
    const gamesOverLine = prop.lastGames.filter(value => value > prop.line).length;
    const percentOverLine = gamesOverLine / prop.lastGames.length;
    
    if (percentOverLine >= 0.8) {
      reasons.push(`Exceeded this line in ${gamesOverLine}/${prop.lastGames.length} recent games`);
    } else if (percentOverLine <= 0.2) {
      reasons.push(`Under this line in ${prop.lastGames.length - gamesOverLine}/${prop.lastGames.length} recent games`);
    }
  }
  
  // Season average vs line
  if (prop.seasonAverage) {
    const diff = prop.seasonAverage - prop.line;
    const diffPercent = Math.abs(diff) / prop.line * 100;
    
    if (diff > 0 && diffPercent > 10) {
      reasons.push(`Season average of ${prop.seasonAverage.toFixed(1)} is ${diffPercent.toFixed(0)}% above the line`);
    } else if (diff < 0 && diffPercent > 10) {
      reasons.push(`Season average of ${prop.seasonAverage.toFixed(1)} is ${diffPercent.toFixed(0)}% below the line`);
    }
  }
  
  if (reasons.length === 0) {
    reasons.push(`Based on overall statistical analysis`);
  }
  
  return reasons.join(". ") + ".";
}

/**
 * Calculate historical average for a prop type
 */
function calculateHistoricalAverage(
  playerData: PlayerHistoricalData,
  propType: PropType, 
  matchup: TeamMatchupHistory | undefined
): number | undefined {
  if (matchup && matchup.averagePerformance[propType]) {
    return matchup.averagePerformance[propType];
  }
  
  // Fall back to season average
  return playerData.seasonStats[propType];
}

/**
 * Generate a default analysis when no historical data is available
 */
function generateDefaultAnalysis(prop: PlayerProp): PlayerTrendAnalysis {
  return {
    playerId: prop.playerId,
    playerName: prop.playerName,
    propType: prop.propType,
    confidence: prop.prediction.confidence,
    recommendation: prop.prediction.recommended,
    reasoning: "Based on general statistical analysis only. Limited historical data available.",
    line: prop.line,
    streakImpact: 0,
    matchupImpact: 0
  };
}

/**
 * Analyze multiple player props and return the most confident picks
 */
export function getMostConfidentPicks(props: PlayerProp[], minimumConfidence = 70): PlayerTrendAnalysis[] {
  const analyses = props.map(prop => analyzePlayerProp(prop));
  return analyses
    .filter(analysis => analysis.confidence >= minimumConfidence)
    .sort((a, b) => b.confidence - a.confidence);
}
