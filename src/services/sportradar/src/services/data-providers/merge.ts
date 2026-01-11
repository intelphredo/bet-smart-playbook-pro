// src/services/data-providers/merge.ts

import type { ESPNGame } from "./espn";
import type { SportradarGame } from "./sportradar";
import type { OddsApiGame } from "./odds-api";
import type { MockGame } from "./mock";

// -----------------------------
// Provider Priority
// -----------------------------
// Higher number = higher priority
const SOURCE_PRIORITY = {
  sportradar: 3,
  espn: 2,
  oddsApi: 1,
  mock: 0,
};

// -----------------------------
// Determine Source
// -----------------------------
const determineSource = (providers: {
  sportradar?: any;
  espn?: any;
  oddsApi?: any;
  mock?: any;
}) => {
  if (providers.sportradar) return "Sportradar";
  if (providers.espn) return "ESPN";
  if (providers.oddsApi) return "Odds API";
  return "Mock";
};

// -----------------------------
// Normalize Helpers
// -----------------------------
const normalizeTeamName = (name?: string) => {
  if (!name) return "";
  return name.trim();
};

const normalizeStatus = (status?: string) => {
  if (!status) return "unknown";
  return status.toLowerCase();
};

// -----------------------------
// Merge Logic
// -----------------------------
export const mergeGameData = ({
  espn,
  sportradar,
  oddsApi,
  mock,
}: {
  espn?: ESPNGame;
  sportradar?: SportradarGame;
  oddsApi?: OddsApiGame;
  mock?: MockGame;
}) => {
  const providers = { espn, sportradar, oddsApi, mock };

  // Pick highest-priority provider for each field
  const pick = <T>(field: keyof ESPNGame | keyof SportradarGame | keyof OddsApiGame | keyof MockGame): T | undefined => {
    const ordered = Object.entries(providers)
      .filter(([_, data]) => data && data[field] !== undefined)
      .sort(
        ([a], [b]) =>
          SOURCE_PRIORITY[b as keyof typeof SOURCE_PRIORITY] -
          SOURCE_PRIORITY[a as keyof typeof SOURCE_PRIORITY]
      );

    return ordered.length > 0 ? (ordered[0][1] as any)[field] : undefined;
  };

  // Unified game object
  const merged = {
    id: pick<string>("id"),
    homeTeam: normalizeTeamName(pick<string>("homeTeam")),
    awayTeam: normalizeTeamName(pick<string>("awayTeam")),
    startTime: pick<string>("startTime"),
    status: normalizeStatus(pick<string>("status")),
    odds: pick<any>("odds"),
    injuries: pick<any>("injuries"),
    league: pick<string>("league"),
    source: determineSource(providers),
    lastUpdated: new Date().toISOString(),
  };

  return merged;
};

// -----------------------------
// Merge Array of Games
// -----------------------------
export const mergeGames = ({
  espnGames = [],
  sportradarGames = [],
  oddsApiGames = [],
  mockGames = [],
}: {
  espnGames?: ESPNGame[];
  sportradarGames?: SportradarGame[];
  oddsApiGames?: OddsApiGame[];
  mockGames?: MockGame[];
}) => {
  const allIds = new Set<string>();

  // Collect all unique game IDs
  [espnGames, sportradarGames, oddsApiGames, mockGames].forEach((list) => {
    list.forEach((g) => allIds.add(g.id));
  });

  // Merge each game by ID
  const merged = Array.from(allIds).map((id) => {
    const espn = espnGames.find((g) => g.id === id);
    const sportradar = sportradarGames.find((g) => g.id === id);
    const oddsApi = oddsApiGames.find((g) => g.id === id);
    const mock = mockGames.find((g) => g.id === id);

    return mergeGameData({ espn, sportradar, oddsApi, mock });
  });

  return merged;
};
