// Betting Trends Types

export interface BettingTrend {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  
  // Public betting percentages
  publicBetting: {
    spreadHome: number; // % on home spread
    spreadAway: number; // % on away spread
    moneylineHome: number; // % on home ML
    moneylineAway: number; // % on away ML
    over: number; // % on over
    under: number; // % on under
  };
  
  // Sharp betting indicators
  sharpBetting: {
    spreadFavorite: 'home' | 'away' | 'neutral';
    moneylineFavorite: 'home' | 'away' | 'neutral';
    totalFavorite: 'over' | 'under' | 'neutral';
    confidence: number; // 0-100
    signals: SharpSignal[];
  };
  
  // Line movement analysis
  lineMovement: {
    openSpread: number;
    currentSpread: number;
    spreadMovement: number;
    openTotal: number;
    currentTotal: number;
    totalMovement: number;
    reverseLineMovement: boolean; // Key sharp indicator
  };
  
  // Money flow
  moneyFlow: {
    homeMoneyPct: number;
    awayMoneyPct: number;
    overMoneyPct: number;
    underMoneyPct: number;
  };
  
  lastUpdated: string;
}

export interface SharpSignal {
  type: 'steam_move' | 'reverse_line' | 'line_freeze' | 'whale_bet' | 'syndicate_play';
  side: 'home' | 'away' | 'over' | 'under';
  strength: 'weak' | 'moderate' | 'strong';
  description: string;
  detectedAt: string;
}

export interface TeamBettingHistory {
  teamName: string;
  league: string;
  record: {
    atsWins: number;
    atsLosses: number;
    atsPushes: number;
    atsWinPct: number;
  };
  trends: {
    last5: string;
    last10: string;
    homeAts: string;
    awayAts: string;
    asFavorite: string;
    asUnderdog: string;
  };
  overUnder: {
    overs: number;
    unders: number;
    pushes: number;
    overPct: number;
  };
}

export type MarketType = 'spread' | 'moneyline' | 'total';
