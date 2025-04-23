
import { Match } from "@/types/sports";
import { generateAdvancedPrediction } from "../core/predictionEngine";
import { calculateWeatherImpact } from "../../smartScore/factors/weatherFactors";
import { calculateInjuryImpact } from "../../smartScore/factors/injuryFactors";

/**
 * Statistical Edge Algorithm
 * 
 * This algorithm focuses on statistical analysis with:
 * - Weather factor amplification
 * - Injury impact assessment
 * - Situational spots (back-to-backs, rest advantage, etc.)
 * - Statistical matchup advantages
 */
export function generateStatisticalEdgePrediction(match: Match): Match {
  // Clone the match to avoid mutation
  const enhancedMatch = { ...match };
  
  // Start with the base prediction
  const basePrediction = generateAdvancedPrediction(match);
  
  // Extract the prediction from the base prediction
  const { prediction } = basePrediction;
  if (!prediction) {
    return basePrediction; // Return the base prediction if no prediction is available
  }
  
  // Apply Statistical Edge specific adjustments
  const adjustedConfidence = applyStatisticalEdgeAdjustments(basePrediction);
  
  // Create the Statistical Edge algorithm-specific prediction
  enhancedMatch.prediction = {
    ...prediction,
    confidence: Math.round(adjustedConfidence),
    algorithmId: "85c48bbe-5b1a-4c1e-a0d5-e284e9e952f1" // Statistical Edge algorithm UUID
  };
  
  return enhancedMatch;
}

function applyStatisticalEdgeAdjustments(match: Match): number {
  if (!match.prediction) return 50;
  
  // Start with the base confidence
  let confidence = match.prediction.confidence;
  
  // Statistical Edge puts more emphasis on situational data and matchup statistics
  
  // 1. Amplify weather impacts - this algorithm weighs weather heavily
  const { weatherImpact } = calculateWeatherImpact(match);
  if (weatherImpact < 50) {
    // Bad weather causes more uncertainty - reduce confidence
    confidence -= (50 - weatherImpact) * 0.3;
  }
  
  // 2. Amplify injury impacts - this algorithm weighs injuries heavily
  const { injuriesScore } = calculateInjuryImpact(match);
  if (injuriesScore < 50) {
    // Significant injuries cause more uncertainty
    confidence -= (50 - injuriesScore) * 0.3;
  }
  
  // 3. Consider situational spots (simulated for now)
  // In a real implementation, we'd use actual rest days data
  const homeRestAdvantage = Math.floor(Math.random() * 3); // 0-2 days rest advantage
  if (homeRestAdvantage > 0) {
    if (match.prediction.recommended === 'home') {
      // Home team with rest advantage is a positive signal
      confidence += homeRestAdvantage * 2;
    } else {
      confidence -= homeRestAdvantage * 2;
    }
  }
  
  // 4. Statistical matchup advantages
  // This would use actual team statistics in a real implementation
  if (match.homeTeam.stats && match.awayTeam.stats) {
    // Example: 3-point shooting advantage for teams that rely on 3s
    const home3pct = match.homeTeam.stats.threePointPercentage as number || 0;
    const away3pct = match.awayTeam.stats.threePointPercentage as number || 0;
    
    if (home3pct && away3pct) {
      const shootingDiff = home3pct - away3pct;
      if (Math.abs(shootingDiff) > 0.03) { // 3% difference is significant
        if ((shootingDiff > 0 && match.prediction.recommended === 'home') ||
            (shootingDiff < 0 && match.prediction.recommended === 'away')) {
          confidence += 3; // Shooting advantage aligns with our pick
        }
      }
    }
  }
  
  // 5. League-specific adjustments
  if (match.league === 'NFL') {
    // NFL is more predictable for this algorithm
    confidence += 3;
  } else if (match.league === 'NHL') {
    // NHL has more variance in this algorithm
    confidence -= 3;
  }
  
  // Ensure confidence stays within reasonable bounds
  return Math.max(40, Math.min(85, confidence));
}

// Function to apply Statistical Edge to a collection of matches
export function applyStatisticalEdgePredictions(matches: Match[]): Match[] {
  return matches.map(match => generateStatisticalEdgePrediction(match));
}
