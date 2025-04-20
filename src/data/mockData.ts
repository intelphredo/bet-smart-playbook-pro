import { League, Match, BettingAlgorithm, PlayerProp, ArbitrageOpportunity } from "@/types/sports";

export const upcomingMatches: Match[] = [
  {
    id: "1",
    league: "NBA",
    homeTeam: {
      id: "1",
      name: "Los Angeles Lakers",
      shortName: "LAL",
      logo: "/lakers-logo.png",
      record: "45-37",
    },
    awayTeam: {
      id: "2",
      name: "Golden State Warriors",
      shortName: "GSW",
      logo: "/warriors-logo.png",
      record: "46-36",
    },
    startTime: "2025-04-21T18:00:00Z",
    odds: {
      homeWin: 1.85,
      awayWin: 2.05,
    },
    prediction: {
      recommended: "home",
      confidence: 65,
      projectedScore: {
        home: 112,
        away: 108,
      },
    },
    status: "scheduled",
  },
  {
    id: "2",
    league: "NFL",
    homeTeam: {
      id: "3",
      name: "New England Patriots",
      shortName: "NE",
      logo: "/patriots-logo.png",
      record: "12-5",
    },
    awayTeam: {
      id: "4",
      name: "Kansas City Chiefs",
      shortName: "KC",
      logo: "/chiefs-logo.png",
      record: "13-4",
    },
    startTime: "2025-09-08T20:20:00Z",
    odds: {
      homeWin: 2.10,
      awayWin: 1.75,
    },
    prediction: {
      recommended: "away",
      confidence: 70,
      projectedScore: {
        home: 24,
        away: 28,
      },
    },
    status: "scheduled",
  },
  {
    id: "3",
    league: "MLB",
    homeTeam: {
      id: "5",
      name: "Los Angeles Dodgers",
      shortName: "LAD",
      logo: "/dodgers-logo.png",
      record: "95-67",
    },
    awayTeam: {
      id: "6",
      name: "San Francisco Giants",
      shortName: "SF",
      logo: "/giants-logo.png",
      record: "88-74",
    },
    startTime: "2025-07-04T13:05:00Z",
    odds: {
      homeWin: 1.65,
      awayWin: 2.25,
    },
    prediction: {
      recommended: "home",
      confidence: 60,
      projectedScore: {
        home: 5,
        away: 3,
      },
    },
    status: "scheduled",
  },
  {
    id: "4",
    league: "NHL",
    homeTeam: {
      id: "7",
      name: "Boston Bruins",
      shortName: "BOS",
      logo: "/bruins-logo.png",
      record: "51-26-5",
    },
    awayTeam: {
      id: "8",
      name: "Toronto Maple Leafs",
      shortName: "TOR",
      logo: "/leafs-logo.png",
      record: "49-27-6",
    },
    startTime: "2025-05-15T19:30:00Z",
    odds: {
      homeWin: 1.90,
      awayWin: 1.90,
    },
    prediction: {
      recommended: "home",
      confidence: 55,
      projectedScore: {
        home: 4,
        away: 3,
      },
    },
    status: "scheduled",
  },
  {
    id: "5",
    league: "SOCCER",
    homeTeam: {
      id: "9",
      name: "Manchester United",
      shortName: "MU",
      logo: "/manutd-logo.png",
      record: "26-8-4",
    },
    awayTeam: {
      id: "10",
      name: "Liverpool",
      shortName: "LFC",
      logo: "/liverpool-logo.png",
      record: "24-10-4",
    },
    startTime: "2025-06-01T16:00:00Z",
    odds: {
      homeWin: 2.40,
      awayWin: 2.60,
      draw: 3.50,
    },
    prediction: {
      recommended: "draw",
      confidence: 45,
      projectedScore: {
        home: 1,
        away: 1,
      },
    },
    status: "scheduled",
  },
];

