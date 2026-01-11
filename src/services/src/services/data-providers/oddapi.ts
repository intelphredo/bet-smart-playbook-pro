// src/services/data-providers/odds-api.ts

import { fetchWithRetry } from "@/utils/fetchWithRetry";

export interface OddsApiGame {
  id: string;
  odds: any;
}

export async function getOddsApiGames(): Promise<OddsApiGame[]> {
  const url = "/api/odds-api/games";

  const data = await fetchWithRetry(url);

  if (!data || !Array.isArray(data)) return [];

  return data.map((g: any) => ({
    id: g.id,
    odds: g.odds,
  }));
}
