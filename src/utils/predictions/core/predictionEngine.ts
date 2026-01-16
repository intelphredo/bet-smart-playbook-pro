/**
 * Enhanced Prediction Engine
 * 
 * Comprehensive prediction algorithm that considers ALL relevant factors:
 * - Team strength and record analysis
 * - Home court/field advantage (league-specific)
 * - Head-to-head historical matchups
 * - Recent form and momentum (with streak detection)
 * - Back-to-back game fatigue
 * - Injury impact assessment
 * - Rest days differential
 * - Coaching matchup analysis
 * 
 * IMPORTANT: Once a prediction is made and saved, it is LOCKED and will not change.
 * The engine checks both local cache AND database for existing predictions.
 */

import { League, Match } from "@/types/sports";
import { HistoricalData } from "../types";
import { projectScore } from "../factors/scoreProjection";
import { generateMLBPrediction } from "../sport-specific/mlbPredictions";
import { cachePrediction, hasCachedPrediction, getCachedPrediction, clearPredictionCache } from "../cache/predictionCache";
import { runComprehensiveAnalysis, ComprehensiveAnalysis } from "../factors/comprehensiveFactors";
import { generatePredictionReasoning, generateOneLiner } from "../factors/reasoningGenerator";
import { 
  isPredicitionLocked, 
  getLockedPredictionsForMatch, 
  applyLockedPredictionToMatch 
} from "@/hooks/useLockedPredictions";

// Re-export cache functions for external use
export { clearPredictionCache };

/**
 * Generate an advanced prediction with comprehensive factor analysis
 * LOCKED PREDICTION PRIORITY:
 * 1. Check local cache (fast, 24h TTL)
 * 2. Check if prediction is locked in database
 * 3. Only generate new prediction if neither exists
 */
