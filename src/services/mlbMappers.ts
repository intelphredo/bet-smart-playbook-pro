
import { Match, Team, League, PlayerStats } from "@/types/sports";
import { SPORTSBOOK_LOGOS } from "./espnConstants";

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
          undefined
      };
      
      const awayTeam: Team = {
        id: game.gameData.teams.away.id.toString(),
        name: game.gameData.teams.away.name,
        shortName: game.gameData.teams.away.abbreviation || game.gameData.teams.away.teamName.substring(0, 3).toUpperCase(),
        logo: `https://www.mlbstatic.com/team-logos/${game.gameData.teams.away.id}.svg`,
        record: game.gameData.teams.away.record ? 
          `${game.gameData.teams.away.record.wins}-${game.gameData.teams.away.record.losses}` : 
          undefined
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
      
      // Generate realistic looking odds variations
      const baseHomeOdds = 1.8 + (Math.random() * 0.4 - 0.2);
      const baseAwayOdds = 2.0 + (Math.random() * 0.4 - 0.2);
      
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
              id: "fanduel",
              name: "FanDuel",
              logo: SPORTSBOOK_LOGOS.fanduel,
              isAvailable: true
            },
            homeWin: baseHomeOdds + (Math.random() * 0.2 - 0.1),
            awayWin: baseAwayOdds + (Math.random() * 0.2 - 0.1),
            updatedAt: new Date().toISOString()
          },
          {
            sportsbook: {
              id: "draftkings",
              name: "DraftKings",
              logo: SPORTSBOOK_LOGOS.draftkings,
              isAvailable: true
            },
            homeWin: baseHomeOdds + (Math.random() * 0.2 - 0.1),
            awayWin: baseAwayOdds + (Math.random() * 0.2 - 0.1),
            updatedAt: new Date(Date.now() - 120000).toISOString()
          }
        ],
        prediction: {
          recommended: Math.random() > 0.5 ? "home" : "away",
          confidence: Math.floor(Math.random() * 30) + 60,
          projectedScore: {
            home: score ? score.home + (Math.random() > 0.7 ? 1 : 0) : Math.floor(Math.random() * 5) + 1,
            away: score ? score.away + (Math.random() > 0.7 ? 1 : 0) : Math.floor(Math.random() * 5)
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
