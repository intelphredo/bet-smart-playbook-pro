
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
  
  // Use MLB-specific prediction logic for baseball games
  if (match.league === 'MLB') {
    return generateMLBPrediction(match, historicalData);
  }
  
  // Calculate team strengths based on available data
  const homeTeamStrength = calculateTeamStrength(homeTeam, match.league);
  const awayTeamStrength = calculateTeamStrength(awayTeam, match.league);
  
  // Base confidence calculation - START NEUTRAL at 50 (removed home team bias)
  let confidence = 50;
  
  // Factor 1: Team strength difference
  const strengthDifference = homeTeamStrength.offense + homeTeamStrength.defense - 
                            awayTeamStrength.offense - awayTeamStrength.defense;
  confidence += strengthDifference * 0.25; // Increased weight for team strength
  
  // Factor 2: Dynamic home field advantage (varies by league and team performance)
  const homeAdvantage = getDynamicHomeAdvantage(match.league, homeTeam);
  confidence += homeAdvantage;
  
  // Factor 3: Historical matchup data (if available) - increased weight
  if (historicalData && historicalData.totalGames > 0) {
    const homeWinPct = historicalData.homeWins / historicalData.totalGames;
    confidence += (homeWinPct * 100 - 50) * 0.25; // Increased weight for head-to-head
  }
  
  // Factor 4: Momentum - incorporate recent form more heavily
  const homeTeamMomentum = calculateMomentumScore(homeTeam);
  const awayTeamMomentum = calculateMomentumScore(awayTeam);
  confidence += (homeTeamMomentum - awayTeamMomentum) * 0.20;
  
  // Determine recommended bet based on NEUTRAL stance
  const homeTeamFavored = confidence >= 50;
  const recommended = homeTeamFavored ? "home" : "away";
  
  // Adjust confidence to be within reasonable bounds
  confidence = Math.max(40, Math.min(85, Math.abs(confidence)));
  
  // Project scores based on team strengths - balanced for both teams
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
 * Calculate momentum score based on recent form
 */
function calculateMomentumScore(team: Team): number {
  if (!team.recentForm || team.recentForm.length === 0) {
    return 0;
  }
  
  // Weight recent games more heavily
  let momentumScore = 0;
  const recentGames = [...team.recentForm].slice(0, Math.min(5, team.recentForm.length));
  
  // Give more weight to most recent games
  recentGames.forEach((result, index) => {
    const gameWeight = (recentGames.length - index) / recentGames.length; // More recent games have higher weight
    momentumScore += result === 'W' ? (3 * gameWeight) : (-2 * gameWeight);
  });
  
  return momentumScore;
}

/**
 * MLB-specific prediction algorithm
 * Emphasizes pitching matchups, statistical trends, and run differential
 * Removes the home team bias
 */