export const liveMatches: Match[] = [
  {
    id: "6",
    league: "NBA",
    homeTeam: {
      id: "11",
      name: "Boston Celtics",
      shortName: "BOS",
      logo: "/celtics-logo.png",
      record: "50-32",
    },
    awayTeam: {
      id: "12",
      name: "Milwaukee Bucks",
      shortName: "MIL",
      logo: "/bucks-logo.png",
      record: "48-34",
    },
    startTime: "2025-04-18T19:00:00Z",
    odds: {
      homeWin: 1.75,
      awayWin: 2.15,
    },
    prediction: {
      recommended: "home",
      confidence: 58,
      projectedScore: {
        home: 115,
        away: 110,
      },
    },
    status: "live",
    score: {
      home: 60,
      away: 55,
      period: "Half-time",
    },
  },
  {
    id: "7",
    league: "NFL",
    homeTeam: {
      id: "13",
      name: "Seattle Seahawks",
      shortName: "SEA",
      logo: "/seahawks-logo.png",
      record: "9-8",
    },
    awayTeam: {
      id: "14",
      name: "Green Bay Packers",
      shortName: "GB",
      logo: "/packers-logo.png",
      record: "10-7",
    },
    startTime: "2025-09-15T20:15:00Z",
    odds: {
      homeWin: 1.95,
      awayWin: 1.85,
    },
    prediction: {
      recommended: "away",
      confidence: 62,
      projectedScore: {
        home: 21,
        away: 24,
      },
    },
    status: "live",
    score: {
      home: 14,
      away: 17,
      period: "3rd Quarter",
    },
  },
];

export const algorithms: BettingAlgorithm[] = [
  {
    name: "SmartScore",
    description: "A proprietary algorithm that predicts match outcomes based on historical data and real-time statistics.",
    winRate: 72,
    recentResults: ["W", "W", "L", "W", "W"],
  },
  {
    name: "PropHunter",
    description: "Identifies high-value player props by analyzing player performance, matchups, and betting odds.",
    winRate: 68,
    recentResults: ["W", "L", "W", "W", "L"],
  },
  {
    name: "ArbAlert",
    description: "Detects arbitrage opportunities across multiple sportsbooks for guaranteed profit.",
    winRate: 95,
    recentResults: ["W", "W", "W", "W", "W"],
  },
];

export const playerProps: PlayerProp[] = [
  {
    id: "1",
    playerId: "101",
    playerName: "LeBron James",
    team: "LAL",
    matchId: "1",
    propType: "points",
    line: 27.5,
    odds: {
      over: 1.90,
      under: 1.90,
    },
    prediction: {
      recommended: "over",
      confidence: 68,
      projectedValue: 29.1,
    },
    lastGames: [30, 25, 28, 32, 27],
    seasonAverage: 27.2,
  },
  {
    id: "2",
    playerId: "102",
    playerName: "Patrick Mahomes",
    team: "KC",
    matchId: "2",
    propType: "touchdowns",
    line: 2.5,
    odds: {
      over: 2.10,
      under: 1.75,
    },
    prediction: {
      recommended: "over",
      confidence: 72,
      projectedValue: 2.8,
    },
    lastGames: [3, 2, 3, 4, 2],
    seasonAverage: 2.6,
  },
  {
    id: "3",
    playerId: "103",
    playerName: "Mookie Betts",
    team: "LAD",
    matchId: "3",
    propType: "hits",
    line: 1.5,
    odds: {
      over: 1.80,
      under: 2.00,
    },
    prediction: {
      recommended: "over",
      confidence: 65,
      projectedValue: 1.7,
    },
    lastGames: [2, 1, 3, 1, 2],
    seasonAverage: 1.6,
  },
];

