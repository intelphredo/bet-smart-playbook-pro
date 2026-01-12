import { useQuery } from "@tanstack/react-query";
import { League, Match, LiveOdds, Sportsbook } from "@/types/sports";
import { supabase } from "@/integrations/supabase/client";

interface OddsApiEvent {
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
      outcomes: Array<{
        name: string;
        price: number;
        point?: number;
      }>;
    }>;
  }>;
}

interface OddsApiResponse {
  success: boolean;
  events: OddsApiEvent[];
  totalEvents: number;
  apiUsage: {
    remaining: string;
    used: string;
  };
  fetchedAt: string;
  errors?: string[];
}

/**
 * Convert American odds to decimal odds
 */
function americanToDecimal(american: number): number {
  if (american > 0) {
    return (american / 100) + 1;
  }
  return (100 / Math.abs(american)) + 1;
}

/**
 * Map Odds API event to Match format
 */
function mapOddsApiEventToMatch(event: OddsApiEvent): Match {
  // Extract moneyline odds from first bookmaker
  const h2hMarket = event.bookmakers?.[0]?.markets?.find(m => m.key === "h2h");
  const homeOutcome = h2hMarket?.outcomes?.find(o => o.name === event.home_team);
  const awayOutcome = h2hMarket?.outcomes?.find(o => o.name === event.away_team);
  const drawOutcome = h2hMarket?.outcomes?.find(o => o.name === "Draw");

  // Build live odds from all bookmakers
  const liveOdds: LiveOdds[] = event.bookmakers?.map((bookmaker) => {
    const bh2h = bookmaker.markets?.find(m => m.key === "h2h");
    const spreads = bookmaker.markets?.find(m => m.key === "spreads");
    const totals = bookmaker.markets?.find(m => m.key === "totals");

    const bHomeOutcome = bh2h?.outcomes?.find(o => o.name === event.home_team);
    const bAwayOutcome = bh2h?.outcomes?.find(o => o.name === event.away_team);
    const bDrawOutcome = bh2h?.outcomes?.find(o => o.name === "Draw");

    const sportsbook: Sportsbook = {
      id: bookmaker.key,
      name: bookmaker.title,
      logo: `/sportsbooks/${bookmaker.key}.png`,
      isAvailable: true,
    };

    const spreadHome = spreads?.outcomes?.find(o => o.name === event.home_team);
    const spreadAway = spreads?.outcomes?.find(o => o.name === event.away_team);
    const totalOver = totals?.outcomes?.find(o => o.name === "Over");
    const totalUnder = totals?.outcomes?.find(o => o.name === "Under");

    return {
      homeWin: bHomeOutcome ? americanToDecimal(bHomeOutcome.price) : 0,
      awayWin: bAwayOutcome ? americanToDecimal(bAwayOutcome.price) : 0,
      draw: bDrawOutcome ? americanToDecimal(bDrawOutcome.price) : undefined,
      updatedAt: bookmaker.last_update,
      sportsbook,
      spread: spreadHome && spreadAway ? {
        homeSpread: spreadHome.point || 0,
        homeSpreadOdds: americanToDecimal(spreadHome.price),
        awaySpread: spreadAway.point || 0,
        awaySpreadOdds: americanToDecimal(spreadAway.price),
      } : undefined,
      totals: totalOver && totalUnder ? {
        total: totalOver.point || 0,
        overOdds: americanToDecimal(totalOver.price),
        underOdds: americanToDecimal(totalUnder.price),
      } : undefined,
    };
  }) || [];

  // Determine match status based on commence time
  const now = new Date();
  const commenceTime = new Date(event.commence_time);
  const threeHoursLater = new Date(commenceTime.getTime() + 3 * 60 * 60 * 1000);
  
  let status: "scheduled" | "live" | "finished" = "scheduled";
  if (now >= commenceTime && now < threeHoursLater) {
    status = "live";
  } else if (now >= threeHoursLater) {
    status = "finished";
  }

  return {
    id: event.id,
    league: event.league as League,
    homeTeam: {
      id: `${event.league}-${event.home_team.replace(/\s+/g, "-").toLowerCase()}`,
      name: event.home_team,
      shortName: event.home_team.split(" ").pop() || event.home_team,
      logo: "",
    },
    awayTeam: {
      id: `${event.league}-${event.away_team.replace(/\s+/g, "-").toLowerCase()}`,
      name: event.away_team,
      shortName: event.away_team.split(" ").pop() || event.away_team,
      logo: "",
    },
    startTime: event.commence_time,
    odds: {
      homeWin: homeOutcome ? americanToDecimal(homeOutcome.price) : 0,
      awayWin: awayOutcome ? americanToDecimal(awayOutcome.price) : 0,
      draw: drawOutcome ? americanToDecimal(drawOutcome.price) : undefined,
    },
    liveOdds,
    prediction: {
      recommended: "home",
      confidence: 50,
      projectedScore: { home: 0, away: 0 },
    },
    status,
  };
}

/**
 * Fetch odds from the edge function
 */
async function fetchOddsFromEdgeFunction(league: League | "ALL"): Promise<Match[]> {
  const { data, error } = await supabase.functions.invoke<OddsApiResponse>("fetch-odds", {
    body: null,
    headers: {},
  });

  // Add query params manually since invoke doesn't support them well
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-odds?league=${league}`,
    {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch odds: ${response.status}`);
  }

  const result: OddsApiResponse = await response.json();

  if (!result.success || !result.events) {
    return [];
  }

  return result.events.map(mapOddsApiEventToMatch);
}

/**
 * Hook to fetch real-time odds data from The Odds API via edge function
 */
export function useOddsApi(league: League | "ALL" = "ALL") {
  const query = useQuery<Match[]>({
    queryKey: ["oddsApi", league],
    queryFn: () => fetchOddsFromEdgeFunction(league),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    matches: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

/**
 * Legacy hook for backwards compatibility
 */
export const useOdds = useOddsApi;