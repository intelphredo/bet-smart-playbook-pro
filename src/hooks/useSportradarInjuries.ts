import { useQuery } from '@tanstack/react-query';
import { SportLeague, SportradarInjury } from '@/types/sportradar';
import { 
  fetchLeagueInjuries, 
  getTeamInjuries,
  fetchAllInjuries as fetchAllInjuriesFromMock,
  calculateInjuryImpact
} from '@/services/sportradar/injuriesService';
import { 
  fetchInjuries as fetchInjuriesFromApi,
  fetchAllInjuries as fetchAllInjuriesFromApi,
  checkSportradarStatus
} from '@/services/sportradarApiService';

// Try API first, fall back to mock data
async function fetchInjuriesWithFallback(league: SportLeague): Promise<SportradarInjury[]> {
  try {
    const result = await fetchInjuriesFromApi(league);
    if (result.success && result.data) {
      // Map API response to our injury type
      const apiData = result.data as Record<string, unknown>;
      const injuries = (apiData.players || apiData.injuries || []) as any[];
      return injuries.map((injury: any) => ({
        id: injury.id || `${injury.player?.id || Math.random()}`,
        playerId: injury.player?.id || injury.player_id || '',
        playerName: injury.player?.full_name || injury.player?.name || 'Unknown',
        team: injury.team?.name || injury.team?.market || 'Unknown',
        teamId: injury.team?.id || injury.team_id || '',
        position: injury.player?.position || injury.position || 'Unknown',
        status: (injury.status || 'questionable') as any,
        description: injury.desc || injury.description || 'Undisclosed',
        injuryType: injury.injury_type || injury.type || 'Unknown',
        startDate: injury.start_date || injury.update_date || new Date().toISOString(),
        expectedReturn: injury.expected_return,
        practice: injury.practice_status,
        comment: injury.comment,
        updatedAt: injury.update_date || injury.updated_at || new Date().toISOString(),
      }));
    }
    throw new Error('No data');
  } catch (error) {
    console.log(`[Injuries] API failed for ${league}, using fallback`);
    return fetchLeagueInjuries(league);
  }
}

async function fetchAllWithFallback(): Promise<Record<SportLeague, SportradarInjury[]>> {
  try {
    const result = await fetchAllInjuriesFromApi();
    return result as Record<SportLeague, SportradarInjury[]>;
  } catch (error) {
    console.log('[Injuries] API failed for all leagues, using fallback');
    return fetchAllInjuriesFromMock();
  }
}

export function useSportradarInjuries(league: SportLeague) {
  return useQuery({
    queryKey: ['sportradar', 'injuries', league],
    queryFn: () => fetchInjuriesWithFallback(league),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useTeamInjuries(league: SportLeague, teamId: string) {
  return useQuery({
    queryKey: ['sportradar', 'injuries', league, 'team', teamId],
    queryFn: () => getTeamInjuries(league, teamId),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    enabled: !!teamId,
    refetchOnWindowFocus: false,
  });
}

export function useAllLeagueInjuries() {
  return useQuery({
    queryKey: ['sportradar', 'injuries', 'all'],
    queryFn: fetchAllWithFallback,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useSportradarStatus() {
  return useQuery({
    queryKey: ['sportradar', 'status'],
    queryFn: checkSportradarStatus,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 60 * 60 * 1000,
    retry: 1,
  });
}

export { calculateInjuryImpact };
