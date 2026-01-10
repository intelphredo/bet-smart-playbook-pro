// Sportradar Game Service
// Fetches game data, boxscores, and match intelligence

import { API_CONFIGS } from '@/config/apiConfig';
import { 
  SportLeague, 
  SportradarGame,
  SportradarBoxscore,
  SportradarMatchIntelligence
} from '@/types/sportradar';
import { 
  fetchSportradar, 
  formatDateForApi,
  CACHE_DURATION, 
  shouldUseMockData 
} from './sportradarCore';
import { getTeamInjuries, calculateInjuryImpact } from './injuriesService';
import { getTeamStanding, getTeamForm } from './standingsService';

// Mock game data
const MOCK_GAMES: SportradarGame[] = [
  {
    id: 'game-1',
    status: 'scheduled',
    scheduledTime: new Date(Date.now() + 3600000).toISOString(),
    homeTeam: {
      id: 'team-lal',
      name: 'Lakers',
      market: 'Los Angeles',
      alias: 'LAL'
    },
    awayTeam: {
      id: 'team-gsw',
      name: 'Warriors',
      market: 'Golden State',
      alias: 'GSW'
    },
    venue: {
      id: 'venue-crypto',
      name: 'Crypto.com Arena',
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
      capacity: 19068
    }
  }
];

// Map API response to game
const mapApiGame = (apiGame: any, league: SportLeague): SportradarGame => {
  const statusMap: Record<string, SportradarGame['status']> = {
    'scheduled': 'scheduled',
    'created': 'scheduled',
    'inprogress': 'inprogress',
    'in_progress': 'inprogress',
    'halftime': 'halftime',
    'complete': 'complete',
    'closed': 'closed',
    'cancelled': 'cancelled',
    'postponed': 'postponed'
  };

  return {
    id: apiGame.id || '',
    status: statusMap[apiGame.status?.toLowerCase()] || 'scheduled',
    scheduledTime: apiGame.scheduled || apiGame.start_time || '',
    homeTeam: {
      id: apiGame.home?.id || '',
      name: apiGame.home?.name || '',
      market: apiGame.home?.market || '',
      alias: apiGame.home?.alias || ''
    },
    awayTeam: {
      id: apiGame.away?.id || '',
      name: apiGame.away?.name || '',
      market: apiGame.away?.market || '',
      alias: apiGame.away?.alias || ''
    },
    homeScore: apiGame.home_points || apiGame.home?.points,
    awayScore: apiGame.away_points || apiGame.away?.points,
    period: apiGame.period || apiGame.quarter,
    clock: apiGame.clock,
    venue: apiGame.venue ? {
      id: apiGame.venue.id,
      name: apiGame.venue.name,
      city: apiGame.venue.city,
      state: apiGame.venue.state,
      country: apiGame.venue.country,
      capacity: apiGame.venue.capacity
    } : undefined,
    broadcast: apiGame.broadcast ? { network: apiGame.broadcast.network } : undefined,
    weather: apiGame.weather
  };
};

// Fetch game boxscore
export const fetchGameBoxscore = async (
  league: SportLeague,
  gameId: string
): Promise<SportradarBoxscore | null> => {
  if (shouldUseMockData()) {
    return null;
  }

  try {
    const endpoints = API_CONFIGS.SPORTRADAR.ENDPOINTS[league] as Record<string, string>;
    const boxscoreEndpoint = endpoints?.GAME_BOXSCORE || endpoints?.MATCH_SUMMARY;
    if (!boxscoreEndpoint) {
      console.warn(`[Game] No boxscore endpoint for ${league}`);
      return null;
    }

    const response = await fetchSportradar<any>(
      boxscoreEndpoint,
      { game_id: gameId, league },
      { cacheDuration: 60000 } // 1 minute for live games
    );

    const data = response.data;
    return {
      game: mapApiGame(data, league),
      homeTeamStats: data.home?.statistics || {},
      awayTeamStats: data.away?.statistics || {},
      homePlayerStats: data.home?.players || [],
      awayPlayerStats: data.away?.players || [],
      leaders: data.leaders
    };
  } catch (error) {
    console.error(`[Game] Error fetching boxscore for ${gameId}:`, error);
    return null;
  }
};

