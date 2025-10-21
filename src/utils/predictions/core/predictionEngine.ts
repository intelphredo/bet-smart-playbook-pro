
import { League, Match } from "@/types/sports";
import { HistoricalData, TeamStrength } from "../types";
import { calculateTeamStrength } from "../factors/teamStrength";
import { calculateMomentumScore } from "../factors/momentum";
import { getDynamicHomeAdvantage } from "../factors/homeAdvantage";
import { projectScore } from "../factors/scoreProjection";
import { generateMLBPrediction } from "../sport-specific/mlbPredictions";
import { cachePrediction, hasCachedPrediction, getCachedPrediction } from "../cache/predictionCache";

/**
 * Advanced prediction algorithm that considers multiple factors:
 * - Historical matchup data
 * - Team strengths (offense/defense)
 * - Home field advantage
 * - Recent form
 * - Injuries
 * - Weather conditions
 * 
 * Predictions are locked/cached per match by id, preventing fluctuation on re-calculation.
 */
export function generateAdvancedPrediction(
  match: Match, 
  historicalData?: HistoricalData
): Match {
  // Lock prediction: if we've already generated it for this match id, return the cached value
  if (hasCachedPrediction(match.id)) {
    return getCachedPrediction(match.id)!;
  }

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
  
  // Calculate true probability (confidence / 100)
  const trueProbability = confidence / 100;
  
  // Calculate implied fair odds
  const impliedOdds = 1 / trueProbability;
  
  // Get current bookmaker odds for the recommended outcome
  const bookmakerOdds = recommended === 'home' ? match.odds.homeWin : match.odds.awayWin;
  
  // Calculate Expected Value (EV)
  const b = bookmakerOdds - 1;
  const p = trueProbability;
  const q = 1 - p;
  const expectedValue = (p * b) - q;
  const evPercentage = expectedValue * 100;
  
  // Calculate Kelly Criterion (using 1/4 Kelly for safety)
  let kellyFraction = 0;
  let kellyStakeUnits = 0;
  if (expectedValue > 0) {
    const fullKelly = ((b * p) - q) / b;
    kellyFraction = Math.max(0, fullKelly * 0.25); // 1/4 Kelly
    kellyStakeUnits = kellyFraction * 100; // Assuming 100 units bankroll
  }
  
  // Project scores based on team strengths - balanced for both teams
  const projectedHomeScore = projectScore(homeTeamStrength, awayTeamStrength, true, match.league);
  const projectedAwayScore = projectScore(awayTeamStrength, homeTeamStrength, false, match.league);
  
  // Update match prediction with sharp betting metrics
  enhancedMatch.prediction = {
    recommended,
    confidence: Math.round(confidence),
    projectedScore: {
      home: projectedHomeScore,
      away: projectedAwayScore
    },
    trueProbability,
    impliedOdds: Math.round(impliedOdds * 100) / 100,
    expectedValue: Math.round(expectedValue * 10000) / 10000,
    evPercentage: Math.round(evPercentage * 100) / 100,
    kellyFraction: Math.round(kellyFraction * 10000) / 10000,
    kellyStakeUnits: Math.round(kellyStakeUnits * 100) / 100
  };
  
  // Cache the prediction (lock it)
  return cachePrediction(enhancedMatch);
}

/**
 * Apply the advanced prediction algorithm to a list of matches
 */
export function applyAdvancedPredictions(matches: Match[]): Match[] {
  return matches.map(match => generateAdvancedPrediction(match));
}
