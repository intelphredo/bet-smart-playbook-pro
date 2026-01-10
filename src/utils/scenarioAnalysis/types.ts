
export type RiskLevel = 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
export type BetCategory = 'moneyline' | 'spread' | 'totals' | 'live' | 'parlay' | 'props' | 'strategic' | 'situational';

export interface ScenarioAdvantage {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

export interface ScenarioDisadvantage {
  title: string;
  description: string;
  severity: 'critical' | 'major' | 'minor';
}

export interface BettingScenario {
  id: string;
  name: string;
  shortName: string;
  category: BetCategory;
  riskLevel: RiskLevel;
  description: string;
  
  // Statistical metrics
  historicalWinRate: number;      // 0-100
  expectedROI: number;            // Can be negative
  variance: 'low' | 'medium' | 'high' | 'extreme';
  
  // Deep analysis
  advantages: ScenarioAdvantage[];
  disadvantages: ScenarioDisadvantage[];
  
  // Usage guidance
  whenToUse: string[];
  whenToAvoid: string[];
  
  // Bankroll guidance
  recommendedKellyFraction: number;  // 0-1
  maxBankrollPercentage: number;     // Max % of bankroll per bet
  
  // Pro tips
  proTips: string[];
  
  // Detection criteria (for auto-detecting in matches)
  detectionCriteria?: {
    oddsRange?: { min?: number; max?: number };
    spreadRange?: { min?: number; max?: number };
    totalRange?: { min?: number; max?: number };
    isLive?: boolean;
    isParlayComponent?: boolean;
    situational?: string[];
  };
}

export interface ScenarioDetectionResult {
  scenario: BettingScenario;
  confidence: number;      // How confident we are this scenario applies
  matchFactors: string[];  // What factors triggered this detection
}

export interface ScenarioPerformance {
  scenarioId: string;
  totalBets: number;
  wins: number;
  losses: number;
  pushes: number;
  roi: number;
  avgOdds: number;
  bestStreak: number;
  worstStreak: number;
  lastUpdated: string;
}
