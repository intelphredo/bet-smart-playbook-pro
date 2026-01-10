// Sportradar Player Service
// Fetches player profiles, stats, and league leaders

import { API_CONFIGS } from '@/config/apiConfig';
import { 
  SportLeague, 
  SportradarPlayer, 
  SportradarPlayerStats,
  SportradarLeagueLeader 
} from '@/types/sportradar';
import { 
  fetchSportradar, 
  getSeasonParams, 
  CACHE_DURATION, 
  shouldUseMockData 
} from './sportradarCore';

// Mock player data
const MOCK_PLAYERS: SportradarPlayer[] = [
  {
    id: 'player-lebron',
    name: 'LeBron James',
    fullName: 'LeBron Raymone James',
    firstName: 'LeBron',
    lastName: 'James',
    position: 'F',
    jerseyNumber: '23',
    teamId: 'team-lal',
    teamName: 'Los Angeles Lakers',
    height: '6-9',
    weight: '250',
    birthDate: '1984-12-30',
    college: 'None (High School)',
    draftYear: 2003,
    draftRound: 1,
    draftPick: 1,
    experience: 21,
    status: 'active'
  },
  {
    id: 'player-curry',
    name: 'Stephen Curry',
    fullName: 'Wardell Stephen Curry II',
    firstName: 'Stephen',
    lastName: 'Curry',
    position: 'G',
    jerseyNumber: '30',
    teamId: 'team-gsw',
    teamName: 'Golden State Warriors',
    height: '6-2',
    weight: '185',
    birthDate: '1988-03-14',
    college: 'Davidson',
    draftYear: 2009,
    draftRound: 1,
    draftPick: 7,
    experience: 15,
    status: 'active'
  }
];

// Mock league leaders
const MOCK_LEADERS: Record<SportLeague, SportradarLeagueLeader[]> = {
  NBA: [
    {
      category: 'points',
      categoryDisplayName: 'Points Per Game',
      league: 'NBA',
      players: [
        { rank: 1, player: MOCK_PLAYERS[0], value: 28.5, displayValue: '28.5 PPG' },
        { rank: 2, player: MOCK_PLAYERS[1], value: 27.2, displayValue: '27.2 PPG' }
      ]
    },
    {
      category: 'assists',
      categoryDisplayName: 'Assists Per Game',
      league: 'NBA',
      players: [
        { rank: 1, player: MOCK_PLAYERS[0], value: 8.1, displayValue: '8.1 APG' }
      ]
    }
  ],
  NFL: [],
  MLB: [],
  NHL: [],
  SOCCER: []
};

// Map API response to player
const mapApiPlayer = (apiPlayer: any): SportradarPlayer => {
  return {
    id: apiPlayer.id || '',
    name: apiPlayer.name || apiPlayer.full_name || `${apiPlayer.first_name} ${apiPlayer.last_name}`,
    fullName: apiPlayer.full_name || `${apiPlayer.first_name || ''} ${apiPlayer.last_name || ''}`.trim(),
    firstName: apiPlayer.first_name || '',
    lastName: apiPlayer.last_name || '',
    position: apiPlayer.position || apiPlayer.primary_position || '',
    primaryPosition: apiPlayer.primary_position,
    jerseyNumber: apiPlayer.jersey_number?.toString() || '',
    teamId: apiPlayer.team?.id || '',
    teamName: apiPlayer.team?.name || '',
    height: apiPlayer.height ? `${Math.floor(apiPlayer.height / 12)}-${apiPlayer.height % 12}` : '',
    weight: apiPlayer.weight?.toString() || '',
    birthDate: apiPlayer.birth_date || apiPlayer.birthdate || '',
    birthPlace: apiPlayer.birth_place,
    college: apiPlayer.college,
    draftYear: apiPlayer.draft?.year,
    draftRound: apiPlayer.draft?.round,
    draftPick: apiPlayer.draft?.pick,
    experience: apiPlayer.experience || 0,
    status: (apiPlayer.status || 'active').toLowerCase() as any,
    injuryStatus: apiPlayer.injury_status,
    photoUrl: apiPlayer.headshot_url || apiPlayer.photo_url
  };
};

// Fetch player profile
export const fetchPlayerProfile = async (
  league: SportLeague,
  playerId: string
): Promise<SportradarPlayer | null> => {
  if (shouldUseMockData()) {
    return MOCK_PLAYERS.find(p => p.id === playerId) || null;
  }

  try {
    const endpoints = API_CONFIGS.SPORTRADAR.ENDPOINTS[league];
    if (!endpoints?.PLAYER_PROFILE) {
      console.warn(`[Player] No player profile endpoint for ${league}`);
      return null;
    }

    const response = await fetchSportradar<any>(
      endpoints.PLAYER_PROFILE,
      { player_id: playerId, league },
      { cacheDuration: CACHE_DURATION }
    );

    return mapApiPlayer(response.data.player || response.data);
  } catch (error) {
    console.error(`[Player] Error fetching player ${playerId}:`, error);
    return null;
  }
};

// Fetch league leaders
export const fetchLeagueLeaders = async (
  league: SportLeague,
  category?: string
): Promise<SportradarLeagueLeader[]> => {
  if (shouldUseMockData()) {
    const mockData = MOCK_LEADERS[league] || [];
    return category 
      ? mockData.filter(l => l.category === category) 
      : mockData;
  }

  try {
    const endpoints = API_CONFIGS.SPORTRADAR.ENDPOINTS[league];
    if (!endpoints?.LEAGUE_LEADERS) {
      console.warn(`[Player] No league leaders endpoint for ${league}`);
      return [];
    }

    const seasonParams = getSeasonParams(league);
    const params: Record<string, string | number> = {
      ...seasonParams,
      league
    };

    // Soccer needs competition_id
    if (league === 'SOCCER') {
      params.competition_id = API_CONFIGS.SPORTRADAR.SOCCER_COMPETITIONS.PREMIER_LEAGUE;
    }

    const response = await fetchSportradar<any>(
      endpoints.LEAGUE_LEADERS,
      params,
      { cacheDuration: CACHE_DURATION * 2 } // Leaders don't change often
    );

    // Map response to our format
    const leaders: SportradarLeagueLeader[] = [];
    const categories = response.data.categories || response.data.leaders || [];

    categories.forEach((cat: any) => {
      const categoryName = cat.name || cat.type || cat.category;
      const players = (cat.leaders || cat.players || []).map((p: any, idx: number) => ({
        rank: p.rank || idx + 1,
        player: mapApiPlayer(p.player || p),
        value: p.value || p.avg || p.total || 0,
        displayValue: `${p.value || p.avg || p.total || 0}`
      }));

      if (players.length > 0) {
        leaders.push({
          category: categoryName.toLowerCase().replace(/\s+/g, '_'),
          categoryDisplayName: categoryName,
          league,
          players
        });
      }
    });

    return category 
      ? leaders.filter(l => l.category === category)
      : leaders;
  } catch (error) {
    console.error(`[Player] Error fetching league leaders:`, error);
    return MOCK_LEADERS[league] || [];
  }
};

// Search players (simple implementation using team rosters)
export const searchPlayers = async (
  query: string,
  league?: SportLeague
): Promise<SportradarPlayer[]> => {
  if (shouldUseMockData()) {
    const lowerQuery = query.toLowerCase();
    return MOCK_PLAYERS.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      p.fullName.toLowerCase().includes(lowerQuery)
    );
  }

  // For real API, this would need to search through team rosters
  // or use a dedicated search endpoint if available
  console.log(`[Player] Search not implemented for API: ${query}`);
  return [];
};
