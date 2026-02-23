// Hook that integrates the intelligent notification engine with the app
// Runs detection loops and saves alerts to database based on user preferences

import { useEffect, useRef, useCallback } from 'react';
import { Match } from '@/types/sports';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/usePreferences';
import {
  detectSteamMoves,
  detectSharpMoney,
  detectAIConfidenceCrossings,
  detectValueDrops,
  generateDailyBriefing,
  saveIntelligentAlert,
  filterAlertsByPreferences,
  IntelligentAlert,
} from './useIntelligentNotifications';

interface UseIntelligentAlertsOptions {
  matches: Match[];
  enabled?: boolean;
}

export function useIntelligentAlerts({ matches, enabled = true }: UseIntelligentAlertsOptions) {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const previousOddsRef = useRef(new Map<string, { homeWin: number; awayWin: number; timestamp: number }>());
  const previousConfidenceRef = useRef(new Map<string, number>());
  const alertedIdsRef = useRef(new Set<string>());
  const lastBriefingRef = useRef<string>('');
  const lastScanRef = useRef(0);

  const runDetection = useCallback(() => {
    if (!enabled || !user || matches.length === 0) return;

    const now = Date.now();
    // Only scan every 2 minutes
    if (now - lastScanRef.current < 2 * 60 * 1000) return;
    lastScanRef.current = now;

    const allAlerts: IntelligentAlert[] = [];

    // 1. Steam Moves
    const steamAlerts = detectSteamMoves(matches, previousOddsRef.current);
    allAlerts.push(...steamAlerts);

    // 2. Sharp Money
    const sharpAlerts = detectSharpMoney(matches);
    allAlerts.push(...sharpAlerts);

    // 3. AI Confidence Crossings
    const confidenceAlerts = detectAIConfidenceCrossings(matches, previousConfidenceRef.current);
    allAlerts.push(...confidenceAlerts);

    // 4. Value Drops
    const valueAlerts = detectValueDrops(matches);
    allAlerts.push(...valueAlerts);

    // 5. Daily Briefing (once per day)
    const today = new Date().toDateString();
    if (lastBriefingRef.current !== today) {
      const briefing = generateDailyBriefing(matches);
      if (briefing) {
        allAlerts.push(briefing);
        lastBriefingRef.current = today;
      }
    }

    // Filter by user preferences
    const filtered = filterAlertsByPreferences(allAlerts, preferences.notifications);

    // Deduplicate - don't send same alert ID twice
    const newAlerts = filtered.filter(a => !alertedIdsRef.current.has(a.id));

    // Save new alerts to database
    newAlerts.forEach(alert => {
      alertedIdsRef.current.add(alert.id);
      saveIntelligentAlert(alert, user.id);
    });

    // Update snapshots for next comparison
    matches.forEach(match => {
      previousOddsRef.current.set(match.id, {
        homeWin: match.odds?.homeWin || 0,
        awayWin: match.odds?.awayWin || 0,
        timestamp: now,
      });
      previousConfidenceRef.current.set(match.id, match.prediction?.confidence || 0);
    });

    // Clean old alert IDs (keep last 500)
    if (alertedIdsRef.current.size > 500) {
      const arr = Array.from(alertedIdsRef.current);
      alertedIdsRef.current = new Set(arr.slice(-250));
    }
  }, [enabled, user, matches, preferences.notifications]);

  useEffect(() => {
    if (!enabled || !user) return;

    // Initial scan after delay
    const timeout = setTimeout(runDetection, 5000);

    // Periodic scan
    const interval = setInterval(runDetection, 60 * 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [enabled, user, runDetection]);
}
