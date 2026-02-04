// Major Injury Detection System - Monitors for breaking injury news
// Detects high-impact injuries that could move betting lines

import { useState, useEffect, useCallback, useRef } from 'react';
import { Match, League } from '@/types/sports';
import { ESPNInjury, fetchTeamInjuriesByName } from '@/hooks/useESPNInjuries';
import { InjuryStatus } from '@/types/injuries';

export interface MajorInjuryAlert {
  id: string;
  matchId: string;
  match: Match;
  player: {
    name: string;
    position: string;
    team: string;
  };
  status: InjuryStatus;
  injuryType: string;
  impactLevel: 'critical' | 'high' | 'medium';
  lineImpact: {
    estimatedSpreadShift: number;
    estimatedTotalShift: number;
    direction: 'favorable_home' | 'favorable_away';
  };
  detectedAt: Date;
  isNew: boolean;
}

// Position impact weights for line movement estimation
const POSITION_IMPACT: Record<string, Record<string, number>> = {
  NBA: {
    'PG': 4.5, 'SG': 3.5, 'SF': 3.0, 'PF': 3.5, 'C': 4.0,
  },
  NFL: {
    'QB': 7.0, 'RB': 3.0, 'WR': 2.5, 'TE': 2.0, 'OL': 1.5,
    'DE': 2.5, 'DT': 2.0, 'LB': 2.5, 'CB': 3.0, 'S': 2.5, 'K': 1.0, 'P': 0.5,
  },
  MLB: {
    'SP': 4.0, 'RP': 1.5, 'C': 2.0, '1B': 2.5, '2B': 2.0,
    '3B': 2.5, 'SS': 2.5, 'LF': 2.0, 'CF': 2.5, 'RF': 2.0, 'DH': 2.0,
  },
  NHL: {
    'G': 5.0, 'D': 2.5, 'C': 3.5, 'LW': 2.5, 'RW': 2.5,
  },
};

// Get estimated line impact based on position and status
function getLineImpact(
  league: League,
  position: string,
  status: InjuryStatus,
  isHomeTeam: boolean
): { spread: number; total: number } {
  const positionWeights = POSITION_IMPACT[league] || {};
  const baseImpact = positionWeights[position.toUpperCase()] || 2.0;
  
  // Status multiplier
  const statusMultiplier: Record<InjuryStatus, number> = {
    'out': 1.0,
    'doubtful': 0.8,
    'questionable': 0.4,
    'probable': 0.1,
    'day-to-day': 0.5,
    'healthy': 0,
  };
  
  const multiplier = statusMultiplier[status] || 0.5;
  const spreadShift = baseImpact * multiplier;
  const totalShift = -spreadShift * 0.5; // Injuries often lower totals
  
  return {
    spread: isHomeTeam ? spreadShift : -spreadShift,
    total: totalShift,
  };
}

// Determine impact level based on position and status
function getImpactLevel(
  league: League,
  position: string,
  status: InjuryStatus
): 'critical' | 'high' | 'medium' {
  const positionWeights = POSITION_IMPACT[league] || {};
  const impact = positionWeights[position.toUpperCase()] || 2.0;
  
  // Critical: Key player (QB, star) definitely out
  if (impact >= 4.0 && (status === 'out' || status === 'doubtful')) {
    return 'critical';
  }
  
  // High: Key player questionable or solid contributor out
  if (
    (impact >= 4.0 && status === 'questionable') ||
    (impact >= 3.0 && (status === 'out' || status === 'doubtful'))
  ) {
    return 'high';
  }
  
  return 'medium';
}

interface InjuryCache {
  matchId: string;
  injuries: ESPNInjury[];
  fetchedAt: number;
}

interface UseInjuryMonitorOptions {
  matches: Match[];
  enabled?: boolean;
  onMajorInjury?: (alert: MajorInjuryAlert) => void;
}

