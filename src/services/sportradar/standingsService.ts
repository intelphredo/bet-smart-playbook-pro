// Sportradar Standings Service
// Fetches and maps standings data for all sports via edge function

import { API_CONFIGS } from '@/config/apiConfig';
import { SportLeague, SportradarStanding, PlayoffPosition } from '@/types/sportradar';
import { 
  fetchSportradar, 
  getSeasonParams, 
  STANDINGS_CACHE_DURATION, 
  shouldUseMockData 
} from './sportradarCore';

// Mock standings data for development
const MOCK_STANDINGS: Record<SportLeague, SportradarStanding[]> = {
  NBA: [
    {
      teamId: 'team-bos', teamName: 'Boston Celtics', market: 'Boston', alias: 'BOS',
      conference: 'Eastern', division: 'Atlantic',
      wins: 35, losses: 10, winPct: 0.778, gamesBack: 0,
      streak: { kind: 'win', length: 5 },
      homeRecord: '20-3', awayRecord: '15-7', last10: '8-2',
      pointsFor: 120.5, pointsAgainst: 108.2, pointDiff: 12.3,
      confRank: 1, divRank: 1, playoffPosition: 'clinched', clinched: true
    },
    {
      teamId: 'team-mil', teamName: 'Milwaukee Bucks', market: 'Milwaukee', alias: 'MIL',
      conference: 'Eastern', division: 'Central',
      wins: 30, losses: 15, winPct: 0.667, gamesBack: 5,
      streak: { kind: 'win', length: 2 },
      homeRecord: '18-5', awayRecord: '12-10', last10: '6-4',
      pointsFor: 118.2, pointsAgainst: 113.5, pointDiff: 4.7,
      confRank: 2, divRank: 1, playoffPosition: 'in'
    },
    {
      teamId: 'team-okc', teamName: 'Oklahoma City Thunder', market: 'Oklahoma City', alias: 'OKC',
      conference: 'Western', division: 'Northwest',
      wins: 33, losses: 11, winPct: 0.750, gamesBack: 0,
      streak: { kind: 'win', length: 4 },
      homeRecord: '19-3', awayRecord: '14-8', last10: '7-3',
      pointsFor: 119.8, pointsAgainst: 109.1, pointDiff: 10.7,
      confRank: 1, divRank: 1, playoffPosition: 'clinched', clinched: true
    }
  ],
  NFL: [
    {
      teamId: 'team-sf', teamName: 'San Francisco 49ers', market: 'San Francisco', alias: 'SF',
      conference: 'NFC', division: 'West',
      wins: 12, losses: 5, ties: 0, winPct: 0.706, gamesBack: 0,
      streak: { kind: 'win', length: 3 },
      homeRecord: '7-2', awayRecord: '5-3', last10: '7-3',
      pointsFor: 28.5, pointsAgainst: 18.2, pointDiff: 10.3,
      confRank: 1, divRank: 1, playoffPosition: 'clinched', clinched: true
    },
    {
      teamId: 'team-kc', teamName: 'Kansas City Chiefs', market: 'Kansas City', alias: 'KC',
      conference: 'AFC', division: 'West',
      wins: 11, losses: 6, ties: 0, winPct: 0.647, gamesBack: 0,
      streak: { kind: 'win', length: 2 },
      homeRecord: '6-3', awayRecord: '5-3', last10: '6-4',
      pointsFor: 25.8, pointsAgainst: 20.1, pointDiff: 5.7,
      confRank: 2, divRank: 1, playoffPosition: 'in'
    }
  ],
  MLB: [
    {
      teamId: 'team-lad', teamName: 'Los Angeles Dodgers', market: 'Los Angeles', alias: 'LAD',
      conference: 'National', division: 'West',
      wins: 100, losses: 62, winPct: 0.617, gamesBack: 0,
      streak: { kind: 'win', length: 4 },
      homeRecord: '55-26', awayRecord: '45-36', last10: '7-3',
      pointsFor: 5.2, pointsAgainst: 4.1, pointDiff: 1.1,
      confRank: 1, divRank: 1, playoffPosition: 'clinched', clinched: true
    },
    {
      teamId: 'team-atl', teamName: 'Atlanta Braves', market: 'Atlanta', alias: 'ATL',
      conference: 'National', division: 'East',
      wins: 98, losses: 64, winPct: 0.605, gamesBack: 2,
      streak: { kind: 'loss', length: 1 },
      homeRecord: '52-29', awayRecord: '46-35', last10: '6-4',
      pointsFor: 5.0, pointsAgainst: 4.0, pointDiff: 1.0,
      confRank: 2, divRank: 1, playoffPosition: 'in'
    }
  ],
  NHL: [
    {
      teamId: 'team-bos-nhl', teamName: 'Boston Bruins', market: 'Boston', alias: 'BOS',
      conference: 'Eastern', division: 'Atlantic',
      wins: 32, losses: 8, ties: 5, winPct: 0.767, gamesBack: 0,
      streak: { kind: 'win', length: 6 },
      homeRecord: '18-2-2', awayRecord: '14-6-3', last10: '8-1-1',
      pointsFor: 3.8, pointsAgainst: 2.5, pointDiff: 1.3,
      confRank: 1, divRank: 1, playoffPosition: 'clinched', clinched: true
    },
    {
      teamId: 'team-van', teamName: 'Vancouver Canucks', market: 'Vancouver', alias: 'VAN',
      conference: 'Western', division: 'Pacific',
      wins: 28, losses: 12, ties: 4, winPct: 0.682, gamesBack: 0,
      streak: { kind: 'win', length: 3 },
      homeRecord: '16-4-2', awayRecord: '12-8-2', last10: '7-2-1',
      pointsFor: 3.5, pointsAgainst: 2.8, pointDiff: 0.7,
      confRank: 1, divRank: 1, playoffPosition: 'in'
    }
  ],
  SOCCER: [
    {
      teamId: 'team-liv', teamName: 'Liverpool', market: 'Liverpool', alias: 'LIV',
      conference: 'Premier League', division: '',
      wins: 18, losses: 2, ties: 3, winPct: 0.848, gamesBack: 0,
      streak: { kind: 'win', length: 4 },
      homeRecord: '10-0-1', awayRecord: '8-2-2', last10: '8-1-1',
      pointsFor: 52, pointsAgainst: 18, pointDiff: 34,
      confRank: 1, divRank: 1, playoffPosition: 'in'
    },
    {
      teamId: 'team-ars', teamName: 'Arsenal', market: 'Arsenal', alias: 'ARS',
      conference: 'Premier League', division: '',
      wins: 14, losses: 3, ties: 6, winPct: 0.739, gamesBack: 6,
      streak: { kind: 'win', length: 2 },
      homeRecord: '9-0-2', awayRecord: '5-3-4', last10: '6-2-2',
      pointsFor: 45, pointsAgainst: 22, pointDiff: 23,
      confRank: 2, divRank: 1, playoffPosition: 'in'
    }
  ]
};

