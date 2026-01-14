/**
 * Live Score Configuration
 * Defines league priority tiers and polling intervals
 */

import { League } from '@/types/sports';

// League priority tiers for polling frequency
export const LEAGUE_TIERS = {
  TIER_1: ['NBA', 'NFL', 'EPL', 'CHAMPIONS_LEAGUE'] as League[],
  TIER_2: ['MLB', 'NHL', 'LA_LIGA', 'SERIE_A', 'BUNDESLIGA'] as League[],
  TIER_3: ['NCAAB', 'NCAAF', 'WNBA', 'MLS', 'LIGUE_1', 'UFC', 'ATP', 'WTA', 'PGA', 'CFL', 'XFL', 'SOCCER'] as League[],
} as const;

// Polling intervals in milliseconds
export const POLLING_INTERVALS = {
  TIER_1: 10000,      // 10 seconds for high-priority leagues
  TIER_2: 30000,      // 30 seconds for medium-priority leagues
  TIER_3: 120000,     // 2 minutes for low-priority leagues
  PRE_GAME: 300000,   // 5 minutes for pre-game
  FINISHED: 300000,   // 5 minutes after game ends, then stop
  PAUSED: 0,          // No polling when paused
} as const;

// Exponential backoff configuration for errors
export const BACKOFF_CONFIG = {
  INITIAL_DELAY: 5000,    // 5 seconds
  MAX_DELAY: 45000,       // 45 seconds
  MULTIPLIER: 3,          // Triple on each retry
  MAX_RETRIES: 5,
} as const;

// WebSocket configuration
export const WEBSOCKET_CONFIG = {
  MAX_CONNECTIONS: 3,
  RECONNECT_DELAY: 3000,
  HEARTBEAT_INTERVAL: 30000,
  STALE_THRESHOLD: 30000,  // 30 seconds
} as const;

// Game state types
export type GameState = 'pre' | 'live' | 'halftime' | 'finished' | 'delayed' | 'postponed';

// Score update types
export type UpdateType = 'full' | 'delta' | 'score_only';

/**
 * Get the tier for a specific league
 */
export function getLeagueTier(league: League): 1 | 2 | 3 {
  if (LEAGUE_TIERS.TIER_1.includes(league)) return 1;
  if (LEAGUE_TIERS.TIER_2.includes(league)) return 2;
  return 3;
}

/**
 * Get polling interval based on league tier and game state
 */
export function getPollingInterval(league: League, gameState: GameState): number {
  if (gameState === 'finished') return POLLING_INTERVALS.FINISHED;
  if (gameState === 'pre') return POLLING_INTERVALS.PRE_GAME;
  if (gameState === 'halftime') return POLLING_INTERVALS.TIER_2; // Slower during halftime
  
  const tier = getLeagueTier(league);
  switch (tier) {
    case 1: return POLLING_INTERVALS.TIER_1;
    case 2: return POLLING_INTERVALS.TIER_2;
    case 3: return POLLING_INTERVALS.TIER_3;
  }
}

/**
 * Calculate backoff delay for error retry
 */
export function calculateBackoffDelay(attempt: number): number {
  const delay = BACKOFF_CONFIG.INITIAL_DELAY * Math.pow(BACKOFF_CONFIG.MULTIPLIER, attempt);
  return Math.min(delay, BACKOFF_CONFIG.MAX_DELAY);
}

/**
 * Check if data is stale based on last update timestamp
 */
export function isDataStale(lastUpdate: string | Date | undefined, thresholdMs: number = WEBSOCKET_CONFIG.STALE_THRESHOLD): boolean {
  if (!lastUpdate) return true;
  const lastUpdateTime = new Date(lastUpdate).getTime();
  return Date.now() - lastUpdateTime > thresholdMs;
}

/**
 * Group matches by league for batched API calls
 */
export function groupMatchesByLeague<T extends { league: League }>(matches: T[]): Map<League, T[]> {
  const grouped = new Map<League, T[]>();
  
  for (const match of matches) {
    const existing = grouped.get(match.league) || [];
    existing.push(match);
    grouped.set(match.league, existing);
  }
  
  return grouped;
}

/**
 * Priority sort for leagues (Tier 1 first)
 */
export function sortLeaguesByPriority(leagues: League[]): League[] {
  return [...leagues].sort((a, b) => getLeagueTier(a) - getLeagueTier(b));
}

/**
 * Get leagues by tier
 */
export function getLeaguesByTier(tier: 1 | 2 | 3): League[] {
  switch (tier) {
    case 1: return [...LEAGUE_TIERS.TIER_1];
    case 2: return [...LEAGUE_TIERS.TIER_2];
    case 3: return [...LEAGUE_TIERS.TIER_3];
  }
}
