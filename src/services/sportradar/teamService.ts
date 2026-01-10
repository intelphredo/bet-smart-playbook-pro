// Sportradar Team Service
// Fetches team profiles, rosters, and depth charts

import { API_CONFIGS } from '@/config/apiConfig';
import { 
  SportLeague, 
  SportradarTeam, 
  SportradarPlayer,
  SportradarTeamDepthChart,
  SportradarDepthChartPosition
} from '@/types/sportradar';
import { 
  fetchSportradar, 
  CACHE_DURATION, 
  shouldUseMockData 
} from './sportradarCore';

// Mock team data
const MOCK_TEAMS: Record<string, SportradarTeam> = {
  'team-lal': {
    id: 'team-lal',
    name: 'Lakers',
    market: 'Los Angeles',
    alias: 'LAL',
    conference: 'Western',
    division: 'Pacific',
    venue: {
      id: 'venue-crypto',
      name: 'Crypto.com Arena',
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
      capacity: 19068
    },
    coach: {
      id: 'coach-ham',
      name: 'Darvin Ham',
      position: 'Head Coach'
    },
    primaryColor: '#552583',
    secondaryColor: '#FDB927'
  },
  'team-gsw': {
    id: 'team-gsw',
    name: 'Warriors',
    market: 'Golden State',
    alias: 'GSW',
    conference: 'Western',
    division: 'Pacific',
    venue: {
      id: 'venue-chase',
      name: 'Chase Center',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      capacity: 18064
    },
    coach: {
      id: 'coach-kerr',
      name: 'Steve Kerr',
      position: 'Head Coach'
    },
    primaryColor: '#1D428A',
    secondaryColor: '#FFC72C'
  }
};

// Mock roster
const MOCK_ROSTERS: Record<string, SportradarPlayer[]> = {
  'team-lal': [
    {
      id: 'player-lebron',
      name: 'LeBron James',
      fullName: 'LeBron Raymone James',
      firstName: 'LeBron',
      lastName: 'James',
      position: 'F',
      jerseyNumber: '23',
      teamId: 'team-lal',
      height: '6-9',
      weight: '250',
      birthDate: '1984-12-30',
      experience: 21,
      status: 'active'
    },
    {
      id: 'player-ad',
      name: 'Anthony Davis',
      fullName: 'Anthony Marshon Davis Jr.',
      firstName: 'Anthony',
      lastName: 'Davis',
      position: 'F-C',
      jerseyNumber: '3',
      teamId: 'team-lal',
      height: '6-10',
      weight: '253',
      birthDate: '1993-03-11',
      experience: 12,
      status: 'active'
    }
  ]
};

// Map API response to team
const mapApiTeam = (apiTeam: any): SportradarTeam => {
  return {
    id: apiTeam.id || '',
    name: apiTeam.name || '',
    market: apiTeam.market || '',
    alias: apiTeam.alias || apiTeam.abbreviation || '',
    conference: apiTeam.conference?.name || '',
    division: apiTeam.division?.name || '',
    venue: apiTeam.venue ? {
      id: apiTeam.venue.id,
      name: apiTeam.venue.name,
      city: apiTeam.venue.city,
      state: apiTeam.venue.state,
      country: apiTeam.venue.country,
      capacity: apiTeam.venue.capacity || 0,
      surface: apiTeam.venue.surface
    } : undefined,
    coach: apiTeam.coaches?.[0] ? {
      id: apiTeam.coaches[0].id,
      name: apiTeam.coaches[0].full_name || apiTeam.coaches[0].name,
      position: apiTeam.coaches[0].position || 'Head Coach'
    } : undefined,
    logo: apiTeam.logo_url,
    primaryColor: apiTeam.team_colors?.[0]?.hex,
    secondaryColor: apiTeam.team_colors?.[1]?.hex
  };
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
    jerseyNumber: apiPlayer.jersey_number?.toString() || '',
    teamId: apiPlayer.team?.id || '',
    height: apiPlayer.height ? `${Math.floor(apiPlayer.height / 12)}-${apiPlayer.height % 12}` : '',
    weight: apiPlayer.weight?.toString() || '',
    birthDate: apiPlayer.birth_date || '',
    experience: apiPlayer.experience || 0,
    status: (apiPlayer.status || 'active').toLowerCase() as any
  };
};

