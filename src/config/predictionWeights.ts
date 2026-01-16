/**
 * Centralized prediction weights and thresholds configuration
 * All prediction algorithms should import these values instead of hardcoding
 */

// MLB Prediction Weights
export const MLB_PREDICTION_WEIGHTS = {
  TEAM_RECORD: 0.35,        // 35% weight for team record strength
  RUN_DIFFERENTIAL: 0.30,   // 30% weight for run differential
  RECENT_FORM: 0.25,        // 25% weight for recent form (momentum)
  HEAD_TO_HEAD: 0.15,       // 15% weight for head-to-head history
} as const;

// NBA Prediction Weights
export const NBA_PREDICTION_WEIGHTS = {
  TEAM_STRENGTH: 0.35,
  HOME_ADVANTAGE: 0.10,
  RECENT_FORM: 0.25,
  HEAD_TO_HEAD: 0.15,
  INJURY_IMPACT: 0.15,
} as const;

// NFL Prediction Weights
export const NFL_PREDICTION_WEIGHTS = {
  TEAM_STRENGTH: 0.30,
  HOME_ADVANTAGE: 0.15,
  RECENT_FORM: 0.20,
  HEAD_TO_HEAD: 0.15,
  WEATHER_IMPACT: 0.10,
  INJURY_IMPACT: 0.10,
} as const;

// NHL Prediction Weights
export const NHL_PREDICTION_WEIGHTS = {
  TEAM_STRENGTH: 0.35,
  HOME_ADVANTAGE: 0.08,
  RECENT_FORM: 0.25,
  GOALIE_STRENGTH: 0.20,
  HEAD_TO_HEAD: 0.12,
} as const;

// Soccer Prediction Weights
export const SOCCER_PREDICTION_WEIGHTS = {
  TEAM_STRENGTH: 0.30,
  HOME_ADVANTAGE: 0.12,
  RECENT_FORM: 0.25,
  HEAD_TO_HEAD: 0.15,
  LEAGUE_POSITION: 0.18,
} as const;

// Home Advantage Factors by League (percentage points)
export const HOME_ADVANTAGE = {
  NBA: 3.5,
  NFL: 2.5,
  NHL: 1.5,
  MLB: 1.0,  // Smallest home advantage in MLB
  NCAAB: 4.5,
  NCAAF: 3.0,
  SOCCER: 5.0,
  EPL: 4.5,
  LA_LIGA: 5.5,
  SERIE_A: 5.0,
  BUNDESLIGA: 4.0,
  LIGUE_1: 4.5,
  MLS: 4.0,
  CHAMPIONS_LEAGUE: 3.5,
  WNBA: 3.0,
} as const;

// Confidence Thresholds
export const CONFIDENCE_THRESHOLDS = {
  LOW: 50,
  MEDIUM: 60,
  HIGH: 70,
  VERY_HIGH: 80,
  ELITE: 85,
} as const;

// Kelly Criterion Settings
export const KELLY_SETTINGS = {
  FRACTION: 0.25,           // Quarter Kelly by default
  MAX_STAKE_PERCENT: 5,     // Never risk more than 5% of bankroll
  MIN_EDGE_PERCENT: 2,      // Minimum edge required to bet
} as const;

// Expected Value Thresholds
export const EV_THRESHOLDS = {
  MIN_POSITIVE: 0.02,       // 2% minimum positive EV
  GOOD: 0.05,               // 5% is good EV
  EXCELLENT: 0.10,          // 10% is excellent EV
} as const;

// Odds Configuration
export const ODDS_CONFIG = {
  BASE_ODDS: 1.9,           // Default base odds (American: -110)
  MIN_ODDS: 1.2,            // Minimum acceptable odds
  MAX_ODDS: 5.0,            // Maximum odds before high variance warning
  ADJUSTMENT_CAP: 0.6,      // Maximum odds adjustment from strength difference
  VARIANCE_MULTIPLIER: 0.3, // Odds variance between sportsbooks
} as const;

// Score Projection Base Values by League
export const SCORE_PROJECTION_BASE = {
  NBA: 110,
  NCAAB: 70,
  WNBA: 80,
  NFL: 22,
  NCAAF: 28,
  NHL: 2.8,
  MLB: 4.5,
  SOCCER: 1.3,
  EPL: 1.4,
  LA_LIGA: 1.3,
  SERIE_A: 1.2,
  BUNDESLIGA: 1.5,
  LIGUE_1: 1.3,
  MLS: 1.5,
  CHAMPIONS_LEAGUE: 1.4,
} as const;

// Variance Factors by League (higher = more unpredictable)
export const LEAGUE_VARIANCE = {
  NBA: 0.15,
  NCAAB: 0.25,
  WNBA: 0.20,
  NFL: 0.30,
  NCAAF: 0.35,
  NHL: 0.25,
  MLB: 0.40,  // Baseball has high variance
  SOCCER: 0.30,
  EPL: 0.25,
  LA_LIGA: 0.25,
  SERIE_A: 0.28,
  BUNDESLIGA: 0.25,
  LIGUE_1: 0.30,
  MLS: 0.35,
  CHAMPIONS_LEAGUE: 0.28,
} as const;
