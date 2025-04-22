
import { League, Match, Team, PlayerStats } from "@/types";
import { SPORTSBOOK_LOGOS } from "../utils/sportsbook";

// Define interfaces for MLB API responses
export interface MLBGameResponse {
  gamePk: number;
  link: string;
  gameData: {
    game: {
      pk: number;
      type: string;
      season: string;
      dateTime: string;
    };
    teams: {
      away: MLBTeam;
      home: MLBTeam;
    };
    venue: {
      id: number;
      name: string;
    };
    status: {
      abstractGameState: string;
      codedGameState: string;
      detailedState: string;
    };
  };
  liveData: {
    linescore: {
      currentInning: number;
      currentInningOrdinal: string;
      inningState: string;
      teams: {
        home: { runs: number; hits: number; errors: number };
        away: { runs: number; hits: number; errors: number };
      };
    };
    plays?: {
      allPlays: Array<any>;
      currentPlay: any;
    };
  };
}

export interface MLBTeam {
  id: number;
  name: string;
  teamName: string;
  abbreviation: string;
  record?: {
    wins: number;
    losses: number;
  };
}

interface MLBScheduleResponse {
  dates: Array<{
    date: string;
    games: MLBGameResponse[];
  }>;
}

export interface MLBStandingsResponse {
  records: Array<{
    standingsType: string;
    league: { id: number; name: string };
    division: { id: number; name: string };
    teamRecords: Array<{
      team: MLBTeam;
      streak: { streakCode: string };
      divisionGamesBack: string;
      leagueGamesBack: string;
      wins: number;
      losses: number;
      winningPercentage: string;
    }>;
  }>;
}

// Map MLB games to our Match type
export const mapMLBGameToMatch = (data: MLBScheduleResponse): Match[] => {
  const allGames: Match[] = [];
  
  // Process each date in the schedule
  data.dates.forEach(dateObj => {
    const games = dateObj.games.map(game => {
      // Get home and away teams
      const homeTeam: Team = {
        id: game.gameData.teams.home.id.toString(),
        name: game.gameData.teams.home.name,
        shortName: game.gameData.teams.home.abbreviation || game.gameData.teams.home.teamName.substring(0, 3).toUpperCase(),
        logo: `https://www.mlbstatic.com/team-logos/${game.gameData.teams.home.id}.svg`,
        record: game.gameData.teams.home.record ? 
          `${game.gameData.teams.home.record.wins}-${game.gameData.teams.home.record.losses}` : 
          undefined,
        // Add recent form data (simulated)
        recentForm: generateRecentForm(game.gameData.teams.home.record?.wins || 0, game.gameData.teams.home.record?.losses || 0)
      };
      
      const awayTeam: Team = {
        id: game.gameData.teams.away.id.toString(),
        name: game.gameData.teams.away.name,
        shortName: game.gameData.teams.away.abbreviation || game.gameData.teams.away.teamName.substring(0, 3).toUpperCase(),
        logo: `https://www.mlbstatic.com/team-logos/${game.gameData.teams.away.id}.svg`,
        record: game.gameData.teams.away.record ? 
          `${game.gameData.teams.away.record.wins}-${game.gameData.teams.away.record.losses}` : 
          undefined,
        // Add recent form data (simulated)  
        recentForm: generateRecentForm(game.gameData.teams.away.record?.wins || 0, game.gameData.teams.away.record?.losses || 0)
      };
      
      // Determine game status
      let status: "scheduled" | "live" | "finished";
      switch(game.gameData.status.abstractGameState) {
        case "Live":
          status = "live";
          break;
        case "Final":
          status = "finished";
          break;
        default:
          status = "scheduled";
      }
      
      // Create score object if the game is live or finished
      const score = status !== "scheduled" ? {
        home: game.liveData.linescore.teams.home.runs,
        away: game.liveData.linescore.teams.away.runs,
        period: `${game.liveData.linescore.inningState} ${game.liveData.linescore.currentInningOrdinal}`,
      } : undefined;
      
      // Generate odds more realistically based on team records
      const homeRecord = game.gameData.teams.home.record || { wins: 0, losses: 0 };
      const awayRecord = game.gameData.teams.away.record || { wins: 0, losses: 0 };
      
      const homeWinPct = homeRecord.wins / (homeRecord.wins + homeRecord.losses || 1);
      const awayWinPct = awayRecord.wins / (awayRecord.wins + awayRecord.losses || 1);
      
      // Baseball odds typically range from 1.5 to 3.0
      let baseHomeOdds, baseAwayOdds;
      
      if (homeWinPct > awayWinPct) {
        // Home team is favored
        baseHomeOdds = 1.5 + (1 - (homeWinPct - awayWinPct)) * 0.5;
        baseAwayOdds = 2.0 + (homeWinPct - awayWinPct) * 2;
      } else {
        // Away team is favored
        baseAwayOdds = 1.5 + (1 - (awayWinPct - homeWinPct)) * 0.5;
        baseHomeOdds = 2.0 + (awayWinPct - homeWinPct) * 2;
      }
      
      // Add slight randomness to odds
      baseHomeOdds += (Math.random() * 0.2) - 0.1;
      baseAwayOdds += (Math.random() * 0.2) - 0.1;
      
      // Generate realistic prediction based on team records and recent form
      const homeStrength = calculateMLBTeamStrength(homeTeam);
      const awayStrength = calculateMLBTeamStrength(awayTeam);
      
      // Determine recommended side based on strengths
      let recommended: "home" | "away";
      let confidence: number;
      
      if (homeStrength > awayStrength) {
        recommended = "home";
        confidence = Math.floor(50 + Math.min(25, (homeStrength - awayStrength) * 10));
      } else {
        recommended = "away";
        confidence = Math.floor(50 + Math.min(25, (awayStrength - homeStrength) * 10));
      }
      
      // Add randomness to confidence (baseball has higher variance)
      confidence += Math.floor(Math.random() * 8) - 4;
      confidence = Math.max(51, Math.min(75, confidence));
      
      // Create match object
      const match: Match = {
        id: game.gamePk.toString(),
        league: "MLB" as League,
        homeTeam,
        awayTeam,
        startTime: game.gameData.game.dateTime,
        odds: {
          homeWin: baseHomeOdds,
          awayWin: baseAwayOdds,
        },
        liveOdds: [
          {
            sportsbook: {
              id: "draftkings",
              name: "DraftKings",
              logo: SPORTSBOOK_LOGOS.draftkings,
              isAvailable: true
            },
            homeWin: baseHomeOdds + (Math.random() * 0.1 - 0.05),
            awayWin: baseAwayOdds + (Math.random() * 0.1 - 0.05),
            updatedAt: new Date().toISOString()
          },
          {
            sportsbook: {
              id: "betmgm",
              name: "BetMGM",
              logo: SPORTSBOOK_LOGOS.betmgm,
              isAvailable: true
            },
            homeWin: baseHomeOdds + (Math.random() * 0.1 - 0.05),
            awayWin: baseAwayOdds + (Math.random() * 0.1 - 0.05),
            updatedAt: new Date(Date.now() - 120000).toISOString() // 2 minutes ago
          }
        ],
        prediction: {
          recommended,
          confidence,
          projectedScore: {
            home: score ? score.home + (Math.random() > 0.7 ? 1 : 0) : Math.floor(homeStrength * 0.1) + Math.floor(Math.random() * 3),
            away: score ? score.away + (Math.random() > 0.7 ? 1 : 0) : Math.floor(awayStrength * 0.1) + Math.floor(Math.random() * 3)
          }
        },
        status,
        score,
      };
      
      return match;
    });
    
    allGames.push(...games);
  });
  
  return allGames;
};