export const arbitrageOpportunities: ArbitrageOpportunity[] = [
  {
    id: "1",
    matchId: "5",
    match: {
      homeTeam: "Manchester United",
      awayTeam: "Liverpool",
      league: "SOCCER",
      startTime: "2025-06-01T16:00:00Z",
    },
    bookmakers: [
      {
        name: "Bet365",
        odds: {
          homeWin: 2.40,
          awayWin: 3.20,
          draw: 3.50,
        },
      },
      {
        name: "William Hill",
        odds: {
          homeWin: 2.50,
          awayWin: 3.10,
          draw: 3.40,
        },
      },
      {
        name: "Pinnacle",
        odds: {
          homeWin: 2.45,
          awayWin: 3.25,
          draw: 3.60,
        },
      },
    ],
    arbitragePercentage: 98.5,
    potentialProfit: 1.5,
    bettingStrategy: [
      {
        bookmaker: "Bet365",
        team: "home",
        stakePercentage: 41.0,
        odds: 2.40,
      },
      {
        bookmaker: "William Hill",
        team: "away",
        stakePercentage: 31.5,
        odds: 3.20,
      },
      {
        bookmaker: "Pinnacle",
        team: "draw",
        stakePercentage: 27.5,
        odds: 3.60,
      },
    ],
    isPremium: true,
  },
  {
    id: "2",
    matchId: "6",
    match: {
      homeTeam: "Boston Celtics",
      awayTeam: "Milwaukee Bucks",
      league: "NBA",
      startTime: "2025-04-18T19:00:00Z",
    },
    bookmakers: [
      {
        name: "FanDuel",
        odds: {
          homeWin: 1.75,
          awayWin: 2.15,
        },
      },
      {
        name: "DraftKings",
        odds: {
          homeWin: 1.80,
          awayWin: 2.10,
        },
      },
    ],
    arbitragePercentage: 99.2,
    potentialProfit: 0.8,
    bettingStrategy: [
      {
        bookmaker: "FanDuel",
        team: "home",
        stakePercentage: 54.5,
        odds: 1.75,
      },
      {
        bookmaker: "DraftKings",
        team: "away",
        stakePercentage: 45.5,
        odds: 2.10,
      },
    ],
    isPremium: false,
  },
];

export const sportsbooks = [
  {
    id: "1",
    name: "BetSmart",
    logo: "/betsmart-logo.png",
    isAvailable: true,
  },
  {
    id: "2",
    name: "SportKing",
    logo: "/sportking-logo.png",
    isAvailable: true,
  },
  {
    id: "3",
    name: "PlayOdds",
    logo: "/playodds-logo.png",
    isAvailable: true,
  },
];

export const upcomingMatches = [
  {
    id: "1",
    league: "NBA",
    homeTeam: {
      id: "1",
      name: "Los Angeles Lakers",
      shortName: "LAL",
      logo: "/lakers-logo.png",
      record: "45-37",
    },
    awayTeam: {
      id: "2",
      name: "Golden State Warriors",
      shortName: "GSW",
      logo: "/warriors-logo.png",
      record: "46-36",
    },
    startTime: "2025-04-21T18:00:00Z",
    odds: {
      homeWin: 1.85,
      awayWin: 2.05,
    },
    liveOdds: [
      {
        homeWin: 2.1,
        awayWin: 1.8,
        updatedAt: "2025-04-20T15:30:00Z",
        sportsbook: sportsbooks[0],
      },
      {
        homeWin: 2.15,
        awayWin: 1.75,
        updatedAt: "2025-04-20T15:28:00Z",
        sportsbook: sportsbooks[1],
      },
      {
        homeWin: 2.05,
        awayWin: 1.85,
        updatedAt: "2025-04-20T15:25:00Z",
        sportsbook: sportsbooks[2],
      },
    ],
    prediction: {
      recommended: "home",
      confidence: 65,
      projectedScore: {
        home: 112,
        away: 108,
      },
    },
    status: "scheduled",
  },
  {
    id: "2",
    league: "NFL",
    homeTeam: {
      id: "3",
      name: "New England Patriots",
      shortName: "NE",
      logo: "/patriots-logo.png",
      record: "12-5",
    },
    awayTeam: {
      id: "4",
      name: "Kansas City Chiefs",
      shortName: "KC",
      logo: "/chiefs-logo.png",
      record: "13-4",
    },
    startTime: "2025-09-08T20:20:00Z",
    odds: {
      homeWin: 2.10,
      awayWin: 1.75,
    },
    prediction: {
      recommended: "away",
      confidence: 70,
      projectedScore: {
        home: 24,
        away: 28,
      },
    },
    status: "scheduled",
  },
  {
    id: "3",
    league: "MLB",
    homeTeam: {
      id: "5",
      name: "Los Angeles Dodgers",
      shortName: "LAD",
      logo: "/dodgers-logo.png",
      record: "95-67",
    },
    awayTeam: {
      id: "6",
      name: "San Francisco Giants",
      shortName: "SF",
      logo: "/giants-logo.png",
      record: "88-74",
    },
    startTime: "2025-07-04T13:05:00Z",
    odds: {
      homeWin: 1.65,
      awayWin: 2.25,
    },
    prediction: {
      recommended: "home",
      confidence: 60,
      projectedScore: {
        home: 5,
        away: 3,
      },
    },
    status: "scheduled",
  },
  {
    id: "4",
    league: "NHL",
    homeTeam: {
      id: "7",
      name: "Boston Bruins",
      shortName: "BOS",
      logo: "/bruins-logo.png",
      record: "51-26-5",
    },
    awayTeam: {
      id: "8",
      name: "Toronto Maple Leafs",
      shortName: "TOR",
      logo: "/leafs-logo.png",
      record: "49-27-6",
    },
    startTime: "2025-05-15T19:30:00Z",
    odds: {
      homeWin: 1.90,
      awayWin: 1.90,
    },
    prediction: {
      recommended: "home",
      confidence: 55,
      projectedScore: {
        home: 4,
        away: 3,
      },
    },
    status: "scheduled",
  },
  {
    id: "5",
    league: "SOCCER",
    homeTeam: {
      id: "9",
      name: "Manchester United",
      shortName: "MU",
      logo: "/manutd-logo.png",
      record: "26-8-4",
    },
    awayTeam: {
      id: "10",
      name: "Liverpool",
      shortName: "LFC",
      logo: "/liverpool-logo.png",
      record: "24-10-4",
    },
    startTime: "2025-06-01T16:00:00Z",
    odds: {
      homeWin: 2.40,
      awayWin: 2.60,
      draw: 3.50,
    },
    prediction: {
      recommended: "draw",
      confidence: 45,
      projectedScore: {
        home: 1,
        away: 1,
      },
    },
    status: "scheduled",
  },
];

