
import { League } from '@/types/sports';
import { SportPositionWeights, PositionWeight } from '@/types/injuries';

// Status multipliers - how much of the impact to apply based on injury status
export const STATUS_MULTIPLIERS: Record<string, number> = {
  'out': 1.0,
  'doubtful': 0.85,
  'questionable': 0.5,
  'probable': 0.2,
  'day-to-day': 0.4,
  'healthy': 0,
};

// NBA Position Weights
const NBA_POSITIONS: PositionWeight[] = [
  { position: 'PG', offensiveWeight: 0.85, defensiveWeight: 0.5, basePointsImpact: 18 },
  { position: 'SG', offensiveWeight: 0.75, defensiveWeight: 0.55, basePointsImpact: 16 },
  { position: 'SF', offensiveWeight: 0.7, defensiveWeight: 0.65, basePointsImpact: 15 },
  { position: 'PF', offensiveWeight: 0.65, defensiveWeight: 0.7, basePointsImpact: 14 },
  { position: 'C', offensiveWeight: 0.55, defensiveWeight: 0.85, basePointsImpact: 12 },
  { position: 'G', offensiveWeight: 0.8, defensiveWeight: 0.52, basePointsImpact: 17 },
  { position: 'F', offensiveWeight: 0.68, defensiveWeight: 0.68, basePointsImpact: 14.5 },
];

// NFL Position Weights
const NFL_POSITIONS: PositionWeight[] = [
  { position: 'QB', offensiveWeight: 1.0, defensiveWeight: 0, basePointsImpact: 12 },
  { position: 'RB', offensiveWeight: 0.7, defensiveWeight: 0, basePointsImpact: 4 },
  { position: 'WR', offensiveWeight: 0.6, defensiveWeight: 0, basePointsImpact: 3 },
  { position: 'TE', offensiveWeight: 0.45, defensiveWeight: 0.15, basePointsImpact: 2.5 },
  { position: 'OL', offensiveWeight: 0.35, defensiveWeight: 0, basePointsImpact: 2 },
  { position: 'OT', offensiveWeight: 0.35, defensiveWeight: 0, basePointsImpact: 2 },
  { position: 'OG', offensiveWeight: 0.3, defensiveWeight: 0, basePointsImpact: 1.5 },
  { position: 'C', offensiveWeight: 0.3, defensiveWeight: 0, basePointsImpact: 1.5 },
  { position: 'DE', offensiveWeight: 0, defensiveWeight: 0.7, basePointsImpact: 2.5 },
  { position: 'DT', offensiveWeight: 0, defensiveWeight: 0.6, basePointsImpact: 2 },
  { position: 'LB', offensiveWeight: 0, defensiveWeight: 0.65, basePointsImpact: 2.5 },
  { position: 'CB', offensiveWeight: 0, defensiveWeight: 0.75, basePointsImpact: 3 },
  { position: 'S', offensiveWeight: 0, defensiveWeight: 0.65, basePointsImpact: 2 },
  { position: 'K', offensiveWeight: 0.25, defensiveWeight: 0, basePointsImpact: 1.5 },
  { position: 'P', offensiveWeight: 0.1, defensiveWeight: 0.1, basePointsImpact: 0.5 },
];

// NHL Position Weights
const NHL_POSITIONS: PositionWeight[] = [
  { position: 'C', offensiveWeight: 0.85, defensiveWeight: 0.6, basePointsImpact: 0.8 },
  { position: 'LW', offensiveWeight: 0.8, defensiveWeight: 0.45, basePointsImpact: 0.7 },
  { position: 'RW', offensiveWeight: 0.8, defensiveWeight: 0.45, basePointsImpact: 0.7 },
  { position: 'D', offensiveWeight: 0.4, defensiveWeight: 0.85, basePointsImpact: 0.4 },
  { position: 'G', offensiveWeight: 0, defensiveWeight: 1.0, basePointsImpact: 1.5 },
];

// MLB Position Weights (runs instead of points)
const MLB_POSITIONS: PositionWeight[] = [
  { position: 'SP', offensiveWeight: 0.1, defensiveWeight: 0.95, basePointsImpact: 2.5 },
  { position: 'RP', offensiveWeight: 0.05, defensiveWeight: 0.6, basePointsImpact: 0.8 },
  { position: 'C', offensiveWeight: 0.5, defensiveWeight: 0.7, basePointsImpact: 0.4 },
  { position: '1B', offensiveWeight: 0.75, defensiveWeight: 0.35, basePointsImpact: 0.6 },
  { position: '2B', offensiveWeight: 0.6, defensiveWeight: 0.65, basePointsImpact: 0.5 },
  { position: '3B', offensiveWeight: 0.65, defensiveWeight: 0.6, basePointsImpact: 0.5 },
  { position: 'SS', offensiveWeight: 0.6, defensiveWeight: 0.7, basePointsImpact: 0.5 },
  { position: 'LF', offensiveWeight: 0.7, defensiveWeight: 0.5, basePointsImpact: 0.5 },
  { position: 'CF', offensiveWeight: 0.65, defensiveWeight: 0.65, basePointsImpact: 0.5 },
  { position: 'RF', offensiveWeight: 0.7, defensiveWeight: 0.55, basePointsImpact: 0.5 },
  { position: 'DH', offensiveWeight: 0.85, defensiveWeight: 0, basePointsImpact: 0.6 },
];

