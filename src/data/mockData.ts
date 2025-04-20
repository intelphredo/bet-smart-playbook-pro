
import { Match, League, BettingAlgorithm } from "../types/sports";

export const upcomingMatches: Match[] = [
  {
    id: "nba-1",
    league: "NBA",
    homeTeam: {
      id: "lakers",
      name: "Los Angeles Lakers",
      shortName: "Lakers",
      logo: "/placeholder.svg",
      record: "42-30",
      recentForm: ["W", "W", "L", "W", "L"],
    },
    awayTeam: {
      id: "celtics",
      name: "Boston Celtics",
      shortName: "Celtics",
      logo: "/placeholder.svg",
      record: "48-24",
      recentForm: ["W", "W", "W", "L", "W"],
    },
    startTime: "2025-04-20T19:30:00Z",
    odds: {
      homeWin: 2.1,
      awayWin: 1.75,
    },
    prediction: {
      recommended: "away",
      confidence: 68,
      projectedScore: {
        home: 108,
        away: 114,
      },
    },
    status: "scheduled",
  },
  {
    id: "nfl-1",
    league: "NFL",
    homeTeam: {
      id: "chiefs",
      name: "Kansas City Chiefs",
      shortName: "Chiefs",
      logo: "/placeholder.svg",
      record: "10-2",
      recentForm: ["W", "W", "W", "W", "L"],
    },
    awayTeam: {
      id: "bills",
      name: "Buffalo Bills",
      shortName: "Bills",
      logo: "/placeholder.svg",
      record: "8-4",
      recentForm: ["W", "L", "W", "L", "W"],
    },
    startTime: "2025-04-21T20:15:00Z",
    odds: {
      homeWin: 1.65,
      awayWin: 2.3,
    },
    prediction: {
      recommended: "home",
      confidence: 73,
      projectedScore: {
        home: 28,
        away: 21,
      },
    },
    status: "scheduled",
  },
  {
    id: "mlb-1",
    league: "MLB",
    homeTeam: {
      id: "yankees",
      name: "New York Yankees",
      shortName: "Yankees",
      logo: "/placeholder.svg",
      record: "88-64",
      recentForm: ["W", "L", "W", "W", "W"],
    },
    awayTeam: {
      id: "redsox",
      name: "Boston Red Sox",
      shortName: "Red Sox",
      logo: "/placeholder.svg",
      record: "76-76",
      recentForm: ["L", "L", "W", "L", "W"],
    },
    startTime: "2025-04-22T18:05:00Z",
    odds: {
      homeWin: 1.72,
      awayWin: 2.15,
    },
    prediction: {
      recommended: "home",
      confidence: 65,
      projectedScore: {
        home: 5,
        away: 3,
      },
    },
    status: "scheduled",
  },
  {
    id: "nhl-1",
    league: "NHL",
    homeTeam: {
      id: "rangers",
      name: "New York Rangers",
      shortName: "Rangers",
      logo: "/placeholder.svg",
      record: "40-22-8",
      recentForm: ["W", "W", "L", "W", "W"],
    },
    awayTeam: {
      id: "penguins",
      name: "Pittsburgh Penguins",
      shortName: "Penguins",
      logo: "/placeholder.svg",
      record: "36-26-8",
      recentForm: ["L", "W", "W", "L", "W"],
    },
    startTime: "2025-04-20T23:00:00Z",
    odds: {
      homeWin: 1.85,
      awayWin: 1.95,
    },
    prediction: {
      recommended: "home",
      confidence: 55,
      projectedScore: {
        home: 3,
        away: 2,
      },
    },
    status: "scheduled",
  },
  {
    id: "soccer-1",
    league: "SOCCER",
    homeTeam: {
      id: "mancity",
      name: "Manchester City",
      shortName: "Man City",
      logo: "/placeholder.svg",
      record: "24-5-3",
      recentForm: ["W", "W", "D", "W", "W"],
    },
    awayTeam: {
      id: "liverpool",
      name: "Liverpool FC",
      shortName: "Liverpool",
      logo: "/placeholder.svg",
      record: "22-7-3",
      recentForm: ["W", "W", "W", "D", "L"],
    },
    startTime: "2025-04-21T14:00:00Z",
    odds: {
      homeWin: 2.0,
      draw: 3.4,
      awayWin: 3.75,
    },
    prediction: {
      recommended: "home",
      confidence: 60,
      projectedScore: {
        home: 2,
        away: 1,
      },
    },
    status: "scheduled",
  },
];

export const liveMatches: Match[] = [
  {
    id: "nba-live-1",
    league: "NBA",
    homeTeam: {
      id: "nets",
      name: "Brooklyn Nets",
      shortName: "Nets",
      logo: "/placeholder.svg",
      record: "35-37",
    },
    awayTeam: {
      id: "knicks",
      name: "New York Knicks",
      shortName: "Knicks",
      logo: "/placeholder.svg",
      record: "41-31",
    },
    startTime: "2025-04-20T17:00:00Z",
    odds: {
      homeWin: 2.4,
      awayWin: 1.6,
    },
    prediction: {
      recommended: "away",
      confidence: 70,
      projectedScore: {
        home: 105,
        away: 112,
      },
    },
    status: "live",
    score: {
      home: 78,
      away: 83,
      period: "3rd Quarter",
    },
  },
  {
    id: "soccer-live-1",
    league: "SOCCER",
    homeTeam: {
      id: "arsenal",
      name: "Arsenal FC",
      shortName: "Arsenal",
      logo: "/placeholder.svg",
      record: "19-9-4",
    },
    awayTeam: {
      id: "chelsea",
      name: "Chelsea FC",
      shortName: "Chelsea",
      logo: "/placeholder.svg",
      record: "17-10-5",
    },
    startTime: "2025-04-20T16:30:00Z",
    odds: {
      homeWin: 1.85,
      draw: 3.5,
      awayWin: 4.2,
    },
    prediction: {
      recommended: "home",
      confidence: 61,
      projectedScore: {
        home: 2,
        away: 0,
      },
    },
    status: "live",
    score: {
      home: 1,
      away: 0,
      period: "57'",
    },
  },
];

export const algorithms: BettingAlgorithm[] = [
  {
    name: "ValueBet Pro",
    description: "Identifies undervalued odds based on statistical analysis of team performance metrics.",
    winRate: 67.3,
    recentResults: ["W", "W", "L", "W", "W"],
  },
  {
    name: "Trend Analyzer",
    description: "Analyzes recent team form, head-to-head statistics, and historical performance patterns.",
    winRate: 64.8,
    recentResults: ["W", "W", "W", "L", "W"],
  },
  {
    name: "ML Predictor",
    description: "Machine learning algorithm trained on over 50,000 historical matches across all major leagues.",
    winRate: 71.2,
    recentResults: ["W", "L", "W", "W", "W"],
  },
];