export const liveMatches = [
  {
    id: "6",
    league: "NBA",
    homeTeam: {
      id: "11",
      name: "Boston Celtics",
      shortName: "BOS",
      logo: "/celtics-logo.png",
      record: "50-32",
    },
    awayTeam: {
      id: "12",
      name: "Milwaukee Bucks",
      shortName: "MIL",
      logo: "/bucks-logo.png",
      record: "48-34",
    },
    startTime: "2025-04-18T19:00:00Z",
    odds: {
      homeWin: 1.75,
      awayWin: 2.15,
    },
    liveOdds: [
      {
        homeWin: 1.78,
        awayWin: 2.10,
        updatedAt: "2025-04-18T20:30:00Z",
        sportsbook: sportsbooks[0],
      },
      {
        homeWin: 1.82,
        awayWin: 2.05,
        updatedAt: "2025-04-18T20:28:00Z",
        sportsbook: sportsbooks[1],
      },
      {
        homeWin: 1.73,
        awayWin: 2.20,
        updatedAt: "2025-04-18T20:25:00Z",
        sportsbook: sportsbooks[2],
      },
    ],
    prediction: {
      recommended: "home",
      confidence: 58,
      projectedScore: {
        home: 115,
        away: 110,
      },
    },
    status: "live",
    score: {
      home: 60,
      away: 55,
      period: "Half-time",
    },
  },
  {
    id: "7",
    league: "NFL",
    homeTeam: {
      id: "13",
      name: "Seattle Seahawks",
      shortName: "SEA",
      logo: "/seahawks-logo.png",
      record: "9-8",
    },
    awayTeam: {
      id: "14",
      name: "Green Bay Packers",
      shortName: "GB",
      logo: "/packers-logo.png",
      record: "10-7",
    },
    startTime: "2025-09-15T20:15:00Z",
    odds: {
      homeWin: 1.95,
      awayWin: 1.85,
    },
    prediction: {
      recommended: "away",
      confidence: 62,
      projectedScore: {
        home: 21,
        away: 24,
      },
    },
    status: "live",
    score: {
      home: 14,
      away: 17,
      period: "3rd Quarter",
    },
  },
];