// Map API response to our standings type
const mapApiStanding = (apiStanding: any, league: SportLeague): SportradarStanding => {
  const wins = apiStanding.wins || apiStanding.win || 0;
  const losses = apiStanding.losses || apiStanding.loss || 0;
  const ties = apiStanding.ties || apiStanding.tie || 0;
  const gamesPlayed = wins + losses + ties;

  const playoffMap: Record<string, PlayoffPosition> = {
    'clinched': 'clinched',
    'x': 'clinched',
    'y': 'clinched',
    'z': 'clinched',
    'in': 'in',
    'wildcard': 'wildcard',
    'out': 'out',
    'eliminated': 'eliminated',
    'e': 'eliminated'
  };

  return {
    teamId: apiStanding.team?.id || apiStanding.id || '',
    teamName: apiStanding.team?.name || apiStanding.name || '',
    market: apiStanding.team?.market || apiStanding.market || '',
    alias: apiStanding.team?.alias || apiStanding.alias || '',
    conference: apiStanding.conference?.name || apiStanding.conference || '',
    division: apiStanding.division?.name || apiStanding.division || '',
    wins,
    losses,
    ties: ties > 0 ? ties : undefined,
    winPct: gamesPlayed > 0 ? wins / gamesPlayed : 0,
    gamesBack: apiStanding.games_back || apiStanding.games_behind || 0,
    streak: {
      kind: apiStanding.streak?.type === 'loss' ? 'loss' : 'win',
      length: apiStanding.streak?.length || 0
    },
    homeRecord: `${apiStanding.home?.wins || 0}-${apiStanding.home?.losses || 0}`,
    awayRecord: `${apiStanding.away?.wins || 0}-${apiStanding.away?.losses || 0}`,
    last10: apiStanding.last_10 || `${apiStanding.last_ten_wins || 0}-${apiStanding.last_ten_losses || 0}`,
    pointsFor: apiStanding.points_for || apiStanding.scoring?.points_per_game || 0,
    pointsAgainst: apiStanding.points_against || apiStanding.scoring?.points_against_per_game || 0,
    pointDiff: (apiStanding.points_for || 0) - (apiStanding.points_against || 0),
    confRank: apiStanding.conference?.rank || apiStanding.conference_rank || 0,
    divRank: apiStanding.division?.rank || apiStanding.division_rank || 0,
    playoffPosition: playoffMap[apiStanding.playoff_status?.toLowerCase()] || undefined,
    clinched: apiStanding.clinched || apiStanding.playoff_status === 'clinched'
  };
};

