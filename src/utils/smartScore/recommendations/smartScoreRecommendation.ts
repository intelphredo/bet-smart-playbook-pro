
import { Match } from "@/types/sports";

type ScoreComponents = {
  momentumScore: number;
  valueScore: number;
  oddsMovementScore: number;
  weatherImpact: number;
  injuriesScore: number;
  arbitrageScore: number;
};

/**
 * Generate smart score recommendation based on match data and score components
 */
export function generateSmartScoreRecommendation(
  match: Match, 
  overallScore: number,
  components: ScoreComponents
) {
  // Default recommendation
  const recommendation = {
    strength: "Neutral",
    action: "",
    reasoning: ""
  };
  
  // If match has no prediction, return neutral recommendation
  if (!match.prediction) {
    recommendation.reasoning = "Insufficient data to make a recommendation.";
    return recommendation;
  }
  
  // Base recommendation on overall score
  if (overallScore >= 75) {
    recommendation.strength = "Strong";
    recommendation.action = "Consider betting on this match.";
    
    // Find primary factor for high score
    const primaryFactor = getPrimaryStrongFactor(components);
    recommendation.reasoning = `Strong ${primaryFactor} indicators favor ${
      match.prediction.recommended === "home" ? match.homeTeam.shortName : match.awayTeam.shortName
    }. ${getConfidenceStatement(match.prediction.confidence)}.`;
  } 
  else if (overallScore >= 60) {
    recommendation.strength = "Moderate";
    recommendation.action = "Worth watching this matchup.";
    recommendation.reasoning = `Moderate indicators favor ${
      match.prediction.recommended === "home" ? match.homeTeam.shortName : match.awayTeam.shortName
    }. ${getConfidenceStatement(match.prediction.confidence)}.`;
  }
  else if (overallScore <= 35) {
    recommendation.strength = "Avoid";
    recommendation.action = "Consider avoiding this match.";
    recommendation.reasoning = `Multiple negative factors detected. ${getCautionStatement(components)}.`;
  }
  else {
    recommendation.strength = "Neutral";
    recommendation.action = "More research needed.";
    recommendation.reasoning = `Mixed signals in this match. Prediction confidence: ${match.prediction.confidence}%.`;
  }
  
  return recommendation;
}

/**
 * Get the primary factor contributing to a strong recommendation
 */
function getPrimaryStrongFactor(components: ScoreComponents): string {
  const { momentumScore, valueScore, oddsMovementScore, weatherImpact, arbitrageScore } = components;
  
  if (arbitrageScore > 70) return "arbitrage";
  if (valueScore > 75) return "value";
  if (momentumScore > 70) return "momentum";
  if (oddsMovementScore > 70) return "odds movement";
  if (weatherImpact > 80) return "weather condition";
  
  return "combined indicator";
}

/**
 * Generate a confidence statement based on prediction confidence
 */
function getConfidenceStatement(confidence: number): string {
  if (confidence >= 70) {
    return `Algorithm prediction confidence is high (${confidence}%)`;
  } else if (confidence >= 60) {
    return `Algorithm prediction confidence is moderate (${confidence}%)`;
  } else {
    return `Algorithm prediction confidence is low (${confidence}%)`;
  }
}

/**
 * Generate a caution statement when recommendation is to avoid
 */
function getCautionStatement(components: ScoreComponents): string {
  const { weatherImpact, injuriesScore, oddsMovementScore } = components;
  
  if (weatherImpact < 40) {
    return "Weather conditions may negatively impact this match";
  } else if (injuriesScore < 40) {
    return "Injury concerns present in this matchup";
  } else if (oddsMovementScore < 40) {
    return "Odds movement signals potential concerns";
  }
  
  return "Multiple risk factors present";
}