export const algorithms = [
  {
    name: "SmartScore",
    description: "A proprietary algorithm that predicts match outcomes based on historical data and real-time statistics.",
    winRate: 72,
    recentResults: ["W", "W", "L", "W", "W"],
  },
  {
    name: "PropHunter",
    description: "Identifies high-value player props by analyzing player performance, matchups, and betting odds.",
    winRate: 68,
    recentResults: ["W", "L", "W", "W", "L"],
  },
  {
    name: "ArbAlert",
    description: "Detects arbitrage opportunities across multiple sportsbooks for guaranteed profit.",
    winRate: 95,
    recentResults: ["W", "W", "W", "W", "W"],
  },
];

export const playerProps = [
  {
    id: "1",
    playerId: "101",
    playerName: "LeBron James",
    team: "LAL",
    matchId: "1",
    propType: "points",
    line: 27.5,
    odds: {
      over: 1.90,
      under: 1.90,
    },
    prediction: {
      recommended: "over",
      confidence: 68,
      projectedValue: 29.1,
    },
    lastGames: [30, 25, 28, 32, 27],
    seasonAverage: 27.2,
  },
  {
    id: "2",
    playerId: "102",
    playerName: "Patrick Mahomes",
    team: "KC",
    matchId: "2",
    propType: "touchdowns",
    line: 2.5,
    odds: {
      over: 2.10,
      under: 1.75,
    },
    prediction: {
      recommended: "over",
      confidence: 72,
      projectedValue: 2.8,
    },
    lastGames: [3, 2, 3, 4, 2],
    seasonAverage: 2.6,
  },
  {
    id: "3",
    playerId: "103",
    playerName: "Mookie Betts",
    team: "LAD",
    matchId: "3",
    propType: "hits",
    line: 1.5,
    odds: {
      over: 1.80,
      under: 2.00,
    },
    prediction: {
      recommended: "over",
      confidence: 65,
      projectedValue: 1.7,
    },
    lastGames: [2, 1, 3, 1, 2],
    seasonAverage: 1.6,
  },
];

export const arbitrageOpportunities = [
  {
    id: "1",
    matchId: "5",
    match: {
      homeTeam: "Manchester United",
      awayTeam: "Liverpool",
      league: "SOCCER",
      startTime: "2025-06-01T16:00:00Z",
    },
    bookmakers: [
      {
        name: "Bet365",
        odds: {
          homeWin: 2.40,
          awayWin: 3.20,
          draw: 3.50,
        },
      },
      {
        name: "William Hill",
        odds: {
          homeWin: 2.50,
          awayWin: 3.10,
          draw: 3.40,
        },
      },
      {
        name: "Pinnacle",
        odds: {
          homeWin: 2.45,
          awayWin: 3.25,
          draw: 3.60,
        },
      },
    ],
    arbitragePercentage: 98.5,
    potentialProfit: 1.5,
    bettingStrategy: [
      {
        bookmaker: "Bet365",
        team: "home",
        stakePercentage: 41.0,
        odds: 2.40,
      },
      {
        bookmaker: "William Hill",
        team: "away",
        stakePercentage: 31.5,
        odds: 3.20,
      },
      {
        bookmaker: "Pinnacle",
        team: "draw",
        stakePercentage: 27.5,
        odds: 3.60,
      },
    ],
    isPremium: true,
  },
  {
    id: "2",
    matchId: "6",
    match: {
      homeTeam: "Boston Celtics",
      awayTeam: "Milwaukee Bucks",
      league: "NBA",
      startTime: "2025-04-18T19:00:00Z",
    },
    bookmakers: [
      {
        name: "FanDuel",
        odds: {
          homeWin: 1.75,
          awayWin: 2.15,
        },
      },
      {
        name: "DraftKings",
        odds: {
          homeWin: 1.80,
          awayWin: 2.10,
        },
      },
    ],
    arbitragePercentage: 99.2,
    potentialProfit: 0.8,
    bettingStrategy: [
      {
        bookmaker: "FanDuel",
        team: "home",
        stakePercentage: 54.5,
        odds: 1.75,
      },
      {
        bookmaker: "DraftKings",
        team: "away",
        stakePercentage: 45.5,
        odds: 2.10,
      },
    ],
    isPremium: false,
  },
];
