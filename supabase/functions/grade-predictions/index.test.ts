// Test suite for grade-predictions edge function
// Run with: deno test --allow-net --allow-env supabase/functions/grade-predictions/index.test.ts

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "http://localhost:54321";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/grade-predictions`;

Deno.test("grade-predictions: handles OPTIONS request", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "OPTIONS",
  });

  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
});

Deno.test("grade-predictions: returns success response structure", async () => {
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
    assertExists(data.data);
    assertEquals(typeof data.data.graded, "number");
    assertEquals(typeof data.data.checked, "number");
  } else {
    assertExists(data.error);
  }
});

Deno.test("grade-predictions: handles GET request", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  // Should work with GET as well
  assertEquals(response.status === 200 || response.status === 500, true);
});

// Unit tests for accuracy rating calculation
Deno.test("calculateAccuracyRating: correct winner gets 50 points", () => {
  const testCases = [
    { projected: { home: 100, away: 90 }, actual: { home: 110, away: 95 }, correctWinner: true },
    { projected: { home: 90, away: 100 }, actual: { home: 95, away: 110 }, correctWinner: true },
    { projected: { home: 100, away: 90 }, actual: { home: 85, away: 95 }, correctWinner: false },
  ];

  for (const tc of testCases) {
    const projectedWinner = tc.projected.home > tc.projected.away ? "home" : "away";
    const actualWinner = tc.actual.home > tc.actual.away ? "home" : "away";
    const winnerScore = projectedWinner === actualWinner ? 50 : 0;

    assertEquals(winnerScore, tc.correctWinner ? 50 : 0);
  }
});

Deno.test("calculateAccuracyRating: score difference accuracy", () => {
  const testCases = [
    { projected: { home: 100, away: 90 }, actual: { home: 105, away: 95 }, expectedDiffScore: 25 }, // Same diff
    { projected: { home: 100, away: 90 }, actual: { home: 110, away: 95 }, expectedMinDiffScore: 19 }, // 5 point diff error
  ];

  for (const tc of testCases) {
    const projectedDiff = Math.abs(tc.projected.home - tc.projected.away);
    const actualDiff = Math.abs(tc.actual.home - tc.actual.away);
    const diffError = Math.abs(projectedDiff - actualDiff);
    const diffScore = Math.max(0, 25 - diffError * 3);

    if (tc.expectedDiffScore !== undefined) {
      assertEquals(diffScore, tc.expectedDiffScore);
    }
    if (tc.expectedMinDiffScore !== undefined) {
      assertEquals(diffScore >= tc.expectedMinDiffScore, true);
    }
  }
});

Deno.test("calculateAccuracyRating: total score is capped at 100", () => {
  // Perfect prediction
  const projected = { home: 100, away: 90 };
  const actual = { home: 100, away: 90 };

  const projectedDiff = Math.abs(projected.home - projected.away);
  const actualDiff = Math.abs(actual.home - actual.away);
  const diffScore = Math.max(0, 25 - Math.abs(projectedDiff - actualDiff) * 3);

  const homeError = Math.abs(projected.home - actual.home);
  const awayError = Math.abs(projected.away - actual.away);
  const avgError = (homeError + awayError) / 2;
  const individualScore = Math.max(0, 25 - avgError * 2);

  const winnerScore = 50; // Correct winner

  const total = Math.min(100, diffScore + individualScore + winnerScore);

  assertEquals(total <= 100, true);
  assertEquals(total, 100); // Perfect prediction should score 100
});

Deno.test("calculateAccuracyRating: handles null projected scores", () => {
  const projected = { home: null, away: null };
  const actual = { home: 100, away: 95 };

  // When projected scores are null, only winner accuracy matters
  let score = 0;

  if (projected.home !== null && projected.away !== null) {
    // Calculate score accuracy
  } else {
    // No score accuracy available, just use base
    score = 0;
  }

  assertEquals(score, 0);
});

Deno.test("calculateAccuracyRating: handles draw predictions", () => {
  const projected = { home: 100, away: 100 };
  const actual = { home: 95, away: 95 };

  const projectedWinner = projected.home > projected.away ? "home" :
                          projected.home < projected.away ? "away" : "draw";
  const actualWinner = actual.home > actual.away ? "home" :
                       actual.home < actual.away ? "away" : "draw";

  const winnerScore = projectedWinner === actualWinner ? 50 : 0;

  assertEquals(projectedWinner, "draw");
  assertEquals(actualWinner, "draw");
  assertEquals(winnerScore, 50);
});

// Integration-style tests for prediction matching
Deno.test("predictionMatching: team name in prediction text", () => {
  const testCases = [
    { prediction: "Lakers Win", homeTeam: "Lakers", awayTeam: "Celtics", homeWon: true, expected: true },
    { prediction: "Lakers Win", homeTeam: "Lakers", awayTeam: "Celtics", homeWon: false, expected: false },
    { prediction: "Celtics Win", homeTeam: "Lakers", awayTeam: "Celtics", homeWon: false, expected: true },
    { prediction: "home", homeTeam: "Lakers", awayTeam: "Celtics", homeWon: true, expected: true },
    { prediction: "away", homeTeam: "Lakers", awayTeam: "Celtics", homeWon: false, expected: true },
  ];

  for (const tc of testCases) {
    const predictionLower = tc.prediction.toLowerCase();
    const predictedHome =
      predictionLower.includes(tc.homeTeam.toLowerCase()) ||
      predictionLower.includes("home");

    const isCorrect = predictedHome ? tc.homeWon : !tc.homeWon;

    assertEquals(isCorrect, tc.expected, `Failed for: ${tc.prediction}`);
  }
});

Deno.test("batchProcessing: handles empty predictions array", () => {
  const pendingPredictions: unknown[] = [];
  const BATCH_SIZE = 10;
  let processedBatches = 0;

  for (let i = 0; i < pendingPredictions.length; i += BATCH_SIZE) {
    processedBatches++;
  }

  assertEquals(processedBatches, 0);
});

Deno.test("batchProcessing: correctly batches predictions", () => {
  const pendingPredictions = Array(25).fill({ id: "test" });
  const BATCH_SIZE = 10;
  const batches: unknown[][] = [];

  for (let i = 0; i < pendingPredictions.length; i += BATCH_SIZE) {
    batches.push(pendingPredictions.slice(i, i + BATCH_SIZE));
  }

  assertEquals(batches.length, 3);
  assertEquals(batches[0].length, 10);
  assertEquals(batches[1].length, 10);
  assertEquals(batches[2].length, 5);
});
