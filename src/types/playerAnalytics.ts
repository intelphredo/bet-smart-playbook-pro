
import { PropType } from "./sports";

export interface PlayerHistoricalData {
  playerId: string;
  playerName: string;
  matchups: TeamMatchupHistory[];
  currentStreak: PlayerStreak;
  seasonStats: SeasonStats;
}

export interface TeamMatchupHistory {
  teamId: string;
  teamName: string;
  games: GamePerformance[];
  averagePerformance: {
    [key in PropType]?: number;
  };
  struggles: boolean; // Indicates if player historically struggles against this team
}

export interface GamePerformance {
  date: string;
  stats: {
    [key in PropType]?: number;
  };
  result: 'W' | 'L';
}

export interface PlayerStreak {
  type: 'hot' | 'cold' | 'neutral';
  length: number; // Number of games in the streak
  stats: {
    [key in PropType]?: {
      average: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    };
  };
}

export interface SeasonStats {
  games: number;
  [key: string]: number;
}

export interface PlayerTrendAnalysis {
  playerId: string;
  playerName: string;
  propType: PropType;
  confidence: number; // 0-100
  recommendation: 'over' | 'under';
  reasoning: string;
  line?: number;
  historicalAvg?: number;
  streakImpact: number; // -10 to +10 impact on confidence
  matchupImpact: number; // -10 to +10 impact on confidence
}
