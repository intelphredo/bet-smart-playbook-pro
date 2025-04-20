export type League = 'NBA' | 'NFL' | 'MLB' | 'NHL' | 'SOCCER';

export type PropType = 'points' | 'assists' | 'rebounds' | 'touchdowns' | 'goals' | 'saves' | 'shots';

export interface Sportsbook {
  id: string;
  name: string;
  logo: string;
  isAvailable: boolean;
}

export interface LiveOdds {
  homeWin: number;
  awayWin: number;
  draw?: number;
  updatedAt: string;
  sportsbook: Sportsbook;
}

export interface Match {
  id: string;
  league: League;
  homeTeam: Team;
  awayTeam: Team;
  startTime: string;
  odds: {
    homeWin: number;
    awayWin: number;
    draw?: number;
  };
  liveOdds?: LiveOdds[];
  prediction: {
    recommended: 'home' | 'away' | 'draw';
    confidence: number;
    projectedScore: {
      home: number;
      away: number;
    };
  };
  status: 'scheduled' | 'live' | 'finished';
  score?: {
    home: number;
    away: number;
    period?: string;
  };
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  record?: string;
  recentForm?: string[];
  stats?: {
    [key: string]: number | string;
  };
}

export interface BettingAlgorithm {
  name: string;
  description: string;
  winRate: number;
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

export interface ArbitrageOpportunity {
  id: string;
  matchId: string;
  match: {
    homeTeam: string;
    awayTeam: string;
    league: League;
    startTime: string;
  };
  bookmakers: {
    name: string;
    odds: {
      homeWin: number;
      awayWin: number;
      draw?: number;
    };
  }[];
  arbitragePercentage: number;
  potentialProfit: number;
  bettingStrategy: {
    bookmaker: string;
    team: 'home' | 'away' | 'draw';
    stakePercentage: number;
    odds: number;
  }[];
  isPremium: boolean;
}

export interface User {
  id: string;
  email: string;
  isPremium: boolean;
  subscriptionEnds?: string;
  lastLogin?: string;
}
