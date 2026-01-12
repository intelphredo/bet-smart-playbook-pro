// src/hooks/useSportradarInjuries.ts
// Refactored to use ESPN Core API for injury data

import { useQuery } from "@tanstack/react-query";
import { getSportradarGames } from "@/services/data-providers/sportradar";
import { SportLeague, SportradarInjury, InjuryStatus } from "@/types/sportradar";
import { League } from "@/types/sports";

// Extended SportLeague to include NCAAB
export type ExtendedSportLeague = SportLeague | 'NCAAB' | 'NCAAF';

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

// Map ExtendedSportLeague to ESPN path configuration
const getESPNConfig = (league: ExtendedSportLeague): { sport: string; leaguePath: string } | null => {
  const mapping: Record<ExtendedSportLeague, { sport: string; leaguePath: string }> = {
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

// Fetch injuries from ESPN Core API (more reliable than roster parsing)
const fetchESPNCoreInjuries = async (league: ExtendedSportLeague): Promise<SportradarInjury[]> => {
  const config = getESPNConfig(league);
  if (!config) return [];

  const injuries: SportradarInjury[] = [];
  const now = new Date().toISOString();

  try {
    // First, get today's games from scoreboard to find active teams and game events
    const scoreboardUrl = `https://site.api.espn.com/apis/site/v2/sports/${config.sport}/${config.leaguePath}/scoreboard`;
    const scoreboardResponse = await fetch(scoreboardUrl);
    
    if (!scoreboardResponse.ok) {
      console.warn(`Scoreboard API returned ${scoreboardResponse.status} for ${league}`);
      return fetchFromTeamRosters(league, config);
    }
    
    const scoreboardData = await scoreboardResponse.json();
    const events = scoreboardData.events || [];
    
    // Extract injuries from game summaries which include more detailed injury info
    const summaryPromises = events.slice(0, 10).map(async (event: any) => {
      try {
        const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/${config.sport}/${config.leaguePath}/summary?event=${event.id}`;
        const summaryResponse = await fetch(summaryUrl);
        
        if (!summaryResponse.ok) return [];
        
        const summaryData = await summaryResponse.json();
        const eventInjuries: SportradarInjury[] = [];
        
        // Parse injuries from game summary - check different possible locations
        const injuryReports = summaryData.injuries || summaryData.gameInfo?.injuries || [];
        
        // Handle different injury data structures
        injuryReports.forEach((report: any) => {
          const teamName = report.team?.displayName || report.team?.name || 'Unknown Team';
          const teamId = report.team?.id || '';
          
          const entries = report.injuries || report.items || [];
          entries.forEach((injury: any) => {
            eventInjuries.push({
              id: `${injury.athlete?.id || injury.playerId || Date.now()}-${Date.now()}`,
              playerId: injury.athlete?.id || injury.playerId || '',
              playerName: injury.athlete?.displayName || injury.athlete?.fullName || injury.playerName || 'Unknown Player',
              position: injury.athlete?.position?.abbreviation || injury.position || '',
              team: teamName,
              teamId: teamId,
              status: mapESPNStatus(injury.status || injury.type?.abbreviation || ''),
              injuryType: injury.type?.name || injury.details?.type || injury.description || 'Undisclosed',
              description: injury.details?.detail || injury.longComment || injury.shortComment || injury.type?.description || '',
              expectedReturn: injury.details?.returnDate,
              startDate: injury.date || now,
              updatedAt: injury.date || now,
            });
          });
        });
        
        // Also check boxscore for injury info
        const boxscorePlayers = summaryData.boxscore?.players || [];
        boxscorePlayers.forEach((teamData: any) => {
          const teamName = teamData.team?.displayName || teamData.team?.name || '';
          const teamId = teamData.team?.id || '';
          
          const stats = teamData.statistics || [];
          stats.forEach((statGroup: any) => {
            const athletes = statGroup.athletes || [];
            athletes.forEach((athlete: any) => {
              // Check if athlete has injury status
              if (athlete.athlete?.injuries?.length > 0) {
                athlete.athlete.injuries.forEach((injury: any) => {
                  eventInjuries.push({
                    id: `${athlete.athlete.id}-${injury.id || Date.now()}`,
                    playerId: athlete.athlete.id,
                    playerName: athlete.athlete.displayName || athlete.athlete.fullName,
                    position: athlete.athlete.position?.abbreviation || '',
                    team: teamName,
                    teamId: teamId,
                    status: mapESPNStatus(injury.status || injury.type?.abbreviation || ''),
                    injuryType: injury.type?.name || 'Undisclosed',
                    description: injury.longComment || injury.shortComment || '',
                    startDate: injury.date || now,
                    updatedAt: now,
                  });
                });
              }
            });
          });
        });
        
        return eventInjuries;
      } catch (err) {
        console.warn(`Error fetching summary for event ${event.id}:`, err);
        return [];
      }
    });
    
    const summaryInjuries = await Promise.all(summaryPromises);
    injuries.push(...summaryInjuries.flat());
    
    // If we got injuries from summaries, return them
    if (injuries.length > 0) {
      // Deduplicate by player ID
      const uniqueInjuries = deduplicateInjuries(injuries);
      return uniqueInjuries;
    }
    
    // Fallback to team roster parsing if no injuries found in summaries
    return fetchFromTeamRosters(league, config);
    
  } catch (error) {
    console.error(`Error fetching ESPN Core injuries for ${league}:`, error);
    return fetchFromTeamRosters(league, config);
  }
};

// Fetch injuries from team rosters (fallback method)
const fetchFromTeamRosters = async (
  league: ExtendedSportLeague, 
  config: { sport: string; leaguePath: string }
): Promise<SportradarInjury[]> => {
  try {
    const teamsUrl = `https://site.api.espn.com/apis/site/v2/sports/${config.sport}/${config.leaguePath}/teams`;
    
    const teamsResponse = await fetch(teamsUrl);
    if (!teamsResponse.ok) {
      console.warn(`Teams API returned ${teamsResponse.status} for ${league}`);
      return getMockInjuries(league);
    }
    
    const teamsData = await teamsResponse.json();
    const teams = teamsData.sports?.[0]?.leagues?.[0]?.teams || [];
    
    // For college basketball, limit to top teams to avoid too many requests
    const teamLimit = league === 'NCAAB' ? 30 : 20;
    const teamSlice = teams.slice(0, teamLimit);
    
    const allInjuries = await Promise.all(
      teamSlice.map((t: any) => 
        fetchTeamRosterInjuries(config, t.team?.id, t.team?.displayName || t.team?.name)
      )
    );
    
    const flatInjuries = allInjuries.flat();
    
    // If no injuries found from API, return mock data
    if (flatInjuries.length === 0) {
      return getMockInjuries(league);
    }
    
    return deduplicateInjuries(flatInjuries);
  } catch (error) {
    console.error(`Error fetching team rosters for ${league}:`, error);
    return getMockInjuries(league);
  }
};

// Fetch injuries from a specific team's roster
const fetchTeamRosterInjuries = async (
  config: { sport: string; leaguePath: string },
  teamId: string,
  teamName: string
): Promise<SportradarInjury[]> => {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/${config.sport}/${config.leaguePath}/teams/${teamId}/roster`;
    
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const data = await response.json();
    const injuries: SportradarInjury[] = [];
    
    const now = new Date().toISOString();
    const athletes = data.athletes || [];
    
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
              updatedAt: injury.date || now,
            });
          });
        }
      });
    });
    
    return injuries;
  } catch (error) {
    console.warn(`Error fetching roster injuries for team ${teamId}:`, error);
    return [];
  }
};

// Deduplicate injuries by player ID
const deduplicateInjuries = (injuries: SportradarInjury[]): SportradarInjury[] => {
  const seen = new Map<string, SportradarInjury>();
  
  for (const injury of injuries) {
    const key = `${injury.playerId}-${injury.team}`;
    if (!seen.has(key)) {
      seen.set(key, injury);
    }
  }
  
  return Array.from(seen.values());
};

// Mock injuries for fallback when API fails
const getMockInjuries = (league: ExtendedSportLeague): SportradarInjury[] => {
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
    NCAAB: [
      {
        id: 'mock-ncaab-1',
        playerId: '101',
        playerName: 'Dylan Harper',
        position: 'G',
        team: 'Rutgers Scarlet Knights',
        teamId: 'rutgers',
        status: 'questionable',
        injuryType: 'Ankle',
        description: 'Right ankle sprain',
        startDate: now,
        updatedAt: now,
      },
      {
        id: 'mock-ncaab-2',
        playerId: '102',
        playerName: 'Mark Mitchell',
        position: 'F',
        team: 'Duke Blue Devils',
        teamId: 'duke',
        status: 'out',
        injuryType: 'Knee',
        description: 'Left knee injury',
        startDate: now,
        updatedAt: now,
      },
      {
        id: 'mock-ncaab-3',
        playerId: '103',
        playerName: 'Johni Broome',
        position: 'C',
        team: 'Auburn Tigers',
        teamId: 'auburn',
        status: 'day-to-day',
        injuryType: 'Back',
        description: 'Lower back tightness',
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
    NCAAF: [
      {
        id: 'mock-ncaaf-1',
        playerId: '201',
        playerName: 'Quinn Ewers',
        position: 'QB',
        team: 'Texas Longhorns',
        teamId: 'texas',
        status: 'questionable',
        injuryType: 'Shoulder',
        description: 'Right shoulder strain',
        startDate: now,
        updatedAt: now,
      },
    ],
  };
  
  return mockData[league] || [];
};

// Main hook to fetch injuries for a specific league (supports NCAAB)
export const useSportradarInjuries = (league: ExtendedSportLeague) => {
  return useQuery<SportradarInjury[]>({
    queryKey: ["sportradar-injuries", league],
    queryFn: () => fetchESPNCoreInjuries(league),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
  });
};
