// Sportradar Injuries Service
// Fetches and maps injury data for all sports via edge function

import { SportLeague, SportradarInjury, InjuryStatus } from '@/types/sportradar';
import { 
  fetchSportradar, 
  INJURY_CACHE_DURATION, 
  shouldUseMockData 
} from './sportradarCore';

// Mock injury data for development
const MOCK_INJURIES: Record<SportLeague, SportradarInjury[]> = {
  NBA: [
    {
      id: 'inj-nba-1',
      playerId: 'player-lebron',
      playerName: 'LeBron James',
      team: 'Los Angeles Lakers',
      teamId: 'team-lal',
      position: 'F',
      status: 'questionable',
      description: 'Left ankle soreness',
      injuryType: 'Ankle',
      startDate: '2024-01-15',
      expectedReturn: '2024-01-20',
      practice: 'limited',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'inj-nba-2',
      playerId: 'player-curry',
      playerName: 'Stephen Curry',
      team: 'Golden State Warriors',
      teamId: 'team-gsw',
      position: 'G',
      status: 'out',
      description: 'Right knee sprain',
      injuryType: 'Knee',
      startDate: '2024-01-10',
      expectedReturn: '2024-01-25',
      practice: 'did-not-participate',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'inj-nba-3',
      playerId: 'player-embiid',
      playerName: 'Joel Embiid',
      team: 'Philadelphia 76ers',
      teamId: 'team-phi',
      position: 'C',
      status: 'day-to-day',
      description: 'Left knee injury management',
      injuryType: 'Knee',
      startDate: '2024-01-01',
      practice: 'limited',
      updatedAt: new Date().toISOString()
    }
  ],
  NFL: [
    {
      id: 'inj-nfl-1',
      playerId: 'player-mahomes',
      playerName: 'Patrick Mahomes',
      team: 'Kansas City Chiefs',
      teamId: 'team-kc',
      position: 'QB',
      status: 'probable',
      description: 'Right ankle',
      injuryType: 'Ankle',
      startDate: '2024-01-12',
      practice: 'full',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'inj-nfl-2',
      playerId: 'player-henry',
      playerName: 'Derrick Henry',
      team: 'Tennessee Titans',
      teamId: 'team-ten',
      position: 'RB',
      status: 'questionable',
      description: 'Hamstring',
      injuryType: 'Hamstring',
      startDate: '2024-01-14',
      practice: 'limited',
      updatedAt: new Date().toISOString()
    }
  ],
  MLB: [
    {
      id: 'inj-mlb-1',
      playerId: 'player-ohtani',
      playerName: 'Shohei Ohtani',
      team: 'Los Angeles Dodgers',
      teamId: 'team-lad',
      position: 'DH',
      status: 'out',
      description: 'Right elbow UCL surgery recovery',
      injuryType: 'Elbow',
      startDate: '2023-09-20',
      expectedReturn: '2025-04-01',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'inj-mlb-2',
      playerId: 'player-trout',
      playerName: 'Mike Trout',
      team: 'Los Angeles Angels',
      teamId: 'team-laa',
      position: 'CF',
      status: 'day-to-day',
      description: 'Left knee soreness',
      injuryType: 'Knee',
      startDate: '2024-01-10',
      updatedAt: new Date().toISOString()
    }
  ],
  NHL: [
    {
      id: 'inj-nhl-1',
      playerId: 'player-mcdavid',
      playerName: 'Connor McDavid',
      team: 'Edmonton Oilers',
      teamId: 'team-edm',
      position: 'C',
      status: 'probable',
      description: 'Upper body',
      injuryType: 'Upper Body',
      startDate: '2024-01-14',
      practice: 'full',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'inj-nhl-2',
      playerId: 'player-crosby',
      playerName: 'Sidney Crosby',
      team: 'Pittsburgh Penguins',
      teamId: 'team-pit',
      position: 'C',
      status: 'questionable',
      description: 'Lower body',
      injuryType: 'Lower Body',
      startDate: '2024-01-13',
      practice: 'limited',
      updatedAt: new Date().toISOString()
    }
  ],
  SOCCER: [
    {
      id: 'inj-soccer-1',
      playerId: 'player-haaland',
      playerName: 'Erling Haaland',
      team: 'Manchester City',
      teamId: 'team-mci',
      position: 'ST',
      status: 'doubtful',
      description: 'Foot injury',
      injuryType: 'Foot',
      startDate: '2024-01-10',
      expectedReturn: '2024-01-22',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'inj-soccer-2',
      playerId: 'player-salah',
      playerName: 'Mohamed Salah',
      team: 'Liverpool',
      teamId: 'team-liv',
      position: 'RW',
      status: 'probable',
      description: 'Hamstring tightness',
      injuryType: 'Hamstring',
      startDate: '2024-01-15',
      practice: 'full',
      updatedAt: new Date().toISOString()
    }
  ]
};

