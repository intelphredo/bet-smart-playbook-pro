import { useQuery } from '@tanstack/react-query';
import { SportLeague } from '@/types/sportradar';
import { 
  fetchLeagueInjuries, 
  getTeamInjuries,
  fetchAllInjuries,
  calculateInjuryImpact
} from '@/services/sportradar/injuriesService';

export function useSportradarInjuries(league: SportLeague) {
  return useQuery({
    queryKey: ['sportradar', 'injuries', league],
    queryFn: () => fetchLeagueInjuries(league),
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
    queryFn: fetchAllInjuries,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export { calculateInjuryImpact };
