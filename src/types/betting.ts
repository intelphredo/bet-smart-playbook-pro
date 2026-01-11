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

// Parlay types
export interface ParlayLeg extends BetSlipItem {
  legId: string;
}

export interface Parlay {
  id: string;
  legs: ParlayLeg[];
  combinedOdds: number;
  stake: number;
  potentialPayout: number;
}

// Calculate combined parlay odds from individual American odds
export function calculateParlayOdds(legs: BetSlipItem[]): number {
  if (legs.length === 0) return 0;
  if (legs.length === 1) return legs[0].odds;

  // Convert American odds to decimal, multiply, then convert back
  const decimalOdds = legs.map(leg => {
    if (leg.odds > 0) {
      return (leg.odds / 100) + 1;
    } else {
      return (100 / Math.abs(leg.odds)) + 1;
    }
  });

  const combinedDecimal = decimalOdds.reduce((acc, odds) => acc * odds, 1);

  // Convert back to American
  if (combinedDecimal >= 2) {
    return Math.round((combinedDecimal - 1) * 100);
  } else {
    return Math.round(-100 / (combinedDecimal - 1));
  }
}

// Calculate potential payout for a parlay
export function calculateParlayPayout(combinedOdds: number, stake: number): number {
  if (combinedOdds > 0) {
    return stake + (stake * (combinedOdds / 100));
  } else {
    return stake + (stake * (100 / Math.abs(combinedOdds)));
  }
}
