
import { League, Match } from "@/types/sports";
import { HistoricalData, TeamRecord } from "../types";
import { calculateWeightedRecentForm } from "../factors/momentum";
import { cachePrediction, hasCachedPrediction, getCachedPrediction } from "../cache/predictionCache";
import { calculateMLBTeamStrength } from "../factors/teamStrength";

/**
 * Parse team record from string format (W-L)
 */
export function parseTeamRecord(record: string): TeamRecord {
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
 */
export function calculateRunDifferential(record: TeamRecord): number {
  if (record.games === 0) return 0;
  
  const winningPct = record.wins / record.games;
  // Estimated run differential based on Pythagorean expectation formula
  return Math.round((winningPct - 0.5) * 120);
}

/**
 * MLB-specific prediction algorithm
 * Emphasizes pitching matchups, statistical trends, and run differential
 * Removes the home team bias
 */
export function generateMLBPrediction(
  match: Match,
  historicalData?: HistoricalData
): Match {
  // Lock prediction: if already generated for this id, return cached
  if (hasCachedPrediction(match.id)) {
    return getCachedPrediction(match.id)!;
  }

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

  // Add to cache (lock the prediction)
  return cachePrediction(enhancedMatch);
}