// Fetch team profile
export const fetchTeamProfile = async (
  league: SportLeague,
  teamId: string
): Promise<SportradarTeam | null> => {
  if (shouldUseMockData()) {
    return MOCK_TEAMS[teamId] || null;
  }

  try {
    const endpoints = API_CONFIGS.SPORTRADAR.ENDPOINTS[league];
    if (!endpoints?.TEAM_PROFILE) {
      console.warn(`[Team] No team profile endpoint for ${league}`);
      return MOCK_TEAMS[teamId] || null;
    }

    const response = await fetchSportradar<any>(
      endpoints.TEAM_PROFILE,
      { team_id: teamId, league },
      { cacheDuration: CACHE_DURATION * 4 } // Team info doesn't change often
    );

    return mapApiTeam(response.data.team || response.data);
  } catch (error) {
    console.error(`[Team] Error fetching team ${teamId}:`, error);
    return MOCK_TEAMS[teamId] || null;
  }
};

// Fetch team roster
export const fetchTeamRoster = async (
  league: SportLeague,
  teamId: string
): Promise<SportradarPlayer[]> => {
  if (shouldUseMockData()) {
    return MOCK_ROSTERS[teamId] || [];
  }

  try {
    const endpoints = API_CONFIGS.SPORTRADAR.ENDPOINTS[league] as Record<string, string>;
    const rosterEndpoint = endpoints?.TEAM_ROSTER || endpoints?.TEAM_PROFILE;
    
    if (!rosterEndpoint) {
      console.warn(`[Team] No roster endpoint for ${league}`);
      return [];
    }

    const response = await fetchSportradar<any>(
      rosterEndpoint,
      { team_id: teamId, league },
      { cacheDuration: CACHE_DURATION * 2 }
    );

    const players = response.data.players || response.data.roster || [];
    return players.map(mapApiPlayer);
  } catch (error) {
    console.error(`[Team] Error fetching roster for ${teamId}:`, error);
    return MOCK_ROSTERS[teamId] || [];
  }
};

// Fetch depth chart
export const fetchDepthChart = async (
  league: SportLeague,
  teamId: string
): Promise<SportradarTeamDepthChart | null> => {
  if (shouldUseMockData()) {
    return null;
  }

  try {
    const endpoints = API_CONFIGS.SPORTRADAR.ENDPOINTS[league] as Record<string, string>;
    const depthEndpoint = endpoints?.TEAM_DEPTH_CHART || endpoints?.DEPTH_CHARTS;
    
    if (!depthEndpoint) {
      console.warn(`[Team] No depth chart endpoint for ${league}`);
      return null;
    }

    const response = await fetchSportradar<any>(
      depthEndpoint,
      { team_id: teamId, league },
      { cacheDuration: CACHE_DURATION }
    );

    const positions: SportradarDepthChartPosition[] = [];
    const depthData = response.data.depth_chart || response.data.positions || [];

    depthData.forEach((pos: any) => {
      const players = (pos.players || []).map((p: any, idx: number) => ({
        depth: p.depth || idx + 1,
        player: mapApiPlayer(p.player || p)
      }));

      if (players.length > 0) {
        positions.push({
          position: pos.name || pos.position,
          positionName: pos.full_name || pos.name || pos.position,
          players
        });
      }
    });

    return {
      teamId,
      teamName: response.data.team?.name || '',
      league,
      positions,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error(`[Team] Error fetching depth chart for ${teamId}:`, error);
    return null;
  }
};

// Get team with roster
export const getTeamWithRoster = async (
  league: SportLeague,
  teamId: string
): Promise<{ team: SportradarTeam | null; roster: SportradarPlayer[] }> => {
  const [team, roster] = await Promise.all([
    fetchTeamProfile(league, teamId),
    fetchTeamRoster(league, teamId)
  ]);

  return { team, roster };
};
