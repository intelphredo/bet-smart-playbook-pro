// Injuries Service
// Fetches and maps injury data for all sports via ESPN API (more reliable than Sportradar)

import { SportLeague, SportradarInjury, InjuryStatus } from '@/types/sportradar';
import { 
  INJURY_CACHE_DURATION, 
  shouldUseMockData,
  getCachedData,
  setCachedData
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

// Map league to ESPN API path configuration
const getESPNConfig = (league: SportLeague): { sport: string; leaguePath: string } | null => {
  const mapping: Record<SportLeague, { sport: string; leaguePath: string }> = {
    NBA: { sport: 'basketball', leaguePath: 'nba' },
    NFL: { sport: 'football', leaguePath: 'nfl' },
    MLB: { sport: 'baseball', leaguePath: 'mlb' },
    NHL: { sport: 'hockey', leaguePath: 'nhl' },
    SOCCER: { sport: 'soccer', leaguePath: 'eng.1' },
  };
  
  return mapping[league] || null;
};

// Fetch injuries from ESPN scoreboard/summary APIs
const fetchESPNInjuries = async (league: SportLeague): Promise<SportradarInjury[]> => {
  const config = getESPNConfig(league);
  if (!config) return MOCK_INJURIES[league] || [];

  const injuries: SportradarInjury[] = [];
  const now = new Date().toISOString();

  try {
    // Get today's games from scoreboard
    const scoreboardUrl = `https://site.api.espn.com/apis/site/v2/sports/${config.sport}/${config.leaguePath}/scoreboard`;
    const scoreboardResponse = await fetch(scoreboardUrl);
    
    if (!scoreboardResponse.ok) {
      console.warn(`[Injuries] ESPN Scoreboard returned ${scoreboardResponse.status} for ${league}`);
      return MOCK_INJURIES[league] || [];
    }
    
    const scoreboardData = await scoreboardResponse.json();
    const events = scoreboardData.events || [];
    
    // Extract injuries from game summaries (up to 10 games)
    const summaryPromises = events.slice(0, 10).map(async (event: any) => {
      try {
        const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/${config.sport}/${config.leaguePath}/summary?event=${event.id}`;
        const summaryResponse = await fetch(summaryUrl);
        
        if (!summaryResponse.ok) return [];
        
        const summaryData = await summaryResponse.json();
        const eventInjuries: SportradarInjury[] = [];
        
        // Parse injuries from game summary
        const injuryReports = summaryData.injuries || summaryData.gameInfo?.injuries || [];
        
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
        
        return eventInjuries;
      } catch (err) {
        console.warn(`[Injuries] Error fetching summary for event ${event.id}:`, err);
        return [];
      }
    });
    
    const summaryInjuries = await Promise.all(summaryPromises);
    injuries.push(...summaryInjuries.flat());
    
    // Deduplicate by player ID
    const seen = new Set<string>();
    const unique = injuries.filter(inj => {
      const key = inj.playerId || inj.playerName;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    
    return unique.length > 0 ? unique : (MOCK_INJURIES[league] || []);
  } catch (error) {
    console.error(`[Injuries] ESPN fetch error for ${league}:`, error);
    return MOCK_INJURIES[league] || [];
  }
};

// Fetch league injuries via ESPN (primary) with caching
export const fetchLeagueInjuries = async (league: SportLeague): Promise<SportradarInjury[]> => {
  if (shouldUseMockData()) {
    console.log(`[Injuries] Using mock data for ${league}`);
    return MOCK_INJURIES[league] || [];
  }

  // Check cache first
  const cacheKey = `injuries:${league}`;
  const cached = getCachedData<SportradarInjury[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const injuries = await fetchESPNInjuries(league);
    // Cache the result
    setCachedData(cacheKey, injuries, INJURY_CACHE_DURATION);
    return injuries;
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
