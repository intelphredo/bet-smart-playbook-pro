
import { Match, Team, League } from "@/types/sports";
import { SPORTSBOOK_LOGOS } from "../utils/sportsbook";

interface ESPNEvent {
  id: string;
  date: string;
  name: string;
  shortName: string;
  status: {
    type: {
      state: string;
      description: string;
    };
    period: number;
    displayClock: string;
  };
  competitions: Array<{
    id: string;
    competitors: Array<{
      id: string;
      homeAway: string;
      team: {
        id: string;
        name: string;
        abbreviation: string;
        displayName: string;
        logo: string;
      };
      score: string;
      records?: Array<{
        type: string;
        summary: string;
      }>;
    }>;
    odds?: Array<{
      provider: {
        id: string;
        name: string;
      };
      details: string;
      overUnder: number;
    }>;
  }>;
}

export interface ESPNResponse {
  events: ESPNEvent[];
}

export const mapESPNEventToMatch = (event: ESPNEvent, league: League): Match => {
  const competition = event.competitions[0];
  const homeCompetitor = competition.competitors.find(c => c.homeAway === "home");
  const awayCompetitor = competition.competitors.find(c => c.homeAway === "away");
  
  if (!homeCompetitor || !awayCompetitor) {
    throw new Error("Missing competitor data");
  }
  
  const homeRecord = homeCompetitor.records?.find(r => r.type === "total")?.summary || "";
  const awayRecord = awayCompetitor.records?.find(r => r.type === "total")?.summary || "";
  
  const homeTeam: Team = {
    id: homeCompetitor.team.id,
    name: homeCompetitor.team.name,
    shortName: homeCompetitor.team.abbreviation,
    logo: homeCompetitor.team.logo,
    record: homeRecord,
  };
  
  const awayTeam: Team = {
    id: awayCompetitor.team.id,
    name: awayCompetitor.team.name,
    shortName: awayCompetitor.team.abbreviation,
    logo: awayCompetitor.team.logo,
    record: awayRecord,
  };
  
  const status = event.status.type.state === "in" ? "live" : 
                 event.status.type.state === "post" ? "finished" : "scheduled";
  
  const baseHomeOdds = competition.odds?.[0] ? 1.8 : 1.9;
  const baseAwayOdds = competition.odds?.[0] ? 2.2 : 1.9;
  const baseDrawOdds = league === "SOCCER" ? 3.0 : undefined;

  const liveOdds = [
    {
      sportsbook: {
        id: "draftkings",
        name: "DraftKings",
        logo: SPORTSBOOK_LOGOS.draftkings,
        isAvailable: true
      },
      homeWin: baseHomeOdds + (Math.random() * 0.2 - 0.1),
      awayWin: baseAwayOdds + (Math.random() * 0.2 - 0.1),
      draw: baseDrawOdds ? baseDrawOdds + (Math.random() * 0.3 - 0.15) : undefined,
      updatedAt: new Date(Date.now() - 120000).toISOString() // 2 minutes ago
    },
    {
      sportsbook: {
        id: "betmgm",
        name: "BetMGM",
        logo: SPORTSBOOK_LOGOS.betmgm,
        isAvailable: true
      },
      homeWin: baseHomeOdds + (Math.random() * 0.2 - 0.1),
      awayWin: baseAwayOdds + (Math.random() * 0.2 - 0.1),
      draw: baseDrawOdds ? baseDrawOdds + (Math.random() * 0.3 - 0.15) : undefined,
      updatedAt: new Date(Date.now() - 180000).toISOString() // 3 minutes ago
    },
    {
      sportsbook: {
        id: "fanduel",
        name: "FanDuel",
        logo: SPORTSBOOK_LOGOS.fanduel,
        isAvailable: true
      },
      homeWin: baseHomeOdds + (Math.random() * 0.2 - 0.1),
      awayWin: baseAwayOdds + (Math.random() * 0.2 - 0.1),
      draw: baseDrawOdds ? baseDrawOdds + (Math.random() * 0.3 - 0.15) : undefined,
      updatedAt: new Date(Date.now() - 60000).toISOString() // 1 minute ago
    }
  ];

  const odds = {
    homeWin: baseHomeOdds,
    awayWin: baseAwayOdds,
    ...(league === "SOCCER" && { draw: baseDrawOdds })
  };
  
  const score = status !== "scheduled" ? {
    home: parseInt(homeCompetitor.score, 10),
    away: parseInt(awayCompetitor.score, 10),
    period: `Period ${event.status.period} - ${event.status.displayClock}`,
  } : undefined;
  
  const homeTeamFavored = odds.homeWin <= odds.awayWin;
  const confidence = homeTeamFavored ? 65 : 55;
  
  return {
    id: event.id,
    league,
    homeTeam,
    awayTeam,
    startTime: event.date,
    odds,
    liveOdds,
    prediction: {
      recommended: homeTeamFavored ? "home" : "away",
      confidence,
      projectedScore: {
        home: score ? score.home + (Math.random() > 0.5 ? 1 : 0) : Math.floor(Math.random() * 5) + 1,
        away: score ? score.away + (Math.random() > 0.5 ? 1 : 0) : Math.floor(Math.random() * 5),
      },
    },
    status,
    score,
  };
};
