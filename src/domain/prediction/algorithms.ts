/**
 * Domain Layer - Algorithm Implementations
 * 
 * Specific prediction algorithms that extend the base engine.
 * Each algorithm has its own weights and logic.
 */

import { MatchData, PredictionContext, PredictionFactors, PredictionResult } from "./interfaces";
import { BasePredictionEngine, calculateTeamStrengthMetrics } from "./engine";

// ============================================
// Algorithm IDs (for database consistency)
// ============================================

export const ALGORITHM_IDS = {
  ML_POWER_INDEX: "f4ce9fdc-c41a-4a5c-9f18-5d732674c5b8",
  VALUE_PICK_FINDER: "3a7e2d9b-8c5f-4b1f-9e17-7b31a4dce6c2",
  STATISTICAL_EDGE: "85c48bbe-5b1a-4c1e-a0d5-e284e9e952f1",
  SHARP_MONEY: "d7f3e8a2-9b4c-4e1a-8f5d-6c2b1a0e9d8f",
} as const;

export type AlgorithmId = typeof ALGORITHM_IDS[keyof typeof ALGORITHM_IDS];

// ============================================
// ML Power Index Algorithm
// ============================================

export class MLPowerIndexEngine extends BasePredictionEngine {
  constructor() {
    super({
      id: ALGORITHM_IDS.ML_POWER_INDEX,
      name: "ML Power Index",
      description: "Machine learning algorithm analyzing historical data and performance trends",
      version: "2.0.0",
      weights: {
        teamStrength: 0.35,
        homeAdvantage: 0.12,
        momentum: 0.25,
        historical: 0.18,
        injuries: 0.05,
        weather: 0.05,
      },
      thresholds: {
        minConfidence: 42,
        skipThreshold: 48,
        highValueThreshold: 68,
      },
    });
  }

  protected calculateConfidence(factors: PredictionFactors): number {
    let confidence = super.calculateConfidence(factors);
    
    // ML Power Index gives extra weight to momentum trends
    const momentumBonus = Math.abs(factors.momentum.differential) > 20 ? 3 : 0;
    confidence += momentumBonus;
    
    return Math.max(this.config.thresholds.minConfidence, Math.min(88, confidence));
  }
}

// ============================================
// Value Pick Finder Algorithm
// ============================================

export class ValuePickFinderEngine extends BasePredictionEngine {
  constructor() {
    super({
      id: ALGORITHM_IDS.VALUE_PICK_FINDER,
      name: "Value Pick Finder",
      description: "Focuses on odds analysis and market inefficiencies for value betting",
      version: "2.0.0",
      weights: {
        teamStrength: 0.25,
        homeAdvantage: 0.10,
        momentum: 0.15,
        historical: 0.10,
        injuries: 0.15,
        weather: 0.25, // Higher weight on situational factors
      },
      thresholds: {
        minConfidence: 45,
        skipThreshold: 50,
        highValueThreshold: 62, // Lower threshold for "value" plays
      },
    });
  }

  predict(match: MatchData, context?: PredictionContext): PredictionResult {
    const result = super.predict(match, context);
    
    // Value finder prioritizes EV over raw confidence
    if (result.evPercentage > 5) {
      // Boost recommendation for high EV plays
      result.confidence = Math.min(85, result.confidence + 5);
    }
    
    return result;
  }
}

// ============================================
// Statistical Edge Algorithm
// ============================================

export class StatisticalEdgeEngine extends BasePredictionEngine {
  constructor() {
    super({
      id: ALGORITHM_IDS.STATISTICAL_EDGE,
      name: "Statistical Edge",
      description: "Pure statistics-based algorithm focusing on situational advantages",
      version: "2.0.0",
      weights: {
        teamStrength: 0.30,
        homeAdvantage: 0.20,
        momentum: 0.15,
        historical: 0.25, // Higher weight on historical matchups
        injuries: 0.05,
        weather: 0.05,
      },
      thresholds: {
        minConfidence: 40,
        skipThreshold: 46,
        highValueThreshold: 70,
      },
    });
  }

  protected calculateFactors(match: MatchData, context?: PredictionContext): PredictionFactors {
    const factors = super.calculateFactors(match, context);
    
    // Statistical Edge emphasizes historical patterns
    if (factors.historical && factors.historical.data.totalGames >= 5) {
      factors.historical.impact *= 1.5; // Boost historical impact for larger samples
    }
    
    return factors;
  }
}

// ============================================
// Factory Function
// ============================================

export function createPredictionEngine(algorithmId: string): BasePredictionEngine {
  switch (algorithmId) {
    case ALGORITHM_IDS.ML_POWER_INDEX:
      return new MLPowerIndexEngine();
    case ALGORITHM_IDS.VALUE_PICK_FINDER:
      return new ValuePickFinderEngine();
    case ALGORITHM_IDS.STATISTICAL_EDGE:
      return new StatisticalEdgeEngine();
    default:
      return new BasePredictionEngine({
        id: algorithmId,
        name: "Default Algorithm",
      });
  }
}

// ============================================
// Algorithm Registry
// ============================================

export const ALGORITHM_REGISTRY = [
  {
    id: ALGORITHM_IDS.ML_POWER_INDEX,
    name: "ML Power Index",
    description: "Machine learning algorithm that analyzes historical data, player stats, and team performance trends.",
    icon: "brain",
  },
  {
    id: ALGORITHM_IDS.VALUE_PICK_FINDER,
    name: "Value Pick Finder",
    description: "Specialized algorithm finding betting value through odds analysis and market inefficiencies.",
    icon: "target",
  },
  {
    id: ALGORITHM_IDS.STATISTICAL_EDGE,
    name: "Statistical Edge",
    description: "Pure statistics-based algorithm using situational spots, weather, and matchup data.",
    icon: "chart",
  },
] as const;

export default {
  ALGORITHM_IDS,
  ALGORITHM_REGISTRY,
  createPredictionEngine,
  MLPowerIndexEngine,
  ValuePickFinderEngine,
  StatisticalEdgeEngine,
};
