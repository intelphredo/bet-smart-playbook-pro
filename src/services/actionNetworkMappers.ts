
import { Match, League, Team } from "@/types/sports";

// Action Network sample API types (simplified for demo)
interface ActionNetworkGame {
  id: string;
  event_date: string;
  league: string;
  teams: Array<{
    id: string;
    full_name: string;
    short_name: string;
    logo?: string;
    is_home: boolean;
    record?: string;
  }>;
  odds: {
    home: number;
    away: number;
    draw?: number;
  };
  status: string;
  score?: {
    home: number;
    away: number;
    period?: string;
  };
}

export interface ActionNetworkResponse {
  games: ActionNetworkGame[];
}

export function mapActionNetworkGameToMatch(game: ActionNetworkGame): Match {
  const home = game.teams.find(t => t.is_home);
  const away = game.teams.find(t => !t.is_home);
  if (!home || !away) throw new Error("Missing home/away team in Action Network game data");

  return {
    id: game.id,
    league: game.league as League,
    homeTeam: {
      id: home.id,
      name: home.full_name,
      shortName: home.short_name,
      logo: home.logo || "",
      record: home.record,
    },
    awayTeam: {
      id: away.id,
      name: away.full_name,
      shortName: away.short_name,
      logo: away.logo || "",
      record: away.record,
    },
    startTime: game.event_date,
    odds: {
      homeWin: game.odds.home,
      awayWin: game.odds.away,
      ...(game.odds.draw ? { draw: game.odds.draw } : {})
    },
    liveOdds: undefined,
    prediction: {
      recommended: "home",
      confidence: 50,
      projectedScore: {
        home: 1,
        away: 1
      }
    },
    status: game.status as Match["status"],
    score: game.score
  };
}
