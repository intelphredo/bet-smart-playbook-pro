/**
 * Hook for managing calibration history - recording and fetching historical calibration data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useRef } from 'react';
import { getCalibrationSummary } from '@/utils/modelCalibration/calibrationIntegration';
import { getCachedBinCalibration, getBinCalibrationSummary } from '@/utils/modelCalibration/binCalibration';

export interface CalibrationHistoryRecord {
  id: string;
  recorded_at: string;
  brier_score: number | null;
  mean_absolute_error: number | null;
  is_well_calibrated: boolean;
  overall_adjustment_factor: number;
  total_bins: number;
  adjusted_bins: number;
  overconfident_bins: number;
  underconfident_bins: number;
  total_algorithms: number;
  adjusted_algorithms: number;
  paused_algorithms: number;
  avg_confidence_multiplier: number;
  total_predictions: number;
  settled_predictions: number;
  overall_health_score: number;
  bin_details: any;
  algorithm_details: any;
}

interface CalibrationSnapshot {
  brierScore: number;
  meanAbsoluteError: number;
  isWellCalibrated: boolean;
  overallAdjustmentFactor: number;
  totalBins: number;
  adjustedBins: number;
  overconfidentBins: number;
  underconfidentBins: number;
  totalAlgorithms: number;
  adjustedAlgorithms: number;
  pausedAlgorithms: number;
  avgConfidenceMultiplier: number;
  totalPredictions: number;
  settledPredictions: number;
  overallHealthScore: number;
  binDetails: any;
  algorithmDetails: any;
}

/**
 * Fetch calibration history for a given time range
 */
