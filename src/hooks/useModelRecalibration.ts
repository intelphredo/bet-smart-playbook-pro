/**
 * Hook for automatic model recalibration based on backtest performance
 */

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { subDays, startOfDay } from 'date-fns';
import { fetchAllPredictions } from '@/utils/fetchAllPredictions';
import { getAlgorithmNameFromId, ALGORITHM_IDS } from '@/utils/predictions/algorithms';
import { 
  analyzeAlgorithmPerformance, 
  calculateAlgorithmHealthScore,
} from '@/utils/modelCalibration/performanceAnalyzer';
import { calculateModelWeights } from '@/utils/modelCalibration/weightAdjuster';
import { updateCachedWeights } from '@/utils/modelCalibration/calibrationIntegration';
import { updateBinCalibration } from '@/utils/modelCalibration/binCalibration';
import { 
  RecalibrationResult, 
  CalibrationConfig,
  DEFAULT_CALIBRATION_CONFIG,
  AlgorithmPerformanceWindow,
  ModelWeight,
} from '@/utils/modelCalibration/types';
import type { HistoricalPrediction } from '@/hooks/useHistoricalPredictions';

interface UseModelRecalibrationOptions {
  config?: Partial<CalibrationConfig>;
  enabled?: boolean;
}

export function useModelRecalibration(options: UseModelRecalibrationOptions = {}) {
  const { config: userConfig, enabled = true } = options;
  const config: CalibrationConfig = { ...DEFAULT_CALIBRATION_CONFIG, ...userConfig };

  const query = useQuery({
    queryKey: ['modelRecalibration', config.shortTermDays, config.mediumTermDays],
    queryFn: async (): Promise<RecalibrationResult> => {
      // Fetch predictions for the analysis window
      const startDate = startOfDay(subDays(new Date(), config.longTermDays)).toISOString();
      
      const predictions = await fetchAllPredictions({
        startDate,
        excludeNullPrediction: true,
      });

      // Update bin-level calibration with all predictions
      const historicalPredictions: HistoricalPrediction[] = (predictions || []).map(p => ({
        id: p.id,
        match_id: p.match_id,
        match_title: p.match_title || undefined,
        home_team: p.home_team || undefined,
        away_team: p.away_team || undefined,
        league: p.league,
        algorithm_id: p.algorithm_id,
        prediction: p.prediction,
        confidence: p.confidence,
        predicted_at: p.predicted_at,
        status: p.status as 'won' | 'lost' | 'pending' | 'push',
        projected_score_home: p.projected_score_home,
        projected_score_away: p.projected_score_away,
        actual_score_home: p.actual_score_home,
        actual_score_away: p.actual_score_away,
        accuracy_rating: p.accuracy_rating,
        result_updated_at: p.result_updated_at,
        is_live_prediction: p.is_live_prediction || undefined,
      }));
      
      // Update bin calibration for real-time adjustments
      updateBinCalibration(historicalPredictions);

      // Analyze each algorithm's performance
      const algorithmIds = Object.values(ALGORITHM_IDS);
      const performances: AlgorithmPerformanceWindow[] = [];

      for (const algorithmId of algorithmIds) {
        const algPredictions = (predictions || [])
          .filter(p => p.algorithm_id === algorithmId)
          .map(p => ({
            algorithmId: p.algorithm_id || '',
            algorithmName: getAlgorithmNameFromId(p.algorithm_id || ''),
            confidence: p.confidence || 0,
            status: p.status as 'won' | 'lost' | 'pending',
            predictedAt: p.predicted_at,
          }));

        // Analyze short-term performance (most weight for recalibration)
        const shortTermCutoff = subDays(new Date(), config.shortTermDays);
        const shortTermPreds = algPredictions.filter(
          p => new Date(p.predictedAt) >= shortTermCutoff
        );

        const performance = analyzeAlgorithmPerformance(
          algorithmId,
          getAlgorithmNameFromId(algorithmId),
          shortTermPreds,
          config.shortTermDays,
          config
        );

        performances.push(performance);
      }

      // Calculate adjusted weights based on performance
      const { weights, actions, recommendations } = calculateModelWeights(performances, config);

      // Calculate overall health score
      const healthScores = performances.map(p => calculateAlgorithmHealthScore(p));
      const overallHealthScore = healthScores.length > 0
        ? Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length)
        : 50;

      return {
        timestamp: new Date(),
        windowDays: config.shortTermDays,
        algorithmPerformance: performances,
        modelWeights: weights,
        recommendations,
        overallHealthScore,
        actionsTaken: actions,
      };
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 15 * 60 * 1000, // 15 minutes
  });

  // Update the cached weights whenever we get new data
  useEffect(() => {
    if (query.data?.modelWeights) {
      updateCachedWeights(query.data.modelWeights);
    }
  }, [query.data?.modelWeights]);

  return query;
}

/**
 * Get cached model weights for use in prediction calculations
 */
export function useModelWeights(): ModelWeight[] | undefined {
  const { data } = useModelRecalibration({ enabled: true });
  return data?.modelWeights;
}

/**
 * Check if a specific algorithm should be trusted based on recent performance
 */
export function useAlgorithmTrust(algorithmId: string) {
  const { data, isLoading } = useModelRecalibration({ enabled: true });
  
  if (isLoading || !data) {
    return { trusted: true, weight: 0.33, confidenceMultiplier: 1.0, isLoading };
  }
  
  const weight = data.modelWeights.find(w => w.algorithmId === algorithmId);
  const performance = data.algorithmPerformance.find(p => p.algorithmId === algorithmId);
  
  return {
    trusted: weight ? weight.adjustedWeight > 0.1 : true,
    weight: weight?.adjustedWeight || 0.33,
    confidenceMultiplier: weight?.confidenceMultiplier || 1.0,
    minConfidence: weight?.minConfidenceThreshold || 55,
    healthScore: performance ? calculateAlgorithmHealthScore(performance) : 50,
    isLoading: false,
  };
}
