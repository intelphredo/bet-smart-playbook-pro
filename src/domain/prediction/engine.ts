/**
 * Domain Layer - Base Prediction Engine
 * 
 * Pure business logic for generating predictions.
 * No dependencies on React, data fetching, or external services.
 */

import { League } from "@/types/sports";
import {
  MatchData,
  TeamData,
  OddsData,
  PredictionResult,
  PredictionFactors,
  PredictionContext,
  TeamStrengthMetrics,
  AlgorithmConfig,
  IPredictionEngine,
  DEFAULT_ALGORITHM_WEIGHTS,
} from "./interfaces";

// ============================================
// Pure Calculation Functions
// ============================================

/**
 * Calculate team strength metrics from team data (PURE FUNCTION)
 */
export function calculateTeamStrengthMetrics(team: TeamData): TeamStrengthMetrics {
  let offense = 50;
  let defense = 50;
  let momentum = 50;

  // Factor in record
  if (team.record) {
    const parts = team.record.split('-');
    if (parts.length >= 2) {
      const wins = parseInt(parts[0], 10);
      const losses = parseInt(parts[1], 10);
      const total = wins + losses;

      if (!isNaN(wins) && !isNaN(losses) && total > 0) {
        const winPct = wins / total;
        const adjustment = (winPct - 0.5) * 40;
        offense += adjustment;
        defense += adjustment;
      }
    }
  }

  // Factor in recent form with weighted recency
  if (team.recentForm && team.recentForm.length > 0) {
    let weightedWins = 0;
    let totalWeight = 0;

    team.recentForm.forEach((result, index) => {
      const weight = team.recentForm!.length - index;
      if (result === 'W') weightedWins += weight;
      totalWeight += weight;
    });

    if (totalWeight > 0) {
      const weightedWinPct = weightedWins / totalWeight;
      momentum += (weightedWinPct - 0.5) * 50;
    }
  }

  // Clamp values
  offense = Math.max(25, Math.min(95, offense));
  defense = Math.max(25, Math.min(95, defense));
  momentum = Math.max(20, Math.min(95, momentum));

  return {
    offense,
    defense,
    momentum,
    overall: (offense + defense + momentum) / 3,
  };
}

/**
 * Calculate home field advantage by league (PURE FUNCTION)
 */
export function calculateHomeAdvantage(league: League, _teamName?: string): number {
  const baseAdvantage: Record<string, number> = {
    NBA: 2.5,
    NFL: 2.8,
    MLB: 1.5,
    NHL: 2.2,
    NCAAB: 3.5,
    NCAAF: 3.0,
    SOCCER: 2.0,
    MLS: 2.2,
    EPL: 2.0,
    DEFAULT: 2.0,
  };

  return baseAdvantage[league] ?? baseAdvantage.DEFAULT;
}

/**
 * Project score based on team metrics (PURE FUNCTION)
 */
export function projectScore(
  teamMetrics: TeamStrengthMetrics,
  opponentMetrics: TeamStrengthMetrics,
  isHome: boolean,
  league: League
): number {
  // Base scores by league
  const baseScores: Record<string, number> = {
    NBA: 110,
    NFL: 22,
    MLB: 4.5,
    NHL: 2.8,
    NCAAB: 72,
    NCAAF: 24,
    SOCCER: 1.3,
    DEFAULT: 2,
  };

  const base = baseScores[league] ?? baseScores.DEFAULT;
  
  // Calculate score adjustment
  const offenseImpact = (teamMetrics.offense - 50) / 100;
  const defenseImpact = (50 - opponentMetrics.defense) / 100;
  const momentumImpact = (teamMetrics.momentum - 50) / 200;
  
  let projected = base * (1 + offenseImpact + defenseImpact + momentumImpact);
  
  // Home advantage
  if (isHome) {
    projected *= 1.02;
  }
  
  return Math.max(0, Math.round(projected * 10) / 10);
}

/**
 * Calculate Kelly Criterion stake (PURE FUNCTION)
 */
export function calculateKellyCriterion(
  trueProbability: number,
  decimalOdds: number,
  fraction: number = 0.25 // Quarter Kelly for safety
): { kellyFraction: number; kellyStakeUnits: number } {
  if (trueProbability <= 0 || trueProbability >= 1 || decimalOdds <= 1) {
    return { kellyFraction: 0, kellyStakeUnits: 0 };
  }

  const b = decimalOdds - 1;
  const p = trueProbability;
  const q = 1 - p;

  const fullKelly = ((b * p) - q) / b;
  const adjustedKelly = Math.max(0, fullKelly * fraction);

  return {
    kellyFraction: Math.round(adjustedKelly * 10000) / 10000,
    kellyStakeUnits: Math.round(adjustedKelly * 100 * 100) / 100, // Assuming 100 unit bankroll
  };
}

/**
 * Calculate Expected Value (PURE FUNCTION)
 */
