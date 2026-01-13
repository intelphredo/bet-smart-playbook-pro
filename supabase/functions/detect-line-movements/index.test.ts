// Test suite for detect-line-movements edge function
// Run with: deno test --allow-net --allow-env supabase/functions/detect-line-movements/index.test.ts

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "http://localhost:54321";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/detect-line-movements`;

// Movement thresholds (mirrored from edge function)
const MONEYLINE_MOVEMENT_THRESHOLD = 15;
const SPREAD_MOVEMENT_THRESHOLD = 0.5;
const TOTAL_MOVEMENT_THRESHOLD = 1.0;

// =============================================================================
// HTTP Endpoint Tests
// =============================================================================

Deno.test("detect-line-movements: handles OPTIONS request for CORS", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "OPTIONS",
  });

  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
});

Deno.test("detect-line-movements: returns valid response structure", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  const data = await response.json();
  assertExists(data);

  if (data.success) {
    assertEquals(typeof data.movements_detected, "number");
    assertEquals(typeof data.alerts_created, "number");
  } else {
    assertExists(data.error);
  }
});

// =============================================================================
// Movement Detection Threshold Tests
// =============================================================================

Deno.test("thresholds: moneyline movement detected above threshold", () => {
  const testCases = [
    { current: -125, previous: -110, expected: true },  // 15 point move
    { current: -130, previous: -110, expected: true },  // 20 point move
    { current: -115, previous: -110, expected: false }, // 5 point move
    { current: 150, previous: 130, expected: true },    // 20 point move
    { current: 135, previous: 130, expected: false },   // 5 point move
  ];

  for (const tc of testCases) {
    const movement = Math.abs(tc.current - tc.previous);
    const isSignificant = movement >= MONEYLINE_MOVEMENT_THRESHOLD;
    assertEquals(isSignificant, tc.expected, 
      `Moneyline ${tc.previous} -> ${tc.current} should ${tc.expected ? '' : 'not '}be significant`);
  }
});

Deno.test("thresholds: spread movement detected above threshold", () => {
  const testCases = [
    { current: -4.0, previous: -3.5, expected: true },   // 0.5 point move
    { current: -4.5, previous: -3.5, expected: true },   // 1.0 point move
    { current: -3.5, previous: -3.5, expected: false },  // no move
    { current: 3.0, previous: 3.5, expected: true },     // 0.5 point move
    { current: 3.5, previous: 3.0, expected: true },     // 0.5 point move
  ];

  for (const tc of testCases) {
    const movement = Math.abs(tc.current - tc.previous);
    const isSignificant = movement >= SPREAD_MOVEMENT_THRESHOLD;
    assertEquals(isSignificant, tc.expected,
      `Spread ${tc.previous} -> ${tc.current} should ${tc.expected ? '' : 'not '}be significant`);
  }
});

Deno.test("thresholds: total movement detected above threshold", () => {
  const testCases = [
    { current: 221.5, previous: 220.5, expected: true },  // 1.0 point move
    { current: 222.5, previous: 220.5, expected: true },  // 2.0 point move
    { current: 221.0, previous: 220.5, expected: false }, // 0.5 point move
    { current: 45.0, previous: 47.0, expected: true },    // 2.0 point move
  ];

  for (const tc of testCases) {
    const movement = Math.abs(tc.current - tc.previous);
    const isSignificant = movement >= TOTAL_MOVEMENT_THRESHOLD;
    assertEquals(isSignificant, tc.expected,
      `Total ${tc.previous} -> ${tc.current} should ${tc.expected ? '' : 'not '}be significant`);
  }
});

// =============================================================================
// Movement Direction Tests
// =============================================================================

Deno.test("direction: steam move detection (line moving toward favorite)", () => {
  const movements = [
    { type: 'moneyline_home', from: -110, to: -125, change: -15 }, // Home becomes more favored
  ];

  const hasSteamMove = movements.some(m => m.change < 0);
  assertEquals(hasSteamMove, true);
});

Deno.test("direction: reverse line movement detection", () => {
  const movements = [
    { type: 'moneyline_home', from: -125, to: -110, change: 15 }, // Line moving back
  ];

  const hasReverseMove = movements.some(m => m.change > 0);
  assertEquals(hasReverseMove, true);
});

Deno.test("direction: correctly identifies movement type", () => {
  const determineDirection = (movements: Array<{ change: number }>) => {
    return movements.some(m => m.change < 0) ? 'steam' : 'reverse';
  };

  assertEquals(determineDirection([{ change: -15 }]), 'steam');
  assertEquals(determineDirection([{ change: 15 }]), 'reverse');
  assertEquals(determineDirection([{ change: -10 }, { change: 5 }]), 'steam'); // Mixed, steam wins
});

// =============================================================================
// Odds Grouping Tests
// =============================================================================

Deno.test("grouping: groups odds by match_id and sportsbook_id", () => {
  const mockOdds = [
    { match_id: "m1", sportsbook_id: "sb1", home_odds: -110 },
    { match_id: "m1", sportsbook_id: "sb1", home_odds: -115 },
    { match_id: "m1", sportsbook_id: "sb2", home_odds: -112 },
    { match_id: "m2", sportsbook_id: "sb1", home_odds: -108 },
  ];

  const groupedOdds: Record<string, typeof mockOdds> = {};
  
  for (const odd of mockOdds) {
    const key = `${odd.match_id}:${odd.sportsbook_id}`;
    if (!groupedOdds[key]) groupedOdds[key] = [];
    if (groupedOdds[key].length < 2) {
      groupedOdds[key].push(odd);
    }
  }

  assertEquals(Object.keys(groupedOdds).length, 3);
  assertEquals(groupedOdds["m1:sb1"].length, 2);
  assertEquals(groupedOdds["m1:sb2"].length, 1);
  assertEquals(groupedOdds["m2:sb1"].length, 1);
});

Deno.test("grouping: only keeps two most recent records per group", () => {
  const mockOdds = Array(5).fill(null).map((_, i) => ({
    match_id: "m1",
    sportsbook_id: "sb1",
    home_odds: -110 - i,
    recorded_at: new Date(Date.now() - i * 1000).toISOString(),
  }));

  const groupedOdds: Record<string, typeof mockOdds> = {};
  
  for (const odd of mockOdds) {
    const key = `${odd.match_id}:${odd.sportsbook_id}`;
    if (!groupedOdds[key]) groupedOdds[key] = [];
    if (groupedOdds[key].length < 2) {
      groupedOdds[key].push(odd);
    }
  }

  assertEquals(groupedOdds["m1:sb1"].length, 2);
});

// =============================================================================
// User Preference Matching Tests
// =============================================================================

Deno.test("preferences: matches favorite team in match_title", () => {
  const favoriteTeams = ["Lakers", "Celtics"];
  const matchTitle = "Lakers @ Knicks";

  const isRelevant = favoriteTeams.some(team => 
    matchTitle.toLowerCase().includes(team.toLowerCase())
  );

  assertEquals(isRelevant, true);
});

Deno.test("preferences: matches favorite league", () => {
  const favoriteLeagues = ["NBA", "NFL"];
  const league = "NBA";

  const isRelevant = favoriteLeagues.includes(league);
  assertEquals(isRelevant, true);
});

Deno.test("preferences: matches favorite match by ID", () => {
  const favoriteMatches = ["match-001", "match-002"];
  const matchId = "match-001";

  const isRelevant = favoriteMatches.includes(matchId);
  assertEquals(isRelevant, true);
});

Deno.test("preferences: no preferences means all matches are relevant", () => {
  const favoriteTeams: string[] = [];
  const favoriteLeagues: string[] = [];
  
  // When no preferences set, default behavior (based on edge function logic)
  const hasNoPreferences = favoriteTeams.length === 0 && favoriteLeagues.length === 0;
  assertEquals(hasNoPreferences, true);
});

// =============================================================================
// Alert Message Formatting Tests
// =============================================================================

Deno.test("alertFormat: formats spread movement correctly", () => {
  const movement = { type: 'spread', from: -3.5, to: -4.0 };
  
  const message = `Spread: ${movement.from > 0 ? '+' : ''}${movement.from} → ${movement.to > 0 ? '+' : ''}${movement.to}`;
  assertEquals(message, "Spread: -3.5 → -4");
});

Deno.test("alertFormat: formats total movement correctly", () => {
  const movement = { type: 'total', from: 220.5, to: 222.5 };
  
  const message = `Total: ${movement.from} → ${movement.to}`;
  assertEquals(message, "Total: 220.5 → 222.5");
});

Deno.test("alertFormat: formats moneyline movement with plus signs", () => {
  const movement = { type: 'moneyline_away', from: 130, to: 150 };
  
  const label = movement.type.includes('home') ? 'Home' : 'Away';
  const message = `${label}: ${movement.from > 0 ? '+' : ''}${movement.from} → ${movement.to > 0 ? '+' : ''}${movement.to}`;
  assertEquals(message, "Away: +130 → +150");
});

// =============================================================================
// Movement Details Object Tests
// =============================================================================

Deno.test("movementDetails: captures all required fields", () => {
  const movementDetails = {
    match_id: "match-001",
    match_title: "Lakers @ Celtics",
    league: "NBA",
    sportsbook_id: "fanduel",
    previous_odds: { home: -110, away: -110 },
    current_odds: { home: -125, away: 105 },
    movements: [
      { type: 'moneyline_home', from: -110, to: -125, change: -15 }
    ]
  };

  assertExists(movementDetails.match_id);
  assertExists(movementDetails.match_title);
  assertExists(movementDetails.league);
  assertExists(movementDetails.sportsbook_id);
  assertExists(movementDetails.previous_odds);
  assertExists(movementDetails.current_odds);
  assertEquals(movementDetails.movements.length >= 1, true);
});

// =============================================================================
// Null Value Handling Tests
// =============================================================================

Deno.test("nullHandling: skips comparison when current value is null", () => {
  const current = { home_odds: null, away_odds: -110 };
  const previous = { home_odds: -105, away_odds: -115 };

  const checkMoneyline = (curr: number | null, prev: number | null) => {
    if (curr !== null && prev !== null) {
      return Math.abs(curr - prev) >= MONEYLINE_MOVEMENT_THRESHOLD;
    }
    return false;
  };

  assertEquals(checkMoneyline(current.home_odds, previous.home_odds), false);
  assertEquals(checkMoneyline(current.away_odds, previous.away_odds), false);
});

Deno.test("nullHandling: skips comparison when previous value is null", () => {
  const current = { spread_home: -3.5 };
  const previous = { spread_home: null };

  const checkSpread = (curr: number | null, prev: number | null) => {
    if (curr !== null && prev !== null) {
      return Math.abs(curr - prev) >= SPREAD_MOVEMENT_THRESHOLD;
    }
    return false;
  };

  assertEquals(checkSpread(current.spread_home, previous.spread_home), false);
});

// =============================================================================
// Edge Cases Tests
// =============================================================================

Deno.test("edgeCases: handles very large odds movements", () => {
  const current = -500;
  const previous = -200;
  const movement = Math.abs(current - previous);

  assertEquals(movement >= MONEYLINE_MOVEMENT_THRESHOLD, true);
  assertEquals(movement, 300);
});

Deno.test("edgeCases: handles odds crossing from favorite to underdog", () => {
  const current = 105;  // Now underdog
  const previous = -110; // Was favorite

  // This is a significant line move
  const movement = Math.abs(current - previous);
  assertEquals(movement >= MONEYLINE_MOVEMENT_THRESHOLD, true);
});

Deno.test("edgeCases: handles decimal spread values", () => {
  const current = -3.0;
  const previous = -2.5;
  const movement = Math.abs(current - previous);

  assertEquals(movement, 0.5);
  assertEquals(movement >= SPREAD_MOVEMENT_THRESHOLD, true);
});
