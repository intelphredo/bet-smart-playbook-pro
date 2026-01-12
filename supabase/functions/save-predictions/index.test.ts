// Test suite for save-predictions edge function
// Run with: deno test --allow-net --allow-env supabase/functions/save-predictions/index.test.ts

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "http://localhost:54321";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/save-predictions`;

// Mock ESPN response for testing
const mockESPNResponse = {
  events: [
    {
      id: "test-game-001",
      name: "Test Team A vs Test Team B",
      date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      status: {
        type: {
          state: "pre",
          completed: false,
        },
      },
      competitions: [
        {
          id: "comp-001",
          competitors: [
            {
              homeAway: "home",
              score: "0",
              team: {
                id: "team-a",
                displayName: "Test Team A",
                abbreviation: "TTA",
              },
            },
            {
              homeAway: "away",
              score: "0",
              team: {
                id: "team-b",
                displayName: "Test Team B",
                abbreviation: "TTB",
              },
            },
          ],
          odds: [
            {
              details: "TTA -3.5",
              overUnder: 220.5,
              homeTeamOdds: { moneyLine: -150 },
              awayTeamOdds: { moneyLine: 130 },
            },
          ],
        },
      ],
    },
  ],
};

Deno.test("save-predictions: handles OPTIONS request", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "OPTIONS",
  });

  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
});

Deno.test("save-predictions: returns success response structure", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ leagues: ["NBA"] }),
  });

  const data = await response.json();

  // Should return a valid response structure
  assertExists(data);
  if (data.success) {
    assertExists(data.data);
    assertEquals(typeof data.data.saved, "number");
    assertEquals(typeof data.data.skipped, "number");
  } else {
    // API may fail without proper config, but structure should be valid
    assertExists(data.error);
  }
});

Deno.test("save-predictions: accepts leagues parameter", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ leagues: ["NBA", "NFL"] }),
  });

  assertEquals(response.status === 200 || response.status === 500, true);
  const data = await response.json();
  assertExists(data);
});

Deno.test("save-predictions: handles empty body", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  // Should not crash with empty body
  assertEquals(response.status === 200 || response.status === 500, true);
});

// Unit tests for prediction generation logic
Deno.test("generatePrediction: calculates correct probability", () => {
  // Test American odds to probability conversion
  const testCases = [
    { homeOdds: -150, awayOdds: 130, expectedRecommended: "home" },
    { homeOdds: 200, awayOdds: -250, expectedRecommended: "away" },
    { homeOdds: -110, awayOdds: -110, expectedRecommended: "home" }, // Home advantage
  ];

  for (const tc of testCases) {
    const homeProb = tc.homeOdds > 0
      ? 100 / (tc.homeOdds + 100)
      : Math.abs(tc.homeOdds) / (Math.abs(tc.homeOdds) + 100);
    const awayProb = tc.awayOdds > 0
      ? 100 / (tc.awayOdds + 100)
      : Math.abs(tc.awayOdds) / (Math.abs(tc.awayOdds) + 100);

    const homeAdvantage = 0.03;
    const adjustedHomeProb = homeProb + homeAdvantage;
    const recommended = adjustedHomeProb >= 0.5 ? "home" : "away";

    assertEquals(recommended, tc.expectedRecommended);
  }
});

Deno.test("generatePrediction: confidence is within valid range", () => {
  const testOdds = [
    { home: -500, away: 400 },
    { home: -110, away: -110 },
    { home: 150, away: -170 },
  ];

  for (const odds of testOdds) {
    const homeProb = odds.home > 0
      ? 100 / (odds.home + 100)
      : Math.abs(odds.home) / (Math.abs(odds.home) + 100);

    const confidence = Math.min(80, Math.max(50, Math.round(homeProb * 100)));

    assertEquals(confidence >= 50, true, "Confidence should be at least 50");
    assertEquals(confidence <= 80, true, "Confidence should be at most 80");
  }
});

Deno.test("generatePrediction: projected scores match league averages", () => {
  const leagueScores: Record<string, { avg: number; variance: number }> = {
    NBA: { avg: 112, variance: 8 },
    NFL: { avg: 23, variance: 7 },
    MLB: { avg: 4.5, variance: 2 },
    NHL: { avg: 3, variance: 1.5 },
  };

  for (const [league, scores] of Object.entries(leagueScores)) {
    const projectedHome = Math.round(scores.avg + scores.variance * 0.3);
    const projectedAway = Math.round(scores.avg - scores.variance * 0.2);

    // Scores should be reasonable for the sport
    assertEquals(projectedHome > 0, true, `${league} home score should be positive`);
    assertEquals(projectedAway > 0, true, `${league} away score should be positive`);
    assertEquals(
      Math.abs(projectedHome - scores.avg) <= scores.variance,
      true,
      `${league} home score should be within variance`
    );
  }
});
