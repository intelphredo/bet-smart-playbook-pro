
import { Match, Team, League } from "@/types/sports";

export interface HistoricalData {
  homeWins: number;
  awayWins: number;
  totalGames: number;
}

export interface TeamStrength {
  offense: number;  // 0-100
  defense: number;  // 0-100
  momentum: number; // 0-100
}

export interface TeamRecord {
  wins: number;
  losses: number;
  games: number;
}
