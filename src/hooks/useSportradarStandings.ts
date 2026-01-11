import { useQuery } from '@tanstack/react-query';
import { SportLeague, SportradarStanding } from '@/types/sportradar';
import { fetchESPNStandings, fetchAllESPNStandings } from '@/services/espnStandingsService';

// Primary hook using ESPN (free, reliable)
export function useSportradarStandings(league: SportLeague) {
  return useQuery({
    queryKey: ['espn', 'standings', league],
    queryFn: () => fetchESPNStandings(league),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// Filter by conference from full standings
export function useConferenceStandings(league: SportLeague, conference: string) {
  return useQuery({
    queryKey: ['espn', 'standings', league, 'conference', conference],
    queryFn: async () => {
      const standings = await fetchESPNStandings(league);
      return standings
        .filter(s => s.conference?.toLowerCase() === conference.toLowerCase())
        .sort((a, b) => a.confRank - b.confRank);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// Filter by division from full standings
export function useDivisionStandings(league: SportLeague, division: string) {
  return useQuery({
    queryKey: ['espn', 'standings', league, 'division', division],
    queryFn: async () => {
      const standings = await fetchESPNStandings(league);
      return standings
        .filter(s => s.division?.toLowerCase().includes(division.toLowerCase()))
        .sort((a, b) => a.divRank - b.divRank);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// Fetch all leagues at once
export function useAllLeagueStandings() {
  return useQuery({
    queryKey: ['espn', 'standings', 'all'],
    queryFn: fetchAllESPNStandings,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