export function calculateExpectedValue(
  trueProbability: number,
  decimalOdds: number
): { expectedValue: number; evPercentage: number } {
  if (decimalOdds <= 1) {
    return { expectedValue: 0, evPercentage: 0 };
  }

  const b = decimalOdds - 1;
  const p = trueProbability;
  const q = 1 - p;

  const ev = (p * b) - q;
  
  return {
    expectedValue: Math.round(ev * 10000) / 10000,
    evPercentage: Math.round(ev * 100 * 100) / 100,
  };
}

// ============================================
// Base Prediction Engine Implementation
// ============================================

export class BasePredictionEngine implements IPredictionEngine {
  readonly algorithmId: string;
  readonly algorithmName: string;
  protected config: AlgorithmConfig;

  constructor(config: Partial<AlgorithmConfig> & { id: string; name: string }) {
    this.algorithmId = config.id;
    this.algorithmName = config.name;
    this.config = {
      id: config.id,
      name: config.name,
      description: config.description ?? '',
      version: config.version ?? '1.0.0',
      weights: config.weights ?? { ...DEFAULT_ALGORITHM_WEIGHTS },
      thresholds: config.thresholds ?? {
        minConfidence: 40,
        skipThreshold: 45,
        highValueThreshold: 65,
      },
    };
  }

  /**
   * Generate prediction for a single match
   */
  predict(match: MatchData, context?: PredictionContext): PredictionResult {
    const factors = this.calculateFactors(match, context);
    const confidence = this.calculateConfidence(factors);
    const recommended = this.determineRecommendation(confidence, factors);
    
    const trueProbability = confidence / 100;
    const odds = context?.odds ?? match.odds;
    const relevantOdds = recommended === 'home' 
      ? (odds?.homeWin ?? 2.0) 
      : (odds?.awayWin ?? 2.0);
    
    const { expectedValue, evPercentage } = calculateExpectedValue(trueProbability, relevantOdds);
    const { kellyFraction, kellyStakeUnits } = calculateKellyCriterion(trueProbability, relevantOdds);
    
    return {
      matchId: match.id,
      recommended,
      confidence: Math.round(confidence),
      trueProbability,
      projectedScore: {
        home: projectScore(factors.teamStrength.home, factors.teamStrength.away, true, match.league),
        away: projectScore(factors.teamStrength.away, factors.teamStrength.home, false, match.league),
      },
      impliedOdds: Math.round((1 / trueProbability) * 100) / 100,
      expectedValue,
      evPercentage,
      kellyFraction,
      kellyStakeUnits,
      factors,
      algorithmId: this.algorithmId,
      algorithmName: this.algorithmName,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate predictions for multiple matches
   */
  predictBatch(matches: MatchData[], context?: PredictionContext): PredictionResult[] {
    return matches.map(match => this.predict(match, context));
  }

  /**
   * Calculate all prediction factors
   */
  protected calculateFactors(match: MatchData, context?: PredictionContext): PredictionFactors {
    const homeStrength = calculateTeamStrengthMetrics(match.homeTeam);
    const awayStrength = calculateTeamStrengthMetrics(match.awayTeam);
    const homeAdvantage = calculateHomeAdvantage(match.league, match.homeTeam.name);

    const factors: PredictionFactors = {
      teamStrength: {
        home: homeStrength,
        away: awayStrength,
        differential: homeStrength.overall - awayStrength.overall,
      },
      homeAdvantage,
      momentum: {
        home: homeStrength.momentum,
        away: awayStrength.momentum,
        differential: homeStrength.momentum - awayStrength.momentum,
      },
    };

    // Add historical data if provided
    if (context?.historical && context.historical.totalGames > 0) {
      const homeWinPct = context.historical.homeWins / context.historical.totalGames;
      factors.historical = {
        data: context.historical,
        impact: (homeWinPct - 0.5) * 20,
      };
    }

    return factors;
  }

  /**
   * Calculate confidence score from factors
   */
  protected calculateConfidence(factors: PredictionFactors): number {
    const { weights } = this.config;
    
    let confidence = 50; // Start neutral
    
    // Team strength impact
    confidence += factors.teamStrength.differential * weights.teamStrength;
    
    // Home advantage
    confidence += factors.homeAdvantage * weights.homeAdvantage;
    
    // Momentum
    confidence += factors.momentum.differential * weights.momentum * 0.1;
    
    // Historical
    if (factors.historical) {
      confidence += factors.historical.impact * weights.historical;
    }
    
    // Clamp to valid range
    return Math.max(this.config.thresholds.minConfidence, Math.min(85, confidence));
  }

  /**
   * Determine recommended bet based on confidence
   */
  protected determineRecommendation(
    confidence: number, 
    factors: PredictionFactors
  ): 'home' | 'away' | 'draw' | 'skip' {
    if (confidence < this.config.thresholds.skipThreshold) {
      return 'skip';
    }
    
    // Positive confidence = home favored
    return factors.teamStrength.differential >= 0 ? 'home' : 'away';
  }
}

export default BasePredictionEngine;
