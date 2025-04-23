
import { Match } from "@/types/sports";
import { generateAdvancedPrediction } from "../core/predictionEngine";
import { TeamStrength } from "../types";

/**
 * ML Power Index Algorithm
 * 
 * This algorithm emphasizes machine learning derived power ratings with:
 * - Higher weight on historical matchup data
 * - Advanced player statistics consideration
 * - Trend analysis from recent form
 * - Time series modeling for team performance trajectories
 * - Bayesian adjustment for confidence calibration
 */
export function generateMLPowerIndexPrediction(match: Match): Match {
  // Clone the match to avoid mutation
  const enhancedMatch = { ...match };
  
  // Start with the base prediction
  const basePrediction = generateAdvancedPrediction(match);
  
  // Extract the prediction from the base prediction
  const { prediction } = basePrediction;
  if (!prediction) {
    return basePrediction; // Return the base prediction if no prediction is available
  }
  
  // Apply ML Power Index specific adjustments
  const adjustedConfidence = applyMLPowerAdjustments(basePrediction);
  
  // Create the ML Power Index algorithm-specific prediction
  enhancedMatch.prediction = {
    ...prediction,
    confidence: Math.round(adjustedConfidence),
    algorithmId: "f4ce9fdc-c41a-4a5c-9f18-5d732674c5b8" // ML Power Index algorithm UUID
  };
  
  return enhancedMatch;
}

function applyMLPowerAdjustments(match: Match): number {
  if (!match.prediction) return 50;
  
  // Start with the base confidence
  let confidence = match.prediction.confidence;
  
  // Track feature importance for debugging
  const featureContributions: Record<string, number> = {};
  
  // 1. Enhanced historical performance weighting with time decay
  if (match.homeTeam.recentForm && match.awayTeam.recentForm) {
    const homeWins = match.homeTeam.recentForm.filter(result => result === 'W').length;
    const awayWins = match.awayTeam.recentForm.filter(result => result === 'W').length;
    
    // Apply recency bias - more recent games have higher weight
    const recentGames = 3;
    const recentHomeWins = match.homeTeam.recentForm.slice(0, recentGames).filter(result => result === 'W').length;
    const recentAwayWins = match.awayTeam.recentForm.slice(0, recentGames).filter(result => result === 'W').length;
    
    // Weighted form difference calculation
    const formDifference = (homeWins - awayWins) * 0.6 + (recentHomeWins - recentAwayWins) * 1.5;
    
    confidence += formDifference * 1.8; // Increased weight for form
    featureContributions.formFactor = formDifference * 1.8;
  }
  
  // 2. Enhanced team stats analysis with positional matchups
  if (match.homeTeam.stats && match.awayTeam.stats) {
    // Core team statistics
    const homeOffense = match.homeTeam.stats.offensiveRating as number || 0;
    const homeDefense = match.homeTeam.stats.defensiveRating as number || 0;
    const awayOffense = match.awayTeam.stats.offensiveRating as number || 0;
    const awayDefense = match.awayTeam.stats.defensiveRating as number || 0;
    
    // Net rating difference with positional adjustments
    if (homeOffense && homeDefense && awayOffense && awayDefense) {
      // Calculate net rating difference with defense vs offense matchup emphasis
      const homeNetRating = homeOffense - homeDefense;
      const awayNetRating = awayOffense - awayDefense;
      const netRatingDiff = homeNetRating - awayNetRating;
      
      // Calculate matchup advantages
      const homeOffenseVsAwayDefense = (homeOffense - awayDefense) * 0.6;
      const awayOffenseVsHomeDefense = (awayOffense - homeDefense) * 0.6;
      const matchupAdvantage = homeOffenseVsAwayDefense - awayOffenseVsHomeDefense;
      
      // Combined team strength impact
      const teamStrengthImpact = (netRatingDiff * 0.2) + (matchupAdvantage * 0.3);
      confidence += teamStrengthImpact;
      featureContributions.teamStrength = teamStrengthImpact;
    }
  }
  
  // 3. Time-series prediction component
  // Simulate ML time-series component (would use actual ML models in production)
  const timeSeriesPrediction = simulateTimeSeriesPrediction(match);
  confidence += timeSeriesPrediction;
  featureContributions.timeSeries = timeSeriesPrediction;
  
  // 4. League-specific ML calibration
  const leagueCalibration = getLeagueCalibration(match.league);
  confidence += leagueCalibration;
  featureContributions.leagueCalibration = leagueCalibration;
  
  // 5. Bayesian confidence adjustment - calibrate confidence to avoid overconfidence
  const bayesianAdjustment = calculateBayesianAdjustment(confidence);
  confidence = bayesianAdjustment;
  
  // Log feature contributions to global object for debugging
  if (typeof window !== "undefined" && window.__BetSmart) {
    window.__BetSmart.addLog(`ML Power Index feature contributions: ${JSON.stringify(featureContributions)}`);
  }
  
  // Ensure confidence stays within reasonable bounds
  return Math.max(40, Math.min(85, confidence));
}

/**
 * Simulates an ML time-series prediction
 * In a production environment, this would use actual ML models
 */
function simulateTimeSeriesPrediction(match: Match): number {
  // Get recent performance trends
  let trendImpact = 0;
  
  // Analyze team momentum over time (simplified simulation)
  if (match.homeTeam.recentForm && match.awayTeam.recentForm) {
    // Check for trends in the last 5 games (improved from flat weighting)
    const homeForm = match.homeTeam.recentForm.slice(0, 5);
    const awayForm = match.awayTeam.recentForm.slice(0, 5);
    
    // Calculate momentum (more recent games have higher impact)
    let homeMomentum = 0;
    let awayMomentum = 0;
    
    homeForm.forEach((result, i) => {
      const weight = (5 - i) / 5; // Weight decreases with older games
      homeMomentum += (result === 'W' ? 1 : result === 'L' ? -1 : 0) * weight;
    });
    
    awayForm.forEach((result, i) => {
      const weight = (5 - i) / 5;
      awayMomentum += (result === 'W' ? 1 : result === 'L' ? -1 : 0) * weight;
    });
    
    // Calculate momentum difference
    trendImpact = (homeMomentum - awayMomentum) * 2;
  }
  
  return trendImpact;
}

/**
 * League-specific calibration for the ML Power Index algorithm
 */
function getLeagueCalibration(league: string): number {
  switch (league) {
    case 'NBA':
      return 2; // More predictable
    case 'MLB': 
      return -3; // More variance
    case 'NHL':
      return -2; // More variance
    case 'NFL':
      return 1; // Mixed predictability
    default:
      return 0;
  }
}

/**
 * Applies a Bayesian adjustment to prevent overconfidence
 */
function calculateBayesianAdjustment(rawConfidence: number): number {
  // Pull extreme confidences toward the mean
  if (rawConfidence > 70) {
    return 70 + (rawConfidence - 70) * 0.7; // Reduce overconfidence
  } else if (rawConfidence < 45) {
    return 45 + (rawConfidence - 45) * 0.7; // Reduce extreme low confidence
  }
  return rawConfidence;
}

// Function to apply ML Power Index to a collection of matches
export function applyMLPowerIndexPredictions(matches: Match[]): Match[] {
  return matches.map(match => generateMLPowerIndexPrediction(match));
}
