/**
 * Service Layer - Prediction Service
 * 
 * Orchestrates between data layer and domain logic.
 * This is the main entry point for the presentation layer.
 */

import { Match, League } from "@/types/sports";
import { 
  PredictionResult, 
  EnhancedMatch,
  MatchData,
  PredictionContext,
  HistoricalMatchupData,
} from "@/domain/prediction/interfaces";
import { 
  createPredictionEngine, 
  ALGORITHM_IDS,
  ALGORITHM_REGISTRY,
} from "@/domain/prediction/algorithms";
import { BasePredictionEngine } from "@/domain/prediction/engine";
import { MatchRepository, mapMatchToMatchData, mapMatchDataToMatch } from "@/data/repositories/matchRepository";
import { PredictionRepository } from "@/data/repositories/predictionRepository";

// ============================================
// Service Configuration
// ============================================

interface PredictionServiceConfig {
  defaultAlgorithm?: string;
  cacheEnabled?: boolean;
  persistToDatabase?: boolean;
}

// ============================================
// Prediction Service
// ============================================

export class PredictionService {
  private engines: Map<string, BasePredictionEngine> = new Map();
  private predictionRepo: PredictionRepository;
  private config: PredictionServiceConfig;

  constructor(config: PredictionServiceConfig = {}) {
    this.config = {
      defaultAlgorithm: ALGORITHM_IDS.ML_POWER_INDEX,
      cacheEnabled: true,
      persistToDatabase: false,
      ...config,
    };

    this.predictionRepo = new PredictionRepository({
      useDatabase: this.config.persistToDatabase,
    });

    // Pre-initialize common engines
    this.getEngine(ALGORITHM_IDS.ML_POWER_INDEX);
    this.getEngine(ALGORITHM_IDS.VALUE_PICK_FINDER);
    this.getEngine(ALGORITHM_IDS.STATISTICAL_EDGE);
  }

  /**
   * Get or create a prediction engine
   */
  private getEngine(algorithmId: string): BasePredictionEngine {
    if (!this.engines.has(algorithmId)) {
      this.engines.set(algorithmId, createPredictionEngine(algorithmId));
    }
    return this.engines.get(algorithmId)!;
  }

  /**
   * Generate prediction for a single match
   */
  async predict(
    match: Match,
    algorithmId?: string,
    context?: PredictionContext
  ): Promise<PredictionResult> {
    const engine = this.getEngine(algorithmId ?? this.config.defaultAlgorithm!);
    const matchData = mapMatchToMatchData(match);

    // Check cache first
    if (this.config.cacheEnabled) {
      const cached = await this.predictionRepo.getByMatchId(match.id);
      if (cached && cached.algorithmId === engine.algorithmId) {
        return cached;
      }
    }

    // Generate prediction
    const prediction = engine.predict(matchData, context);

    // Cache the result
    if (this.config.cacheEnabled) {
      await this.predictionRepo.save(prediction);
    }

    return prediction;
  }

  /**
   * Generate predictions for multiple matches
   */
  async predictBatch(
    matches: Match[],
    algorithmId?: string,
    context?: PredictionContext
  ): Promise<Map<string, PredictionResult>> {
    const engine = this.getEngine(algorithmId ?? this.config.defaultAlgorithm!);
    const results = new Map<string, PredictionResult>();

    // Check cache for existing predictions
    if (this.config.cacheEnabled) {
      const matchIds = matches.map(m => m.id);
      const cached = await this.predictionRepo.getByMatchIds(matchIds);
      cached.forEach((prediction, id) => {
        if (prediction.algorithmId === engine.algorithmId) {
          results.set(id, prediction);
        }
      });
    }

    // Generate predictions for uncached matches
    const uncachedMatches = matches.filter(m => !results.has(m.id));
    if (uncachedMatches.length > 0) {
      const matchDataList = uncachedMatches.map(mapMatchToMatchData);
      const newPredictions = engine.predictBatch(matchDataList, context);

      newPredictions.forEach(prediction => {
        results.set(prediction.matchId, prediction);
      });

      // Cache new predictions
      if (this.config.cacheEnabled) {
        await this.predictionRepo.saveBatch(newPredictions);
      }
    }

    return results;
  }

  /**
   * Enhance matches with predictions
   */
  async enhanceMatches(
    matches: Match[],
    algorithmId?: string
  ): Promise<Match[]> {
    const predictions = await this.predictBatch(matches, algorithmId);

    return matches.map(match => {
      const prediction = predictions.get(match.id);
      if (!prediction) return match;

      return {
        ...match,
        prediction: {
          recommended: prediction.recommended,
          confidence: prediction.confidence,
          projectedScore: prediction.projectedScore,
          trueProbability: prediction.trueProbability,
          impliedOdds: prediction.impliedOdds,
          expectedValue: prediction.expectedValue,
          evPercentage: prediction.evPercentage,
          kellyFraction: prediction.kellyFraction,
          kellyStakeUnits: prediction.kellyStakeUnits,
        },
      } as Match;
    });
  }

  /**
   * Get predictions from all algorithms for comparison
   */
  async getAllAlgorithmPredictions(
    match: Match
  ): Promise<Map<string, PredictionResult>> {
    const results = new Map<string, PredictionResult>();
    const matchData = mapMatchToMatchData(match);

    for (const algo of ALGORITHM_REGISTRY) {
      const engine = this.getEngine(algo.id);
      const prediction = engine.predict(matchData);
      results.set(algo.id, prediction);
    }

    return results;
  }

  /**
   * Get consensus prediction from all algorithms
   */
  async getConsensusPrediction(match: Match): Promise<PredictionResult> {
    const allPredictions = await this.getAllAlgorithmPredictions(match);
    
    let homeVotes = 0;
    let awayVotes = 0;
    let totalConfidence = 0;
    let totalHomeScore = 0;
    let totalAwayScore = 0;

    allPredictions.forEach(prediction => {
      if (prediction.recommended === 'home') homeVotes++;
      if (prediction.recommended === 'away') awayVotes++;
      totalConfidence += prediction.confidence;
      totalHomeScore += prediction.projectedScore.home;
      totalAwayScore += prediction.projectedScore.away;
    });

    const count = allPredictions.size;
    const recommended = homeVotes > awayVotes ? 'home' : 'away';
    const avgConfidence = totalConfidence / count;

    return {
      matchId: match.id,
      recommended,
      confidence: Math.round(avgConfidence),
      trueProbability: avgConfidence / 100,
      projectedScore: {
        home: Math.round(totalHomeScore / count * 10) / 10,
        away: Math.round(totalAwayScore / count * 10) / 10,
      },
      impliedOdds: 100 / avgConfidence,
      expectedValue: 0, // Would need odds to calculate
      evPercentage: 0,
      kellyFraction: 0,
      kellyStakeUnits: 0,
      factors: {} as any,
      algorithmId: 'consensus',
      algorithmName: 'Consensus',
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get available algorithms
   */
  getAlgorithms() {
    return ALGORITHM_REGISTRY;
  }

  /**
   * Clear prediction cache
   */
  clearCache(): void {
    this.predictionRepo.clearCache();
  }
}

// ============================================
// Singleton Instance
// ============================================

let serviceInstance: PredictionService | null = null;

export function getPredictionService(config?: PredictionServiceConfig): PredictionService {
  if (!serviceInstance) {
    serviceInstance = new PredictionService(config);
  }
  return serviceInstance;
}

export function resetPredictionService(): void {
  serviceInstance = null;
}

export default PredictionService;
