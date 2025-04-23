
import { Match } from "@/types/sports";
import { applyMLPowerIndexPredictions } from "./mlPowerIndex";
import { applyValuePickPredictions } from "./valuePickFinder";
import { applyStatisticalEdgePredictions } from "./statisticalEdge";

/**
 * Algorithm types and their unique identifiers
 */
export const ALGORITHM_IDS = {
  ML_POWER_INDEX: "f4ce9fdc-c41a-4a5c-9f18-5d732674c5b8",
  VALUE_PICK_FINDER: "3a7e2d9b-8c5f-4b1f-9e17-7b31a4dce6c2", 
  STATISTICAL_EDGE: "85c48bbe-5b1a-4c1e-a0d5-e284e9e952f1"
};

export type AlgorithmType = 'ML_POWER_INDEX' | 'VALUE_PICK_FINDER' | 'STATISTICAL_EDGE';

/**
 * Applies all algorithm predictions to the provided matches
 * Returns an object with each algorithm's predictions in a separate array
 */
export function applyAllAlgorithmPredictions(matches: Match[]): {
  mlPowerIndex: Match[];
  valuePickFinder: Match[];
  statisticalEdge: Match[];
} {
  return {
    mlPowerIndex: applyMLPowerIndexPredictions(matches),
    valuePickFinder: applyValuePickPredictions(matches),
    statisticalEdge: applyStatisticalEdgePredictions(matches)
  };
}

/**
 * Applies a specific algorithm's predictions to the provided matches
 */
export function applyAlgorithmPredictions(matches: Match[], algorithmType: AlgorithmType): Match[] {
  switch (algorithmType) {
    case 'ML_POWER_INDEX':
      return applyMLPowerIndexPredictions(matches);
    case 'VALUE_PICK_FINDER':
      return applyValuePickPredictions(matches);
    case 'STATISTICAL_EDGE':
      return applyStatisticalEdgePredictions(matches);
    default:
      return matches;
  }
}

/**
 * Helper function to get algorithm name from ID
 */
export function getAlgorithmNameFromId(id: string): string {
  switch (id) {
    case ALGORITHM_IDS.ML_POWER_INDEX:
      return "ML Power Index";
    case ALGORITHM_IDS.VALUE_PICK_FINDER:
      return "Value Pick Finder";
    case ALGORITHM_IDS.STATISTICAL_EDGE:
      return "Statistical Edge";
    default:
      return "Unknown Algorithm";
  }
}

/**
 * Helper function to get algorithm description from ID
 */
export function getAlgorithmDescriptionFromId(id: string): string {
  switch (id) {
    case ALGORITHM_IDS.ML_POWER_INDEX:
      return "Machine learning algorithm that analyzes historical data, player stats, and team performance trends to predict match outcomes with advanced statistical modeling.";
    case ALGORITHM_IDS.VALUE_PICK_FINDER:
      return "Specialized algorithm that focuses on finding betting value through odds analysis, line movements, and market inefficiencies to identify the most profitable opportunities.";
    case ALGORITHM_IDS.STATISTICAL_EDGE:
      return "Pure statistics-based algorithm that considers situational spots, weather impacts, injuries, and matchup advantages to find edges in the betting markets.";
    default:
      return "Algorithm details not available.";
  }
}
