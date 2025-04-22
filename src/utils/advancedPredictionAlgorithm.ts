import { calculateSmartScore } from "./smartScoreCalculator";
import { Match } from "@/types";

/**
 * applyAdvancedPredictions - Applies advanced prediction algorithms to enhance match predictions.
 *
 * @param {Match[]} matches - An array of Match objects.
 * @returns {Match[]} - The array of Match objects with enhanced predictions.
 */
export function applyAdvancedPredictions(matches: Match[]): Match[] {
  return matches.map(match => {
    // Enhance prediction confidence based on multiple factors
    let enhancedConfidence = match.prediction?.confidence || 50; // Default confidence

    // Apply smart score to enhance confidence
    if (match.smartScore) {
      enhancedConfidence += (match.smartScore.overall - 50) * 0.4; // Adjust confidence based on smart score
    }

    // Add more factors here to adjust the confidence

    enhancedConfidence = Math.max(50, Math.min(95, enhancedConfidence)); // Cap between 50-95

    return {
      ...match,
      prediction: {
        ...match.prediction,
        confidence: enhancedConfidence,
      },
    };
  });
}

/**
 * analyzeResults - Analyzes the results of a set of matches and provides insights.
 *
 * @param {Match[]} matches - An array of Match objects.
 * @returns {object} - An object containing analysis results.
 */
export function analyzeResults(matches: Match[]): object {
  const totalMatches = matches.length;
  const predictedCorrectly = matches.filter(match => {
    if (!match.prediction || !match.score) return false;

    const { recommended } = match.prediction;
    const { home, away } = match.score;

    if (recommended === "home" && home > away) return true;
    if (recommended === "away" && away > home) return true;
    return false;
  }).length;

  const accuracyPercentage = (predictedCorrectly / totalMatches) * 100;

  return {
    totalMatches,
    predictedCorrectly,
    accuracyPercentage,
  };
}
