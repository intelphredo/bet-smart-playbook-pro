// Sportradar Game Service
// Fetches game data, boxscores, and match intelligence

import { 
  SportLeague, 
  SportradarGame,
  SportradarBoxscore,
  SportradarMatchIntelligence
} from '@/types/sportradar';
import { 
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

// Fetch game boxscore (not currently supported via edge function)
export const fetchGameBoxscore = async (
  league: SportLeague,
  gameId: string
): Promise<SportradarBoxscore | null> => {
  // Edge function doesn't currently support game boxscores
  console.debug(`[Game] Boxscore not supported via edge function for ${gameId}`);
  return null;
};

// Fetch game summary (not currently supported via edge function)
export const fetchGameSummary = async (
  league: SportLeague,
  gameId: string
): Promise<SportradarGame | null> => {
  if (shouldUseMockData()) {
    return MOCK_GAMES.find(g => g.id === gameId) || null;
  }

  // Edge function doesn't currently support game summaries
  console.debug(`[Game] Game summary not supported via edge function for ${gameId}`);
  return MOCK_GAMES.find(g => g.id === gameId) || null;
};

// Fetch daily schedule (not currently supported via edge function)
export const fetchDailySchedule = async (
  league: SportLeague,
  date: Date = new Date()
): Promise<SportradarGame[]> => {
  if (shouldUseMockData()) {
    return MOCK_GAMES;
  }

  // Edge function doesn't currently support schedules
  // Live game data comes from ESPN which is more reliable
  console.debug(`[Game] Daily schedule not supported via edge function, use ESPN instead`);
  return [];
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
