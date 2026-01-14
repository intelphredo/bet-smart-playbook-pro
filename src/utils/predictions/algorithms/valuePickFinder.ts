
import { Match } from "@/types/sports";
import { generateAdvancedPrediction } from "../core/predictionEngine";
import { hasArbitrageOpportunity } from "../../smartScore/arbitrageFactors";
import { calculateValueFactor } from "../../smartScore/valueFactors";
import { applyConfidenceCalibration } from "@/utils/modelCalibration/calibrationIntegration";
import { ALGORITHM_IDS } from "./index";

/**
 * Value Pick Finder Algorithm
 * 
 * This algorithm specializes in finding betting value with:
 * - Odds discrepancy analysis
 * - Line movement tracking
 * - Public betting percentage consideration (simulated)
 * - Market inefficiency detection
 * 
 * Now integrates with the automatic recalibration system to adjust
 * confidence based on recent algorithm performance.
 */
export function generateValuePickPrediction(match: Match): Match {
  // Clone the match to avoid mutation
  const enhancedMatch = { ...match };
  
  // Start with the base prediction
  const basePrediction = generateAdvancedPrediction(match);
  
  // Extract the prediction from the base prediction
  const { prediction } = basePrediction;
  if (!prediction) {
    return basePrediction; // Return the base prediction if no prediction is available
  }
  
  // Apply Value Pick specific adjustments
  const rawConfidence = applyValuePickAdjustments(basePrediction);
  
  // Apply calibration from the recalibration system
  const algorithmId = ALGORITHM_IDS.VALUE_PICK_FINDER;
  const calibrated = applyConfidenceCalibration(rawConfidence, algorithmId);
  
  // Create the Value Pick algorithm-specific prediction
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

function applyValuePickAdjustments(match: Match): number {
  if (!match.prediction) return 50;
  
  // Start with the base confidence
  let confidence = match.prediction.confidence;
  
  // Value Pick Finder puts more emphasis on odds and market value
  
  // 1. Check if the match has odds data
  if (match.odds) {
    // Calculate value score (already emphasized value in this algorithm)
    const { valueScore } = calculateValueFactor(match);
    
    // Add a strong influence from value score
    if (valueScore > 60) {
      confidence += (valueScore - 60) * 0.5;
    } else if (valueScore < 40) {
      confidence -= (40 - valueScore) * 0.5;
    }
  }
  
  // 2. Check for odds movement patterns if available
  if (match.liveOdds && match.liveOdds.length > 1) {
    const sortedOdds = [...match.liveOdds].sort((a, b) => 
      new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    );
    
    const firstOdds = sortedOdds[0];
    const latestOdds = sortedOdds[sortedOdds.length - 1];
    
    if (match.prediction.recommended === 'home') {
      // Home team movement is valuable information
      const homeMovement = latestOdds.homeWin - firstOdds.homeWin;
      if (homeMovement > 0.2) {
        // Line moving in our favor (getting better odds) is a positive signal
        confidence += 5;
      } else if (homeMovement < -0.2) {
        // Line moving against us is a negative signal
        confidence -= 5;
      }
    } else if (match.prediction.recommended === 'away') {
      const awayMovement = latestOdds.awayWin - firstOdds.awayWin;
      if (awayMovement > 0.2) {
        confidence += 5;
      } else if (awayMovement < -0.2) {
        confidence -= 5;
      }
    }
  }
  
  // 3. Check for potential arbitrage - this algorithm values arbitrage highly
  if (hasArbitrageOpportunity(match)) {
    // Substantial boost for arbitrage opportunities
    confidence += 10;
  }
  
  // 4. Simulate public betting percentages (in reality this would come from an API)
  const simulatedPublicBettingOnFavorite = Math.random() * 30 + 60; // 60-90% public on favorite
  if (simulatedPublicBettingOnFavorite > 75) {
    // If public is heavily on favorite, and we're on underdog, increase confidence
    if ((match.odds.homeWin < match.odds.awayWin && match.prediction.recommended === 'away') ||
        (match.odds.homeWin > match.odds.awayWin && match.prediction.recommended === 'home')) {
      confidence += 3;
    }
  }
  
  // Ensure confidence stays within reasonable bounds
  return Math.max(40, Math.min(85, confidence));
}

// Function to apply Value Pick Finder to a collection of matches
export function applyValuePickPredictions(matches: Match[]): Match[] {
  return matches.map(match => generateValuePickPrediction(match));
}
