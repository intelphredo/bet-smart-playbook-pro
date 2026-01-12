import { useEffect, useRef, useCallback } from 'react';
import { Match } from '@/types/sports';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface HighValueOpportunity {
  id: string;
  matchId: string;
  type: 'high_confidence' | 'arbitrage' | 'positive_ev' | 'sharp_line' | 'smart_score';
  title: string;
  message: string;
  value: number;
  match: Match;
  timestamp: Date;
}

interface UseHighValueAlertsOptions {
  matches: Match[];
  confidenceThreshold?: number;
  smartScoreThreshold?: number;
  evThreshold?: number;
  enabled?: boolean;
}

// Track which opportunities we've already alerted on
const alertedOpportunities = new Set<string>();

export function useHighValueAlerts({
  matches,
  confidenceThreshold = 75,
  smartScoreThreshold = 70,
  evThreshold = 5,
  enabled = true,
}: UseHighValueAlertsOptions) {
  const { user } = useAuth();
  const previousMatchesRef = useRef<Map<string, Match>>(new Map());

  const detectHighValueOpportunities = useCallback((currentMatches: Match[]): HighValueOpportunity[] => {
    const opportunities: HighValueOpportunity[] = [];
    const prevMatches = previousMatchesRef.current;

    currentMatches.forEach((match) => {
      const prevMatch = prevMatches.get(match.id);
      const confidence = match.prediction?.confidence || 0;
      const smartScore = match.smartScore?.overall || 0;
      const evPercentage = match.prediction?.evPercentage || 0;
      const hasArbitrage = match.smartScore?.hasArbitrageOpportunity || false;

      // High confidence pick appeared or increased significantly
      if (confidence >= confidenceThreshold) {
        const prevConfidence = prevMatch?.prediction?.confidence || 0;
        const isNew = !prevMatch || prevConfidence < confidenceThreshold;
        const significantIncrease = prevConfidence > 0 && confidence - prevConfidence >= 10;
        
        if (isNew || significantIncrease) {
          const alertKey = `high_conf_${match.id}_${Math.floor(confidence / 5)}`;
          if (!alertedOpportunities.has(alertKey)) {
            opportunities.push({
              id: alertKey,
              matchId: match.id,
              type: 'high_confidence',
              title: '🎯 High Confidence Pick',
              message: `${match.homeTeam?.shortName} vs ${match.awayTeam?.shortName} - ${Math.round(confidence)}% confidence`,
              value: confidence,
              match,
              timestamp: new Date(),
            });
            alertedOpportunities.add(alertKey);
          }
        }
      }

      // Smart Score threshold met
      if (smartScore >= smartScoreThreshold) {
        const prevSmartScore = prevMatch?.smartScore?.overall || 0;
        const isNew = !prevMatch || prevSmartScore < smartScoreThreshold;
        
        if (isNew) {
          const alertKey = `smart_score_${match.id}_${Math.floor(smartScore / 5)}`;
          if (!alertedOpportunities.has(alertKey)) {
            opportunities.push({
              id: alertKey,
              matchId: match.id,
              type: 'smart_score',
              title: '⚡ High SmartScore Match',
              message: `${match.homeTeam?.shortName} vs ${match.awayTeam?.shortName} - SmartScore: ${Math.round(smartScore)}`,
              value: smartScore,
              match,
              timestamp: new Date(),
            });
            alertedOpportunities.add(alertKey);
          }
        }
      }

      // Positive EV opportunity
      if (evPercentage >= evThreshold) {
        const prevEV = prevMatch?.prediction?.evPercentage || 0;
        const isNew = !prevMatch || prevEV < evThreshold;
        
        if (isNew) {
          const alertKey = `pos_ev_${match.id}_${Math.floor(evPercentage)}`;
          if (!alertedOpportunities.has(alertKey)) {
            opportunities.push({
              id: alertKey,
              matchId: match.id,
              type: 'positive_ev',
              title: '💰 Positive EV Opportunity',
              message: `${match.homeTeam?.shortName} vs ${match.awayTeam?.shortName} - +${evPercentage.toFixed(1)}% EV`,
              value: evPercentage,
              match,
              timestamp: new Date(),
            });
            alertedOpportunities.add(alertKey);
          }
        }
      }

      // Arbitrage opportunity
      if (hasArbitrage) {
        const hadArbitrage = prevMatch?.smartScore?.hasArbitrageOpportunity || false;
        
        if (!hadArbitrage) {
          const alertKey = `arb_${match.id}`;
          if (!alertedOpportunities.has(alertKey)) {
            opportunities.push({
              id: alertKey,
              matchId: match.id,
              type: 'arbitrage',
              title: '🔥 Arbitrage Detected',
              message: `${match.homeTeam?.shortName} vs ${match.awayTeam?.shortName} - Risk-free profit available`,
              value: 100,
              match,
              timestamp: new Date(),
            });
            alertedOpportunities.add(alertKey);
          }
        }
      }
    });

    return opportunities;
  }, [confidenceThreshold, smartScoreThreshold, evThreshold]);

  const saveAlertToDatabase = useCallback(async (opportunity: HighValueOpportunity) => {
    if (!user) return;

    try {
      await supabase.from('user_alerts').insert({
        user_id: user.id,
        type: opportunity.type === 'arbitrage' ? 'arbitrage' : 'line_movement',
        title: opportunity.title,
        message: opportunity.message,
        match_id: opportunity.matchId,
        metadata: {
          value: opportunity.value,
          opportunityType: opportunity.type,
        },
        is_read: false,
      });
    } catch (error) {
      console.error('Error saving alert to database:', error);
    }
  }, [user]);

  useEffect(() => {
    if (!enabled || matches.length === 0) return;

    const opportunities = detectHighValueOpportunities(matches);

    // Show toast for each new opportunity
    opportunities.forEach((opp) => {
      const toastOptions = {
        description: opp.message,
        duration: 8000,
        action: {
          label: 'View',
          onClick: () => {
            // Could navigate to match or open modal
            console.log('Navigate to match:', opp.matchId);
          },
        },
      };

      switch (opp.type) {
        case 'arbitrage':
          toast.success(opp.title, toastOptions);
          break;
        case 'positive_ev':
          toast.success(opp.title, toastOptions);
          break;
        case 'high_confidence':
          toast(opp.title, toastOptions);
          break;
        case 'smart_score':
          toast(opp.title, toastOptions);
          break;
        default:
          toast(opp.title, toastOptions);
      }

      // Save to database for persistent notifications
      saveAlertToDatabase(opp);
    });

    // Update previous matches reference
    const newPrevMatches = new Map<string, Match>();
    matches.forEach((match) => newPrevMatches.set(match.id, match));
    previousMatchesRef.current = newPrevMatches;
  }, [matches, enabled, detectHighValueOpportunities, saveAlertToDatabase]);

  // Clear old alerted opportunities periodically (every hour)
  useEffect(() => {
    const interval = setInterval(() => {
      alertedOpportunities.clear();
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    clearAlertCache: () => alertedOpportunities.clear(),
  };
}