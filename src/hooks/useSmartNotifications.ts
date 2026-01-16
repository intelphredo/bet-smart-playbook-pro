// Smart Notification System (24/2) - Scans next 24 hours for critical alerts
// Pushes maximum 2 alerts per user for high-priority opportunities
// Includes major injury detection for line-moving news

import { useState, useEffect, useCallback, useRef } from 'react';
import { Match } from '@/types/sports';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { parseISO, addHours, isWithinInterval } from 'date-fns';
import { useInjuryMonitor, MajorInjuryAlert } from './useInjuryMonitor';

export interface SmartAlert {
  id: string;
  type: 'value_threshold' | 'major_injury' | 'steam_move' | 'closing_line_value';
  priority: 'critical' | 'high' | 'medium';
  match: Match;
  title: string;
  message: string;
  timestamp: Date;
  silent?: boolean; // If true, alert is tracked but no toast notification shown
  injuryData?: {
    playerName: string;
    position: string;
    team: string;
    status: string;
    estimatedSpreadShift: number;
  };
}

interface UseSmartNotificationsOptions {
  matches: Match[];
  enabled?: boolean;
  valueThreshold?: number; // EV% threshold
  confidenceThreshold?: number;
  maxAlertsPerDay?: number; // Max push notifications
  enableInjuryMonitoring?: boolean;
}

interface AlertedItem {
  matchId: string;
  alertType: string;
  timestamp: number;
}

// Alert cooldown - don't re-alert on same opportunity for 4 hours
const ALERT_COOLDOWN_MS = 4 * 60 * 60 * 1000;

// Max alerts per 24 hour window
const MAX_DAILY_ALERTS = 2;

