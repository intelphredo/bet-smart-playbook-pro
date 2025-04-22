
import { PlayerStats } from "./player";

interface GameStats {
  [key: string]: number;
}

interface HistoricalGame {
  date: string;
  stats: GameStats;
  result: "W" | "L" | "D";
}

interface MatchupHistory {
  teamId: string;
  teamName: string;
  games: HistoricalGame[];
  averagePerformance: GameStats;
  struggles: boolean;
}

interface StatsTrend {
  average: number;
  trend: "increasing" | "stable" | "decreasing";
}

interface PlayerStreak {
  type: "hot" | "cold";
  length: number;
  stats: {
    [key: string]: StatsTrend;
  };
}

interface SeasonStats {
  games: number;
  [key: string]: number;
}

export interface PlayerHistoricalData {
  playerId: string;
  playerName: string;
  matchups: MatchupHistory[];
  currentStreak: PlayerStreak;
  seasonStats: SeasonStats;
}

export interface PlayerTrendAnalysis {
  playerId: string;
  playerName: string;
  propType: string;
  confidence: number;
  recommendation: 'over' | 'under';
  reasoning: string;
  line: number;
  historicalAvg?: number;
  streakImpact: number;
  matchupImpact: number;
}

