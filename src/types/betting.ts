import { League } from './core';
import { Team } from './team';

export interface Sportsbook {
  id: string;
  name: string;
  logo: string;
  isAvailable: boolean;
  bonusOffer?: string;
  rating?: number;
}

export interface LiveOdds {
  homeWin: number;
  awayWin: number;
  draw?: number;
  updatedAt: string;
  sportsbook: Sportsbook;
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
