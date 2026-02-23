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
  TemporalFactors,
  SeasonSegment,
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

// ============================================
// Temporal Encoding Functions
// ============================================

/**
 * Determine season segment from match date and league (PURE FUNCTION)
 */
export function determineSeasonSegment(matchDate: string, league: League): SeasonSegment {
  const month = new Date(matchDate).getMonth(); // 0-indexed

  const schedules: Record<string, { early: number[]; mid: number[]; late: number[]; post: number[] }> = {
    NBA:   { early: [9, 10, 11], mid: [0, 1], late: [2, 3], post: [4, 5] },
    NFL:   { early: [8, 9], mid: [10, 11], late: [0], post: [0, 1] },
    MLB:   { early: [3, 4], mid: [5, 6], late: [7, 8], post: [9, 10] },
    NHL:   { early: [9, 10, 11], mid: [0, 1], late: [2, 3], post: [4, 5] },
    NCAAB: { early: [10, 11], mid: [0, 1], late: [2], post: [2, 3] },
    NCAAF: { early: [8, 9], mid: [10], late: [11], post: [0, 1] },
  };

  const sched = schedules[league] ?? schedules.NBA;
  if (sched.post.includes(month)) return 'postseason';
  if (sched.late.includes(month)) return 'late';
  if (sched.mid.includes(month)) return 'mid';
  return 'early';
}

/**
 * Calculate exponentially weighted recent form (PURE FUNCTION)
 * More recent games get exponentially higher weight.
 * Decay factor of 0.85 means each older game is worth 85% of the next.
 */
export function calculateRecencyWeightedForm(recentForm?: string[], decayFactor: number = 0.85): number {
  if (!recentForm || recentForm.length === 0) return 50;

  let weightedWins = 0;
  let totalWeight = 0;

  recentForm.forEach((result, index) => {
    // index 0 = most recent game
    const weight = Math.pow(decayFactor, index);
    if (result === 'W') weightedWins += weight;
    totalWeight += weight;
  });

  if (totalWeight === 0) return 50;
  return Math.round((weightedWins / totalWeight) * 100);
}

/**
 * Calculate momentum decay (PURE FUNCTION)
 * Measures how sustained a streak is — a 5-game streak has more
 * momentum than alternating W/L even if both are 3-2.
 */
export function calculateMomentumDecay(recentForm?: string[]): number {
  if (!recentForm || recentForm.length < 2) return 0.5;

  // Count consecutive same results from most recent
  let streakLength = 1;
  for (let i = 1; i < recentForm.length; i++) {
    if (recentForm[i] === recentForm[0]) {
      streakLength++;
    } else {
      break;
    }
  }

  // Normalize: streak of 5+ games = near 1.0, single game = ~0.2
  return Math.min(1, streakLength / 5);
}

/**
 * Detect form trajectory (PURE FUNCTION)
 * Compares first-half performance to second-half performance.
 */
export function detectFormTrajectory(recentForm?: string[]): 'ascending' | 'descending' | 'stable' {
  if (!recentForm || recentForm.length < 4) return 'stable';

  const mid = Math.floor(recentForm.length / 2);
  const recentHalf = recentForm.slice(0, mid);
  const olderHalf = recentForm.slice(mid);

  const recentWinPct = recentHalf.filter(r => r === 'W').length / recentHalf.length;
  const olderWinPct = olderHalf.filter(r => r === 'W').length / olderHalf.length;

  const diff = recentWinPct - olderWinPct;
  if (diff > 0.15) return 'ascending';
  if (diff < -0.15) return 'descending';
  return 'stable';
}

/**
 * Calculate full temporal factors for a match (PURE FUNCTION)
 */
export function calculateTemporalFactors(
  match: MatchData,
  homeForm?: string[],
  awayForm?: string[]
): TemporalFactors {
  const seasonSegment = determineSeasonSegment(match.startTime, match.league);

  const recencyWeightedForm = {
    home: calculateRecencyWeightedForm(homeForm),
    away: calculateRecencyWeightedForm(awayForm),
  };

  const momentumDecay = {
    home: calculateMomentumDecay(homeForm),
    away: calculateMomentumDecay(awayForm),
  };

  const formTrajectory = {
    home: detectFormTrajectory(homeForm),
    away: detectFormTrajectory(awayForm),
  };

  // Calculate temporal impact on confidence
  let impact = 0;

  // Recency-weighted form differential
  const formDiff = (recencyWeightedForm.home - recencyWeightedForm.away) / 100;
  impact += formDiff * 8; // Up to ±8 points

  // Momentum sustainability bonus
  const momentumDiff = momentumDecay.home - momentumDecay.away;
  impact += momentumDiff * 4; // Up to ±4 points

  // Trajectory bonus
  const trajScore = (t: 'ascending' | 'descending' | 'stable') =>
    t === 'ascending' ? 1 : t === 'descending' ? -1 : 0;
  impact += (trajScore(formTrajectory.home) - trajScore(formTrajectory.away)) * 1.5;

  // Season segment modifier: trust form less in early season, more in late/postseason
  const segmentMultiplier: Record<SeasonSegment, number> = {
    early: 0.6,      // Small sample, don't trust form much
    mid: 0.85,
    late: 1.0,
    postseason: 1.15, // Postseason intensity amplifies real differences
  };
  impact *= segmentMultiplier[seasonSegment];

  // Clamp
  impact = Math.max(-15, Math.min(15, impact));

  return {
    seasonSegment,
    recencyWeightedForm,
    momentumDecay,
    formTrajectory,
    impact,
  };
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

    // Temporal factors — always compute from available form data
    factors.temporal = calculateTemporalFactors(
      match,
      match.homeTeam.recentForm,
      match.awayTeam.recentForm
    );

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

    // Temporal factors — the key Transformer-inspired addition
    if (factors.temporal) {
      confidence += factors.temporal.impact;
    }
    
    // Clamp to valid range
    return Math.max(this.config.thresholds.minConfidence, Math.min(88, confidence));
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
