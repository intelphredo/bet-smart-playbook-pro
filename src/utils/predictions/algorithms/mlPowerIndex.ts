
import { Match } from "@/types/sports";
import { generateAdvancedPrediction } from "../core/predictionEngine";
import { TeamStrength } from "../types";
import { applyConfidenceCalibration } from "@/utils/modelCalibration/calibrationIntegration";
import { ALGORITHM_IDS } from "./index";

/**
 * ML Power Index Algorithm
 * 
 * This algorithm emphasizes machine learning derived power ratings with:
 * - Higher weight on historical matchup data
 * - Advanced player statistics consideration
 * - Trend analysis from recent form
 * 
 * Now integrates with the automatic recalibration system to adjust
 * confidence based on recent algorithm performance.
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
  const rawConfidence = applyMLPowerAdjustments(basePrediction);
  
  // Apply calibration from the recalibration system
  const algorithmId = ALGORITHM_IDS.ML_POWER_INDEX;
  const calibrated = applyConfidenceCalibration(rawConfidence, algorithmId);
  
  // Create the ML Power Index algorithm-specific prediction
  enhancedMatch.prediction = {
    ...prediction,
    confidence: calibrated.adjustedConfidence,
    rawConfidence: calibrated.rawConfidence,
    isCalibrated: calibrated.multiplier !== 1.0,
    calibrationMultiplier: calibrated.multiplier,
    meetsCalibrationThreshold: calibrated.meetsThreshold,
    isPaused: calibrated.isPaused,
    algorithmId
  };
  
  return enhancedMatch;
}

function applyMLPowerAdjustments(match: Match): number {
  if (!match.prediction) return 50;
  
  // Start with the base confidence
  let confidence = match.prediction.confidence;
  
  // ML Power Index puts more emphasis on historical data and team strengths
  
  // 1. Historical performance weighting (significant weight)
  if (match.homeTeam.recentForm && match.awayTeam.recentForm) {
    const homeWins = match.homeTeam.recentForm.filter(result => result === 'W').length;
    const awayWins = match.awayTeam.recentForm.filter(result => result === 'W').length;
    const formDifference = homeWins - awayWins;
    
    // Add more weight to form difference than standard algorithm
    confidence += formDifference * 1.5;
  }
  
  // 2. Consider team stats with higher weight if available
  if (match.homeTeam.stats && match.awayTeam.stats) {
    // Use offensive and defensive efficiency metrics if available
    const homeOffense = match.homeTeam.stats.offensiveRating as number || 0;
    const homeDefense = match.homeTeam.stats.defensiveRating as number || 0;
    const awayOffense = match.awayTeam.stats.offensiveRating as number || 0;
    const awayDefense = match.awayTeam.stats.defensiveRating as number || 0;
    
    if (homeOffense && homeDefense && awayOffense && awayDefense) {
      // Calculate net rating difference
      const netRatingDiff = (homeOffense - homeDefense) - (awayOffense - awayDefense);
      // Apply a stronger weight than standard algorithm
      confidence += netRatingDiff * 0.3; 
    }
  }
  
  // 3. ML-specific adjustment: time-series prediction influence
  // Simulate ML time-series influence (in a real implementation, this would use actual ML models)
  if (match.league === 'NBA') {
    confidence += 3; // NBA games are more predictable in this algorithm
  } else if (match.league === 'NFL') {
    confidence += 2; // NFL has medium predictability
  } else if (match.league === 'MLB') {
    confidence -= 2; // MLB has more variance in this algorithm
  }
  
  // Ensure confidence stays within reasonable bounds
  return Math.max(40, Math.min(85, confidence));
}

// Function to apply ML Power Index to a collection of matches
export function applyMLPowerIndexPredictions(matches: Match[]): Match[] {
  return matches.map(match => generateMLPowerIndexPrediction(match));
}
