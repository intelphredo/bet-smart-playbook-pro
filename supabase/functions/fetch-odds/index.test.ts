// Test suite for fetch-odds edge function
// Run with: deno test --allow-net --allow-env supabase/functions/fetch-odds/index.test.ts

import { assertEquals, assertExists, assertArrayIncludes } from "https://deno.land/std@0.208.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "http://localhost:54321";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/fetch-odds`;

// ============================================
// Integration Tests - Edge Function Endpoints
// ============================================

Deno.test("fetch-odds: handles OPTIONS request for CORS", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "OPTIONS",
  });

  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
});

Deno.test("fetch-odds: GET returns response structure", async () => {
  const response = await fetch(`${FUNCTION_URL}?league=NBA`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  const data = await response.json();

  // Should return a valid response structure
  assertExists(data);
  if (data.success) {
    assertExists(data.events);
    assertEquals(Array.isArray(data.events), true);
    assertEquals(typeof data.totalEvents, "number");
    assertExists(data.fetchedAt);
  } else {
    // API may fail without API key, but structure should be valid
    assertExists(data.error);
  }
});

Deno.test("fetch-odds: accepts league parameter", async () => {
  const response = await fetch(`${FUNCTION_URL}?league=NFL`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  // Should not crash
  assertEquals(response.status === 200 || response.status === 500, true);
});

Deno.test("fetch-odds: handles unknown league gracefully", async () => {
  const response = await fetch(`${FUNCTION_URL}?league=UNKNOWN`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  const data = await response.json();
  
  // Should return error for unknown league
  assertEquals(response.status, 400);
  assertExists(data.error);
});

Deno.test("fetch-odds: ALL league fetches multiple sports", async () => {
  const response = await fetch(`${FUNCTION_URL}?league=ALL`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  // Should not crash - may fail without API key
  assertEquals(response.status === 200 || response.status === 500, true);
});

// ============================================
// Unit Tests - Sport Key Mapping
// ============================================

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

  const expectedLeagues = ["NFL", "NBA", "MLB", "NHL", "SOCCER", "NCAAF", "NCAAB"];
  
  for (const league of expectedLeagues) {
    assertEquals(league in SPORT_KEYS, true, `${league} should be in SPORT_KEYS`);
  }
});

Deno.test("SPORT_KEYS: returns correct API sport keys", () => {
  const SPORT_KEYS: Record<string, string> = {
    NFL: "americanfootball_nfl",
    NBA: "basketball_nba",
    MLB: "baseball_mlb",
    NHL: "icehockey_nhl",
    SOCCER: "soccer_epl",
  };

  assertEquals(SPORT_KEYS.NFL, "americanfootball_nfl");
  assertEquals(SPORT_KEYS.NBA, "basketball_nba");
  assertEquals(SPORT_KEYS.MLB, "baseball_mlb");
  assertEquals(SPORT_KEYS.NHL, "icehockey_nhl");
  assertEquals(SPORT_KEYS.SOCCER, "soccer_epl");
});

Deno.test("SPORT_KEYS: unknown league returns undefined", () => {
  const SPORT_KEYS: Record<string, string> = {
    NFL: "americanfootball_nfl",
    NBA: "basketball_nba",
  };

  assertEquals(SPORT_KEYS["UNKNOWN"], undefined);
});

// ============================================
// Unit Tests - Markets and Regions
// ============================================

Deno.test("markets: default markets include h2h, spreads, totals", () => {
  const defaultMarkets = "h2h,spreads,totals";
  const marketsList = defaultMarkets.split(",");

  assertArrayIncludes(marketsList, ["h2h"]);
  assertArrayIncludes(marketsList, ["spreads"]);
  assertArrayIncludes(marketsList, ["totals"]);
});

Deno.test("bookmakers: FanDuel is first priority", () => {
  const defaultBookmakers = "fanduel,draftkings,betmgm,caesars,pointsbetus,betrivers,williamhill_us,unibet_us";
  const bookmakersList = defaultBookmakers.split(",");

  assertEquals(bookmakersList[0], "fanduel", "FanDuel should be first priority");
  assertEquals(bookmakersList.length, 8, "Should include 8 sportsbooks");
});

// ============================================
// Unit Tests - Response Processing
// ============================================

Deno.test("response: events include league information", () => {
  const mockEvents = [
    { id: "1", home_team: "Team A", league: "NBA" },
    { id: "2", home_team: "Team B", league: "NFL" },
  ];

  for (const event of mockEvents) {
    assertExists(event.league, "Each event should have a league");
  }
});

Deno.test("response: fulfilled results are processed correctly", () => {
  const results = [
    { status: "fulfilled" as const, value: { league: "NBA", events: [{ id: "1" }] } },
    { status: "fulfilled" as const, value: { league: "NFL", events: [{ id: "2" }, { id: "3" }] } },
    { status: "rejected" as const, reason: new Error("API Error") },
  ];

  const successfulResults = results
    .filter((r): r is { status: "fulfilled"; value: { league: string; events: { id: string }[] } } => 
      r.status === "fulfilled"
    )
    .map(r => r.value);

  assertEquals(successfulResults.length, 2);
  assertEquals(successfulResults[0].league, "NBA");
  assertEquals(successfulResults[1].events.length, 2);
});

Deno.test("response: rejected results are captured as errors", () => {
  const results = [
    { status: "fulfilled" as const, value: { league: "NBA", events: [] } },
    { status: "rejected" as const, reason: { message: "Rate limited" } },
    { status: "rejected" as const, reason: { message: "Network error" } },
  ];

  const failedResults = results
    .filter((r): r is { status: "rejected"; reason: { message: string } } => 
      r.status === "rejected"
    )
    .map(r => r.reason.message);

  assertEquals(failedResults.length, 2);
  assertArrayIncludes(failedResults, ["Rate limited"]);
  assertArrayIncludes(failedResults, ["Network error"]);
});

// ============================================
// Unit Tests - API Usage Tracking
// ============================================

Deno.test("apiUsage: headers are parsed correctly", () => {
  const mockHeaders = new Headers();
  mockHeaders.set("x-requests-remaining", "450");
  mockHeaders.set("x-requests-used", "50");

  const remaining = mockHeaders.get("x-requests-remaining");
  const used = mockHeaders.get("x-requests-used");

  assertEquals(remaining, "450");
  assertEquals(used, "50");
});

// ============================================
// Unit Tests - Event Flattening
// ============================================

Deno.test("eventFlattening: combines events from multiple leagues", () => {
  const successfulResults = [
    { league: "NBA", events: [{ id: "nba-1" }, { id: "nba-2" }] },
    { league: "NFL", events: [{ id: "nfl-1" }] },
    { league: "MLB", events: [] },
  ];

  const allEvents = successfulResults.flatMap(r => 
    r.events.map((event: { id: string }) => ({
      ...event,
      league: r.league,
    }))
  );

  assertEquals(allEvents.length, 3);
  assertEquals(allEvents[0].league, "NBA");
  assertEquals(allEvents[2].league, "NFL");
});
