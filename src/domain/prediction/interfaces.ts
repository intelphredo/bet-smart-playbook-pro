/**
 * Domain Layer - Prediction Interfaces
 * 
 * Pure interfaces that define the prediction domain.
 * No dependencies on React, data fetching, or external services.
 */

import { League } from "@/types/sports";

// ============================================
// Core Domain Types
// ============================================

export interface TeamData {
  id: string;
  name: string;
  shortName: string;
  record?: string;
  recentForm?: string[];
  logo?: string;
}

export interface MatchData {
  id: string;
  homeTeam: TeamData;
  awayTeam: TeamData;
  league: League;
  startTime: string;
  status: 'scheduled' | 'live' | 'finished' | 'pre';
  venue?: string;
  score?: {
    home: number;
    away: number;
    period?: string;
  };
  odds?: OddsData;
}

export interface OddsData {
  homeWin: number;
  awayWin: number;
  draw?: number;
  spread?: {
    home: number;
    away: number;
    homeOdds: number;
    awayOdds: number;
  };
  total?: {
    line: number;
    overOdds: number;
    underOdds: number;
  };
}

// ============================================
// Prediction Domain Types
// ============================================

export interface TeamStrengthMetrics {
  offense: number;  // 0-100
  defense: number;  // 0-100
  momentum: number; // 0-100
  overall: number;  // Computed from above
}

export interface HistoricalMatchupData {
  homeWins: number;
  awayWins: number;
  draws: number;
  totalGames: number;
  avgHomeScore?: number;
  avgAwayScore?: number;
}

export interface PredictionFactors {
  teamStrength: {
    home: TeamStrengthMetrics;
    away: TeamStrengthMetrics;
    differential: number;
  };
  homeAdvantage: number;
  momentum: {
    home: number;
    away: number;
    differential: number;
  };
  historical?: {
    data: HistoricalMatchupData;
    impact: number;
  };
  injuries?: {
    homeImpact: number;
    awayImpact: number;
    differential: number;
  };
  weather?: {
    condition: string;
    impact: number;
  };
}

export interface PredictionResult {
  matchId: string;
  recommended: 'home' | 'away' | 'draw' | 'skip';
  confidence: number; // 0-100
  trueProbability: number; // 0-1
  projectedScore: {
    home: number;
    away: number;
  };
  // Sharp betting metrics
  impliedOdds: number;
  expectedValue: number;
  evPercentage: number;
  kellyFraction: number;
  kellyStakeUnits: number;
  // Analysis factors
  factors: PredictionFactors;
  // Metadata
  algorithmId: string;
  algorithmName: string;
  generatedAt: string;
}

export interface EnhancedMatch extends MatchData {
  prediction?: PredictionResult;
}

// ============================================
// Algorithm Configuration
// ============================================

export interface AlgorithmConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  weights: {
    teamStrength: number;
    homeAdvantage: number;
    momentum: number;
    historical: number;
    injuries: number;
    weather: number;
  };
  thresholds: {
    minConfidence: number;
    skipThreshold: number;
    highValueThreshold: number;
  };
}

export const DEFAULT_ALGORITHM_WEIGHTS = {
  teamStrength: 0.30,
  homeAdvantage: 0.15,
  momentum: 0.20,
  historical: 0.15,
  injuries: 0.10,
  weather: 0.10,
} as const;

// ============================================
// Repository Interfaces (Data Layer Contracts)
// ============================================

export interface IMatchRepository {
  getById(id: string): Promise<MatchData | null>;
  getByLeague(league: League): Promise<MatchData[]>;
  getUpcoming(limit?: number): Promise<MatchData[]>;
  getLive(): Promise<MatchData[]>;
  getFinished(limit?: number): Promise<MatchData[]>;
}

export interface IOddsRepository {
  getByMatchId(matchId: string): Promise<OddsData | null>;
  getByMatchIds(matchIds: string[]): Promise<Map<string, OddsData>>;
  getHistory(matchId: string): Promise<OddsData[]>;
}

export interface IHistoricalRepository {
  getMatchup(homeTeamId: string, awayTeamId: string): Promise<HistoricalMatchupData | null>;
  getTeamHistory(teamId: string, limit?: number): Promise<MatchData[]>;
}

export interface IPredictionRepository {
  save(prediction: PredictionResult): Promise<void>;
  saveBatch(predictions: PredictionResult[]): Promise<void>;
  getByMatchId(matchId: string): Promise<PredictionResult | null>;
  getByMatchIds(matchIds: string[]): Promise<Map<string, PredictionResult>>;
  getByAlgorithm(algorithmId: string, limit?: number): Promise<PredictionResult[]>;
}

// ============================================
// Prediction Engine Interface
// ============================================

export interface IPredictionEngine {
  readonly algorithmId: string;
  readonly algorithmName: string;
  
  predict(match: MatchData, context?: PredictionContext): PredictionResult;
  predictBatch(matches: MatchData[], context?: PredictionContext): PredictionResult[];
}

export interface PredictionContext {
  historical?: HistoricalMatchupData;
  injuries?: {
    home: any[];
    away: any[];
  };
  weather?: {
    condition: string;
    temperature: number;
    wind: number;
  };
  odds?: OddsData;
}
