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
}

export async function getESPNGames(): Promise<ESPNGame[]> {
  const url = "/api/espn/games"; // your edge function or proxy

  const data = await fetchWithRetry(url);

  if (!data || !Array.isArray(data)) return [];

  return data.map((g: any) => ({
    id: g.id,
    homeTeam: g.home_team,
    awayTeam: g.away_team,
    startTime: g.start_time,
    status: g.status,
    odds: g.odds,
    injuries: g.injuries,
    league: g.league,
  }));
}