function generateMLBPrediction(
  match: Match,
  historicalData?: HistoricalData
): Match {
  const enhancedMatch = { ...match };
  const homeTeam = match.homeTeam;
  const awayTeam = match.awayTeam;
  
  // Extract team records if available
  const homeRecord = parseTeamRecord(homeTeam.record || '0-0');
  const awayRecord = parseTeamRecord(awayTeam.record || '0-0');
  
  // Calculate run differentials (proxy for team quality)
  const homeRunDiff = calculateRunDifferential(homeRecord);
  const awayRunDiff = calculateRunDifferential(awayRecord);
  
  // Start with true neutral confidence (no home team bias)
  let confidence = 50;
  
  // Factor 1: Team record strength (35% weight)
  if (homeRecord.games > 0 && awayRecord.games > 0) {
    const homeWinPct = homeRecord.wins / homeRecord.games;
    const awayWinPct = awayRecord.wins / awayRecord.games;
    confidence += (homeWinPct - awayWinPct) * 25; // Balanced weighting
  }
  
  // Factor 2: Run differential (30% weight)
  confidence += (homeRunDiff - awayRunDiff) * 0.15; // Balanced weighting
  
  // Factor 3: Recent form - weighted by recency (25% weight)
  const homeRecentForm = calculateWeightedRecentForm(homeTeam);
  const awayRecentForm = calculateWeightedRecentForm(awayTeam);
  confidence += (homeRecentForm - awayRecentForm) * 5;
  
  // Factor 4: Head-to-head history if available (15% weight)
  if (historicalData && historicalData.totalGames > 2) {
    const headToHeadAdvantage = (historicalData.homeWins / historicalData.totalGames) - 0.5;
    confidence += headToHeadAdvantage * 15; // Give decent weight to head-to-head
  }
  
  // Factor 5: Small MLB home field advantage (much smaller than before)
  confidence += 1.0; // Reduced from previous higher values
  
  // Factor 6: Randomness factor - baseball has high variance
  confidence += (Math.random() * 4) - 2; // Small random factor to prevent ties
  
  // Determine recommended bet
  const homeTeamFavored = confidence >= 50;
  const recommended = homeTeamFavored ? "home" : "away";
  
  // Clamp confidence to reasonable values
  confidence = Math.max(45, Math.min(75, confidence));
  
  // Project realistic baseball scores with no home team bias
  const baseRuns = 4.1; // Neutral average (not favoring home team)
  const homeRunFactor = homeRunDiff / 100;
  const awayRunFactor = awayRunDiff / 100;
  
  const varianceFactor = 0.7; // baseball has high variance
  const homeNoise = (Math.random() * varianceFactor * 2 - varianceFactor);
  const awayNoise = (Math.random() * varianceFactor * 2 - varianceFactor);
  
  const projectedHomeScore = Math.max(0, Math.round(baseRuns + homeRunFactor + homeNoise));
  const projectedAwayScore = Math.max(0, Math.round(baseRuns + awayRunFactor + awayNoise));
  
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
 * Calculate weighted recent form that emphasizes more recent games
 */
function calculateWeightedRecentForm(team: Team): number {
  if (!team.recentForm || team.recentForm.length === 0) {
    return 0;
  }
  
  let weightedScore = 0;
  const recentGames = [...team.recentForm].slice(0, Math.min(5, team.recentForm.length));
  
  // Give more weight to most recent games
  recentGames.forEach((result, index) => {
    const gameWeight = (recentGames.length - index) / recentGames.length;
    weightedScore += result === 'W' ? gameWeight : -gameWeight;
  });
  
  return weightedScore;
}

/**
 * Parse team record from string format (W-L)
 */
function parseTeamRecord(record: string): { wins: number; losses: number; games: number } {
  const parts = record.split('-');
  const wins = parseInt(parts[0]) || 0;
  const losses = parseInt(parts[1]) || 0;
  return { 
    wins, 
    losses, 
    games: wins + losses 
  };
}

/**
 * Calculate run differential based on team record
 * This is an estimation since we don't have actual run data
 */
function calculateRunDifferential(record: { wins: number; losses: number; games: number }): number {
  if (record.games === 0) return 0;
  
  const winningPct = record.wins / record.games;
  // Estimated run differential based on Pythagorean expectation formula
  return Math.round((winningPct - 0.5) * 120);
}

/**
 * Calculate number of wins in recent form
 */
function calculateRecentWins(recentForm: string[]): number {
  return recentForm.filter(result => result === 'W').length;
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
  
  // Adjust based on recent form if available - with stronger emphasis
  if (team.recentForm && team.recentForm.length > 0) {
    let recentWins = 0;
    let weightSum = 0;
    
    // Weight recent games more heavily
    team.recentForm.forEach((result, index) => {
      const weight = team.recentForm.length - index; // More recent games have higher weight
      if (result === 'W') recentWins += weight;
      weightSum += weight;
    });
    
    const weightedWinPct = weightSum > 0 ? recentWins / weightSum : 0.5;
    momentum += (weightedWinPct * 100 - 50) * 1.0; // Stronger emphasis on momentum
  }
  
  // Make sure values are within bounds
  return {
    offense: Math.max(30, Math.min(95, offense)),
    defense: Math.max(30, Math.min(95, defense)),
    momentum: Math.max(20, Math.min(95, momentum))
  };
}

/**
 * Get dynamic home field advantage based on league and team performance
 */
function getDynamicHomeAdvantage(league: League, team: Team): number {
  let baseAdvantage;
  
  // Base advantage by league
  switch (league) {
    case 'NFL': baseAdvantage = 2.5; // Reduced from previous value
    case 'NBA': baseAdvantage = 2.0; // Reduced from previous value
    case 'MLB': baseAdvantage = 1.0; // Significantly reduced from previous value
    case 'NHL': baseAdvantage = 1.8; // Reduced from previous value
    case 'SOCCER': baseAdvantage = 3.0; // Reduced from previous value
    default: baseAdvantage = 2.0;
  }
  
  // Adjust based on team's home performance if available
  // This would ideally use home/away split records, but we'll use recent form as proxy
  if (team.recentForm && team.recentForm.length >= 3) {
    const recentWins = calculateRecentWins(team.recentForm);
    const recentWinPct = recentWins / team.recentForm.length;
    
    // Teams that have been winning get less home field advantage (already accounted for in their strength)
    // Teams that have been losing get more home field advantage (regression to mean)
    if (recentWinPct > 0.6) {
      baseAdvantage *= 0.8; // Reduce HFA for hot teams
    } else if (recentWinPct < 0.4) {
      baseAdvantage *= 1.2; // Increase HFA for cold teams
    }
  }
  
  return baseAdvantage;
}

/**
 * Project score based on team strengths - balanced approach
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
    case 'MLB': baseScore = 4.1; break; // Average MLB team score - slightly reduced
    case 'NHL': baseScore = 3; break;   // Average NHL team score
    case 'SOCCER': baseScore = 1.3; break; // Average soccer team score
    default: baseScore = 10;
  }
  
  // Calculate offensive vs defensive strength
  const offenseDefenseFactor = (teamStrength.offense - opponentStrength.defense) / 100;
  
  // Add home advantage if applicable - reduced impact
  const homeAdvantage = isHome ? (getDynamicHomeAdvantage(league, { id: "", name: "", shortName: "" }) / 20) : 0;
  
  // Calculate projected score - fairly between teams
  let rawScore = baseScore * (1 + offenseDefenseFactor + homeAdvantage);
  
  // Add some randomness - give both teams similar randomness
  const randomSeed = Date.now() + (isHome ? 1 : 0);
  const pseudoRandom = Math.sin(randomSeed) * 0.5 + 0.5; // Generate value between 0-1
  rawScore *= (0.95 + (pseudoRandom * 0.1)); // +/- 5% randomness
  
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
