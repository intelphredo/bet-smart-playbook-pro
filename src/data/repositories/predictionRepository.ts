/**
 * Data Layer - Prediction Repository
 * 
 * Handles prediction storage with in-memory cache and optional database persistence.
 */

import { PredictionResult, IPredictionRepository } from "@/domain/prediction/interfaces";
import { supabase } from "@/integrations/supabase/client";

// ============================================
// In-Memory Prediction Cache
// ============================================

interface CachedPrediction {
  prediction: PredictionResult;
  timestamp: number;
  ttl: number;
}

const predictionCache = new Map<string, CachedPrediction>();
const DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes

// ============================================
// Prediction Repository Implementation
// ============================================

export class PredictionRepository implements IPredictionRepository {
  private useDatabase: boolean;

  constructor(options?: { useDatabase?: boolean }) {
    this.useDatabase = options?.useDatabase ?? false;
  }

  async save(prediction: PredictionResult): Promise<void> {
    // Always cache in memory
    predictionCache.set(prediction.matchId, {
      prediction,
      timestamp: Date.now(),
      ttl: DEFAULT_TTL,
    });

    // Optionally persist to database
    if (this.useDatabase) {
      await this.persistToDatabase(prediction);
    }
  }

  async saveBatch(predictions: PredictionResult[]): Promise<void> {
    const now = Date.now();
    
    // Cache all in memory
    predictions.forEach(prediction => {
      predictionCache.set(prediction.matchId, {
        prediction,
        timestamp: now,
        ttl: DEFAULT_TTL,
      });
    });

    // Batch persist to database
    if (this.useDatabase && predictions.length > 0) {
      await this.persistBatchToDatabase(predictions);
    }
  }

  async getByMatchId(matchId: string): Promise<PredictionResult | null> {
    // Check memory cache first
    const cached = predictionCache.get(matchId);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.prediction;
    }

    // Fall back to database
    if (this.useDatabase) {
      return this.fetchFromDatabase(matchId);
    }

    return null;
  }

  async getByMatchIds(matchIds: string[]): Promise<Map<string, PredictionResult>> {
    const results = new Map<string, PredictionResult>();
    const now = Date.now();
    const missingIds: string[] = [];

    // Check memory cache
    matchIds.forEach(id => {
      const cached = predictionCache.get(id);
      if (cached && now - cached.timestamp < cached.ttl) {
        results.set(id, cached.prediction);
      } else {
        missingIds.push(id);
      }
    });

    // Fetch missing from database
    if (this.useDatabase && missingIds.length > 0) {
      const dbResults = await this.fetchBatchFromDatabase(missingIds);
      dbResults.forEach((prediction, id) => {
        results.set(id, prediction);
        // Cache the fetched results
        predictionCache.set(id, {
          prediction,
          timestamp: now,
          ttl: DEFAULT_TTL,
        });
      });
    }

    return results;
  }

  async getByAlgorithm(algorithmId: string, limit: number = 100): Promise<PredictionResult[]> {
    if (!this.useDatabase) {
      // Return from memory cache
      return Array.from(predictionCache.values())
        .filter(c => c.prediction.algorithmId === algorithmId)
        .slice(0, limit)
        .map(c => c.prediction);
    }

    try {
      const { data, error } = await supabase
        .from('algorithm_predictions')
        .select('*')
        .eq('algorithm_id', algorithmId)
        .order('predicted_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []).map(this.mapDatabaseToPrediction);
    } catch (error) {
      console.error('[PredictionRepository] Error fetching by algorithm:', error);
      return [];
    }
  }

  // ============================================
  // Database Operations
  // ============================================

  private async persistToDatabase(prediction: PredictionResult): Promise<void> {
    try {
      const { error } = await supabase
        .from('algorithm_predictions')
        .upsert({
          match_id: prediction.matchId,
          algorithm_id: prediction.algorithmId,
          prediction: prediction.recommended,
          confidence: prediction.confidence,
          projected_score_home: prediction.projectedScore.home,
          projected_score_away: prediction.projectedScore.away,
          status: 'pending',
          predicted_at: prediction.generatedAt,
        }, {
          onConflict: 'match_id,algorithm_id',
        });

      if (error) throw error;
    } catch (error) {
      console.error('[PredictionRepository] Error persisting prediction:', error);
    }
  }

  private async persistBatchToDatabase(predictions: PredictionResult[]): Promise<void> {
    try {
      const records = predictions.map(p => ({
        match_id: p.matchId,
        algorithm_id: p.algorithmId,
        prediction: p.recommended,
        confidence: p.confidence,
        projected_score_home: p.projectedScore.home,
        projected_score_away: p.projectedScore.away,
        status: 'pending',
        predicted_at: p.generatedAt,
      }));

      const { error } = await supabase
        .from('algorithm_predictions')
        .upsert(records, {
          onConflict: 'match_id,algorithm_id',
        });

      if (error) throw error;
    } catch (error) {
      console.error('[PredictionRepository] Error batch persisting:', error);
    }
  }

  private async fetchFromDatabase(matchId: string): Promise<PredictionResult | null> {
    try {
      const { data, error } = await supabase
        .from('algorithm_predictions')
        .select('*')
        .eq('match_id', matchId)
        .order('predicted_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;
      return this.mapDatabaseToPrediction(data);
    } catch {
      return null;
    }
  }

  private async fetchBatchFromDatabase(matchIds: string[]): Promise<Map<string, PredictionResult>> {
    const results = new Map<string, PredictionResult>();
    
    try {
      const { data, error } = await supabase
        .from('algorithm_predictions')
        .select('*')
        .in('match_id', matchIds);

      if (error || !data) return results;

      data.forEach(row => {
        results.set(row.match_id, this.mapDatabaseToPrediction(row));
      });
    } catch (error) {
      console.error('[PredictionRepository] Error batch fetching:', error);
    }

    return results;
  }

  private mapDatabaseToPrediction(row: any): PredictionResult {
    return {
      matchId: row.match_id,
      recommended: row.prediction as 'home' | 'away' | 'draw' | 'skip',
      confidence: row.confidence ?? 50,
      trueProbability: (row.confidence ?? 50) / 100,
      projectedScore: {
        home: row.projected_score_home ?? 0,
        away: row.projected_score_away ?? 0,
      },
      impliedOdds: 100 / (row.confidence ?? 50),
      expectedValue: 0,
      evPercentage: 0,
      kellyFraction: 0,
      kellyStakeUnits: 0,
      factors: {} as any,
      algorithmId: row.algorithm_id,
      algorithmName: '',
      generatedAt: row.predicted_at,
    };
  }

  // ============================================
  // Cache Management
  // ============================================

  clearCache(): void {
    predictionCache.clear();
  }

  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: predictionCache.size,
      hitRate: 0, // Would need to track hits/misses
    };
  }
}

export default PredictionRepository;
