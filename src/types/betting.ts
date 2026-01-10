export type BetType = 'moneyline' | 'spread' | 'total';
export type BetStatus = 'pending' | 'won' | 'lost' | 'push' | 'cancelled';

export interface UserBet {
  id: string;
  user_id: string;
  match_id: string;
  match_title: string;
  league?: string;
  bet_type: BetType;
  selection: string;
  odds_at_placement: number;
  stake: number;
  potential_payout: number;
  status: BetStatus;
  result_profit?: number;
  placed_at: string;
  settled_at?: string;
  sportsbook?: string;
  opening_odds?: number;
  closing_odds?: number;
  clv_percentage?: number;
  model_confidence?: number;
  model_ev_percentage?: number;
  kelly_stake_recommended?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface UserBettingStats {
  id: string;
  user_id: string;
  total_bets: number;
  pending_bets: number;
  wins: number;
  losses: number;
  pushes: number;
  total_staked: number;
  total_profit: number;
  roi_percentage: number;
  avg_odds: number;
  avg_clv: number;
  best_streak: number;
  current_streak: number;
  last_updated: string;
}

export interface BetSlipItem {
  matchId: string;
  matchTitle: string;
  league?: string;
  betType: BetType;
  selection: string;
  odds: number;
  sportsbook?: string;
  modelConfidence?: number;
  modelEvPercentage?: number;
  kellyRecommended?: number;
}
