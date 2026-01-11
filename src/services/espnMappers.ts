import { Match, Team, League } from "@/types/sports";
import { SPORTSBOOK_LOGOS, getTeamLogoUrl, getTeamInitials } from "@/utils/teamLogos";
import { logger } from "@/utils/logger";

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
    
    // Generate simulated recent form based on record
    const homeRecentForm = generateRecentForm(homeRecord);
    const awayRecentForm = generateRecentForm(awayRecord);
    
    const homeTeam: Team = {
      id: homeCompetitor.team.id,
      name: homeCompetitor.team.name,
      shortName: homeCompetitor.team.abbreviation,
      logo: homeCompetitor.team.logo,
      record: homeRecord,
      recentForm: homeRecentForm
    };
    
    const awayTeam: Team = {
      id: awayCompetitor.team.id,
      name: awayCompetitor.team.name,
      shortName: awayCompetitor.team.abbreviation,
      logo: awayCompetitor.team.logo,
      record: awayRecord,
      recentForm: awayRecentForm
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
      logger.log(`Unknown event state: ${eventState}, defaulting to scheduled`);
      status = "scheduled";
    }
    
    // Create balanced odds based on simulated team strength
    const homeStrength = calculateTeamStrength(homeRecord, homeRecentForm);
    const awayStrength = calculateTeamStrength(awayRecord, awayRecentForm);
    const strengthDiff = homeStrength - awayStrength;
    
    // Generate odds that can favor either team based on strength difference
    const oddsAdjustment = Math.min(Math.max(strengthDiff / 10, -0.6), 0.6);
    
    // Base odds - no longer always favoring home team
    const baseHomeOdds = 1.9 - oddsAdjustment; 
    const baseAwayOdds = 1.9 + oddsAdjustment;
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
    
    // Generate more balanced prediction
    const homeTeamFavored = homeStrength > awayStrength;
    const strengthDifference = Math.abs(homeStrength - awayStrength);
    const confidence = 50 + Math.min(25, strengthDifference * 3); // 50-75 range based on strength diff
    
    // Create more realistic projectedScore based on team strength
    const projectedHome = score ? score.home + (Math.random() > 0.6 ? 1 : 0) : Math.floor(getExpectedScore(league, homeStrength / 10));
    const projectedAway = score ? score.away + (Math.random() > 0.6 ? 1 : 0) : Math.floor(getExpectedScore(league, awayStrength / 10));
    
    // Create multiple sportsbooks with varied odds
    const liveOdds = generateDiverseSportsbookOdds(baseHomeOdds, baseAwayOdds, baseDrawOdds);
    
    return {
      id: event.id,
      league,
      homeTeam,
      awayTeam,
      startTime: event.date,
      odds,
      prediction: {
        recommended: homeTeamFavored ? "home" : "away",
        confidence: Math.round(confidence),
        projectedScore: {
          home: projectedHome,
          away: projectedAway,
        },
      },
      status,
      score,
      liveOdds
    };
  } catch (error) {
    logger.error("Error mapping ESPN event: " + String(error));
    // Return a basic mock match as fallback
    return createFallbackMatch(league);
  }
};

// Create multiple sportsbooks with varied odds
function generateDiverseSportsbookOdds(baseHomeOdds: number, baseAwayOdds: number, baseDrawOdds?: number) {
  const bookmakers = [
    { id: "draftkings", name: "DraftKings", logo: SPORTSBOOK_LOGOS.draftkings },
    { id: "fanduel", name: "FanDuel", logo: SPORTSBOOK_LOGOS.fanduel },
    { id: "betmgm", name: "BetMGM", logo: SPORTSBOOK_LOGOS.betmgm },
    { id: "caesars", name: "Caesars", logo: SPORTSBOOK_LOGOS.caesars }
  ];
  
  // Generate different timestamps for odds movements
  const now = Date.now();
  const twoHoursAgo = now - (2 * 60 * 60 * 1000);
  
  return bookmakers.map((book, i) => {
    // Create varying odds between sportsbooks
    const homeVariance = (Math.random() * 0.3) - 0.15;
    const awayVariance = (Math.random() * 0.3) - 0.15;
    const drawVariance = baseDrawOdds ? (Math.random() * 0.4) - 0.2 : undefined;
    
    // Time variance for different update times
    const timeVariance = Math.floor(Math.random() * (now - twoHoursAgo)) + twoHoursAgo;
    
    return {
      sportsbook: {
        id: book.id,
        name: book.name,
        logo: book.logo,
        isAvailable: true
      },
      homeWin: baseHomeOdds + homeVariance,
      awayWin: baseAwayOdds + awayVariance,
      draw: baseDrawOdds ? baseDrawOdds + (drawVariance || 0) : undefined,
      updatedAt: new Date(timeVariance).toISOString()
    };
  });
}

