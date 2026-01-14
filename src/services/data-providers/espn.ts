// src/services/data-providers/espn.ts

import { fetchWithRetry } from "@/utils/fetchWithRetry";

export interface ESPNGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: string;
  odds?: any;
  injuries?: any;
  league?: string;
  score?: {
    home: number;
    away: number;
    period?: string;
  };
}

export async function getESPNGames(): Promise<ESPNGame[]> {
  try {
    const url = "/api/espn/games";
    const data = await fetchWithRetry(url);

    if (!data || !Array.isArray(data)) return [];

    return data.map((g: any) => ({
      id: g.id,
      homeTeam: g.home_team || g.homeTeam,
      awayTeam: g.away_team || g.awayTeam,
      startTime: g.start_time || g.startTime,
      status: g.status,
      odds: g.odds,
      injuries: g.injuries,
      league: g.league,
      score: g.score ? {
        home: g.score.home ?? 0,
        away: g.score.away ?? 0,
        period: g.score.period,
      } : undefined,
    }));
  } catch (error) {
    console.warn("Failed to fetch ESPN games:", error);
    return [];
  }
}
