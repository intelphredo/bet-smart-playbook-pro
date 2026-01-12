// Shared test utilities for prediction edge functions
// Import in test files: import { ... } from "../_shared/test-utils.ts";

export const mockPrediction = {
  id: "pred-001",
  match_id: "match-001",
  league: "NBA",
  algorithm_id: "85c48bbe-5b1a-4c1e-a0d5-e284e9e952f1",
  prediction: "Lakers Win",
  confidence: 65,
  projected_score_home: 112,
  projected_score_away: 105,
  status: "pending",
  actual_score_home: null,
  actual_score_away: null,
  accuracy_rating: null,
  predicted_at: new Date().toISOString(),
  result_updated_at: null,
};

export const mockESPNGame = {
  id: "match-001",
  name: "Lakers vs Celtics",
  date: new Date().toISOString(),
  status: {
    type: {
      state: "post",
      completed: true,
    },
  },
  competitions: [
    {
      id: "comp-001",
      status: {
        type: {
          completed: true,
          state: "post",
        },
      },
      competitors: [
        {
          homeAway: "home",
          score: "115",
          winner: true,
          team: {
            displayName: "Lakers",
            abbreviation: "LAL",
          },
        },
        {
          homeAway: "away",
          score: "108",
          winner: false,
          team: {
            displayName: "Celtics",
            abbreviation: "BOS",
          },
        },
      ],
    },
  ],
};

export const mockGameResult = {
  completed: true,
  homeScore: 115,
  awayScore: 108,
  homeTeam: "Lakers",
  awayTeam: "Celtics",
  homeWon: true,
};

// Helper to calculate accuracy rating (mirror of edge function logic)
export function calculateAccuracyRating(
  projected: { home: number | null; away: number | null },
  actual: { home: number; away: number },
  predictedCorrectWinner: boolean
): number {
  let score = 0;

  // 50 points for correct winner
  if (predictedCorrectWinner) {
    score += 50;
  }

  // Up to 50 points for score accuracy
  if (projected.home !== null && projected.away !== null) {
    const projectedDiff = Math.abs(projected.home - projected.away);
    const actualDiff = Math.abs(actual.home - actual.away);
    const diffError = Math.abs(projectedDiff - actualDiff);

    const diffScore = Math.max(0, 25 - diffError * 3);

    const homeError = Math.abs((projected.home || 0) - actual.home);
    const awayError = Math.abs((projected.away || 0) - actual.away);
    const avgError = (homeError + awayError) / 2;
    const individualScore = Math.max(0, 25 - avgError * 2);

    score += diffScore + individualScore;
  }

  return Math.min(100, Math.round(score));
}

// Helper to generate prediction from odds (mirror of edge function logic)
export function generatePrediction(
  homeOdds: number,
  awayOdds: number,
  league: string
): { recommended: "home" | "away"; confidence: number; projectedHome: number; projectedAway: number } {
  const homeProb = homeOdds > 0
    ? 100 / (homeOdds + 100)
    : Math.abs(homeOdds) / (Math.abs(homeOdds) + 100);
  const awayProb = awayOdds > 0
    ? 100 / (awayOdds + 100)
    : Math.abs(awayOdds) / (Math.abs(awayOdds) + 100);

  const homeAdvantage = 0.03;
  const adjustedHomeProb = homeProb + homeAdvantage;

  const recommended = adjustedHomeProb >= 0.5 ? "home" : "away";
  const confidence = Math.min(80, Math.max(50, Math.round((recommended === "home" ? adjustedHomeProb : awayProb) * 100)));

  const leagueScores: Record<string, { avg: number; variance: number }> = {
    NBA: { avg: 112, variance: 8 },
    NFL: { avg: 23, variance: 7 },
    MLB: { avg: 4.5, variance: 2 },
    NHL: { avg: 3, variance: 1.5 },
    NCAAF: { avg: 28, variance: 10 },
    NCAAB: { avg: 72, variance: 8 },
    SOCCER: { avg: 1.3, variance: 0.8 },
  };

  const scores = leagueScores[league] || { avg: 100, variance: 10 };
  const projectedHome = Math.round(scores.avg + (recommended === "home" ? scores.variance * 0.3 : -scores.variance * 0.2));
  const projectedAway = Math.round(scores.avg + (recommended === "away" ? scores.variance * 0.3 : -scores.variance * 0.2));

  return { recommended, confidence, projectedHome, projectedAway };
}

// Assert helper for async operations
export async function assertAsyncThrows(
  fn: () => Promise<unknown>,
  errorClass?: ErrorConstructor,
  msgIncludes?: string
): Promise<void> {
  let thrown = false;
  try {
    await fn();
  } catch (e) {
    thrown = true;
    if (errorClass && !(e instanceof errorClass)) {
      throw new Error(`Expected error of type ${errorClass.name}, got ${e.constructor.name}`);
    }
    if (msgIncludes && !(e as Error).message.includes(msgIncludes)) {
      throw new Error(`Expected error message to include "${msgIncludes}", got "${(e as Error).message}"`);
    }
  }
  if (!thrown) {
    throw new Error("Expected function to throw an error");
  }
}

// Create a mock fetch response
export function createMockResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