// Fetch league standings via edge function
export const fetchStandings = async (
  league: SportLeague, 
  season?: number
): Promise<SportradarStanding[]> => {
  if (shouldUseMockData()) {
    console.log(`[Standings] Using mock data for ${league}`);
    return MOCK_STANDINGS[league] || [];
  }

  try {
    const response = await fetchSportradar<any>(
      league,
      'STANDINGS',
      { cacheDuration: STANDINGS_CACHE_DURATION }
    );

    // Extract standings from response (structure varies by sport)
    let standings: any[] = [];

    if (response.data.conferences) {
      // NBA/NFL/NHL format
      response.data.conferences.forEach((conf: any) => {
        if (conf.divisions) {
          conf.divisions.forEach((div: any) => {
            if (div.teams) {
              standings.push(...div.teams.map((team: any) => ({
                ...team,
                conference: conf,
                division: div
              })));
            }
          });
        } else if (conf.teams) {
          standings.push(...conf.teams.map((team: any) => ({
            ...team,
            conference: conf
          })));
        }
      });
    } else if (response.data.standings) {
      standings = response.data.standings;
    } else if (response.data.teams) {
      standings = response.data.teams;
    } else if (response.data.groups) {
      // Soccer format
      response.data.groups.forEach((group: any) => {
        if (group.standings) {
          standings.push(...group.standings);
        }
      });
    }

    return standings.map(s => mapApiStanding(s, league));
  } catch (error) {
    console.error(`[Standings] Error fetching ${league} standings:`, error);
    return MOCK_STANDINGS[league] || [];
  }
};

// Get conference standings
export const getConferenceStandings = async (
  league: SportLeague, 
  conference: string
): Promise<SportradarStanding[]> => {
  const allStandings = await fetchStandings(league);
  return allStandings
    .filter(s => s.conference.toLowerCase() === conference.toLowerCase())
    .sort((a, b) => a.confRank - b.confRank);
};

// Get division standings
export const getDivisionStandings = async (
  league: SportLeague, 
  division: string
): Promise<SportradarStanding[]> => {
  const allStandings = await fetchStandings(league);
  return allStandings
    .filter(s => s.division.toLowerCase() === division.toLowerCase())
    .sort((a, b) => a.divRank - b.divRank);
};

// Get team standing
export const getTeamStanding = async (
  league: SportLeague, 
  teamId: string
): Promise<SportradarStanding | null> => {
  const allStandings = await fetchStandings(league);
  return allStandings.find(s => 
    s.teamId === teamId || 
    s.alias.toLowerCase() === teamId.toLowerCase() ||
    s.teamName.toLowerCase().includes(teamId.toLowerCase())
  ) || null;
};

// Get playoff picture
export const getPlayoffPicture = async (
  league: SportLeague
): Promise<{ in: SportradarStanding[]; wildcard: SportradarStanding[]; out: SportradarStanding[] }> => {
  const allStandings = await fetchStandings(league);
  
  return {
    in: allStandings.filter(s => s.playoffPosition === 'clinched' || s.playoffPosition === 'in'),
    wildcard: allStandings.filter(s => s.playoffPosition === 'wildcard'),
    out: allStandings.filter(s => s.playoffPosition === 'out' || s.playoffPosition === 'eliminated')
  };
};

// Calculate form from recent results
export const getTeamForm = (standing: SportradarStanding): ('W' | 'L' | 'D')[] => {
  const last10 = standing.last10;
  if (!last10) return [];
  
  const [wins, losses] = last10.split('-').map(Number);
  const draws = 10 - wins - losses;
  
  const form: ('W' | 'L' | 'D')[] = [];
  for (let i = 0; i < wins; i++) form.push('W');
  for (let i = 0; i < losses; i++) form.push('L');
  for (let i = 0; i < draws; i++) form.push('D');
  
  return form.slice(0, 5);
};

// Fetch all standings
export const fetchAllStandings = async (): Promise<Record<SportLeague, SportradarStanding[]>> => {
  const leagues: SportLeague[] = ['NBA', 'NFL', 'MLB', 'NHL', 'SOCCER'];
  
  const results = await Promise.all(
    leagues.map(league => fetchStandings(league))
  );

  return leagues.reduce((acc, league, index) => {
    acc[league] = results[index];
    return acc;
  }, {} as Record<SportLeague, SportradarStanding[]>);
};
