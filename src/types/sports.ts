
export type League = 'NBA' | 'NFL' | 'MLB' | 'NHL' | 'SOCCER' | 'NCAAF' | 'NCAAB';

export type PropType = 'points' | 'assists' | 'rebounds' | 'touchdowns' | 'goals' | 'saves' | 'shots' | 'hits';

export interface Sportsbook {
  id: string;
  name: string;
  logo: string;
  isAvailable: boolean;
}

export interface SpreadOdds {
  homeSpread: number;      // e.g., -7.5
  homeSpreadOdds: number;  // Odds for home spread
  awaySpread: number;      // e.g., +7.5
  awaySpreadOdds: number;  // Odds for away spread
}

export interface TotalOdds {
  total: number;           // e.g., 220.5
  overOdds: number;        // Odds for over
  underOdds: number;       // Odds for under
}

export interface LiveOdds {
  homeWin: number;
  awayWin: number;
  draw?: number;
  updatedAt: string;
  sportsbook: Sportsbook;
  spread?: SpreadOdds;
  totals?: TotalOdds;
}

export interface DataVerificationResult {
  isVerified: boolean;
  confidenceScore: number;
  lastUpdated: string;
  sources: string[];
  discrepancies?: {
    field: string;
    values: Record<string, any>;
  }[];
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
    algorithmId?: string;
    // Sharp betting metrics
    trueProbability?: number;      // Model's true win probability (0-1)
    impliedOdds?: number;          // Fair odds based on true probability
    expectedValue?: number;        // EV as decimal
    evPercentage?: number;         // EV as percentage
    kellyFraction?: number;        // Recommended Kelly stake (0-1)
    kellyStakeUnits?: number;      // Recommended stake in units
    clvPercentage?: number;        // Closing Line Value percentage
    beatClosingLine?: boolean;     // Did prediction beat closing line
  };
  status: 'scheduled' | 'pre' | 'live' | 'finished';
  score?: {
    home: number;
    away: number;
    period?: string;
  };
  smartScore?: SmartScore;
  verification?: DataVerificationResult;
  lastUpdated?: string;
  isMockData?: boolean; // Flag to indicate this is mock/demo data
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
  league?: string; // Added optional league property
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

export interface DivisionStanding {
  divisionName: string;
  teams: Array<{
    team: Team;
    wins: number;
    losses: number;
    winPercentage: string;
    gamesBack: string;
    streak: string;
  }>;
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

export type DataSource = 'ESPN' | 'MLB' | 'ACTION' | 'API';

export interface SmartScore {
  overall: number;        // 0-100 overall smart score
  components: {
    momentum: number;     // 0-100 momentum rating
    value: number;        // 0-100 value rating
    oddsMovement: number; // 0-100 odds movement rating
    weather: number;      // 0-100 weather impact (higher is better - less impact)
    injuries: number;     // 0-100 injury impact (higher is better - less impact)
    arbitrage: number;    // 0-100 arbitrage rating
  };
  factors: {
    momentum: any[];
    value: any[];
    oddsMovement: any[];
    weather: any[];
    injuries: any[];
    arbitrage: any[];
  };
  recommendation?: {
    betOn: 'home' | 'away' | 'draw' | 'over' | 'under' | 'none';
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
  };
  hasArbitrageOpportunity: boolean;
}

export interface MatchLineup {
  teamId: string;
  players: {
    playerId: string;
    playerName: string;
    position: string;
    isStarter: boolean;
    isInjured?: boolean;
    injuryStatus?: string;
  }[];
}

export interface MatchOddsTrend {
  homeOdds: number[];
  awayOdds: number[];
  drawOdds?: number[];
  timestamps: string[];
}

export interface MatchEnhanced extends Match {
  lineups?: {
    home: MatchLineup;
    away: MatchLineup;
  };
  oddsTrend?: MatchOddsTrend;
  weatherInfo?: {
    temperature: string;
    condition: string;
    windSpeed: string;
    precipitation: string;
  };
  venue?: {
    name: string;
    city: string;
    country: string;
    capacity: number;
    surface: string;
  };
  headToHead?: {
    lastMatches: {
      date: string;
      homeTeam: string;
      awayTeam: string;
      homeScore: number;
      awayScore: number;
    }[];
    homeTeamWins: number;
    awayTeamWins: number;
    draws: number;
  };
}
