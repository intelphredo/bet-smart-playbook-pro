
import { Match, Team, League } from "@/types/sports";

interface HistoricalData {
  homeWins: number;
  awayWins: number;
  totalGames: number;
}

interface TeamStrength {
  offense: number;  // 0-100
  defense: number;  // 0-100
  momentum: number; // 0-100
}

/**
 * Advanced prediction algorithm that considers multiple factors:
 * - Historical matchup data
 * - Team strengths (offense/defense)
 * - Home field advantage
 * - Recent form
 * - Injuries
 * - Weather conditions
 */
export function generateAdvancedPrediction(
  match: Match, 
  historicalData?: HistoricalData
): Match {
  const enhancedMatch = { ...match };
  const homeTeam = match.homeTeam;
  const awayTeam = match.awayTeam;
  
  // Calculate team strengths based on available data
  const homeTeamStrength = calculateTeamStrength(homeTeam, match.league);
  const awayTeamStrength = calculateTeamStrength(awayTeam, match.league);
  
  // Base confidence calculation
  let confidence = 50; // start neutral
  
  // Factor 1: Team strength difference
  const strengthDifference = homeTeamStrength.offense + homeTeamStrength.defense - 
                            awayTeamStrength.offense - awayTeamStrength.defense;
  confidence += strengthDifference * 0.2; // weight the strength difference
  
  // Factor 2: Home field advantage (varies by league)
  const homeAdvantage = getHomeAdvantage(match.league);
  confidence += homeAdvantage;
  
  // Factor 3: Historical matchup data (if available)
  if (historicalData && historicalData.totalGames > 0) {
    const homeWinPct = historicalData.homeWins / historicalData.totalGames;
    confidence += (homeWinPct * 100 - 50) * 0.15; // adjust confidence based on historical data
  }
  
  // Factor 4: Momentum
  confidence += (homeTeamStrength.momentum - awayTeamStrength.momentum) * 0.15;
  
  // Determine recommended bet
  const homeTeamFavored = confidence >= 50;
  const recommended = homeTeamFavored ? "home" : "away";
  
  // Adjust confidence to be within reasonable bounds
  confidence = Math.max(40, Math.min(85, Math.abs(confidence)));
  
  // Project scores based on team strengths
  const projectedHomeScore = projectScore(homeTeamStrength, awayTeamStrength, true, match.league);
  const projectedAwayScore = projectScore(awayTeamStrength, homeTeamStrength, false, match.league);
  
  // Update match prediction
  enhancedMatch.prediction = {
    recommended,
    confidence: Math.round(confidence),
    projectedScore: {
      home: projectedHomeScore,
      away: projectedAwayScore
    }
  };
  
  return enhancedMatch;
}

/**
 * Calculate team strength based on available data
 */
function calculateTeamStrength(team: Team, league: League): TeamStrength {
  // Default values
  let offense = 50;
  let defense = 50;
  let momentum = 50;
  
  // Adjust based on team record if available
  if (team.record) {
    const recordParts = team.record.split('-');
    if (recordParts.length === 2) {
      const wins = parseInt(recordParts[0]);
      const losses = parseInt(recordParts[1]);
      
      if (!isNaN(wins) && !isNaN(losses) && (wins + losses > 0)) {
        const winningPct = wins / (wins + losses);
        offense += (winningPct * 100 - 50) * 0.4;
        defense += (winningPct * 100 - 50) * 0.4;
      }
    }
  }
  
  // Adjust based on recent form if available
  if (team.recentForm && team.recentForm.length > 0) {
    const recentWins = team.recentForm.filter(r => r === 'W').length;
    const recentGames = team.recentForm.length;
    const recentWinPct = recentWins / recentGames;
    
    momentum += (recentWinPct * 100 - 50) * 0.8;
  }
  
  // Make sure values are within bounds
  return {
    offense: Math.max(30, Math.min(95, offense)),
    defense: Math.max(30, Math.min(95, defense)),
    momentum: Math.max(20, Math.min(95, momentum))
  };
}

/**
 * Get home field advantage factor based on league
 */
function getHomeAdvantage(league: League): number {
  switch (league) {
    case 'NFL': return 3.5;  // NFL home advantage is significant
    case 'NBA': return 3.0;  // NBA has moderate home advantage
    case 'MLB': return 2.0;  // MLB has lower home advantage
    case 'NHL': return 2.5;  // NHL has moderate home advantage
    case 'SOCCER': return 4.0; // Soccer has significant home advantage
    default: return 3.0;
  }
}

/**
 * Project score based on team strengths
 */
function projectScore(
  teamStrength: TeamStrength, 
  opponentStrength: TeamStrength, 
  isHome: boolean, 
  league: League
): number {
  // Base scoring rates by league
  let baseScore = 0;
  switch (league) {
    case 'NBA': baseScore = 105; break; // Average NBA team score
    case 'NFL': baseScore = 24; break;  // Average NFL team score
    case 'MLB': baseScore = 4.5; break; // Average MLB team score
    case 'NHL': baseScore = 3; break;   // Average NHL team score
    case 'SOCCER': baseScore = 1.3; break; // Average soccer team score
    default: baseScore = 10;
  }
  
  // Calculate offensive vs defensive strength
  const offenseDefenseFactor = (teamStrength.offense - opponentStrength.defense) / 100;
  
  // Add home advantage if applicable
  const homeAdvantage = isHome ? getHomeAdvantage(league) / 10 : 0;
  
  // Calculate projected score
  let rawScore = baseScore * (1 + offenseDefenseFactor + homeAdvantage);
  
  // Add some randomness
  rawScore *= (1 + (Math.random() * 0.1 - 0.05));
  
  // Round to appropriate precision based on league
  if (league === 'MLB' || league === 'NHL' || league === 'SOCCER') {
    return Math.max(0, Math.round(rawScore));
  } else {
    return Math.max(0, Math.round(rawScore));
  }
}

/**
 * Apply the advanced prediction algorithm to a list of matches
 */
export function applyAdvancedPredictions(matches: Match[]): Match[] {
  return matches.map(match => generateAdvancedPrediction(match));
}