// Get expected score based on league and team strength
function getExpectedScore(league: League, strength: number): number {
  switch(league) {
    case "NFL": 
      return 20 + (strength * 1.2) + ((Math.random() * 14) - 7);
    case "NBA": 
      return 100 + (strength * 2) + ((Math.random() * 20) - 10);
    case "MLB": 
      return 3.5 + (strength * 0.4) + ((Math.random() * 3) - 1.5);
    case "NHL": 
      return 2.5 + (strength * 0.3) + ((Math.random() * 2) - 1);
    case "SOCCER": 
      return 1 + (strength * 0.2) + ((Math.random() * 2) - 1);
    default:
      return 5 + strength;
  }
}

// Calculate team strength on a scale of 1-10 based on record and recent form
function calculateTeamStrength(record: string, recentForm: string[]): number {
  let strength = 5; // Default neutral
  
  // Parse record if available
  if (record) {
    const parts = record.split('-');
    if (parts.length === 2) {
      const wins = parseInt(parts[0], 10) || 0;
      const losses = parseInt(parts[1], 10) || 0;
      if (wins + losses > 0) {
        // Win percentage impacts strength
        const winPct = wins / (wins + losses);
        strength += (winPct - 0.5) * 6; // -3 to +3 based on record
      }
    }
  }
  
  // Recent form affects strength
  if (recentForm && recentForm.length > 0) {
    const recentWins = recentForm.filter(r => r === 'W').length;
    const formImpact = ((recentWins / recentForm.length) - 0.5) * 3; // -1.5 to +1.5 based on form
    strength += formImpact;
  }
  
  // Add randomness factor to create more variety
  strength += (Math.random() * 2) - 1; // -1 to +1 random factor
  
  // Constrain to reasonable bounds
  return Math.max(1, Math.min(10, strength));
}

// Generate realistic recent form based on record
function generateRecentForm(record: string): string[] {
  const form: string[] = [];
  
  // Default 50% win rate if no record
  let winRate = 0.5;
  
  // Parse record if available
  if (record) {
    const parts = record.split('-');
    if (parts.length === 2) {
      const wins = parseInt(parts[0], 10) || 0;
      const losses = parseInt(parts[1], 10) || 0;
      if (wins + losses > 0) {
        winRate = wins / (wins + losses);
      }
    }
  }
  
  // Generate 5 recent results with some randomness but based on win rate
  for (let i = 0; i < 5; i++) {
    // Teams with high win rates still sometimes lose, and vice versa
    const adjustedWinRate = (winRate * 0.7) + 0.15; // Adjust toward center (0.15-0.85)
    const isWin = Math.random() < adjustedWinRate;
    form.push(isWin ? 'W' : 'L');
  }
  
  // Add streakiness - teams often have runs of wins or losses
  if (form.length >= 4 && Math.random() > 0.5) {
    // 50% chance of a streak in recent games
    const streakValue = Math.random() > 0.5 ? 'W' : 'L';
    const streakStart = Math.floor(Math.random() * 3); // Start streak at index 0, 1, or 2
    form[streakStart] = streakValue;
    form[streakStart + 1] = streakValue;
    form[streakStart + 2] = streakValue;
  }
  
  return form;
}

// Create a fallback match when mapping fails
const createFallbackMatch = (league: League): Match => {
  const id = `fallback-${league}-${Date.now()}`;
  const now = new Date();
  
  const homeTeam: Team = {
    id: "home-team",
    name: `${league} Home Team`,
    shortName: "HOME",
    logo: getTeamLogoUrl("Home Team", league),
    record: "0-0",
  };

  const awayTeam: Team = {
    id: "away-team",
    name: `${league} Away Team`,
    shortName: "AWAY",
    logo: getTeamLogoUrl("Away Team", league),
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
