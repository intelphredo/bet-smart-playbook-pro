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

// Get stat value from ESPN stats array - handles multiple stat name variations
const getStatValue = (stats: ESPNTeamEntry['stats'], ...names: string[]): number => {
  for (const name of names) {
    const stat = stats.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (stat?.value !== undefined) return stat.value;
  }
  return 0;
};

// Get stat display value from ESPN stats array
const getStatDisplayValue = (stats: ESPNTeamEntry['stats'], ...names: string[]): string => {
  for (const name of names) {
    const stat = stats.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (stat?.displayValue) return stat.displayValue;
  }
  return '';
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
  
  // Handle different stat name variations across leagues
  const wins = getStatValue(stats, 'wins', 'W');
  const losses = getStatValue(stats, 'losses', 'L');
  const ties = getStatValue(stats, 'ties', 'T', 'otLosses', 'OTL');
  const gamesPlayed = wins + losses + (ties || 0);
  const winPct = gamesPlayed > 0 ? wins / gamesPlayed : 0;
  
  // Get various stats based on what's available
  const gamesBack = getStatValue(stats, 'gamesBehind', 'gamesBack', 'GB');
  const homeRecord = getStatDisplayValue(stats, 'home', 'homeRecord', 'Home');
  const awayRecord = getStatDisplayValue(stats, 'road', 'awayRecord', 'away', 'Road', 'Away');
  const last10 = getStatDisplayValue(stats, 'L10', 'last10', 'Last10');
  const streak = getStatDisplayValue(stats, 'streak', 'strk', 'STRK');
  
  // Points for/against (varies by sport)
  const pointsFor = getStatValue(stats, 'pointsFor', 'runsScored', 'goalsFor', 'avgPointsFor', 'points', 'PF');
  const pointsAgainst = getStatValue(stats, 'pointsAgainst', 'runsAllowed', 'goalsAgainst', 'avgPointsAgainst', 'PA');
  
  const confRank = getStatValue(stats, 'playoffSeed', 'leagueRank', 'rank', 'clinchIndicator') || index + 1;
  const divRank = getStatValue(stats, 'divisionRank', 'divRank') || index + 1;
  
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
    console.log(`[ESPN Standings Mapper] Processing ${league} standings`);
    
    // Handle conference/division structure (NBA, NFL, NHL, MLB)
    if (response.children && response.children.length > 0) {
      console.log(`[ESPN Standings Mapper] Found ${response.children.length} conferences/groups`);
      
      response.children.forEach((conference) => {
        const confName = conference.name || conference.abbreviation || '';
        console.log(`[ESPN Standings Mapper] Processing conference: ${confName}`);
        
        // Collect all entries for this conference to sort properly
        const conferenceEntries: { entry: ESPNTeamEntry; division: string }[] = [];
        
        // Check for divisions within conference
        if (conference.children && conference.children.length > 0) {
          console.log(`[ESPN Standings Mapper] Found ${conference.children.length} divisions`);
          
          conference.children.forEach((division) => {
            const divName = division.name || division.abbreviation || '';
            
            if (division.standings?.entries) {
              console.log(`[ESPN Standings Mapper] Division ${divName}: ${division.standings.entries.length} teams`);
              division.standings.entries.forEach((entry) => {
                conferenceEntries.push({ entry, division: divName });
              });
            }
          });
        } else if (conference.standings?.entries) {
          // Direct conference standings (no divisions)
          console.log(`[ESPN Standings Mapper] Conference ${confName}: ${conference.standings.entries.length} teams`);
          conference.standings.entries.forEach((entry) => {
            conferenceEntries.push({ entry, division: '' });
          });
        }
        
        // Sort entries by playoffSeed/rank BEFORE mapping
        conferenceEntries.sort((a, b) => {
          const aRank = getStatValue(a.entry.stats, 'playoffSeed', 'leagueRank', 'rank') || 999;
          const bRank = getStatValue(b.entry.stats, 'playoffSeed', 'leagueRank', 'rank') || 999;
          return aRank - bRank;
        });
        
        // Now map with correct index for fallback
        conferenceEntries.forEach(({ entry, division }, index) => {
          standings.push(mapTeamEntry(entry, confName, division, league, index));
        });
      });
    } 
    // Handle flat standings structure (Soccer/Premier League)
    else if (response.standings?.entries) {
      console.log(`[ESPN Standings Mapper] Flat structure: ${response.standings.entries.length} teams`);
      
      // Sort by rank before mapping
      const sortedEntries = [...response.standings.entries].sort((a, b) => {
        const aRank = getStatValue(a.stats, 'playoffSeed', 'leagueRank', 'rank') || 999;
        const bRank = getStatValue(b.stats, 'playoffSeed', 'leagueRank', 'rank') || 999;
        return aRank - bRank;
      });
      
      sortedEntries.forEach((entry, index) => {
        standings.push(mapTeamEntry(entry, league === 'SOCCER' ? 'Premier League' : '', '', league, index));
      });
    } else {
      console.warn(`[ESPN Standings Mapper] No standings data found in response for ${league}`);
      console.log(`[ESPN Standings Mapper] Response keys:`, Object.keys(response || {}));
    }
    
    // Final sort - by conference, then by confRank
    standings.sort((a, b) => {
      if (a.conference !== b.conference) {
        return a.conference.localeCompare(b.conference);
      }
      return a.confRank - b.confRank;
    });
    
    console.log(`[ESPN Standings Mapper] Mapped ${standings.length} teams for ${league}`);
    
  } catch (error) {
    console.error('[ESPN Standings Mapper] Error mapping standings:', error);
  }
  
  return standings;
};
