import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Match, League, Sportsbook, LiveOdds, SpreadOdds, TotalOdds } from "@/types/sports";

export interface OddsApiEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  league: string;
  bookmakers: Array<{
    key: string;
    title: string;
    last_update: string;
    markets: Array<{
      key: string;
      last_update: string;
      outcomes: Array<{
        name: string;
        price: number;
        point?: number;
      }>;
    }>;
  }>;
}

export interface OddsApiResponse {
  success: boolean;
  events: OddsApiEvent[];
  totalEvents: number;
  apiUsage: {
    remaining: string;
    used: string;
  };
  errors?: string[];
  fetchedAt: string;
}

// Sportsbook definitions for mapping
const SPORTSBOOK_MAP: Record<string, Sportsbook> = {
  draftkings: { id: "draftkings", name: "DraftKings", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/c/c5/DraftKings_logo.svg/1200px-DraftKings_logo.svg.png", isAvailable: true },
  fanduel: { id: "fanduel", name: "FanDuel", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/FanDuel_logo.svg/1200px-FanDuel_logo.svg.png", isAvailable: true },
  betmgm: { id: "betmgm", name: "BetMGM", logo: "https://upload.wikimedia.org/wikipedia/commons/1/13/BetMGM_logo.svg", isAvailable: true },
  caesars: { id: "caesars", name: "Caesars", logo: "https://upload.wikimedia.org/wikipedia/en/c/c9/Caesars_Entertainment_logo.svg", isAvailable: true },
  pointsbet: { id: "pointsbet", name: "PointsBet", logo: "https://upload.wikimedia.org/wikipedia/commons/3/3f/PointsBet_logo.svg", isAvailable: true },
  barstool: { id: "barstool", name: "Barstool", logo: "", isAvailable: true },
  bet365: { id: "bet365", name: "Bet365", logo: "https://upload.wikimedia.org/wikipedia/commons/0/0a/Bet365_logo.svg", isAvailable: true },
  betrivers: { id: "betrivers", name: "BetRivers", logo: "", isAvailable: true },
  unibet: { id: "unibet", name: "Unibet", logo: "https://upload.wikimedia.org/wikipedia/commons/1/10/Unibet_logo.svg", isAvailable: true },
  williamhill: { id: "williamhill", name: "William Hill", logo: "", isAvailable: true },
};

// Map Odds API event to our Match type
const mapOddsEventToMatch = (event: OddsApiEvent): Match => {
  const homeTeam = event.home_team;
  const awayTeam = event.away_team;
  
  // Get best odds from bookmakers
  let bestHomeOdds = 0;
  let bestAwayOdds = 0;
  let bestDrawOdds: number | undefined;
  
  const liveOdds: LiveOdds[] = [];
  
  event.bookmakers.forEach(bookmaker => {
    const h2hMarket = bookmaker.markets.find(m => m.key === "h2h");
    const spreadsMarket = bookmaker.markets.find(m => m.key === "spreads");
    const totalsMarket = bookmaker.markets.find(m => m.key === "totals");
    
    if (h2hMarket) {
      const homeOutcome = h2hMarket.outcomes.find(o => o.name === homeTeam);
      const awayOutcome = h2hMarket.outcomes.find(o => o.name === awayTeam);
      const drawOutcome = h2hMarket.outcomes.find(o => o.name === "Draw");
      
      const homeOdds = homeOutcome ? americanToDecimal(homeOutcome.price) : 0;
      const awayOdds = awayOutcome ? americanToDecimal(awayOutcome.price) : 0;
      const drawOdds = drawOutcome ? americanToDecimal(drawOutcome.price) : undefined;
      
      // Extract spread data
      let spread: SpreadOdds | undefined;
      if (spreadsMarket) {
        const homeSpreadOutcome = spreadsMarket.outcomes.find(o => o.name === homeTeam);
        const awaySpreadOutcome = spreadsMarket.outcomes.find(o => o.name === awayTeam);
        
        if (homeSpreadOutcome && awaySpreadOutcome && homeSpreadOutcome.point !== undefined) {
          spread = {
            homeSpread: homeSpreadOutcome.point,
            homeSpreadOdds: americanToDecimal(homeSpreadOutcome.price),
            awaySpread: awaySpreadOutcome.point ?? -homeSpreadOutcome.point,
            awaySpreadOdds: americanToDecimal(awaySpreadOutcome.price),
          };
        }
      }
      
      // Extract totals data
      let totals: TotalOdds | undefined;
      if (totalsMarket) {
        const overOutcome = totalsMarket.outcomes.find(o => o.name === "Over");
        const underOutcome = totalsMarket.outcomes.find(o => o.name === "Under");
        
        if (overOutcome && underOutcome && overOutcome.point !== undefined) {
          totals = {
            total: overOutcome.point,
            overOdds: americanToDecimal(overOutcome.price),
            underOdds: americanToDecimal(underOutcome.price),
          };
        }
      }
      
      // Get sportsbook info or create default
      const sportsbook = SPORTSBOOK_MAP[bookmaker.key] || {
        id: bookmaker.key,
        name: bookmaker.title,
        logo: "",
        isAvailable: true,
      };
      
      liveOdds.push({
        homeWin: homeOdds,
        awayWin: awayOdds,
        draw: drawOdds,
        updatedAt: bookmaker.last_update,
        sportsbook,
        spread,
        totals,
      });
      
      if (homeOdds > bestHomeOdds) bestHomeOdds = homeOdds;
      if (awayOdds > bestAwayOdds) bestAwayOdds = awayOdds;
      if (drawOdds && (!bestDrawOdds || drawOdds > bestDrawOdds)) bestDrawOdds = drawOdds;
    }
  });

  // Determine recommended bet based on best odds
  const recommended: 'home' | 'away' | 'draw' = bestHomeOdds < bestAwayOdds ? "home" : "away";
  
  // Calculate confidence based on odds difference
  const confidence = Math.min(0.85, Math.max(0.5, 1 - Math.abs((1 / bestHomeOdds) - (1 / bestAwayOdds))));

  return {
    id: event.id,
    homeTeam: {
      id: `home-${event.id}`,
      name: homeTeam,
      shortName: getAbbreviation(homeTeam),
      logo: "",
      record: "",
    },
    awayTeam: {
      id: `away-${event.id}`,
      name: awayTeam,
      shortName: getAbbreviation(awayTeam),
      logo: "",
      record: "",
    },
    startTime: event.commence_time,
    status: new Date(event.commence_time) > new Date() ? "scheduled" : "live",
    league: (event.league || mapSportKeyToLeague(event.sport_key)) as League,
    odds: {
      homeWin: bestHomeOdds || 1.9,
      awayWin: bestAwayOdds || 1.9,
      draw: bestDrawOdds,
    },
    liveOdds,
    prediction: {
      recommended,
      confidence,
      projectedScore: {
        home: 0,
        away: 0,
      },
    },
    isMockData: false,
  };
};

// Convert American odds to decimal
const americanToDecimal = (american: number): number => {
  if (american > 0) {
    return (american / 100) + 1;
  } else {
    return (100 / Math.abs(american)) + 1;
  }
};

// Get team abbreviation
const getAbbreviation = (teamName: string): string => {
  const words = teamName.split(" ");
  if (words.length === 1) return teamName.substring(0, 3).toUpperCase();
  return words.map(w => w[0]).join("").toUpperCase().substring(0, 3);
};

// Map sport key to our league type
const mapSportKeyToLeague = (sportKey: string): League => {
  const mapping: Record<string, League> = {
    americanfootball_nfl: "NFL",
    basketball_nba: "NBA",
    baseball_mlb: "MLB",
    icehockey_nhl: "NHL",
    soccer_epl: "SOCCER",
    americanfootball_ncaaf: "NCAAF",
    basketball_ncaab: "NCAAB",
  };
  return mapping[sportKey] || "NFL";
};

export interface OddsApiStatus {
  isLoading: boolean;
  isError: boolean;
  apiUsage?: {
    remaining: string;
    used: string;
  };
  fetchedAt?: string;
  eventCount: number;
}

export function useOddsApi(league: League | "ALL" = "ALL") {
  const query = useQuery<Match[], Error>({
    queryKey: ["odds-api", league],
    queryFn: async () => {
      console.log(`Fetching odds from edge function for league: ${league}`);
      
      const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-odds`);
      url.searchParams.set("league", league);
      
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Odds API error:", errorText);
        throw new Error(`Failed to fetch odds: ${response.statusText}`);
      }

      const result: OddsApiResponse = await response.json();
      
      if (!result.success && result.events?.length === 0) {
        console.warn("No odds data available");
        return [];
      }

      console.log(`Received ${result.totalEvents} events from Odds API`);
      console.log(`API Usage: ${result.apiUsage.used} used, ${result.apiUsage.remaining} remaining`);
      
      // Filter by league if specified
      let events = result.events;
      if (league !== "ALL") {
        events = events.filter(e => e.league === league);
      }

      return events.map(mapOddsEventToMatch);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes to save API calls
    retry: 1,
  });

  return {
    ...query,
    matches: query.data || [],
  };
}
