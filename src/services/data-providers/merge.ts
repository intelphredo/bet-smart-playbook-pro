// src/services/data-providers/merge.ts

import { ESPNGame } from "./espn";
import { SportradarGame } from "./sportradar";
import { OddsApiGame } from "./odds-api";
import { MockGame } from "./mock";

export interface UnifiedGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: string;
  odds?: any;
  injuries?: any;
  league?: string;
  source: string;
  lastUpdated: string;
}

interface MergeInput {
  espnGames: ESPNGame[];
  sportradarGames: SportradarGame[];
  oddsApiGames: OddsApiGame[];
  mockGames: MockGame[];
}

export function mergeGames({
  espnGames,
  sportradarGames,
  oddsApiGames,
  mockGames,
}: MergeInput): UnifiedGame[] {
  const now = new Date().toISOString();
  const merged: UnifiedGame[] = [];
  const seenIds = new Set<string>();

  // ESPN is primary source
  for (const game of espnGames) {
    if (!seenIds.has(game.id)) {
      seenIds.add(game.id);
      
      // Find matching odds
      const oddsMatch = oddsApiGames.find((o) => o.id === game.id);
      
      merged.push({
        id: game.id,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        startTime: game.startTime,
        status: game.status,
        odds: oddsMatch?.odds || game.odds,
        injuries: game.injuries,
        league: game.league,
        source: "ESPN",
        lastUpdated: now,
      });
    }
  }

  // Add Sportradar games not in ESPN
  for (const game of sportradarGames) {
    if (!seenIds.has(game.id)) {
      seenIds.add(game.id);
      
      const oddsMatch = oddsApiGames.find((o) => o.id === game.id);
      
      merged.push({
        id: game.id,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        startTime: game.startTime,
        status: game.status,
        odds: oddsMatch?.odds,
        injuries: game.injuries,
        league: game.league,
        source: "Sportradar",
        lastUpdated: now,
      });
    }
  }

  // Fallback to mock if no real data
  if (merged.length === 0) {
    for (const game of mockGames) {
      merged.push({
        id: game.id,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        startTime: game.startTime,
        status: game.status,
        odds: game.odds,
        injuries: game.injuries,
        league: game.league,
        source: "Mock",
        lastUpdated: now,
      });
    }
  }

  return merged;
}