export function useCalibrationHistory(days: number = 30) {
  return useQuery({
    queryKey: ['calibrationHistory', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('calibration_history')
        .select('*')
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching calibration history:', error);
        throw error;
      }
      
      return data as CalibrationHistoryRecord[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Record a calibration snapshot
 */
export function useRecordCalibrationSnapshot() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (snapshot: CalibrationSnapshot) => {
      const { data, error } = await supabase
        .from('calibration_history')
        .insert({
          brier_score: snapshot.brierScore,
          mean_absolute_error: snapshot.meanAbsoluteError,
          is_well_calibrated: snapshot.isWellCalibrated,
          overall_adjustment_factor: snapshot.overallAdjustmentFactor,
          total_bins: snapshot.totalBins,
          adjusted_bins: snapshot.adjustedBins,
          overconfident_bins: snapshot.overconfidentBins,
          underconfident_bins: snapshot.underconfidentBins,
          total_algorithms: snapshot.totalAlgorithms,
          adjusted_algorithms: snapshot.adjustedAlgorithms,
          paused_algorithms: snapshot.pausedAlgorithms,
          avg_confidence_multiplier: snapshot.avgConfidenceMultiplier,
          total_predictions: snapshot.totalPredictions,
          settled_predictions: snapshot.settledPredictions,
          overall_health_score: snapshot.overallHealthScore,
          bin_details: snapshot.binDetails,
          algorithm_details: snapshot.algorithmDetails,
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error recording calibration snapshot:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calibrationHistory'] });
    },
  });
}

/**
 * Hook that automatically records calibration snapshots periodically
 */
export function useAutoRecordCalibration(enabled: boolean = true, intervalMinutes: number = 60) {
  const { mutate: recordSnapshot } = useRecordCalibrationSnapshot();
  const lastRecordedRef = useRef<Date | null>(null);
  
  useEffect(() => {
    if (!enabled) return;
    
    const checkAndRecord = async () => {
      const now = new Date();
      
      // Check if we should record (at least intervalMinutes since last record)
      if (lastRecordedRef.current) {
        const minutesSinceLastRecord = (now.getTime() - lastRecordedRef.current.getTime()) / (1000 * 60);
        if (minutesSinceLastRecord < intervalMinutes) {
          return;
        }
      }
      
      // Get current calibration state
      const summary = getCalibrationSummary();
      const binCalibration = getCachedBinCalibration();
      const binSummary = getBinCalibrationSummary();
      
      if (!summary.isActive && !binSummary.isActive) {
        return; // No calibration data to record
      }
      
      // Calculate metrics from bin calibration
      let overconfidentBins = 0;
      let underconfidentBins = 0;
      let brierScore = 0;
      let maeSum = 0;
      
      if (binCalibration) {
        overconfidentBins = binCalibration.bins.filter(b => b.isOverconfident).length;
        underconfidentBins = binCalibration.bins.filter(b => b.isUnderconfident).length;
        
        // Calculate approximate Brier score from bins
        const binsWithData = binCalibration.bins.filter(b => b.sampleSize > 0);
        if (binsWithData.length > 0) {
          for (const bin of binsWithData) {
            const prob = bin.expectedWinRate / 100;
            const actual = bin.actualWinRate / 100;
            brierScore += Math.pow(prob - actual, 2) * bin.sampleSize;
            maeSum += Math.abs(bin.calibrationError) * bin.sampleSize;
          }
          const totalSamples = binsWithData.reduce((sum, b) => sum + b.sampleSize, 0);
          brierScore = brierScore / totalSamples;
          maeSum = maeSum / totalSamples;
        }
      }
      
      // Calculate health score
      const healthScore = Math.round(
        50 + 
        (binSummary.isCalibrated ? 25 : -10) +
        (summary.pausedAlgorithms === 0 ? 15 : -15) +
        Math.min(10, (1 - Math.abs(binSummary.overallFactor - 1)) * 20)
      );
      
      const snapshot: CalibrationSnapshot = {
        brierScore: Math.round(brierScore * 10000) / 10000,
        meanAbsoluteError: Math.round(maeSum * 100) / 100,
        isWellCalibrated: binSummary.isCalibrated,
        overallAdjustmentFactor: binSummary.overallFactor,
        totalBins: binCalibration?.bins.length || 0,
        adjustedBins: binSummary.adjustedBinsCount,
        overconfidentBins,
        underconfidentBins,
        totalAlgorithms: 3,
        adjustedAlgorithms: summary.adjustedAlgorithms,
        pausedAlgorithms: summary.pausedAlgorithms,
        avgConfidenceMultiplier: summary.averageMultiplier,
        totalPredictions: binCalibration?.bins.reduce((sum, b) => sum + b.sampleSize, 0) || 0,
        settledPredictions: binCalibration?.bins.reduce((sum, b) => sum + b.sampleSize, 0) || 0,
        overallHealthScore: Math.max(0, Math.min(100, healthScore)),
        binDetails: binCalibration?.bins || [],
        algorithmDetails: null,
      };
      
      recordSnapshot(snapshot);
      lastRecordedRef.current = now;
      console.log('[CalibrationHistory] Recorded snapshot:', { healthScore, isCalibrated: binSummary.isCalibrated });
    };
    
    // Check immediately on mount
    const timeoutId = setTimeout(checkAndRecord, 5000);
    
    // Then check periodically
    const intervalId = setInterval(checkAndRecord, intervalMinutes * 60 * 1000);
    
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [enabled, intervalMinutes, recordSnapshot]);
}

/**
 * Get aggregated calibration trends
 */
export function useCalibrationTrends(days: number = 30) {
  const { data: history, isLoading } = useCalibrationHistory(days);
  
  if (isLoading || !history || history.length === 0) {
    return {
      isLoading,
      trends: null,
    };
  }
  
  // Calculate trends
  const recentRecords = history.slice(-7); // Last 7 records
  const olderRecords = history.slice(0, Math.max(0, history.length - 7));
  
  const avgRecent = (arr: CalibrationHistoryRecord[], key: keyof CalibrationHistoryRecord) => {
    const values = arr.map(r => r[key] as number).filter(v => v != null);
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  };
  
  const recentHealth = avgRecent(recentRecords, 'overall_health_score');
  const olderHealth = olderRecords.length > 0 ? avgRecent(olderRecords, 'overall_health_score') : recentHealth;
  
  const recentBrier = avgRecent(recentRecords, 'brier_score');
  const olderBrier = olderRecords.length > 0 ? avgRecent(olderRecords, 'brier_score') : recentBrier;
  
  const recentAdjusted = avgRecent(recentRecords, 'adjusted_bins');
  const olderAdjusted = olderRecords.length > 0 ? avgRecent(olderRecords, 'adjusted_bins') : recentAdjusted;
  
  return {
    isLoading: false,
    trends: {
      healthTrend: recentHealth - olderHealth,
      brierTrend: olderBrier - recentBrier, // Lower is better, so invert
      adjustedBinsTrend: olderAdjusted - recentAdjusted, // Fewer adjustments is better
      currentHealth: recentHealth,
      currentBrier: recentBrier,
      recordCount: history.length,
      isImproving: recentHealth > olderHealth,
    },
  };
}
