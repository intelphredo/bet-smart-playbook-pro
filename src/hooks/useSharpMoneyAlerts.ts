// Sharp Money Alert Hook - Monitors betting trends and creates alerts for sharp action

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBettingTrends } from '@/hooks/useBettingTrends';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BettingTrend, SharpSignal } from '@/types/bettingTrends';
import { League } from '@/types/sports';

interface AlertedSignal {
  matchId: string;
  signalType: string;
  timestamp: number;
}

// How long to wait before alerting on the same signal again (30 minutes)
const ALERT_COOLDOWN_MS = 30 * 60 * 1000;

export function useSharpMoneyAlerts(league: League, enabled: boolean = true) {
  const { user } = useAuth();
  const { data: trends } = useBettingTrends(league);
  const alertedSignalsRef = useRef<AlertedSignal[]>([]);
  
  // Check if we've already alerted on this signal recently
  const hasAlertedRecently = useCallback((matchId: string, signalType: string): boolean => {
    const now = Date.now();
    // Clean up old alerts
    alertedSignalsRef.current = alertedSignalsRef.current.filter(
      a => now - a.timestamp < ALERT_COOLDOWN_MS
    );
    
    return alertedSignalsRef.current.some(
      a => a.matchId === matchId && a.signalType === signalType
    );
  }, []);
  
  // Record that we alerted on this signal
  const recordAlert = useCallback((matchId: string, signalType: string) => {
    alertedSignalsRef.current.push({
      matchId,
      signalType,
      timestamp: Date.now(),
    });
  }, []);
  
  // Create an alert in the database
  const createAlert = useCallback(async (
    type: 'sharp_money' | 'reverse_line',
    title: string,
    message: string,
    matchId: string,
    metadata: Record<string, any>
  ) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_alerts')
        .insert({
          user_id: user.id,
          type,
          title,
          message,
          match_id: matchId,
          metadata,
          is_read: false,
        });
      
      if (error) {
        console.error('Error creating sharp money alert:', error);
      }
    } catch (err) {
      console.error('Error creating alert:', err);
    }
  }, [user]);
  
  // Monitor trends for sharp signals
  useEffect(() => {
    if (!enabled || !user || !trends || trends.length === 0) return;
    
    trends.forEach((trend) => {
      // Check for reverse line movement
      if (trend.lineMovement.reverseLineMovement) {
        const signalKey = `rlm-${trend.matchId}`;
        if (!hasAlertedRecently(trend.matchId, signalKey)) {
          const advantageTeam = trend.publicBetting.spreadHome > 55 
            ? trend.awayTeam 
            : trend.homeTeam;
          
          createAlert(
            'reverse_line',
            `🔥 Reverse Line Movement: ${trend.homeTeam.split(' ').pop()} vs ${trend.awayTeam.split(' ').pop()}`,
            `Line moving against ${Math.max(trend.publicBetting.spreadHome, trend.publicBetting.spreadAway).toFixed(0)}% public action. Sharp money may be on ${advantageTeam.split(' ').pop()}.`,
            trend.matchId,
            {
              homeTeam: trend.homeTeam,
              awayTeam: trend.awayTeam,
              publicHomePercent: trend.publicBetting.spreadHome,
              spreadMovement: trend.lineMovement.spreadMovement,
              league,
            }
          );
          
          recordAlert(trend.matchId, signalKey);
          
          // Toast notifications disabled - alerts saved to database only
        }
      }
      
      // Check for strong sharp signals
      const strongSignals = trend.sharpBetting.signals.filter(s => s.strength === 'strong');
      strongSignals.forEach((signal) => {
        const signalKey = `${signal.type}-${trend.matchId}`;
        if (!hasAlertedRecently(trend.matchId, signalKey)) {
          const signalLabel = signal.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          
          createAlert(
            'sharp_money',
            `🧠 Sharp Signal: ${signalLabel}`,
            `${signal.description} in ${trend.homeTeam.split(' ').pop()} vs ${trend.awayTeam.split(' ').pop()}. Confidence: ${trend.sharpBetting.confidence}%`,
            trend.matchId,
            {
              homeTeam: trend.homeTeam,
              awayTeam: trend.awayTeam,
              signalType: signal.type,
              signalSide: signal.side,
              signalStrength: signal.strength,
              confidence: trend.sharpBetting.confidence,
              league,
            }
          );
          
          recordAlert(trend.matchId, signalKey);
          
          // Toast notifications disabled - alerts saved to database only
        }
      });
    });
  }, [trends, user, enabled, hasAlertedRecently, recordAlert, createAlert, league]);
  
  return {
    isMonitoring: enabled && !!user,
    trendsCount: trends?.length || 0,
    sharpSignalsCount: trends?.filter(t => t.sharpBetting?.signals?.length > 0).length || 0,
    rlmCount: trends?.filter(t => t.lineMovement?.reverseLineMovement).length || 0,
  };
}

// Hook to monitor all leagues for sharp money
export function useAllLeagueSharpAlerts(enabled: boolean = true) {
  const nba = useSharpMoneyAlerts('NBA', enabled);
  const nfl = useSharpMoneyAlerts('NFL', enabled);
  const mlb = useSharpMoneyAlerts('MLB', enabled);
  const nhl = useSharpMoneyAlerts('NHL', enabled);
  
  return {
    isMonitoring: enabled,
    totalSharpSignals: nba.sharpSignalsCount + nfl.sharpSignalsCount + mlb.sharpSignalsCount + nhl.sharpSignalsCount,
    totalRlm: nba.rlmCount + nfl.rlmCount + mlb.rlmCount + nhl.rlmCount,
  };
}
