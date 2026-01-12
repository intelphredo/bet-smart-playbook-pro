// src/hooks/useESPNInjuries.ts

import { useQuery } from "@tanstack/react-query";
import { League } from "@/types/sports";
import { InjuryStatus } from "@/types/injuries";

// ESPN injury data structure
export interface ESPNInjury {
  id: string;
  playerId: string;
  playerName: string;
  playerPosition: string;
  playerHeadshot?: string;
  team: string;
  teamId: string;
  teamLogo?: string;
  status: InjuryStatus;
  injuryType: string;
  description: string;
  returnDate?: string;
  updatedAt: string;
}

// Map ESPN status to our InjuryStatus type
const mapESPNStatus = (status: string): InjuryStatus => {
  const statusLower = status?.toLowerCase() || '';
  
  if (statusLower.includes('out') || statusLower === 'o') return 'out';
  if (statusLower.includes('doubtful') || statusLower === 'd') return 'doubtful';
  if (statusLower.includes('questionable') || statusLower === 'q') return 'questionable';
  if (statusLower.includes('probable') || statusLower === 'p') return 'probable';
  if (statusLower.includes('day-to-day') || statusLower.includes('day to day') || statusLower === 'dtd') return 'day-to-day';
  if (statusLower.includes('injured reserve') || statusLower === 'ir') return 'out';
  
  return 'questionable';
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

// Fetch injuries for a specific team from ESPN
const fetchTeamInjuries = async (
  league: League,
  teamId: string
): Promise<ESPNInjury[]> => {
  const sportPath = getESPNSportPath(league);
  if (!sportPath) return [];

  try {
    // ESPN team roster endpoint includes injury info
    const url = `https://site.api.espn.com/apis/site/v2/sports/${sportPath.sport}/${sportPath.leaguePath}/teams/${teamId}/roster`;
    
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const data = await response.json();
    const injuries: ESPNInjury[] = [];
    
    // Process athletes from roster
    const athletes = data.athletes || [];
    athletes.forEach((group: any) => {
      const items = group.items || [];
      items.forEach((player: any) => {
        // Check if player has injury info
        if (player.injuries && player.injuries.length > 0) {
          player.injuries.forEach((injury: any) => {
            injuries.push({
              id: `${player.id}-${injury.id || Date.now()}`,
              playerId: player.id,
              playerName: player.fullName || player.displayName,
              playerPosition: player.position?.abbreviation || player.position?.name || '',
              playerHeadshot: player.headshot?.href,
              team: data.team?.displayName || data.team?.name || '',
              teamId: data.team?.id || teamId,
              teamLogo: data.team?.logos?.[0]?.href,
              status: mapESPNStatus(injury.status || injury.type?.abbreviation),
              injuryType: injury.type?.name || injury.details?.type || 'Undisclosed',
              description: injury.details?.detail || injury.longComment || injury.shortComment || '',
              returnDate: injury.details?.returnDate,
              updatedAt: injury.date || new Date().toISOString(),
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

// Fetch all injuries for a league
const fetchLeagueInjuries = async (league: League): Promise<ESPNInjury[]> => {
  const sportPath = getESPNSportPath(league);
  if (!sportPath) return [];

  try {
    // First get all teams in the league
    const teamsUrl = `https://site.api.espn.com/apis/site/v2/sports/${sportPath.sport}/${sportPath.leaguePath}/teams`;
    
    const teamsResponse = await fetch(teamsUrl);
    if (!teamsResponse.ok) return getMockInjuries(league);
    
    const teamsData = await teamsResponse.json();
    const teams = teamsData.sports?.[0]?.leagues?.[0]?.teams || [];
    
    // Fetch injuries for first 10 teams (to limit API calls)
    const teamIds = teams.slice(0, 10).map((t: any) => t.team?.id).filter(Boolean);
    
    const allInjuries = await Promise.all(
      teamIds.map((teamId: string) => fetchTeamInjuries(league, teamId))
    );
    
    return allInjuries.flat();
  } catch (error) {
    console.error(`Error fetching ${league} injuries:`, error);
    return getMockInjuries(league);
  }
};

// Get injuries for specific teams (by name matching)
export const fetchTeamInjuriesByName = async (
  league: League,
  teamName: string
): Promise<ESPNInjury[]> => {
  const sportPath = getESPNSportPath(league);
  if (!sportPath) return [];

  try {
    // Search for team by name
    const searchUrl = `https://site.api.espn.com/apis/site/v2/sports/${sportPath.sport}/${sportPath.leaguePath}/teams`;
    
    const response = await fetch(searchUrl);
    if (!response.ok) return [];
    
    const data = await response.json();
    const teams = data.sports?.[0]?.leagues?.[0]?.teams || [];
    
    // Find matching team
    const normalizedSearch = teamName.toLowerCase();
    const matchingTeam = teams.find((t: any) => {
      const team = t.team;
      return (
        team?.displayName?.toLowerCase().includes(normalizedSearch) ||
        team?.name?.toLowerCase().includes(normalizedSearch) ||
        team?.shortDisplayName?.toLowerCase().includes(normalizedSearch) ||
        team?.abbreviation?.toLowerCase() === normalizedSearch
      );
    });
    
    if (matchingTeam?.team?.id) {
      return fetchTeamInjuries(league, matchingTeam.team.id);
    }
    
    return [];
  } catch (error) {
    console.error(`Error searching for team ${teamName}:`, error);
    return [];
  }
};

// Mock injuries for fallback
const getMockInjuries = (league: League): ESPNInjury[] => {
  const mockData: Record<League, ESPNInjury[]> = {
    NBA: [
      {
        id: 'mock-nba-1',
        playerId: '1',
        playerName: 'Anthony Davis',
        playerPosition: 'PF',
        team: 'Los Angeles Lakers',
        teamId: 'lal',
        status: 'questionable',
        injuryType: 'Knee',
        description: 'Left knee soreness',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'mock-nba-2',
        playerId: '2',
        playerName: 'Ja Morant',
        playerPosition: 'PG',
        team: 'Memphis Grizzlies',
        teamId: 'mem',
        status: 'out',
        injuryType: 'Shoulder',
        description: 'Right shoulder surgery recovery',
        updatedAt: new Date().toISOString(),
      },
    ],
    NFL: [
      {
        id: 'mock-nfl-1',
        playerId: '1',
        playerName: 'Nick Bosa',
        playerPosition: 'DE',
        team: 'San Francisco 49ers',
        teamId: 'sf',
        status: 'questionable',
        injuryType: 'Hip',
        description: 'Hip flexor strain',
        updatedAt: new Date().toISOString(),
      },
    ],
    MLB: [
      {
        id: 'mock-mlb-1',
        playerId: '1',
        playerName: 'Mike Trout',
        playerPosition: 'CF',
        team: 'Los Angeles Angels',
        teamId: 'laa',
        status: 'out',
        injuryType: 'Knee',
        description: 'Meniscus surgery recovery',
        updatedAt: new Date().toISOString(),
      },
    ],
    NHL: [
      {
        id: 'mock-nhl-1',
        playerId: '1',
        playerName: 'Connor McDavid',
        playerPosition: 'C',
        team: 'Edmonton Oilers',
        teamId: 'edm',
        status: 'probable',
        injuryType: 'Upper Body',
        description: 'Upper body maintenance',
        updatedAt: new Date().toISOString(),
      },
    ],
    SOCCER: [],
    NCAAF: [],
    NCAAB: [],
  };
  
  return mockData[league] || [];
};

// Hook to fetch injuries for a league
export const useESPNInjuries = (league: League) => {
  return useQuery({
    queryKey: ['espn-injuries', league],
    queryFn: () => fetchLeagueInjuries(league),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
  });
};

// Hook to fetch injuries for specific teams in a match
export const useMatchInjuries = (
  league: League,
  homeTeamName: string,
  awayTeamName: string
) => {
  return useQuery({
    queryKey: ['match-injuries', league, homeTeamName, awayTeamName],
    queryFn: async () => {
      const [homeInjuries, awayInjuries] = await Promise.all([
        fetchTeamInjuriesByName(league, homeTeamName),
        fetchTeamInjuriesByName(league, awayTeamName),
      ]);
      
      return {
        home: homeInjuries,
        away: awayInjuries,
        all: [...homeInjuries, ...awayInjuries],
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
    enabled: Boolean(league && homeTeamName && awayTeamName),
  });
};
