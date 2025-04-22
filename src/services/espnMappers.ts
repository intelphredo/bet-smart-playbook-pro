
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
      score?: string;
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
  try {
    const competition = event.competitions[0];
    
    if (!competition || !Array.isArray(competition.competitors)) {
      throw new Error("Invalid competition data structure");
    }
    
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
    
    // Enhanced status mapping
    let status: Match["status"];
    const eventState = (event.status?.type?.state || "pre").toLowerCase();
    
    if (eventState === "pre") {
      status = "scheduled";
    } else if (eventState === "in") {
      status = "live";
    } else if (eventState === "post") {
      status = "finished";
    } else {
      console.log(`Unknown event state: ${eventState}, defaulting to scheduled`);
      status = "scheduled";
    }
    
    // Generate mock odds for upcoming games
    const baseHomeOdds = competition.odds?.[0] ? 1.8 : 1.9;
    const baseAwayOdds = competition.odds?.[0] ? 2.2 : 1.9;
    const baseDrawOdds = league === "SOCCER" ? 3.0 : undefined;
  
    const odds = {
      homeWin: baseHomeOdds,
      awayWin: baseAwayOdds,
      ...(league === "SOCCER" && { draw: baseDrawOdds })
    };
    
    // Handle both string and number scores
    const parseScore = (scoreValue: string | undefined) => {
      if (scoreValue === undefined) return 0;
      // Try to parse as number, default to 0 if it fails
      return parseInt(scoreValue, 10) || 0;
    };
    
    const score = status !== "scheduled" ? {
      home: parseScore(homeCompetitor.score),
      away: parseScore(awayCompetitor.score),
      period: `Period ${event.status?.period || 1} - ${event.status?.displayClock || "00:00"}`,
    } : undefined;
    
    // Generate basic prediction for upcoming games
    const homeTeamFavored = odds.homeWin <= odds.awayWin;
    const confidence = homeTeamFavored ? 65 : 55;
    
    return {
      id: event.id,
      league,
      homeTeam,
      awayTeam,
      startTime: event.date,
      odds,
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
      liveOdds: [
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
        }
      ]
    };
  } catch (error) {
    console.error("Error mapping ESPN event:", error, event);
    // Return a basic mock match as fallback
    return createFallbackMatch(league);
  }
};

// Create a fallback match when mapping fails
const createFallbackMatch = (league: League): Match => {
  const id = `fallback-${league}-${Date.now()}`;
  const now = new Date();
  
  const homeTeam: Team = {
    id: "home-team",
    name: `${league} Home Team`,
    shortName: "HOME",
    logo: "https://via.placeholder.com/150",
    record: "0-0",
  };
  
  const awayTeam: Team = {
    id: "away-team",
    name: `${league} Away Team`,
    shortName: "AWAY",
    logo: "https://via.placeholder.com/150",
    record: "0-0",
  };
  
  return {
    id,
    league,
    homeTeam,
    awayTeam,
    startTime: now.toISOString(),
    status: "scheduled",
    odds: {
      homeWin: 1.9,
      awayWin: 2.1,
      ...(league === "SOCCER" && { draw: 3.0 })
    },
    prediction: {
      recommended: "home",
      confidence: 60,
      projectedScore: {
        home: 2,
        away: 1,
      },
    },
    liveOdds: []
  };
};