// Fetch game summary
export const fetchGameSummary = async (
  league: SportLeague,
  gameId: string
): Promise<SportradarGame | null> => {
  if (shouldUseMockData()) {
    return MOCK_GAMES.find(g => g.id === gameId) || null;
  }

  try {
    const endpoints = API_CONFIGS.SPORTRADAR.ENDPOINTS[league] as Record<string, string>;
    const summaryEndpoint = endpoints?.GAME_SUMMARY || endpoints?.GAME_BOXSCORE || endpoints?.MATCH_SUMMARY;
    
    if (!summaryEndpoint) {
      console.warn(`[Game] No game summary endpoint for ${league}`);
      return null;
    }

    const response = await fetchSportradar<any>(
      summaryEndpoint,
      { game_id: gameId, league },
      { cacheDuration: 60000 }
    );

    return mapApiGame(response.data, league);
  } catch (error) {
    console.error(`[Game] Error fetching game summary for ${gameId}:`, error);
    return null;
  }
};

// Fetch daily schedule
export const fetchDailySchedule = async (
  league: SportLeague,
  date: Date = new Date()
): Promise<SportradarGame[]> => {
  if (shouldUseMockData()) {
    return MOCK_GAMES;
  }

  try {
    const endpoints = API_CONFIGS.SPORTRADAR.ENDPOINTS[league] as Record<string, string>;
    const scheduleEndpoint = endpoints?.SCHEDULE;
    
    if (!scheduleEndpoint) {
      console.warn(`[Game] No schedule endpoint for ${league}`);
      return [];
    }

    const dateParams = formatDateForApi(date);
    const response = await fetchSportradar<any>(
      scheduleEndpoint,
      { ...dateParams, league },
      { cacheDuration: CACHE_DURATION }
    );

    const games = response.data.games || response.data.events || response.data.matches || [];
    return games.map((g: any) => mapApiGame(g, league));
  } catch (error) {
    console.error(`[Game] Error fetching daily schedule:`, error);
    return [];
  }
};

// Get comprehensive match intelligence
export const getMatchIntelligence = async (
  league: SportLeague,
  homeTeamId: string,
  awayTeamId: string,
  gameId?: string
): Promise<SportradarMatchIntelligence> => {
  // Fetch all data in parallel
  const [
    homeInjuries,
    awayInjuries,
    homeStanding,
    awayStanding
  ] = await Promise.all([
    getTeamInjuries(league, homeTeamId),
    getTeamInjuries(league, awayTeamId),
    getTeamStanding(league, homeTeamId),
    getTeamStanding(league, awayTeamId)
  ]);

  // Calculate betting impact factors
  const homeInjuryImpact = calculateInjuryImpact(homeInjuries);
  const awayInjuryImpact = calculateInjuryImpact(awayInjuries);
  const injuryDiff = awayInjuryImpact - homeInjuryImpact; // Positive = favors home

  // Form impact
  const homeForm = homeStanding ? getTeamForm(homeStanding) : [];
  const awayForm = awayStanding ? getTeamForm(awayStanding) : [];
  const homeFormScore = homeForm.filter(f => f === 'W').length * 20;
  const awayFormScore = awayForm.filter(f => f === 'W').length * 20;
  const formImpact = homeFormScore - awayFormScore;

  // Key players out (players with 'out' status)
  const keyPlayersOut = [
    ...homeInjuries.filter(i => i.status === 'out'),
    ...awayInjuries.filter(i => i.status === 'out')
  ].map(i => ({
    id: i.playerId,
    name: i.playerName,
    fullName: i.playerName,
    firstName: i.playerName.split(' ')[0],
    lastName: i.playerName.split(' ').slice(1).join(' '),
    position: i.position,
    jerseyNumber: '',
    teamId: i.teamId,
    height: '',
    weight: '',
    birthDate: '',
    experience: 0,
    status: 'injured' as const
  }));

  return {
    gameId: gameId || `${homeTeamId}-vs-${awayTeamId}`,
    homeTeamInjuries: homeInjuries,
    awayTeamInjuries: awayInjuries,
    homeTeamStanding: homeStanding || undefined,
    awayTeamStanding: awayStanding || undefined,
    homeTeamForm: homeForm,
    awayTeamForm: awayForm,
    keyPlayersOut,
    bettingImpact: {
      injuryImpact: Math.max(-100, Math.min(100, injuryDiff)),
      formImpact: Math.max(-100, Math.min(100, formImpact)),
      homeAdvantage: 10, // Base home advantage
      restAdvantage: 0 // Would need schedule data
    }
  };
};
