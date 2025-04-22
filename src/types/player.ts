
import { PropType } from './core';

export interface PlayerStats {
  id: string;
  name: string;
  position: string;
  jersey: string;
  teamId?: string;
  teamName?: string;
  battingAverage?: string;
  homeRuns?: number;
  rbi?: number;
  hits?: number;
  runs?: number;
  obp?: string;
  ops?: string;
  slg?: string;
  era?: string;
  wins?: number;
  losses?: number;
  saves?: number;
  strikeouts?: number;
  whip?: string;
}

export interface PlayerProp {
  id: string;
  playerId: string;
  playerName: string;
  team: string;
  league?: string;
  matchId: string;
  propType: PropType;
  line: number;
  odds: {
    over: number;
    under: number;
  };
  prediction?: {
    recommended: 'over' | 'under';
    confidence: number;
    projectedValue: number;
  };
  lastGames?: number[];
  seasonAverage?: number;
}
