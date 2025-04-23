
import { Match } from "@/types/sports";
import { ALGORITHM_IDS } from "../algorithms";
import { logger } from "@/utils/logger";

interface ValidationResult {
  consensusScore: number;
  agreementLevel: 'high' | 'medium' | 'low' | 'conflicted';
  agreementRate: number;
  algorithmConsensus: Record<string, boolean>;
}

/**
 * Cross-validates predictions across different algorithms
 * to identify high consensus picks
 */
export function crossValidateAlgorithms(
  match: Match,
  allAlgorithmResults: {
    mlPowerIndex: Match[];
    valuePickFinder: Match[];
    statisticalEdge: Match[];
  }
): ValidationResult {
  // Find the match in each algorithm's results
  const matchId = match.id;
  
  const mlMatch = allAlgorithmResults.mlPowerIndex.find(m => m.id === matchId);
  const valueMatch = allAlgorithmResults.valuePickFinder.find(m => m.id === matchId);
  const statsMatch = allAlgorithmResults.statisticalEdge.find(m => m.id === matchId);
  
  // Default result
  const defaultResult: ValidationResult = {
    consensusScore: 0,
    agreementLevel: 'low',
    agreementRate: 0,
    algorithmConsensus: {}
  };
  
  // Ensure all algorithm predictions are available
  if (!mlMatch?.prediction || !valueMatch?.prediction || !statsMatch?.prediction) {
    return defaultResult;
  }
  
  // Extract predictions
  const mlPrediction = mlMatch.prediction.recommended;
  const valuePrediction = valueMatch.prediction.recommended;
  const statsPrediction = statsMatch.prediction.recommended;
  
  // Check consensus on the prediction direction
  let consensusCount = 0;
  const algorithmConsensus: Record<string, boolean> = {};
  
  // Check if ML Power Index agrees with the main prediction
  if (mlPrediction === match.prediction?.recommended) {
    consensusCount++;
    algorithmConsensus[ALGORITHM_IDS.ML_POWER_INDEX] = true;
  } else {
    algorithmConsensus[ALGORITHM_IDS.ML_POWER_INDEX] = false;
  }
  
  // Check if Value Pick Finder agrees with the main prediction
  if (valuePrediction === match.prediction?.recommended) {
    consensusCount++;
    algorithmConsensus[ALGORITHM_IDS.VALUE_PICK_FINDER] = true;
  } else {
    algorithmConsensus[ALGORITHM_IDS.VALUE_PICK_FINDER] = false;
  }
  
  // Check if Statistical Edge agrees with the main prediction
  if (statsPrediction === match.prediction?.recommended) {
    consensusCount++;
    algorithmConsensus[ALGORITHM_IDS.STATISTICAL_EDGE] = true;
  } else {
    algorithmConsensus[ALGORITHM_IDS.STATISTICAL_EDGE] = false;
  }
  
  // Calculate agreement rate
  const agreementRate = consensusCount / 3;
  
  // Determine agreement level
  let agreementLevel: 'high' | 'medium' | 'low' | 'conflicted';
  
  if (agreementRate === 1) {
    agreementLevel = 'high';
  } else if (agreementRate >= 0.66) {
    agreementLevel = 'medium';
  } else if (agreementRate === 0.33) {
    agreementLevel = 'low';
  } else {
    agreementLevel = 'conflicted';
  }
  
  // Calculate consensus score (0-100)
  const consensusScore = Math.round(agreementRate * 100);
  
  // Log the cross-validation results
  logger.log(`Cross-validation for match ${match.id}: ${agreementLevel} agreement (${consensusScore}%)`);
  
  return {
    consensusScore,
    agreementLevel,
    agreementRate,
    algorithmConsensus
  };
}

/**
 * Apply cross-validation to a collection of matches
 */
export function validateAlgorithms(
  matches: Match[],
  allAlgorithmResults: {
    mlPowerIndex: Match[];
    valuePickFinder: Match[];
    statisticalEdge: Match[];
  }
): Match[] {
  return matches.map(match => {
    const validationResult = crossValidateAlgorithms(match, allAlgorithmResults);
    
    // Add validation result to the match
    return {
      ...match,
      algorithmValidation: validationResult
    };
  });
}