// Soccer Position Weights (goals)
const SOCCER_POSITIONS: PositionWeight[] = [
  { position: 'GK', offensiveWeight: 0.05, defensiveWeight: 1.0, basePointsImpact: 0.8 },
  { position: 'CB', offensiveWeight: 0.15, defensiveWeight: 0.85, basePointsImpact: 0.3 },
  { position: 'LB', offensiveWeight: 0.35, defensiveWeight: 0.7, basePointsImpact: 0.25 },
  { position: 'RB', offensiveWeight: 0.35, defensiveWeight: 0.7, basePointsImpact: 0.25 },
  { position: 'CDM', offensiveWeight: 0.4, defensiveWeight: 0.75, basePointsImpact: 0.3 },
  { position: 'CM', offensiveWeight: 0.6, defensiveWeight: 0.55, basePointsImpact: 0.35 },
  { position: 'CAM', offensiveWeight: 0.8, defensiveWeight: 0.35, basePointsImpact: 0.5 },
  { position: 'LM', offensiveWeight: 0.7, defensiveWeight: 0.45, basePointsImpact: 0.4 },
  { position: 'RM', offensiveWeight: 0.7, defensiveWeight: 0.45, basePointsImpact: 0.4 },
  { position: 'LW', offensiveWeight: 0.85, defensiveWeight: 0.25, basePointsImpact: 0.5 },
  { position: 'RW', offensiveWeight: 0.85, defensiveWeight: 0.25, basePointsImpact: 0.5 },
  { position: 'ST', offensiveWeight: 0.95, defensiveWeight: 0.15, basePointsImpact: 0.7 },
  { position: 'CF', offensiveWeight: 0.9, defensiveWeight: 0.2, basePointsImpact: 0.65 },
];

// Sport configuration mapping
export const SPORT_POSITION_WEIGHTS: Partial<Record<League, SportPositionWeights>> = {
  NBA: {
    league: 'NBA',
    positions: NBA_POSITIONS,
    averagePointsPerGame: 115,
    averagePointsAllowed: 115,
  },
  NFL: {
    league: 'NFL',
    positions: NFL_POSITIONS,
    averagePointsPerGame: 23,
    averagePointsAllowed: 23,
  },
  NHL: {
    league: 'NHL',
    positions: NHL_POSITIONS,
    averagePointsPerGame: 3.1,
    averagePointsAllowed: 3.1,
  },
  MLB: {
    league: 'MLB',
    positions: MLB_POSITIONS,
    averagePointsPerGame: 4.5,
    averagePointsAllowed: 4.5,
  },
  SOCCER: {
    league: 'SOCCER',
    positions: SOCCER_POSITIONS,
    averagePointsPerGame: 1.5,
    averagePointsAllowed: 1.5,
  },
  EPL: {
    league: 'EPL',
    positions: SOCCER_POSITIONS,
    averagePointsPerGame: 1.5,
    averagePointsAllowed: 1.5,
  },
  LA_LIGA: {
    league: 'LA_LIGA',
    positions: SOCCER_POSITIONS,
    averagePointsPerGame: 1.4,
    averagePointsAllowed: 1.4,
  },
  SERIE_A: {
    league: 'SERIE_A',
    positions: SOCCER_POSITIONS,
    averagePointsPerGame: 1.4,
    averagePointsAllowed: 1.4,
  },
  BUNDESLIGA: {
    league: 'BUNDESLIGA',
    positions: SOCCER_POSITIONS,
    averagePointsPerGame: 1.6,
    averagePointsAllowed: 1.6,
  },
  LIGUE_1: {
    league: 'LIGUE_1',
    positions: SOCCER_POSITIONS,
    averagePointsPerGame: 1.3,
    averagePointsAllowed: 1.3,
  },
  MLS: {
    league: 'MLS',
    positions: SOCCER_POSITIONS,
    averagePointsPerGame: 1.5,
    averagePointsAllowed: 1.5,
  },
  CHAMPIONS_LEAGUE: {
    league: 'CHAMPIONS_LEAGUE',
    positions: SOCCER_POSITIONS,
    averagePointsPerGame: 1.5,
    averagePointsAllowed: 1.5,
  },
  NCAAF: {
    league: 'NCAAF',
    positions: NFL_POSITIONS,
    averagePointsPerGame: 28,
    averagePointsAllowed: 28,
  },
  NCAAB: {
    league: 'NCAAB',
    positions: NBA_POSITIONS,
    averagePointsPerGame: 72,
    averagePointsAllowed: 72,
  },
  WNBA: {
    league: 'WNBA',
    positions: NBA_POSITIONS,
    averagePointsPerGame: 82,
    averagePointsAllowed: 82,
  },
  CFL: {
    league: 'CFL',
    positions: NFL_POSITIONS,
    averagePointsPerGame: 25,
    averagePointsAllowed: 25,
  },
};

export function getPositionWeight(league: League, position: string): PositionWeight {
  const sportConfig = SPORT_POSITION_WEIGHTS[league];
  const normalizedPosition = position.toUpperCase();
  
  if (!sportConfig) {
    // Default fallback for unsupported leagues
    return {
      position: normalizedPosition,
      offensiveWeight: 0.3,
      defensiveWeight: 0.3,
      basePointsImpact: 1,
    };
  }
  
  const positionWeight = sportConfig.positions.find(
    p => p.position.toUpperCase() === normalizedPosition
  );
  
  // Default fallback for unknown positions
  return positionWeight || {
    position: normalizedPosition,
    offensiveWeight: 0.3,
    defensiveWeight: 0.3,
    basePointsImpact: 1,
  };
}

export function getStatusMultiplier(status: string): number {
  const normalizedStatus = status.toLowerCase().replace(/[_\s]/g, '-');
  return STATUS_MULTIPLIERS[normalizedStatus] ?? 0.5;
}
