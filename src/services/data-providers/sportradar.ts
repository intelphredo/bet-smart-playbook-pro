// src/services/data-providers/sportradar.ts

import { fetchWithRetry } from "@/utils/fetchWithRetry";

export interface SportradarGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: string;
  injuries?: any;
  league?: string;
}

export async function getSportradarGames(): Promise<SportradarGame[]> {
  try {
    const url = "/api/sportradar/games";
    const data = await fetchWithRetry(url);

    if (!data || !Array.isArray(data)) return [];

    return data.map((g: any) => ({
      id: g.id,
      homeTeam: g.home?.name || g.homeTeam,
      awayTeam: g.away?.name || g.awayTeam,
      startTime: g.scheduled || g.startTime,
      status: g.status,
      injuries: g.injuries,
      league: g.league,
    }));
  } catch (error) {
    console.warn("Failed to fetch Sportradar games:", error);
    return [];
  }
}
