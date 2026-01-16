/**
 * Provider component that initializes the model calibration system
 * This should be placed high in the component tree to ensure
 * calibration weights are loaded early and available for predictions
 */

import { useEffect } from 'react';
import { useModelRecalibration } from '@/hooks/useModelRecalibration';
import { useAutoRecordCalibration } from '@/hooks/useCalibrationHistory';
import { getCalibrationSummary } from '@/utils/modelCalibration/calibrationIntegration';

interface CalibrationProviderProps {
  children: React.ReactNode;
}

export function CalibrationProvider({ children }: CalibrationProviderProps) {
  // Initialize the recalibration system - this will fetch data and update cached weights
  const { data, isLoading, error } = useModelRecalibration({ enabled: true });
  
  // Auto-record calibration snapshots every hour
  useAutoRecordCalibration(!!data, 60);

  useEffect(() => {
    if (data) {
      const summary = getCalibrationSummary();
      if (summary.isActive) {
        console.log('[CalibrationProvider] Calibration active:', {
          adjustedAlgorithms: summary.adjustedAlgorithms,
          pausedAlgorithms: summary.pausedAlgorithms,
          averageMultiplier: summary.averageMultiplier.toFixed(2),
          binCalibration: summary.binCalibration,
        });
      }
    }
  }, [data]);

  // Just render children - the useModelRecalibration hook handles updating the cache
  return <>{children}</>;
}

export default CalibrationProvider;