export function useInjuryMonitor(options: UseInjuryMonitorOptions) {
  const { matches, enabled = true, onMajorInjury } = options;
  
  const [majorInjuries, setMajorInjuries] = useState<MajorInjuryAlert[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const injuryCacheRef = useRef<Map<string, InjuryCache>>(new Map());
  const previousInjuriesRef = useRef<Map<string, Set<string>>>(new Map());
  const lastScanRef = useRef<number>(0);
  
  // Check if an injury is new (not seen before)
  const isNewInjury = useCallback((matchId: string, injuryId: string): boolean => {
    const previousSet = previousInjuriesRef.current.get(matchId);
    if (!previousSet) return true;
    return !previousSet.has(injuryId);
  }, []);
  
  // Record an injury as seen
  const recordInjury = useCallback((matchId: string, injuryId: string) => {
    if (!previousInjuriesRef.current.has(matchId)) {
      previousInjuriesRef.current.set(matchId, new Set());
    }
    previousInjuriesRef.current.get(matchId)!.add(injuryId);
  }, []);
  
  // Fetch injuries for a match
  const fetchMatchInjuries = useCallback(async (match: Match): Promise<ESPNInjury[]> => {
    const cacheKey = match.id;
    const cached = injuryCacheRef.current.get(cacheKey);
    const now = Date.now();
    
    // Use cache if less than 5 minutes old
    if (cached && now - cached.fetchedAt < 5 * 60 * 1000) {
      return cached.injuries;
    }
    
    try {
      const [homeInjuries, awayInjuries] = await Promise.all([
        fetchTeamInjuriesByName(match.league, match.homeTeam.name),
        fetchTeamInjuriesByName(match.league, match.awayTeam.name),
      ]);
      
      const allInjuries = [...homeInjuries, ...awayInjuries];
      
      injuryCacheRef.current.set(cacheKey, {
        matchId: match.id,
        injuries: allInjuries,
        fetchedAt: now,
      });
      
      return allInjuries;
    } catch (err) {
      console.error('Error fetching injuries for match:', match.id, err);
      return cached?.injuries || [];
    }
  }, []);
  
  // Scan matches for major injuries
  const scanForMajorInjuries = useCallback(async () => {
    if (!enabled || !matches.length || isScanning) return;
    
    setIsScanning(true);
    const newMajorInjuries: MajorInjuryAlert[] = [];
    
    // Limit concurrent fetches
    const batchSize = 5;
    for (let i = 0; i < Math.min(matches.length, 20); i += batchSize) {
      const batch = matches.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (match) => {
          const injuries = await fetchMatchInjuries(match);
          
          // Filter for significant injuries
          const significantInjuries = injuries.filter(injury => {
            const status = injury.status;
            return status === 'out' || status === 'doubtful' || status === 'questionable';
          });
          
          return { match, injuries: significantInjuries };
        })
      );
      
      // Process results
      for (const { match, injuries } of batchResults) {
        for (const injury of injuries) {
          const injuryKey = `${injury.playerId}-${injury.status}`;
          const isNew = isNewInjury(match.id, injuryKey);
          
          // Determine if this is a major injury worth alerting
          const impactLevel = getImpactLevel(match.league, injury.playerPosition, injury.status);
          
          // Only alert on high/critical injuries
          if (impactLevel === 'critical' || impactLevel === 'high') {
            const homeTeamName = match?.homeTeam?.name?.toLowerCase() || '';
            const injuryTeamName = injury?.team?.toLowerCase() || '';
            const isHomeTeam = homeTeamName && injuryTeamName && 
                               (injuryTeamName.includes(homeTeamName) || homeTeamName.includes(injuryTeamName));
            
            const lineImpact = getLineImpact(match.league, injury.playerPosition, injury.status, isHomeTeam);
            
            const alert: MajorInjuryAlert = {
              id: `injury-${match.id}-${injury.playerId}-${Date.now()}`,
              matchId: match.id,
              match,
              player: {
                name: injury.playerName,
                position: injury.playerPosition,
                team: injury.team,
              },
              status: injury.status,
              injuryType: injury.injuryType,
              impactLevel,
              lineImpact: {
                estimatedSpreadShift: lineImpact.spread,
                estimatedTotalShift: lineImpact.total,
                direction: lineImpact.spread > 0 ? 'favorable_away' : 'favorable_home',
              },
              detectedAt: new Date(),
              isNew,
            };
            
            // Only add if new or critical
            if (isNew || impactLevel === 'critical') {
              newMajorInjuries.push(alert);
              
              // Notify via callback
              if (isNew && onMajorInjury) {
                onMajorInjury(alert);
              }
            }
          }
          
          // Record as seen
          recordInjury(match.id, injuryKey);
        }
      }
    }
    
    // Update state with new major injuries
    if (newMajorInjuries.length > 0) {
      setMajorInjuries(prev => {
        const combined = [...newMajorInjuries, ...prev];
        // Dedupe by id and limit
        const seen = new Set<string>();
        return combined.filter(i => {
          if (seen.has(i.id)) return false;
          seen.add(i.id);
          return true;
        }).slice(0, 50);
      });
    }
    
    setIsScanning(false);
    lastScanRef.current = Date.now();
    
    return newMajorInjuries;
  }, [enabled, matches, isScanning, fetchMatchInjuries, isNewInjury, recordInjury, onMajorInjury]);
  
  // Run scan periodically
  useEffect(() => {
    if (!enabled) return;
    
    // Initial scan after delay
    const initialTimeout = setTimeout(() => {
      scanForMajorInjuries();
    }, 5000);
    
    // Periodic scan every 10 minutes
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastScanRef.current >= 10 * 60 * 1000) {
        scanForMajorInjuries();
      }
    }, 60 * 1000);
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [enabled, scanForMajorInjuries]);
  
  // Get injuries affecting a specific match
  const getMatchInjuries = useCallback((matchId: string): MajorInjuryAlert[] => {
    return majorInjuries.filter(i => i.matchId === matchId);
  }, [majorInjuries]);
  
  // Get critical injuries only
  const criticalInjuries = majorInjuries.filter(i => i.impactLevel === 'critical');
  
  // Manual trigger
  const triggerScan = useCallback(async () => {
    return scanForMajorInjuries();
  }, [scanForMajorInjuries]);
  
  return {
    majorInjuries,
    criticalInjuries,
    isScanning,
    triggerScan,
    getMatchInjuries,
    newInjuriesCount: majorInjuries.filter(i => i.isNew).length,
  };
}
