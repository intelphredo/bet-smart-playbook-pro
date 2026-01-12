// src/hooks/useSportradarInjuries.ts

import { useQuery } from "@tanstack/react-query";
import { getSportradarGames } from "@/services/data-providers/sportradar";
import { SportLeague, SportradarInjury, InjuryStatus } from "@/types/sportradar";
import { League } from "@/types/sports";

export const useInjuries = () => {
  const query = useQuery({
    queryKey: ["injuries"],
    queryFn: async () => {
      const games = await getSportradarGames().catch(() => []);
      return games.map((g) => ({
        id: g.id,
        injuries: g.injuries ?? [],
      }));
    },
    staleTime: 15000,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });

  return {
    injuries: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};

// Calculate injury impact score (0-100)
export function calculateInjuryImpact(injuries: SportradarInjury[]): number {
  if (!injuries || injuries.length === 0) return 0;

  let score = 0;
  for (const injury of injuries) {
    switch (injury.status) {
      case "out":
      case "out-for-season":
      case "injured-reserve":
        score += 20;
        break;
      case "doubtful":
        score += 15;
        break;
      case "questionable":
        score += 10;
        break;
      case "day-to-day":
        score += 5;
        break;
      case "probable":
        score += 2;
        break;
    }
  }

  return Math.min(score, 100);
}

// Map SportLeague to League type for ESPN API
const mapSportLeagueToLeague = (sportLeague: SportLeague): League => {
  const mapping: Record<SportLeague, League> = {
    'NBA': 'NBA',
    'NFL': 'NFL',
    'MLB': 'MLB',
    'NHL': 'NHL',
    'SOCCER': 'SOCCER',
  };
  return mapping[sportLeague] || 'NBA';
};

// Get ESPN sport path
const getESPNSportPath = (league: League): { sport: string; leaguePath: string } | null => {
  const mapping: Record<League, { sport: string; leaguePath: string }> = {
    NBA: { sport: 'basketball', leaguePath: 'nba' },
    NFL: { sport: 'football', leaguePath: 'nfl' },
    MLB: { sport: 'baseball', leaguePath: 'mlb' },
    NHL: { sport: 'hockey', leaguePath: 'nhl' },
    SOCCER: { sport: 'soccer', leaguePath: 'eng.1' },
    NCAAF: { sport: 'football', leaguePath: 'college-football' },
    NCAAB: { sport: 'basketball', leaguePath: 'mens-college-basketball' },
  };
  
  return mapping[league] || null;
};

// Map ESPN status to InjuryStatus type
const mapESPNStatus = (status: string): InjuryStatus => {
  const statusLower = status?.toLowerCase() || '';
  
  if (statusLower.includes('out') || statusLower === 'o') return 'out';
  if (statusLower.includes('doubtful') || statusLower === 'd') return 'doubtful';
  if (statusLower.includes('questionable') || statusLower === 'q') return 'questionable';
  if (statusLower.includes('probable') || statusLower === 'p') return 'probable';
  if (statusLower.includes('day-to-day') || statusLower.includes('day to day') || statusLower === 'dtd') return 'day-to-day';
  if (statusLower.includes('injured reserve') || statusLower === 'ir') return 'injured-reserve';
  if (statusLower.includes('out for season') || statusLower === 'ofs') return 'out-for-season';
  
  return 'questionable';
};

// Fetch injuries for a specific team from ESPN
const fetchTeamInjuries = async (
  league: League,
  teamId: string,
  teamName: string
): Promise<SportradarInjury[]> => {
  const sportPath = getESPNSportPath(league);
  if (!sportPath) return [];

  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/${sportPath.sport}/${sportPath.leaguePath}/teams/${teamId}/roster`;
    
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const data = await response.json();
    const injuries: SportradarInjury[] = [];
    
    const athletes = data.athletes || [];
    const now = new Date().toISOString();
    athletes.forEach((group: any) => {
      const items = group.items || [];
      items.forEach((player: any) => {
        if (player.injuries && player.injuries.length > 0) {
          player.injuries.forEach((injury: any) => {
            injuries.push({
              id: `${player.id}-${injury.id || Date.now()}`,
              playerId: player.id,
              playerName: player.fullName || player.displayName,
              position: player.position?.abbreviation || player.position?.name || '',
              team: teamName || data.team?.displayName || data.team?.name || '',
              teamId: data.team?.id || teamId,
              status: mapESPNStatus(injury.status || injury.type?.abbreviation),
              injuryType: injury.type?.name || injury.details?.type || 'Undisclosed',
              description: injury.details?.detail || injury.longComment || injury.shortComment || '',
              expectedReturn: injury.details?.returnDate,
              startDate: injury.date || now,
              practice: injury.practice,
              updatedAt: injury.date || now,
            });
          });
        }
      });
    });
    
    return injuries;
  } catch (error) {
    console.error(`Error fetching ${league} team injuries:`, error);
    return [];
  }
};

// Fetch all injuries for a league from ESPN
const fetchLeagueInjuries = async (league: League): Promise<SportradarInjury[]> => {
  const sportPath = getESPNSportPath(league);
  if (!sportPath) return [];

  try {
    const teamsUrl = `https://site.api.espn.com/apis/site/v2/sports/${sportPath.sport}/${sportPath.leaguePath}/teams`;
    
    const teamsResponse = await fetch(teamsUrl);
    if (!teamsResponse.ok) return getMockInjuries(league);
    
    const teamsData = await teamsResponse.json();
    const teams = teamsData.sports?.[0]?.leagues?.[0]?.teams || [];
    
    // Fetch injuries for first 15 teams to get good coverage
    const teamSlice = teams.slice(0, 15);
    
    const allInjuries = await Promise.all(
      teamSlice.map((t: any) => 
        fetchTeamInjuries(league, t.team?.id, t.team?.displayName || t.team?.name)
      )
    );
    
    const flatInjuries = allInjuries.flat();
    
    // If no injuries found from API, return mock data
    if (flatInjuries.length === 0) {
      return getMockInjuries(league);
    }
    
    return flatInjuries;
  } catch (error) {
    console.error(`Error fetching ${league} injuries:`, error);
    return getMockInjuries(league);
  }
};

