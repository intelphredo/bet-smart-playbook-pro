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
  const url = "/api/sportradar/games";

  const data = await fetchWithRetry(url);

  if (!data || !Array.isArray(data)) return [];

  return data.map((g: any) => ({
    id: g.id,
    homeTeam: g.home.name,
    awayTeam: g.away.name,
    startTime: g.scheduled,
    status: g.status,
    injuries: g.injuries,
    league: g.league,
  }));
}
