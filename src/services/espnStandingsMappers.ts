import { SportLeague, SportradarStanding, PlayoffPosition } from '@/types/sportradar';

interface ESPNTeamEntry {
  team: {
    id: string;
    name: string;
    displayName: string;
    abbreviation: string;
    shortDisplayName?: string;
    logo?: string;
    logos?: Array<{ href: string }>;
  };
  stats: Array<{
    name: string;
    displayName?: string;
    value: number;
    displayValue?: string;
  }>;
  note?: {
    color?: string;
    description?: string;
    rank?: number;
  };
}

interface ESPNStandingsResponse {
  children?: Array<{
    name: string;
    abbreviation?: string;
    standings?: {
      entries: ESPNTeamEntry[];
    };
    children?: Array<{
      name: string;
      abbreviation?: string;
      standings?: {
        entries: ESPNTeamEntry[];
      };
    }>;
  }>;
  standings?: {
    entries: ESPNTeamEntry[];
  };
}

// Get stat value from ESPN stats array
const getStatValue = (stats: ESPNTeamEntry['stats'], name: string): number => {
  const stat = stats.find(s => s.name.toLowerCase() === name.toLowerCase());
  return stat?.value || 0;
};

// Get stat display value from ESPN stats array
const getStatDisplayValue = (stats: ESPNTeamEntry['stats'], name: string): string => {
  const stat = stats.find(s => s.name.toLowerCase() === name.toLowerCase());
  return stat?.displayValue || '';
};

// Parse streak string (e.g., "W5", "L2")
const parseStreak = (streakStr: string): { kind: 'win' | 'loss'; length: number } => {
  if (!streakStr || streakStr.length < 2) {
    return { kind: 'win', length: 0 };
  }
  
  const kind = streakStr.charAt(0).toUpperCase() === 'W' ? 'win' : 'loss';
  const length = parseInt(streakStr.slice(1)) || 0;
  
  return { kind, length };
};

// Determine playoff position based on note/clinch status
const getPlayoffPosition = (entry: ESPNTeamEntry, confRank: number, league: SportLeague): PlayoffPosition | undefined => {
  const note = entry.note?.description?.toLowerCase() || '';
  
  if (note.includes('clinched') || note.includes('- x') || note.includes('- y') || note.includes('- z')) {
    return 'clinched';
  }
  if (note.includes('eliminated') || note.includes('- e')) {
    return 'eliminated';
  }
  
  // Estimate playoff spots based on league
  const playoffSpots: Record<SportLeague, number> = {
    NBA: 6,
    NFL: 7,
    MLB: 3,
    NHL: 8,
    SOCCER: 4
  };
  
  const spots = playoffSpots[league];
  if (confRank <= spots) {
    return 'in';
  }
  if (confRank <= spots + 2) {
    return 'wildcard';
  }
  return 'out';
};

// Map a single ESPN team entry to our standing type
const mapTeamEntry = (
  entry: ESPNTeamEntry, 
  conference: string, 
  division: string, 
  league: SportLeague,
  index: number
): SportradarStanding => {
  const { team, stats } = entry;
  
  const wins = getStatValue(stats, 'wins');
  const losses = getStatValue(stats, 'losses');
  const ties = getStatValue(stats, 'ties') || getStatValue(stats, 'otLosses');
  const gamesPlayed = wins + losses + (ties || 0);
  const winPct = gamesPlayed > 0 ? wins / gamesPlayed : 0;
  
  // Get various stats based on what's available
  const gamesBack = getStatValue(stats, 'gamesBehind') || getStatValue(stats, 'gamesBack');
  const homeRecord = getStatDisplayValue(stats, 'home') || getStatDisplayValue(stats, 'homeRecord');
  const awayRecord = getStatDisplayValue(stats, 'road') || getStatDisplayValue(stats, 'awayRecord') || getStatDisplayValue(stats, 'away');
  const last10 = getStatDisplayValue(stats, 'L10') || getStatDisplayValue(stats, 'last10');
  const streak = getStatDisplayValue(stats, 'streak') || getStatDisplayValue(stats, 'strk');
  
  // Points for/against (varies by sport)
  const pointsFor = getStatValue(stats, 'pointsFor') || 
                    getStatValue(stats, 'runsScored') || 
                    getStatValue(stats, 'goalsFor') ||
                    getStatValue(stats, 'avgPointsFor') ||
                    getStatValue(stats, 'points');
  const pointsAgainst = getStatValue(stats, 'pointsAgainst') || 
                        getStatValue(stats, 'runsAllowed') || 
                        getStatValue(stats, 'goalsAgainst') ||
                        getStatValue(stats, 'avgPointsAgainst');
  
  const confRank = getStatValue(stats, 'playoffSeed') || 
                   getStatValue(stats, 'leagueRank') || 
                   getStatValue(stats, 'rank') ||
                   index + 1;
  const divRank = getStatValue(stats, 'divisionRank') || index + 1;
  
  const playoffPosition = getPlayoffPosition(entry, confRank, league);
  
  return {
    teamId: team.id,
    teamName: team.displayName || team.name,
    market: team.shortDisplayName || team.name.split(' ').slice(0, -1).join(' '),
    alias: team.abbreviation,
    conference,
    division,
    wins,
    losses,
    ties: ties > 0 ? ties : undefined,
    winPct,
    gamesBack,
    streak: parseStreak(streak),
    homeRecord: homeRecord || `${Math.floor(wins / 2)}-${Math.floor(losses / 2)}`,
    awayRecord: awayRecord || `${Math.ceil(wins / 2)}-${Math.ceil(losses / 2)}`,
    last10: last10 || '',
    pointsFor,
    pointsAgainst,
    pointDiff: pointsFor - pointsAgainst,
    confRank,
    divRank,
    playoffPosition,
    clinched: playoffPosition === 'clinched'
  };
};

// Main mapping function
export const mapESPNStandingsToSportradar = (
  response: ESPNStandingsResponse, 
  league: SportLeague
): SportradarStanding[] => {
  const standings: SportradarStanding[] = [];
  
  try {
    // Handle conference/division structure (NBA, NFL, NHL, MLB)
    if (response.children && response.children.length > 0) {
      response.children.forEach((conference) => {
        const confName = conference.name || conference.abbreviation || '';
        
        // Check for divisions within conference
        if (conference.children && conference.children.length > 0) {
          conference.children.forEach((division) => {
            const divName = division.name || division.abbreviation || '';
            
            if (division.standings?.entries) {
              division.standings.entries.forEach((entry, index) => {
                standings.push(mapTeamEntry(entry, confName, divName, league, index));
              });
            }
          });
        } else if (conference.standings?.entries) {
          // Direct conference standings (no divisions)
          conference.standings.entries.forEach((entry, index) => {
            standings.push(mapTeamEntry(entry, confName, '', league, index));
          });
        }
      });
    } 
    // Handle flat standings structure (Soccer/Premier League)
    else if (response.standings?.entries) {
      response.standings.entries.forEach((entry, index) => {
        standings.push(mapTeamEntry(entry, league === 'SOCCER' ? 'Premier League' : '', '', league, index));
      });
    }
    
    // Sort by conference rank
    standings.sort((a, b) => {
      if (a.conference !== b.conference) {
        return a.conference.localeCompare(b.conference);
      }
      return a.confRank - b.confRank;
    });
    
  } catch (error) {
    console.error('[ESPN Standings Mapper] Error mapping standings:', error);
  }
  
  return standings;
};