// Mock injuries for fallback
const getMockInjuries = (league: League): SportradarInjury[] => {
  const now = new Date().toISOString();
  
  const mockData: Record<string, SportradarInjury[]> = {
    NBA: [
      {
        id: 'mock-nba-1',
        playerId: '1',
        playerName: 'Anthony Davis',
        position: 'PF',
        team: 'Los Angeles Lakers',
        teamId: 'lal',
        status: 'questionable',
        injuryType: 'Knee',
        description: 'Left knee soreness',
        startDate: now,
        updatedAt: now,
      },
      {
        id: 'mock-nba-2',
        playerId: '2',
        playerName: 'Ja Morant',
        position: 'PG',
        team: 'Memphis Grizzlies',
        teamId: 'mem',
        status: 'out',
        injuryType: 'Shoulder',
        description: 'Right shoulder surgery recovery',
        startDate: now,
        updatedAt: now,
      },
      {
        id: 'mock-nba-3',
        playerId: '3',
        playerName: 'Kawhi Leonard',
        position: 'SF',
        team: 'Los Angeles Clippers',
        teamId: 'lac',
        status: 'day-to-day',
        injuryType: 'Knee',
        description: 'Load management',
        startDate: now,
        updatedAt: now,
      },
    ],
    NFL: [
      {
        id: 'mock-nfl-1',
        playerId: '1',
        playerName: 'Nick Bosa',
        position: 'DE',
        team: 'San Francisco 49ers',
        teamId: 'sf',
        status: 'questionable',
        injuryType: 'Hip',
        description: 'Hip flexor strain',
        startDate: now,
        updatedAt: now,
      },
      {
        id: 'mock-nfl-2',
        playerId: '2',
        playerName: 'Christian McCaffrey',
        position: 'RB',
        team: 'San Francisco 49ers',
        teamId: 'sf',
        status: 'doubtful',
        injuryType: 'Calf',
        description: 'Calf strain',
        startDate: now,
        updatedAt: now,
      },
    ],
    MLB: [
      {
        id: 'mock-mlb-1',
        playerId: '1',
        playerName: 'Mike Trout',
        position: 'CF',
        team: 'Los Angeles Angels',
        teamId: 'laa',
        status: 'out',
        injuryType: 'Knee',
        description: 'Meniscus surgery recovery',
        startDate: now,
        updatedAt: now,
      },
      {
        id: 'mock-mlb-2',
        playerId: '2',
        playerName: 'Ronald Acuña Jr.',
        position: 'RF',
        team: 'Atlanta Braves',
        teamId: 'atl',
        status: 'out-for-season',
        injuryType: 'ACL',
        description: 'ACL tear',
        startDate: now,
        updatedAt: now,
      },
    ],
    NHL: [
      {
        id: 'mock-nhl-1',
        playerId: '1',
        playerName: 'Connor McDavid',
        position: 'C',
        team: 'Edmonton Oilers',
        teamId: 'edm',
        status: 'probable',
        injuryType: 'Upper Body',
        description: 'Upper body maintenance',
        startDate: now,
        updatedAt: now,
      },
      {
        id: 'mock-nhl-2',
        playerId: '2',
        playerName: 'Auston Matthews',
        position: 'C',
        team: 'Toronto Maple Leafs',
        teamId: 'tor',
        status: 'day-to-day',
        injuryType: 'Upper Body',
        description: 'Upper body injury',
        startDate: now,
        updatedAt: now,
      },
    ],
    SOCCER: [
      {
        id: 'mock-soccer-1',
        playerId: '1',
        playerName: 'Erling Haaland',
        position: 'ST',
        team: 'Manchester City',
        teamId: 'mci',
        status: 'questionable',
        injuryType: 'Groin',
        description: 'Groin strain',
        startDate: now,
        updatedAt: now,
      },
    ],
  };
  
  return mockData[league] || [];
};

// Hook to fetch injuries for a specific league
export const useSportradarInjuries = (league: SportLeague) => {
  const mappedLeague = mapSportLeagueToLeague(league);
  
  return useQuery<SportradarInjury[]>({
    queryKey: ["sportradar-injuries", league],
    queryFn: () => fetchLeagueInjuries(mappedLeague),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
  });
};
