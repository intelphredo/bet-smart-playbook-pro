
import { PlayerProp } from "@/types/sports";

export const playerProps: PlayerProp[] = [
  {
    id: "nba-prop-1",
    playerId: "jokic-1",
    playerName: "Nikola Jokic",
    team: "Denver Nuggets",
    league: "NBA",
    matchId: "nba-1",
    propType: "points",
    line: 26.5,
    odds: {
      over: 1.91,
      under: 1.91
    },
    prediction: {
      recommended: "over",
      confidence: 75,
      projectedValue: 29.5
    },
    lastGames: [28, 31, 25, 33, 27],
    seasonAverage: 28.2
  },
  {
    id: "nfl-prop-1",
    playerId: "mahomes-1",
    playerName: "Patrick Mahomes",
    team: "Kansas City Chiefs",
    league: "NFL",
    matchId: "nfl-1",
    propType: "touchdowns",
    line: 2.5,
    odds: {
      over: 2.1,
      under: 1.8
    },
    prediction: {
      recommended: "over",
      confidence: 68,
      projectedValue: 3
    },
    lastGames: [3, 2, 4, 2, 3],
    seasonAverage: 2.8
  },
  {
    id: "soccer-prop-1",
    playerId: "haaland-1",
    playerName: "Erling Haaland",
    team: "Manchester City",
    league: "SOCCER",
    matchId: "soccer-1",
    propType: "goals",
    line: 0.5,
    odds: {
      over: 1.65,
      under: 2.3
    },
    prediction: {
      recommended: "over",
      confidence: 72,
      projectedValue: 1.2
    },
    lastGames: [1, 2, 0, 1, 1],
    seasonAverage: 1.1
  }
];
