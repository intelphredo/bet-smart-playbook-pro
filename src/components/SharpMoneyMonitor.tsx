// Global Sharp Money Monitor - Runs in background and creates alerts

import { useEffect } from 'react';
import { useAllLeagueSharpAlerts } from '@/hooks/useSharpMoneyAlerts';
import { useAuth } from '@/hooks/useAuth';

export function SharpMoneyMonitor() {
  const { user } = useAuth();
  const { isMonitoring, totalSharpSignals, totalRlm } = useAllLeagueSharpAlerts(!!user);
  
  // Log monitoring status in dev
  useEffect(() => {
    if (isMonitoring && (totalSharpSignals > 0 || totalRlm > 0)) {
      console.log(`[SharpMoneyMonitor] Active - ${totalSharpSignals} sharp signals, ${totalRlm} RLM detected`);
    }
  }, [isMonitoring, totalSharpSignals, totalRlm]);
  
  // This component doesn't render anything - it just monitors in the background
  return null;
}

export default SharpMoneyMonitor;
