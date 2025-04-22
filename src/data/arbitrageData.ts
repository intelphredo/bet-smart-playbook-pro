import { ArbitrageOpportunity } from "@/types";

export const arbitrageOpportunities: ArbitrageOpportunity[] = [
  {
    id: "arb-1",
    matchId: "nba-1",
    match: {
      homeTeam: "Denver Nuggets",
      awayTeam: "Miami Heat",
      league: "NBA",
      startTime: "2025-04-21T19:00:00Z"
    },
    bookmakers: [
      {
        name: "BetSmart",
        odds: {
          homeWin: 1.92,
          awayWin: 2.25
        }
      },
      {
        name: "SportsBet",
        odds: {
          homeWin: 1.85,
          awayWin: 2.35
        }
      },
      {
        name: "GameDay",
        odds: {
          homeWin: 1.95,
          awayWin: 2.20
        }
      }
    ],
    arbitragePercentage: 98.2,
    potentialProfit: 1.8,
    bettingStrategy: [
      {
        bookmaker: "BetSmart",
        team: "home",
        stakePercentage: 54.1,
        odds: 1.92
      },
      {
        bookmaker: "SportsBet",
        team: "away",
        stakePercentage: 45.9,
        odds: 2.35
      }
    ],
    isPremium: true
  },
  {
    id: "arb-2",
    matchId: "nfl-1",
    match: {
      homeTeam: "Kansas City Chiefs",
      awayTeam: "San Francisco 49ers",
      league: "NFL",
      startTime: "2025-04-22T20:00:00Z"
    },
    bookmakers: [
      {
        name: "BetSmart",
        odds: {
          homeWin: 1.75,
          awayWin: 2.40
        }
      },
      {
        name: "SportsBet",
        odds: {
          homeWin: 1.70,
          awayWin: 2.50
        }
      },
      {
        name: "GameDay",
        odds: {
          homeWin: 1.80,
          awayWin: 2.30
        }
      }
    ],
    arbitragePercentage: 97.5,
    potentialProfit: 2.5,
    bettingStrategy: [
      {
        bookmaker: "GameDay",
        team: "home",
        stakePercentage: 56.2,
        odds: 1.80
      },
      {
        bookmaker: "SportsBet",
        team: "away",
        stakePercentage: 43.8,
        odds: 2.50
      }
    ],
    isPremium: true
  },
  {
    id: "arb-3",
    matchId: "soccer-1",
    match: {
      homeTeam: "Manchester City",
      awayTeam: "Liverpool",
      league: "SOCCER",
      startTime: "2025-04-23T15:00:00Z"
    },
    bookmakers: [
      {
        name: "BetSmart",
        odds: {
          homeWin: 2.00,
          awayWin: 3.50,
          draw: 3.75
        }
      },
      {
        name: "SportsBet",
        odds: {
          homeWin: 1.95,
          awayWin: 3.60,
          draw: 3.90
        }
      },
      {
        name: "GameDay",
        odds: {
          homeWin: 2.10,
          awayWin: 3.40,
          draw: 3.80
        }
      }
    ],
    arbitragePercentage: 96.8,
    potentialProfit: 3.2,
    bettingStrategy: [
      {
        bookmaker: "GameDay",
        team: "home",
        stakePercentage: 48.1,
        odds: 2.10
      },
      {
        bookmaker: "SportsBet",
        team: "away",
        stakePercentage: 28.2,
        odds: 3.60
      },
      {
        bookmaker: "SportsBet",
        team: "draw",
        stakePercentage: 23.7,
        odds: 3.90
      }
    ],
    isPremium: true
  }
];
