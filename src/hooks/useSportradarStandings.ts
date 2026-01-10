import { useQuery } from '@tanstack/react-query';
import { SportLeague } from '@/types/sportradar';
import { 
  fetchStandings, 
  getConferenceStandings, 
  getDivisionStandings,
  fetchAllStandings 
} from '@/services/sportradar/standingsService';

export function useSportradarStandings(league: SportLeague) {
  return useQuery({
    queryKey: ['sportradar', 'standings', league],
    queryFn: () => fetchStandings(league),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useConferenceStandings(league: SportLeague, conference: string) {
  return useQuery({
    queryKey: ['sportradar', 'standings', league, 'conference', conference],
    queryFn: () => getConferenceStandings(league, conference),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useDivisionStandings(league: SportLeague, division: string) {
  return useQuery({
    queryKey: ['sportradar', 'standings', league, 'division', division],
    queryFn: () => getDivisionStandings(league, division),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useAllLeagueStandings() {
  return useQuery({
    queryKey: ['sportradar', 'standings', 'all'],
    queryFn: fetchAllStandings,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
