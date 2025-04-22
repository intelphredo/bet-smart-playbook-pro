import { Match, Team, League } from "@/types";

export const mapSportRadarToMatch = (data: any, league: League): Match[] => {
  try {
    if (!data || !data.games) {
      console.warn(`No game data found in SportRadar response for ${league}`);
      return [];
    }

    // SportRadar returns different formats for different sports
    // This is a simplified example that would need to be expanded for each sport
    return data.games.map((game: any) => {
      // Map home team
      const homeTeam: Team = {
        id: game.home.id || `sr-${game.home.name.toLowerCase().replace(/\s/g, '-')}`,
        name: game.home.name,
        shortName: game.home.alias || game.home.abbreviation || game.home.name.substring(0, 3),
        logo: `https://placeholder.com/teams/${league.toLowerCase()}/${game.home.id}.svg`,
        record: game.home.record || '',
        recentForm: []
      };

      // Map away team
      const awayTeam: Team = {
        id: game.away.id || `sr-${game.away.name.toLowerCase().replace(/\s/g, '-')}`,
        name: game.away.name,
        shortName: game.away.alias || game.away.abbreviation || game.away.name.substring(0, 3),
        logo: `https://placeholder.com/teams/${league.toLowerCase()}/${game.away.id}.svg`,
        record: game.away.record || '',
        recentForm: []
      };

      // Map basic match data
      const match: Match = {
        id: game.id,
        league,
        homeTeam,
        awayTeam,
        startTime: game.scheduled || game.start_time,
        odds: {
          homeWin: 0,
          awayWin: 0,
          draw: league === 'SOCCER' ? 0 : undefined
        },
        status: mapGameStatus(game.status),
        prediction: {
          recommended: 'home', // Default, should be updated with real prediction
          confidence: 50, // Default, should be updated with real confidence
          projectedScore: {
            home: 0,
            away: 0
          }
        }
      };

      // Add score if available
      if (game.scoring || game.home_points) {
        match.score = {
          home: game.home_points || (game.scoring ? game.scoring.home.total || 0 : 0),
          away: game.away_points || (game.scoring ? game.scoring.away.total || 0 : 0),
          period: game.period || game.quarter || game.half || ''
        };
      }

      return match;
    });
  } catch (error) {
    console.error(`Error mapping SportRadar data for ${league}:`, error);
    return [];
  }
};

// Helper to map SportRadar status to our status format
function mapGameStatus(status: string): 'scheduled' | 'pre' | 'live' | 'finished' {
  const lowerStatus = (status || '').toLowerCase();
  
  if (lowerStatus.includes('scheduled') || lowerStatus === 'created') {
    return 'scheduled';
  } else if (lowerStatus === 'inprogress' || lowerStatus === 'in progress' || lowerStatus.includes('live')) {
    return 'live';
  } else if (lowerStatus.includes('closed') || lowerStatus === 'complete' || lowerStatus === 'completed') {
    return 'finished';
  } else if (lowerStatus === 'pregame' || lowerStatus.includes('pre')) {
    return 'pre';
  }
  
  return 'scheduled';
}
