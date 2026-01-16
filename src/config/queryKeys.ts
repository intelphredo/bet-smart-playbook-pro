/**
 * Centralized React Query key factory
 * Ensures consistent query key management across the application
 * 
 * Usage:
 *   queryKeys.matches.all
 *   queryKeys.matches.byLeague('NBA')
 *   queryKeys.predictions.byMatch('match-id')
 */

import { League } from '@/types/sports';

export const queryKeys = {
  // Match related queries
  matches: {
    all: ['matches'] as const,
    byLeague: (league: League) => ['matches', 'league', league] as const,
    byId: (matchId: string) => ['matches', 'detail', matchId] as const,
    live: () => ['matches', 'live'] as const,
    scheduled: () => ['matches', 'scheduled'] as const,
    finished: () => ['matches', 'finished'] as const,
    byDate: (date: string) => ['matches', 'date', date] as const,
  },

  // Prediction related queries
  predictions: {
    all: ['predictions'] as const,
    byMatch: (matchId: string) => ['predictions', 'match', matchId] as const,
    byAlgorithm: (algorithmId: string) => ['predictions', 'algorithm', algorithmId] as const,
    historical: (params?: { startDate?: string; endDate?: string; league?: string }) => 
      ['predictions', 'historical', params] as const,
    byTeams: (homeTeam: string, awayTeam: string, league: string) => 
      ['predictions', 'teams', homeTeam, awayTeam, league] as const,
  },

  // Algorithm related queries
  algorithms: {
    all: ['algorithms'] as const,
    performance: (dateRange?: { start?: Date; end?: Date }) => 
      ['algorithmPerformance', dateRange] as const,
    stats: (algorithmId: string) => ['algorithms', 'stats', algorithmId] as const,
    comparison: () => ['algorithms', 'comparison'] as const,
  },

  // User related queries
  user: {
    profile: (userId: string) => ['user', 'profile', userId] as const,
    bets: (userId: string, filters?: Record<string, unknown>) => 
      ['user', 'bets', userId, filters] as const,
    stats: (userId: string) => ['user', 'stats', userId] as const,
    alerts: (userId: string) => ['user', 'alerts', userId] as const,
    preferences: (userId: string) => ['user', 'preferences', userId] as const,
  },

  // Betting related queries
  bets: {
    all: ['bets'] as const,
    byId: (betId: string) => ['bets', 'detail', betId] as const,
    pending: (userId: string) => ['bets', 'pending', userId] as const,
    history: (userId: string, page?: number) => ['bets', 'history', userId, page] as const,
    stats: (userId: string) => ['bets', 'stats', userId] as const,
  },

  // Odds related queries
  odds: {
    byMatch: (matchId: string) => ['odds', 'match', matchId] as const,
    history: (matchId: string) => ['odds', 'history', matchId] as const,
    live: (matchId: string) => ['odds', 'live', matchId] as const,
    movements: (matchId: string) => ['odds', 'movements', matchId] as const,
  },

  // Injury related queries
  injuries: {
    all: ['injuries'] as const,
    byLeague: (league: League) => ['injuries', 'league', league] as const,
    byTeam: (teamId: string) => ['injuries', 'team', teamId] as const,
    byPlayer: (playerId: string) => ['injuries', 'player', playerId] as const,
  },

  // Standings related queries
  standings: {
    byLeague: (league: League) => ['standings', 'league', league] as const,
    conference: (league: League, conference: string) => 
      ['standings', 'conference', league, conference] as const,
  },

  // Betting trends
  trends: {
    byMatch: (matchId: string) => ['trends', 'match', matchId] as const,
    sharp: (league?: League) => ['trends', 'sharp', league] as const,
    public: (matchId: string) => ['trends', 'public', matchId] as const,
  },

  // Backtest related queries
  backtest: {
    results: (config: Record<string, unknown>) => ['backtest', 'results', config] as const,
    comparison: (strategies: string[]) => ['backtest', 'comparison', strategies] as const,
    optimization: (params: Record<string, unknown>) => ['backtest', 'optimization', params] as const,
  },

  // Similar matchups for cross-section analysis
  similarMatchups: {
    byTeams: (homeTeam: string, awayTeam: string, league: string) => 
      ['similar-matchups', homeTeam, awayTeam, league] as const,
  },

  // Weather data
  weather: {
    byVenue: (venueKey: string) => ['weather', 'venue', venueKey] as const,
    byMatch: (matchId: string) => ['weather', 'match', matchId] as const,
  },

  // Schedule exports
  schedule: {
    export: (filters: Record<string, unknown>) => ['schedule', 'export', filters] as const,
  },

  // Sportradar data
  sportradar: {
    injuries: (league: string) => ['sportradar', 'injuries', league] as const,
    standings: (league: string) => ['sportradar', 'standings', league] as const,
    leaders: (league: string, category?: string) => 
      ['sportradar', 'leaders', league, category] as const,
    team: (league: string, teamId: string) => 
      ['sportradar', 'team', league, teamId] as const,
    player: (league: string, playerId: string) => 
      ['sportradar', 'player', league, playerId] as const,
  },
} as const;

// Helper type for extracting query key types
export type QueryKeys = typeof queryKeys;

export default queryKeys;