export function useSmartNotifications(options: UseSmartNotificationsOptions) {
  const {
    matches,
    enabled = true,
    valueThreshold = 5, // 5% EV minimum
    confidenceThreshold = 70,
    maxAlertsPerDay = MAX_DAILY_ALERTS,
    enableInjuryMonitoring = true,
  } = options;
  
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [alertsToday, setAlertsToday] = useState(0);
  const [injuryAlertsCount, setInjuryAlertsCount] = useState(0);
  const alertedItemsRef = useRef<AlertedItem[]>([]);
  const lastScanRef = useRef<number>(0);
  
  // Save alert to database (defined early for use in injury handler)
  const saveAlertToDatabase = useCallback(async (alert: SmartAlert) => {
    if (!user) return;
    
    try {
      await supabase.from('user_alerts').insert({
        user_id: user.id,
        type: alert.type === 'major_injury' ? 'line_movement' : 
              alert.type === 'value_threshold' ? 'clv_update' : 'line_movement',
        title: alert.title,
        message: alert.message,
        match_id: alert.match.id,
        metadata: {
          alertType: alert.type,
          priority: alert.priority,
          confidence: alert.match.prediction?.confidence,
          evPercentage: alert.match.prediction?.evPercentage,
          injuryData: alert.injuryData,
        },
        is_read: false,
      });
    } catch (err) {
      console.error('Error saving smart notification:', err);
    }
  }, [user]);
  
  // Handle major injury detection
  const handleMajorInjury = useCallback((injuryAlert: MajorInjuryAlert) => {
    if (!user) return;
    
    // Check if we've already alerted on this
    const alertKey = `injury-${injuryAlert.player.name}-${injuryAlert.status}`;
    const now = Date.now();
    const hasAlerted = alertedItemsRef.current.some(
      item => item.matchId === injuryAlert.matchId && 
              item.alertType === alertKey &&
              now - item.timestamp < ALERT_COOLDOWN_MS
    );
    
    if (hasAlerted) return;
    
    // Create smart alert from injury
    const spreadShift = Math.abs(injuryAlert.lineImpact.estimatedSpreadShift).toFixed(1);
    const directionText = injuryAlert.lineImpact.direction === 'favorable_home' 
      ? 'favoring ' + injuryAlert.match.homeTeam.shortName
      : 'favoring ' + injuryAlert.match.awayTeam.shortName;
    
    const smartAlert: SmartAlert = {
      id: injuryAlert.id,
      type: 'major_injury',
      priority: injuryAlert.impactLevel,
      match: injuryAlert.match,
      title: `🚨 Injury Alert: ${injuryAlert.player.name} (${injuryAlert.status.toUpperCase()})`,
      message: `${injuryAlert.player.position} for ${injuryAlert.player.team} - ${injuryAlert.injuryType}. Est. ${spreadShift}pt line shift ${directionText}.`,
      timestamp: injuryAlert.detectedAt,
      injuryData: {
        playerName: injuryAlert.player.name,
        position: injuryAlert.player.position,
        team: injuryAlert.player.team,
        status: injuryAlert.status,
        estimatedSpreadShift: injuryAlert.lineImpact.estimatedSpreadShift,
      },
    };
    
    // Show toast for critical/high injuries - DISABLED (silent mode)
    if (injuryAlert.impactLevel === 'critical' || injuryAlert.impactLevel === 'high') {
      // Toast notification silenced - data still tracked in alerts state and database
      // toast(smartAlert.title, {
      //   description: smartAlert.message,
      //   duration: 12000,
      //   action: {
      //     label: 'View Game',
      //     onClick: () => window.location.href = `/game/${injuryAlert.matchId}`,
      //   },
      // });
      
      // Save to database (still track silently)
      saveAlertToDatabase(smartAlert);
      
      // Record as alerted
      alertedItemsRef.current.push({
        matchId: injuryAlert.matchId,
        alertType: alertKey,
        timestamp: now,
      });
    }
    
    // Add to alerts state
    setAlerts(prev => [smartAlert, ...prev].slice(0, 15));
    setInjuryAlertsCount(prev => prev + 1);
    
  }, [user, saveAlertToDatabase]);
  
  // Injury monitoring hook
  const { 
    majorInjuries, 
    criticalInjuries,
    isScanning: isInjuryScanning,
    newInjuriesCount 
  } = useInjuryMonitor({
    matches,
    enabled: enabled && enableInjuryMonitoring,
    onMajorInjury: handleMajorInjury,
  });
  
  // Clean old alerted items and count today's alerts
  const cleanAlertedItems = useCallback(() => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    alertedItemsRef.current = alertedItemsRef.current.filter(
      item => item.timestamp > oneDayAgo
    );
    
    // Count alerts in last 24 hours
    const todayCount = alertedItemsRef.current.filter(
      item => item.timestamp > oneDayAgo
    ).length;
    setAlertsToday(todayCount);
    
    return todayCount;
  }, []);
  
  // Check if we've already alerted on this
  const hasAlertedRecently = useCallback((matchId: string, alertType: string): boolean => {
    const now = Date.now();
    return alertedItemsRef.current.some(
      item => 
        item.matchId === matchId && 
        item.alertType === alertType &&
        now - item.timestamp < ALERT_COOLDOWN_MS
    );
  }, []);
  
  // Record an alert
  const recordAlert = useCallback((matchId: string, alertType: string) => {
    alertedItemsRef.current.push({
      matchId,
      alertType,
      timestamp: Date.now(),
    });
  }, []);
  
  // Scan matches for alert-worthy opportunities
  const scanForAlerts = useCallback(() => {
    if (!enabled || !matches.length) return;
    
    const now = new Date();
    const next24Hours = addHours(now, 24);
    const todayAlertCount = cleanAlertedItems();
    
    // Stop if we've hit daily limit
    if (todayAlertCount >= maxAlertsPerDay) {
      return;
    }
    
    const newAlerts: SmartAlert[] = [];
    
    // Filter to games within next 24 hours
    const upcomingMatches = matches.filter(match => {
      try {
        const startTime = parseISO(match.startTime);
        return isWithinInterval(startTime, { start: now, end: next24Hours });
      } catch {
        return false;
      }
    });
    
    for (const match of upcomingMatches) {
      // Already at max alerts?
      if (newAlerts.length + todayAlertCount >= maxAlertsPerDay) break;
      
      const confidence = match.prediction?.confidence || 0;
      const evPercentage = match.prediction?.evPercentage || 0;
      const smartScore = match.smartScore?.overall || 0;
      
      // Check for value threshold crossing
      if (
        evPercentage >= valueThreshold && 
        confidence >= confidenceThreshold &&
        !hasAlertedRecently(match.id, 'value_threshold')
      ) {
        const recommendedTeam = match.prediction?.recommended === 'home' 
          ? match.homeTeam.name 
          : match.awayTeam.name;
        
        const priority = evPercentage >= 10 ? 'critical' : evPercentage >= 7 ? 'high' : 'medium';
        
        newAlerts.push({
          id: `value-${match.id}-${Date.now()}`,
          type: 'value_threshold',
          priority,
          match,
          title: `🎯 High-Value: ${match.homeTeam.shortName || match.homeTeam.name} vs ${match.awayTeam.shortName || match.awayTeam.name}`,
          message: `${recommendedTeam} at +${evPercentage.toFixed(1)}% EV with ${confidence.toFixed(0)}% confidence. ${match.league}`,
          timestamp: new Date(),
        });
        
        recordAlert(match.id, 'value_threshold');
      }
      
      // Check for steam moves / arbitrage - DISABLED (silent mode)
      // Arbitrage alerts are still tracked but toast notifications are silenced
      if (
        match.smartScore?.hasArbitrageOpportunity &&
        !hasAlertedRecently(match.id, 'steam_move')
      ) {
        // Still add to alerts array for UI display, but skip toast notification
        newAlerts.push({
          id: `steam-${match.id}-${Date.now()}`,
          type: 'steam_move',
          priority: 'critical',
          match,
          title: `⚡ Steam Move: ${match.homeTeam.shortName || match.homeTeam.name} vs ${match.awayTeam.shortName || match.awayTeam.name}`,
          message: `Rapid line movement detected. Arbitrage opportunity available. Act fast!`,
          timestamp: new Date(),
          silent: true, // Mark as silent - no toast
        });
        
        recordAlert(match.id, 'steam_move');
      }
      
      // Check for exceptional SmartScore (above 85)
      if (
        smartScore >= 85 &&
        confidence >= 75 &&
        !hasAlertedRecently(match.id, 'high_smartscore')
      ) {
        const recommendedTeam = match.prediction?.recommended === 'home' 
          ? match.homeTeam.name 
          : match.awayTeam.name;
        
        newAlerts.push({
          id: `smartscore-${match.id}-${Date.now()}`,
          type: 'value_threshold',
          priority: 'high',
          match,
          title: `🔥 SmartScore 85+: ${match.homeTeam.shortName || match.homeTeam.name} vs ${match.awayTeam.shortName || match.awayTeam.name}`,
          message: `${recommendedTeam} - SmartScore ${smartScore.toFixed(0)} with all factors aligned. ${match.league}`,
          timestamp: new Date(),
        });
        
        recordAlert(match.id, 'high_smartscore');
      }
    }
    
    // Sort by priority, then limit to max
    const priorityOrder = { critical: 0, high: 1, medium: 2 };
    newAlerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    const alertsToSend = newAlerts.slice(0, maxAlertsPerDay - todayAlertCount);
    
    // Send alerts - save to database only (toast notifications disabled)
    alertsToSend.forEach(alert => {
      // Save all alerts to database
      saveAlertToDatabase(alert);
    });
    
    setAlerts(prev => [...alertsToSend, ...prev].slice(0, 10));
    setAlertsToday(prev => prev + alertsToSend.length);
    
  }, [
    enabled, 
    matches, 
    valueThreshold, 
    confidenceThreshold, 
    maxAlertsPerDay,
    cleanAlertedItems,
    hasAlertedRecently,
    recordAlert,
    saveAlertToDatabase
  ]);
  
  // Run scan periodically (every 15 minutes)
  useEffect(() => {
    if (!enabled || !user) return;
    
    // Initial scan after short delay
    const initialTimeout = setTimeout(() => {
      scanForAlerts();
      lastScanRef.current = Date.now();
    }, 2000);
    
    // Periodic scan
    const interval = setInterval(() => {
      const now = Date.now();
      // Only scan if 15+ minutes since last scan
      if (now - lastScanRef.current >= 15 * 60 * 1000) {
        scanForAlerts();
        lastScanRef.current = now;
      }
    }, 60 * 1000); // Check every minute if scan needed
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [enabled, user, scanForAlerts]);
  
  // Manual trigger
  const triggerScan = useCallback(() => {
    scanForAlerts();
    lastScanRef.current = Date.now();
  }, [scanForAlerts]);
  
  // Clear today's alert count (for testing)
  const resetDailyLimit = useCallback(() => {
    alertedItemsRef.current = [];
    setAlertsToday(0);
    setAlerts([]);
  }, []);
  
  return {
    alerts,
    alertsToday,
    remainingAlerts: maxAlertsPerDay - alertsToday,
    triggerScan,
    resetDailyLimit,
    isActive: enabled && !!user,
    // Injury monitoring data
    majorInjuries,
    criticalInjuries,
    injuryAlertsCount,
    isInjuryScanning,
    newInjuriesCount,
  };
}