/**
 * Generate realistic recent form data based on win-loss record
 */
function generateRecentForm(wins: number, losses: number): string[] {
  if (wins === 0 && losses === 0) {
    return [];
  }
  
  const totalGames = wins + losses;
  const winRate = wins / totalGames;
  
  // Generate 5 recent results
  const recentForm: string[] = [];
  for (let i = 0; i < 5; i++) {
    // Higher win rate teams get more wins in recent form
    const isWin = Math.random() < (winRate * 1.2) || Math.random() < 0.5;
    recentForm.push(isWin ? 'W' : 'L');
  }
  
  return recentForm;
}

/**
 * Calculate MLB team strength based on record and form
 */
function calculateMLBTeamStrength(team: Team): number {
  let strength = 50; // baseline
  
  // Factor in team record
  if (team.record) {
    const parts = team.record.split('-');
    if (parts.length === 2) {
      const wins = parseInt(parts[0]);
      const losses = parseInt(parts[1]);
      
      if (!isNaN(wins) && !isNaN(losses) && (wins + losses > 0)) {
        const winPct = wins / (wins + losses);
        strength += (winPct - 0.5) * 40; // adjust strength based on win percentage
      }
    }
  }
  
  // Factor in recent form
  if (team.recentForm && team.recentForm.length > 0) {
    const recentWins = team.recentForm.filter(r => r === 'W').length;
    const recentWinPct = recentWins / team.recentForm.length;
    
    strength += (recentWinPct - 0.5) * 20; // recent form has less impact than overall record
  }
  
  // Return strength between 30-70 for most teams
  return Math.max(30, Math.min(70, strength));
}

// Map MLB teams response to Team type
export const mapMLBTeamsResponse = (data: { teams: MLBTeam[] }): Team[] => {
  return data.teams.map(team => {
    return {
      id: team.id.toString(),
      name: team.name,
      shortName: team.abbreviation || team.teamName.substring(0, 3).toUpperCase(),
      logo: `https://www.mlbstatic.com/team-logos/${team.id}.svg`,
      record: team.record ? `${team.record.wins}-${team.record.losses}` : undefined
    };
  });
};

// Map MLB player stats
export const mapMLBPlayerStats = (data: any): PlayerStats[] => {
  const playerStats: PlayerStats[] = [];
  
  if (data.roster && Array.isArray(data.roster)) {
    data.roster.forEach((player: any) => {
      // Check if player has person object with stats
      if (player.person && player.person.stats) {
        const personStats = player.person.stats.find((stat: any) => stat.type.displayName === "season");
        const stats = personStats?.splits[0]?.stat;
        
        if (stats) {
          playerStats.push({
            id: player.person.id.toString(),
            name: player.person.fullName,
            position: player.position?.abbreviation || "N/A",
            jersey: player.jerseyNumber || "",
            battingAverage: stats.avg || "0.000",
            homeRuns: stats.homeRuns || 0,
            rbi: stats.rbi || 0,
            hits: stats.hits || 0,
            runs: stats.runs || 0,
            obp: stats.obp || "0.000",
            ops: stats.ops || "0.000",
            slg: stats.slg || "0.000",
            era: stats.era || "0.00",
            wins: stats.wins || 0,
            losses: stats.losses || 0,
            saves: stats.saves || 0,
            strikeouts: stats.strikeOuts || 0,
            whip: stats.whip || "0.00"
          });
        } else {
          // Add player with basic info if no stats
          playerStats.push({
            id: player.person.id.toString(),
            name: player.person.fullName,
            position: player.position?.abbreviation || "N/A",
            jersey: player.jerseyNumber || ""
          });
        }
      }
    });
  }
  
  return playerStats;
};
