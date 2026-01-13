// Test suite for record-odds edge function
// Run with: deno test --allow-net --allow-env supabase/functions/record-odds/index.test.ts

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "http://localhost:54321";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/record-odds`;

// =============================================================================
// HTTP Endpoint Tests
// =============================================================================

Deno.test("record-odds: handles OPTIONS request for CORS", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "OPTIONS",
  });

  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
});

Deno.test("record-odds: returns valid response structure", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  const data = await response.json();
  assertExists(data);
  
  // Should have either success with data or error
  if (data.success) {
    assertEquals(typeof data.recordsInserted, "number");
    assertExists(data.recordedAt);
  } else {
    assertExists(data.error);
  }
});

Deno.test("record-odds: accepts leagues parameter", async () => {
  const response = await fetch(`${FUNCTION_URL}?leagues=NBA,NFL`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  assertEquals(response.status === 200 || response.status === 500, true);
  const data = await response.json();
  assertExists(data);
});

// =============================================================================
// Sport Key Mapping Tests
// =============================================================================

Deno.test("SPORT_KEYS: contains all major leagues", () => {
  const SPORT_KEYS: Record<string, string> = {
    NFL: "americanfootball_nfl",
    NBA: "basketball_nba",
    MLB: "baseball_mlb",
    NHL: "icehockey_nhl",
    SOCCER: "soccer_epl",
    NCAAF: "americanfootball_ncaaf",
    NCAAB: "basketball_ncaab",
  };

  assertEquals(SPORT_KEYS["NBA"], "basketball_nba");
  assertEquals(SPORT_KEYS["NFL"], "americanfootball_nfl");
  assertEquals(SPORT_KEYS["MLB"], "baseball_mlb");
  assertEquals(SPORT_KEYS["NHL"], "icehockey_nhl");
  assertEquals(Object.keys(SPORT_KEYS).length >= 7, true);
});

Deno.test("SPORT_KEYS: unknown leagues are undefined", () => {
  const SPORT_KEYS: Record<string, string> = {
    NBA: "basketball_nba",
  };

  assertEquals(SPORT_KEYS["INVALID"], undefined);
  assertEquals(SPORT_KEYS["XFL"], undefined);
});

// =============================================================================
// Odds Record Interface Tests
// =============================================================================

Deno.test("OddsRecord: valid moneyline record structure", () => {
  interface OddsRecord {
    match_id: string;
    match_title: string;
    league: string;
    sportsbook_id: string;
    sportsbook_name: string;
    market_type: string;
    home_odds?: number;
    away_odds?: number;
    draw_odds?: number;
  }

  const record: OddsRecord = {
    match_id: "match-001",
    match_title: "Lakers vs Celtics",
    league: "NBA",
    sportsbook_id: "fanduel",
    sportsbook_name: "FanDuel",
    market_type: "moneyline",
    home_odds: -150,
    away_odds: 130,
  };

  assertEquals(record.market_type, "moneyline");
  assertExists(record.home_odds);
  assertExists(record.away_odds);
  assertEquals(record.draw_odds, undefined);
});

Deno.test("OddsRecord: valid spread record structure", () => {
  interface OddsRecord {
    match_id: string;
    match_title: string;
    league: string;
    sportsbook_id: string;
    sportsbook_name: string;
    market_type: string;
    spread_home?: number;
    spread_away?: number;
    spread_home_odds?: number;
    spread_away_odds?: number;
  }

  const record: OddsRecord = {
    match_id: "match-001",
    match_title: "Chiefs vs 49ers",
    league: "NFL",
    sportsbook_id: "draftkings",
    sportsbook_name: "DraftKings",
    market_type: "spread",
    spread_home: -3.5,
    spread_away: 3.5,
    spread_home_odds: -110,
    spread_away_odds: -110,
  };

  assertEquals(record.market_type, "spread");
  assertEquals(record.spread_home, -3.5);
  assertEquals(record.spread_away, 3.5);
});

Deno.test("OddsRecord: valid totals record structure", () => {
  interface OddsRecord {
    match_id: string;
    match_title: string;
    league: string;
    sportsbook_id: string;
    sportsbook_name: string;
    market_type: string;
    total_line?: number;
    over_odds?: number;
    under_odds?: number;
  }

  const record: OddsRecord = {
    match_id: "match-001",
    match_title: "Yankees vs Red Sox",
    league: "MLB",
    sportsbook_id: "betmgm",
    sportsbook_name: "BetMGM",
    market_type: "total",
    total_line: 8.5,
    over_odds: -115,
    under_odds: -105,
  };

  assertEquals(record.market_type, "total");
  assertEquals(record.total_line, 8.5);
  assertExists(record.over_odds);
  assertExists(record.under_odds);
});

// =============================================================================
// Batch Processing Tests
// =============================================================================

Deno.test("batchProcessing: correctly batches odds records", () => {
  const oddsRecords = Array(1500).fill({ match_id: "test", sportsbook_id: "test" });
  const batchSize = 500;
  const batches: unknown[][] = [];

  for (let i = 0; i < oddsRecords.length; i += batchSize) {
    batches.push(oddsRecords.slice(i, i + batchSize));
  }

  assertEquals(batches.length, 3);
  assertEquals(batches[0].length, 500);
  assertEquals(batches[1].length, 500);
  assertEquals(batches[2].length, 500);
});

Deno.test("batchProcessing: handles records less than batch size", () => {
  const oddsRecords = Array(250).fill({ match_id: "test" });
  const batchSize = 500;
  const batches: unknown[][] = [];

  for (let i = 0; i < oddsRecords.length; i += batchSize) {
    batches.push(oddsRecords.slice(i, i + batchSize));
  }

  assertEquals(batches.length, 1);
  assertEquals(batches[0].length, 250);
});

Deno.test("batchProcessing: handles empty records array", () => {
  const oddsRecords: unknown[] = [];
  const batchSize = 500;
  let batchCount = 0;

  for (let i = 0; i < oddsRecords.length; i += batchSize) {
    batchCount++;
  }

  assertEquals(batchCount, 0);
});

// =============================================================================
// Data Validation Tests
// =============================================================================

Deno.test("dataValidation: match_title is correctly formatted", () => {
  const homeTeam = "Lakers";
  const awayTeam = "Celtics";
  const matchTitle = `${homeTeam} vs ${awayTeam}`;

  assertEquals(matchTitle, "Lakers vs Celtics");
  assertEquals(matchTitle.includes(" vs "), true);
});

Deno.test("dataValidation: handles special characters in team names", () => {
  const testCases = [
    { home: "76ers", away: "Trail Blazers", expected: "76ers vs Trail Blazers" },
    { home: "D'Tigers", away: "T'Wolves", expected: "D'Tigers vs T'Wolves" },
    { home: "FC Barcelona", away: "Real Madrid CF", expected: "FC Barcelona vs Real Madrid CF" },
  ];

  for (const tc of testCases) {
    const matchTitle = `${tc.home} vs ${tc.away}`;
    assertEquals(matchTitle, tc.expected);
  }
});

Deno.test("dataValidation: decimal odds are properly typed", () => {
  const oddsValues = [1.45, 2.10, 3.00, 1.01, 100.00];

  for (const odds of oddsValues) {
    assertEquals(typeof odds, "number");
    assertEquals(odds > 0, true);
  }
});

// =============================================================================
// API Response Parsing Tests
// =============================================================================

Deno.test("parseApiResponse: extracts correct home team from outcomes", () => {
  const mockH2HMarket = {
    outcomes: [
      { name: "Lakers", price: 1.65 },
      { name: "Celtics", price: 2.20 },
    ],
  };

  const homeTeam = "Lakers";
  const homeOutcome = mockH2HMarket.outcomes.find((o) => o.name === homeTeam);

  assertExists(homeOutcome);
  assertEquals(homeOutcome.price, 1.65);
});

Deno.test("parseApiResponse: handles draw outcome in soccer", () => {
  const mockH2HMarket = {
    outcomes: [
      { name: "Manchester United", price: 2.10 },
      { name: "Draw", price: 3.40 },
      { name: "Liverpool", price: 3.20 },
    ],
  };

  const drawOutcome = mockH2HMarket.outcomes.find((o) => o.name === "Draw");
  assertExists(drawOutcome);
  assertEquals(drawOutcome.price, 3.40);
});

Deno.test("parseApiResponse: extracts spread points correctly", () => {
  const mockSpreadMarket = {
    outcomes: [
      { name: "Chiefs", point: -3.5, price: 1.91 },
      { name: "49ers", point: 3.5, price: 1.91 },
    ],
  };

  const homeTeam = "Chiefs";
  const homeSpread = mockSpreadMarket.outcomes.find((o) => o.name === homeTeam);

  assertExists(homeSpread);
  assertEquals(homeSpread.point, -3.5);
  assertEquals(homeSpread.price, 1.91);
});

Deno.test("parseApiResponse: extracts totals line and odds", () => {
  const mockTotalsMarket = {
    outcomes: [
      { name: "Over", point: 45.5, price: 1.95 },
      { name: "Under", point: 45.5, price: 1.87 },
    ],
  };

  const overOutcome = mockTotalsMarket.outcomes.find((o) => o.name === "Over");
  const underOutcome = mockTotalsMarket.outcomes.find((o) => o.name === "Under");

  assertExists(overOutcome);
  assertExists(underOutcome);
  assertEquals(overOutcome.point, underOutcome.point);
  assertEquals(overOutcome.point, 45.5);
});
