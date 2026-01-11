
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Match, League } from '@/types/sports';
import { InjuryLineImpact } from '@/types/injuries';
import { SportLeague, SportradarInjury } from '@/types/sportradar';
import { fetchLeagueInjuries } from '@/services/sportradar/injuriesService';
import { calculateInjuryLineImpact } from '@/utils/injuries/injuryLineImpactCalculator';

// Map our League type to Sportradar's SportLeague
function mapToSportLeague(league: League): SportLeague {
  const mapping: Record<League, SportLeague> = {
    'NBA': 'NBA',
    'NFL': 'NFL',
    'MLB': 'MLB',
    'NHL': 'NHL',
    'SOCCER': 'SOCCER',
    'NCAAF': 'NFL', // Use NFL as fallback
    'NCAAB': 'NBA', // Use NBA as fallback
  };
  return mapping[league] || 'NBA';
}

// Filter injuries by team (case-insensitive, partial match)
function filterInjuriesByTeam(
  injuries: SportradarInjury[],
  teamName: string,
  teamShortName: string
): SportradarInjury[] {
  const normalizedTeamName = teamName.toLowerCase();
  const normalizedShortName = teamShortName.toLowerCase();
  
  return injuries.filter(injury => {
    const injuryTeam = (injury.team || '').toLowerCase();
    return (
      injuryTeam.includes(normalizedTeamName) ||
      injuryTeam.includes(normalizedShortName) ||
      normalizedTeamName.includes(injuryTeam) ||
      normalizedShortName.includes(injuryTeam)
    );
  });
}

export function useMatchInjuryImpact(match: Match | null) {
  const sportLeague = match ? mapToSportLeague(match.league) : 'NBA';
  
  // Fetch all injuries for the league
  const { data: leagueInjuries, isLoading, error } = useQuery({
    queryKey: ['injuries', sportLeague],
    queryFn: () => fetchLeagueInjuries(sportLeague),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,
    enabled: !!match,
  });
  
  // Calculate injury impact for this specific match
  const injuryImpact = useMemo<InjuryLineImpact | null>(() => {
    if (!match || !leagueInjuries || leagueInjuries.length === 0) {
      return null;
    }
    
    // Filter injuries by team
    const homeInjuries = filterInjuriesByTeam(
      leagueInjuries,
      match.homeTeam.name,
      match.homeTeam.shortName
    );
    
    const awayInjuries = filterInjuriesByTeam(
      leagueInjuries,
      match.awayTeam.name,
      match.awayTeam.shortName
    );
    
    // If no injuries for either team, return minimal impact
    if (homeInjuries.length === 0 && awayInjuries.length === 0) {
      return {
        matchId: match.id,
        league: match.league,
        spreadAdjustment: 0,
        totalAdjustment: 0,
        moneylineShift: 0,
        homeTeamImpact: {
          teamId: match.homeTeam.id,
          teamName: match.homeTeam.name,
          offensiveImpact: 0,
          defensiveImpact: 0,
          overallImpact: 0,
          adjustedPointsPerGame: 0,
          keyPlayersOut: [],
          totalPlayersAffected: 0,
        },
        awayTeamImpact: {
          teamId: match.awayTeam.id,
          teamName: match.awayTeam.name,
          offensiveImpact: 0,
          defensiveImpact: 0,
          overallImpact: 0,
          adjustedPointsPerGame: 0,
          keyPlayersOut: [],
          totalPlayersAffected: 0,
        },
        netAdvantage: 0,
        advantageTeam: 'even',
        confidenceLevel: 'low',
        lastUpdated: new Date().toISOString(),
        keyPlayersAffected: [],
        impactSummary: 'No injury data available for this matchup',
        marketAdjusted: false,
      };
    }
    
    return calculateInjuryLineImpact(match, homeInjuries, awayInjuries);
  }, [match, leagueInjuries]);
  
  // Get injuries split by team
  const homeInjuries = useMemo(() => {
    if (!match || !leagueInjuries) return [];
    return filterInjuriesByTeam(
      leagueInjuries,
      match.homeTeam.name,
      match.homeTeam.shortName
    );
  }, [match, leagueInjuries]);
  
  const awayInjuries = useMemo(() => {
    if (!match || !leagueInjuries) return [];
    return filterInjuriesByTeam(
      leagueInjuries,
      match.awayTeam.name,
      match.awayTeam.shortName
    );
  }, [match, leagueInjuries]);
  
  return {
    injuryImpact,
    homeInjuries,
    awayInjuries,
    isLoading,
    error,
    hasSignificantImpact: (injuryImpact?.homeTeamImpact.overallImpact ?? 0) >= 10 ||
                           (injuryImpact?.awayTeamImpact.overallImpact ?? 0) >= 10,
    lastUpdated: injuryImpact?.lastUpdated,
  };
}

// Simpler hook for just checking if there's injury impact
export function useHasInjuryImpact(match: Match | null): boolean {
  const { hasSignificantImpact } = useMatchInjuryImpact(match);
  return hasSignificantImpact;
}
