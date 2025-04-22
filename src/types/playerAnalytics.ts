
import { League } from "./core";

export interface PlayerProp {
  playerId: string;
  playerName: string;
  team?: string;
  league?: League;
  propType: string;
  line: number;
  lastGames?: number[];
  seasonAverage?: number;
  odds?: {
    over: number;
    under: number;
  };
  matchup?: string;
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