// Map API response to our injury type
const mapApiInjury = (apiInjury: any, league: SportLeague): SportradarInjury => {
  const statusMap: Record<string, InjuryStatus> = {
    'OUT': 'out',
    'DOUBTFUL': 'doubtful',
    'QUESTIONABLE': 'questionable',
    'PROBABLE': 'probable',
    'DAY-TO-DAY': 'day-to-day',
    'D2D': 'day-to-day',
    'IR': 'injured-reserve',
    'INJURED_RESERVE': 'injured-reserve',
    'O': 'out',
    'D': 'doubtful',
    'Q': 'questionable',
    'P': 'probable'
  };

  return {
    id: apiInjury.id || `injury-${apiInjury.player?.id || Math.random()}`,
    playerId: apiInjury.player?.id || '',
    playerName: apiInjury.player?.full_name || apiInjury.player?.name || 'Unknown',
    team: apiInjury.team?.name || apiInjury.team?.market || '',
    teamId: apiInjury.team?.id || '',
    position: apiInjury.player?.position || apiInjury.player?.primary_position || '',
    status: statusMap[apiInjury.status?.toUpperCase()] || 'questionable',
    description: apiInjury.desc || apiInjury.description || apiInjury.comment || '',
    injuryType: apiInjury.injury_type || apiInjury.type || 'Unknown',
    startDate: apiInjury.start_date || apiInjury.update_date || new Date().toISOString(),
    expectedReturn: apiInjury.expected_return || undefined,
    practice: apiInjury.practice_status?.toLowerCase() as any,
    comment: apiInjury.comment,
    updatedAt: apiInjury.update_date || new Date().toISOString()
  };
};

// Fetch league injuries via edge function
export const fetchLeagueInjuries = async (league: SportLeague): Promise<SportradarInjury[]> => {
  if (shouldUseMockData()) {
    console.log(`[Injuries] Using mock data for ${league}`);
    return MOCK_INJURIES[league] || [];
  }

  try {
    const response = await fetchSportradar<any>(
      league,
      'INJURIES',
      { cacheDuration: INJURY_CACHE_DURATION }
    );

    // Extract injuries from response (structure varies by sport)
    let injuries: any[] = [];
    
    if (response.data.teams) {
      // NBA/NFL format: injuries nested under teams
      response.data.teams.forEach((team: any) => {
        if (team.players) {
          team.players.forEach((player: any) => {
            if (player.injuries?.length > 0) {
              injuries.push(...player.injuries.map((inj: any) => ({
                ...inj,
                player,
                team
              })));
            }
          });
        }
      });
    } else if (response.data.injuries) {
      injuries = response.data.injuries;
    } else if (response.data.players) {
      injuries = response.data.players.filter((p: any) => p.injury);
    }

    return injuries.map(inj => mapApiInjury(inj, league));
  } catch (error) {
    console.error(`[Injuries] Error fetching ${league} injuries:`, error);
    return MOCK_INJURIES[league] || [];
  }
};

// Fetch daily injuries for a specific date (uses same INJURIES endpoint)
export const fetchDailyInjuries = async (
  league: SportLeague, 
  date: Date = new Date()
): Promise<SportradarInjury[]> => {
  // Edge function currently only supports INJURIES, not DAILY_INJURIES
  return fetchLeagueInjuries(league);
};

// Get injuries for a specific team
export const getTeamInjuries = async (
  league: SportLeague, 
  teamId: string
): Promise<SportradarInjury[]> => {
  const allInjuries = await fetchLeagueInjuries(league);
  return allInjuries.filter(inj => 
    inj.teamId === teamId || 
    inj.team.toLowerCase().includes(teamId.toLowerCase())
  );
};

// Get injury impact score for a team (0-100, higher = more impacted)
export const calculateInjuryImpact = (injuries: SportradarInjury[]): number => {
  if (injuries.length === 0) return 0;

  const statusWeights: Record<InjuryStatus, number> = {
    'out': 100,
    'out-for-season': 100,
    'injured-reserve': 90,
    'doubtful': 75,
    'questionable': 50,
    'day-to-day': 40,
    'probable': 20
  };

  // Position importance weights
  const positionWeights: Record<string, number> = {
    'QB': 2.0, 'C': 1.5, 'PG': 1.5, 'G': 1.3,
    'RB': 1.3, 'WR': 1.2, 'F': 1.2, 'ST': 1.4,
    'TE': 1.1, 'LT': 1.2, 'RT': 1.2,
    'CB': 1.2, 'S': 1.1, 'LB': 1.1,
    'DE': 1.1, 'DT': 1.0
  };

  let totalImpact = 0;
  injuries.forEach(injury => {
    const statusWeight = statusWeights[injury.status] || 50;
    const posWeight = positionWeights[injury.position?.toUpperCase()] || 1.0;
    totalImpact += (statusWeight * posWeight);
  });

  // Normalize to 0-100 scale
  return Math.min(100, Math.round(totalImpact / Math.max(injuries.length * 50, 1) * 50));
};

// Get all injuries across all leagues
export const fetchAllInjuries = async (): Promise<Record<SportLeague, SportradarInjury[]>> => {
  const leagues: SportLeague[] = ['NBA', 'NFL', 'MLB', 'NHL', 'SOCCER'];
  
  const results = await Promise.all(
    leagues.map(league => fetchLeagueInjuries(league))
  );

  return leagues.reduce((acc, league, index) => {
    acc[league] = results[index];
    return acc;
  }, {} as Record<SportLeague, SportradarInjury[]>);
};
