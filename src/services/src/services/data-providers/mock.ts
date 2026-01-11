// src/services/data-providers/mock.ts

export interface MockGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: string;
  odds?: any;
  injuries?: any;
  league?: string;
}

export async function getMockGames(): Promise<MockGame[]> {
  return [
    {
      id: "mock-1",
      homeTeam: "Mock Home",
      awayTeam: "Mock Away",
      startTime: new Date().toISOString(),
      status: "scheduled",
      odds: { spread: -3 },
      injuries: [],
      league: "mock",
    },
  ];
}
