
export interface BankrollSettings {
  currentBankroll: number;
  startingBankroll: number;
  unitSize: number;
  kellyFraction: number;
  maxBetPercentage: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  dailyLossLimit?: number;
  weeklyLossLimit?: number;
}

export interface BankrollSimulation {
  scenario: 'bull' | 'bear' | 'realistic';
  projectedBankroll: number[];
  winRate: number;
  avgOdds: number;
  numBets: number;
  probabilityOfProfit: number;
  probabilityOfRuin: number;
  maxDrawdown: number;
  sharpeRatio: number;
  expectedGrowth: number;
}

export interface BankrollHistory {
  id: string;
  date: string;
  bankroll: number;
  change: number;
  changePercent: number;
  betsPlaced: number;
  wins: number;
  losses: number;
}

export interface BankrollScenario {
  id: string;
  name: string;
  description: string;
  riskLevel: 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
  unitSizePercent: number;
  kellyFraction: number;
  evThreshold: number;
  expectedMonthlyGrowth: number;
  maxDrawdownTolerance: number;
  winRateRequired: number;
  advantages: string[];
  disadvantages: string[];
  whenToUse: string[];
  whenToSwitch: string[];
}

export interface BankrollRisk {
  riskOfRuin: number;
  currentDrawdown: number;
  maxDrawdown: number;
  daysToRecovery: number;
  healthScore: number;
}

export interface BankrollProjection {
  day: number;
  optimistic: number;
  realistic: number;
  pessimistic: number;
}

export const DEFAULT_BANKROLL_SETTINGS: BankrollSettings = {
  currentBankroll: 1000,
  startingBankroll: 1000,
  unitSize: 20,
  kellyFraction: 0.25,
  maxBetPercentage: 5,
  riskTolerance: 'moderate',
  dailyLossLimit: 100,
  weeklyLossLimit: 250
};
