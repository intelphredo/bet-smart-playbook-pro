/**
 * Live Score Data Types
 * Comprehensive types for live score updates and events
 */

import { League } from '@/types/sports';
import { GameState } from '@/config/live-scores';

/**
 * Key game events (goals, touchdowns, etc.)
 */
export interface GameEvent {
  id: string;
  type: 'goal' | 'touchdown' | 'field_goal' | 'homerun' | 'three_pointer' | 
        'penalty' | 'red_card' | 'yellow_card' | 'substitution' | 'timeout' | 
        'challenge' | 'injury' | 'other';
  team: 'home' | 'away';
  time: string;           // Game clock when event occurred
  period: string;         // Period/quarter/inning
  player?: string;        // Player involved (if applicable)
  description: string;
  timestamp: string;      // ISO timestamp when event was recorded
}

/**
 * Possession indicator for applicable sports
 */
export interface PossessionInfo {
  team: 'home' | 'away' | null;
  yardLine?: number;      // Football
  down?: number;          // Football
  distance?: number;      // Football
  baseRunners?: {         // Baseball
    first: boolean;
    second: boolean;
    third: boolean;
  };
  outs?: number;          // Baseball
  powerPlay?: boolean;    // Hockey
  manUp?: boolean;        // Hockey
}

/**
 * Complete live score data structure
 */
export interface LiveScoreData {
  matchId: string;
  league: League;
  
  // Core score information
  score: {
    home: number;
    away: number;
  };
  
  // Period/timing information
  period: string;           // "Q1", "1st Half", "P2", etc.
  clock: string;            // "12:45", "5:30", etc.
  gameState: GameState;
  
  // Possession (sport-specific)
  possession?: PossessionInfo;
  
  // Key game events
  events: GameEvent[];
  
  // Delta tracking
  lastUpdate: string;       // ISO timestamp
  updateType: 'full' | 'delta';
  changedFields: string[];  // Fields that changed in delta update
  
  // Connection status
  source: 'websocket' | 'polling' | 'cache';
  isStale: boolean;
  connectionQuality: 'good' | 'degraded' | 'poor';
}

/**
 * Delta update - only contains changed fields
 */
export interface LiveScoreDelta {
  matchId: string;
  timestamp: string;
  changes: Partial<Omit<LiveScoreData, 'matchId' | 'league'>>;
  newEvents?: GameEvent[];
}

/**
 * Batch update for multiple games
 */
export interface LiveScoreBatch {
  timestamp: string;
  updates: LiveScoreData[];
  deltas: LiveScoreDelta[];
  errors: Array<{
    matchId: string;
    error: string;
  }>;
}

/**
 * Connection status for UI indicators
 */
export interface ConnectionStatus {
  type: 'websocket' | 'polling';
  isConnected: boolean;
  lastHeartbeat: string | null;
  reconnectAttempts: number;
  quality: 'good' | 'degraded' | 'poor' | 'disconnected';
  activeConnections: number;
  maxConnections: number;
}

/**
 * Subscription info for a match
 */
export interface MatchSubscription {
  matchId: string;
  league: League;
  priority: 'critical' | 'high' | 'normal' | 'low';
  hasUserBet: boolean;
  connectionType: 'websocket' | 'polling';
  pollingInterval: number;
  lastUpdate: string | null;
  errorCount: number;
  isActive: boolean;
}
