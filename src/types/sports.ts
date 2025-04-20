export type League = 'NBA' | 'NFL' | 'MLB' | 'NHL' | 'SOCCER';

export type PropType = 'points' | 'assists' | 'rebounds' | 'touchdowns' | 'goals' | 'saves' | 'shots';

export interface Match {
  id: string;
  league: League;
  homeTeam: Team;
  awayTeam: Team;
  startTime: string;
  odds: {
    homeWin: number;
    awayWin: number;
    draw?: number; // Only for soccer
  };
  prediction: {
    recommended: 'home' | 'away' | 'draw';
    confidence: number; // 0-100
    projectedScore: {
      home: number;
      away: number;
    };
  };
  status: 'scheduled' | 'live' | 'finished';
  score?: {
    home: number;
    away: number;
    period?: string; // Quarter, Half, Inning, etc.
  };
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  record?: string; // W-L or W-D-L format
  recentForm?: string[]; // Last 5 games: W, L, D
  stats?: {
    [key: string]: number | string;
  };
}

export interface BettingAlgorithm {
  name: string;
  description: string;
  winRate: number; // 0-100
  recentResults: ('W' | 'L')[];
}

export interface UserBet {
  id: string;
  matchId: string;
  betType: 'home' | 'away' | 'draw' | 'over' | 'under';
  odds: number;
  amount: number;
  potentialWinnings: number;
  status: 'pending' | 'won' | 'lost';
}

export interface PlayerProp {
  id: string;
  playerId: string;
  playerName: string;
  team: string;
  matchId: string;
  propType: PropType;
  line: number;
  odds: {
    over: number;
    under: number;
  };
  prediction: {
    recommended: 'over' | 'under';
    confidence: number;
    projectedValue: number;
  };
  lastGames?: number[];
  seasonAverage?: number;
}
