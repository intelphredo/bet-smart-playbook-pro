
import { Match, Team, League } from "@/types/sports";
import { ESPNEvent } from "./espnApiConfig";

// Logos for reference in sportsbook objects
export const SPORTSBOOK_LOGOS = {
  fanduel: "https://upload.wikimedia.org/wikipedia/en/3/3d/FanDuel_logo.svg",
  draftkings: "https://upload.wikimedia.org/wikipedia/en/f/fd/DraftKings_logo.svg",
  betmgm: "https://upload.wikimedia.org/wikipedia/commons/2/2f/BetMGM_logo.svg",
};

// Map ESPN data to our app's data model
export const mapESPNEventToMatch = (event: ESPNEvent, league: League): Match => {
  const competition = event.competitions[0];
  const homeCompetitor = competition.competitors.find(c => c.homeAway === "home");
  const awayCompetitor = competition.competitors.find(c => c.homeAway === "away");

  if (!homeCompetitor || !awayCompetitor) {
    throw new Error("Missing competitor data");
  }

  // Get team records
  const homeRecord = homeCompetitor.records?.find(r => r.type === "total")?.summary || "";
  const awayRecord = awayCompetitor.records?.find(r => r.type === "total")?.summary || "";

  // Create team objects
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

  // Determine status
  const status = event.status.type.state === "in" ? "live" :
    event.status.type.state === "post" ? "finished" : "scheduled";

  // Generate realistic looking odds variations for different sportsbooks
  const baseHomeOdds = competition.odds?.[0] ? 1.8 : 1.9;
  const baseAwayOdds = competition.odds?.[0] ? 2.2 : 1.9;
  const baseDrawOdds = league === "SOCCER" ? 3.0 : undefined;

  // Create simulated live odds from different sportsbooks
  const liveOdds = [
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
      draw: baseDrawOdds ? baseDrawOdds + (Math.random() * 0.3 - 0.15) : undefined,
      updatedAt: new Date(Date.now() - 120000).toISOString()
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
      updatedAt: new Date(Date.now() - 180000).toISOString()
    }
  ];

  // Create basic odds
  const odds = {
    homeWin: baseHomeOdds,
    awayWin: baseAwayOdds,
    ...(league === "SOCCER" && { draw: baseDrawOdds })
  };

  // Create score object if the match is live or finished
  const score = status !== "scheduled" ? {
    home: parseInt(homeCompetitor.score, 10),
    away: parseInt(awayCompetitor.score, 10),
    period: `Period ${event.status.period} - ${event.status.displayClock}`,
  } : undefined;

  // Create a basic prediction (since we don't have actual prediction data from ESPN)
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