export function generateAdvancedPrediction(
  match: Match, 
  historicalData?: HistoricalData
): Match {
  // LOCK CHECK 1: Local cache (fastest)
  if (hasCachedPrediction(match.id)) {
    const cached = getCachedPrediction(match.id)!;
    console.log(`[PredictionLock] Using cached prediction for ${match.id}`);
    return cached;
  }
  
  // LOCK CHECK 2: Database (check if already saved)
  if (isPredicitionLocked(match.id)) {
    const lockedMatch = applyLockedPredictionToMatch(match);
    if (lockedMatch.prediction?.isLocked) {
      console.log(`[PredictionLock] Using DB-locked prediction for ${match.id}`);
      // Also cache it locally for faster access
      return cachePrediction(lockedMatch);
    }
  }

  const enhancedMatch = { ...match };
  const homeTeam = match.homeTeam;
  const awayTeam = match.awayTeam;
  
  // Use MLB-specific prediction logic for baseball games
  if (match.league === 'MLB') {
    return generateMLBPrediction(match, historicalData);
  }
  
  // Run comprehensive analysis
  const analysis = runComprehensiveAnalysis(match);
  
  // Calculate base confidence from total impact
  // Impact range is roughly -50 to +50, we map to confidence
  const impactMagnitude = Math.abs(analysis.totalImpact);
  
  // Base confidence starts at 50 and scales with impact
  let confidence = 50;
  
  // Strong signals push confidence further from 50
  if (impactMagnitude > 25) {
    confidence = 50 + Math.min(30, impactMagnitude * 0.8);
  } else if (impactMagnitude > 15) {
    confidence = 50 + impactMagnitude * 0.7;
  } else if (impactMagnitude > 8) {
    confidence = 50 + impactMagnitude * 0.6;
  } else {
    confidence = 50 + impactMagnitude * 0.5;
  }
  
  // Add confidence boost from aligned high-confidence factors
  confidence += analysis.confidenceBoost;
  
  // Determine recommended pick
  const recommended: 'home' | 'away' = analysis.totalImpact >= 0 ? 'home' : 'away';
  
  // Ensure confidence reflects the magnitude of the edge
  // Adjust confidence to be within reasonable bounds
  confidence = Math.max(42, Math.min(88, confidence));
  
  // For close games (low impact), keep confidence closer to 50
  if (impactMagnitude < 5) {
    confidence = Math.max(48, Math.min(55, confidence));
  }
  
  // Calculate true probability
  const trueProbability = confidence / 100;
  
  // Calculate implied fair odds
  const impliedOdds = 1 / trueProbability;
  
  // Get current bookmaker odds for the recommended outcome
  const bookmakerOdds = recommended === 'home' 
    ? (match.odds?.homeWin || 1.9) 
    : (match.odds?.awayWin || 1.9);
  
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
    kellyStakeUnits = kellyFraction * 100;
  }
  
  // Calculate team strength from analysis for score projection
  const homeStrengthScore = 50 + (analysis.totalImpact > 0 ? analysis.totalImpact * 0.5 : 0);
  const awayStrengthScore = 50 + (analysis.totalImpact < 0 ? Math.abs(analysis.totalImpact) * 0.5 : 0);
  
  const teamStrengthHome = {
    offense: Math.min(85, Math.max(35, homeStrengthScore)),
    defense: Math.min(85, Math.max(35, homeStrengthScore)),
    momentum: 50
  };
  
  const teamStrengthAway = {
    offense: Math.min(85, Math.max(35, awayStrengthScore)),
    defense: Math.min(85, Math.max(35, awayStrengthScore)),
    momentum: 50
  };
  
  // Project scores
  const projectedHomeScore = projectScore(teamStrengthHome, teamStrengthAway, true, match.league);
  const projectedAwayScore = projectScore(teamStrengthAway, teamStrengthHome, false, match.league);
  
  // Generate reasoning
  const reasoning = generatePredictionReasoning(
    homeTeam.shortName || homeTeam.name,
    awayTeam.shortName || awayTeam.name,
    recommended,
    Math.round(confidence),
    analysis
  );
  
  const oneLiner = generateOneLiner(
    homeTeam.shortName || homeTeam.name,
    awayTeam.shortName || awayTeam.name,
    recommended,
    Math.round(confidence),
    analysis
  );
  
  // Update match prediction with all metrics
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
    kellyStakeUnits: Math.round(kellyStakeUnits * 100) / 100,
    // Enhanced reasoning fields
    reasoning: oneLiner,
    detailedReasoning: reasoning.summary + ' ' + reasoning.keyFactors.slice(0, 2).join('. '),
    keyFactors: reasoning.keyFactors,
    riskLevel: analysis.riskLevel,
    warningFlags: reasoning.warningFlags,
    analysisFactors: analysis.factors.map(f => ({
      name: f.name,
      impact: f.impact,
      description: f.description,
      favoredTeam: f.favoredTeam
    }))
  };
  
  // Also update smartScore with reasoning
  if (enhancedMatch.smartScore) {
    enhancedMatch.smartScore.recommendation = {
      ...enhancedMatch.smartScore.recommendation,
      reasoning: oneLiner
    };
  }
  
  // Cache the prediction (lock it)
  return cachePrediction(enhancedMatch);
}

/**
 * Apply the advanced prediction algorithm to a list of matches
 */
export function applyAdvancedPredictions(matches: Match[]): Match[] {
  return matches.map(match => generateAdvancedPrediction(match));
}

/**
 * Force regenerate predictions (clears cache first)
 * WARNING: This should rarely be used as it bypasses prediction locking.
 * Locked predictions in the database will still be respected.
 * Only clears LOCAL cache - does not affect DB-locked predictions.
 */
export function regeneratePredictions(matches: Match[]): Match[] {
  console.warn('[PredictionLock] Clearing local cache - DB-locked predictions will still be respected');
  clearPredictionCache();
  return applyAdvancedPredictions(matches);
}

/**
 * Apply predictions to matches, respecting locked predictions
 * This is the preferred method for applying predictions as it
 * checks for locked predictions before generating new ones.
 */
export function applyPredictionsWithLocking(matches: Match[]): Match[] {
  return matches.map(match => {
    // The generateAdvancedPrediction function already checks for locks
    return generateAdvancedPrediction(match);
  });
}
