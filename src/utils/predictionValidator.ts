
import { Match } from "@/types/sports";
import { logger } from "@/utils/logger";

interface ValidationStats {
  totalPredictions: number;
  homePredictions: number;
  awayPredictions: number;
  drawPredictions: number;
  homeWinRate: number;
  awayWinRate: number;
  drawWinRate: number;
  favoritePredictions: number;
  underdogPredictions: number;
  favoriteWinRate: number;
  underdogWinRate: number;
  averageConfidence: number;
  biasScore: number;
}

// Main validation function to analyze prediction bias
export function validatePredictions(matches: Match[]): ValidationStats {
  const stats: ValidationStats = {
    totalPredictions: 0,
    homePredictions: 0,
    awayPredictions: 0,
    drawPredictions: 0,
    homeWinRate: 0,
    awayWinRate: 0,
    drawWinRate: 0,
    favoritePredictions: 0,
    underdogPredictions: 0,
    favoriteWinRate: 0,
    underdogWinRate: 0,
    averageConfidence: 0,
    biasScore: 0
  };
  
  // Filter matches that have predictions
  const validMatches = matches.filter(match => match.prediction);
  
  if (validMatches.length === 0) {
    return stats;
  }
  
  stats.totalPredictions = validMatches.length;
  let confidenceSum = 0;
  
  // Count prediction types and calculate win rates
  validMatches.forEach(match => {
    if (match.prediction) {
      confidenceSum += match.prediction.confidence;
      
      // Home vs Away prediction counts
      if (match.prediction.recommended === 'home') {
        stats.homePredictions++;
      } else if (match.prediction.recommended === 'away') {
        stats.awayPredictions++;
      } else if (match.prediction.recommended === 'draw') {
        stats.drawPredictions++;
      }
      
      // Favorite vs Underdog counts
      if (match.odds) {
        const isFavorite = match.prediction.recommended === 'home' ? 
          match.odds.homeWin <= match.odds.awayWin :
          match.odds.awayWin <= match.odds.homeWin;
          
        if (isFavorite) {
          stats.favoritePredictions++;
        } else {
          stats.underdogPredictions++;
        }
      }
    }
  });
  
  // Calculate average confidence
  stats.averageConfidence = confidenceSum / stats.totalPredictions;
  
  // Calculate win rates - would need actual results for real implementation
  // For now, just estimate based on statistics
  stats.homeWinRate = stats.homePredictions / stats.totalPredictions;
  stats.awayWinRate = stats.awayPredictions / stats.totalPredictions;
  stats.drawWinRate = stats.drawPredictions / stats.totalPredictions;
  
  // Calculate bias score (0-100 where 0 is extremely biased, 100 is perfectly balanced)
  // For home/away bias:
  const homeAwayBias = Math.abs(stats.homeWinRate - 0.5) * 100;
  
  // For favorite/underdog bias:
  let favoriteUnderdogBias = 0;
  if (stats.totalPredictions > 0) {
    favoriteUnderdogBias = Math.abs(stats.favoritePredictions / stats.totalPredictions - 0.5) * 100;
  }
  
  // Combined bias score (lower is more biased)
  stats.biasScore = 100 - ((homeAwayBias + favoriteUnderdogBias) / 2);
  
  // Log results
  logger.log(`Prediction Validator: Analyzed ${stats.totalPredictions} predictions`);
  logger.log(`Home predictions: ${stats.homePredictions} (${(stats.homeWinRate * 100).toFixed(1)}%)`);
  logger.log(`Away predictions: ${stats.awayPredictions} (${(stats.awayWinRate * 100).toFixed(1)}%)`);
  logger.log(`Bias score: ${stats.biasScore.toFixed(1)} out of 100`);
  
  // Store in global object for debugging
  if (typeof window !== 'undefined' && window.__BetSmart) {
    window.__BetSmart.algorithmPerformance = {
      ...stats,
      lastUpdated: new Date().toISOString()
    };
  }
  
  return stats;
}

// Apply validation to matches before returning them
export function applyPredictionValidation(matches: Match[]): Match[] {
  // Run validation process
  validatePredictions(matches);
  
  // Return same matches - validation just runs analysis
  return matches;
}
