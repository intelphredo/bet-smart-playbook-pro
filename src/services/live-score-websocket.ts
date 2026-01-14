/**
 * WebSocket Service for Critical Live Games
 * 
 * Provides real-time score updates via WebSocket connection for:
 * - Games with active user bets
 * - High-priority games (Tier 1 leagues)
 * 
 * Features:
 * - Maximum 3 simultaneous connections
 * - Automatic reconnection with exponential backoff
 * - Fallback to polling on connection failure
 * - Heartbeat monitoring
 */

import { WEBSOCKET_CONFIG, BACKOFF_CONFIG } from '@/config/live-scores';
import { LiveScoreData, ConnectionStatus, GameEvent } from '@/types/live-scores';
import { League } from '@/types/sports';

type WebSocketMessageHandler = (data: LiveScoreData) => void;
type ConnectionStatusHandler = (status: ConnectionStatus) => void;
type ErrorHandler = (error: Error, matchId: string) => void;

interface WebSocketConnection {
  matchId: string;
  league: League;
  socket: WebSocket | null;
  reconnectAttempts: number;
  reconnectTimeout: ReturnType<typeof setTimeout> | null;
  heartbeatInterval: ReturnType<typeof setInterval> | null;
  lastHeartbeat: Date | null;
  isConnecting: boolean;
  priority: number;
}

class LiveScoreWebSocketService {
  private connections: Map<string, WebSocketConnection> = new Map();
  private messageHandlers: Map<string, WebSocketMessageHandler[]> = new Map();
  private statusHandlers: ConnectionStatusHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];
  private connectionQueue: Array<{ matchId: string; league: League; priority: number }> = [];
  private isEnabled: boolean = true;

  // Simulated WebSocket URL (would be real in production)
  private getWebSocketUrl(matchId: string, league: League): string {
    // In production, this would be a real WebSocket endpoint
    // For ESPN, they don't provide public WebSocket access
    // This is a placeholder for when/if such an endpoint exists
    return `wss://api.example.com/live/${league}/${matchId}`;
  }

  /**
   * Subscribe to live updates for a match
   */
  subscribe(
    matchId: string,
    league: League,
    priority: number = 0,
    onMessage: WebSocketMessageHandler
  ): () => void {
    // Add message handler
    const handlers = this.messageHandlers.get(matchId) || [];
    handlers.push(onMessage);
    this.messageHandlers.set(matchId, handlers);

    // Try to connect or queue
    if (this.connections.size < WEBSOCKET_CONFIG.MAX_CONNECTIONS) {
      this.connect(matchId, league, priority);
    } else {
      this.queueConnection(matchId, league, priority);
    }

    // Return unsubscribe function
    return () => this.unsubscribe(matchId, onMessage);
  }

  /**
   * Unsubscribe from match updates
   */
  unsubscribe(matchId: string, handler?: WebSocketMessageHandler): void {
    const handlers = this.messageHandlers.get(matchId) || [];
    
    if (handler) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }

    // If no more handlers, disconnect
    if (handlers.length === 0 || !handler) {
      this.messageHandlers.delete(matchId);
      this.disconnect(matchId);
      
      // Process queue
      this.processQueue();
    } else {
      this.messageHandlers.set(matchId, handlers);
    }
  }

  /**
   * Connect to WebSocket for a match
   */
  private connect(matchId: string, league: League, priority: number): void {
    if (this.connections.has(matchId)) return;
    if (!this.isEnabled) {
      console.log('[WebSocket] Service disabled, using polling fallback');
      return;
    }

    const connection: WebSocketConnection = {
      matchId,
      league,
      socket: null,
      reconnectAttempts: 0,
      reconnectTimeout: null,
      heartbeatInterval: null,
      lastHeartbeat: null,
      isConnecting: true,
      priority,
    };

    this.connections.set(matchId, connection);
    this.notifyStatus();

    try {
      const url = this.getWebSocketUrl(matchId, league);
      const socket = new WebSocket(url);

      socket.onopen = () => this.handleOpen(matchId);
      socket.onmessage = (event) => this.handleMessage(matchId, event);
      socket.onclose = (event) => this.handleClose(matchId, event);
      socket.onerror = (error) => this.handleError(matchId, error);

      connection.socket = socket;
    } catch (error) {
      console.warn(`[WebSocket] Failed to connect for ${matchId}:`, error);
      connection.isConnecting = false;
      this.scheduleReconnect(matchId);
    }
  }

  /**
   * Disconnect from a match
   */
  private disconnect(matchId: string): void {
    const connection = this.connections.get(matchId);
    if (!connection) return;

    if (connection.heartbeatInterval) {
      clearInterval(connection.heartbeatInterval);
    }
    if (connection.reconnectTimeout) {
      clearTimeout(connection.reconnectTimeout);
    }
    if (connection.socket) {
      connection.socket.close();
    }

    this.connections.delete(matchId);
    this.notifyStatus();
  }

  /**
   * Handle WebSocket open
   */
  private handleOpen(matchId: string): void {
    const connection = this.connections.get(matchId);
    if (!connection) return;

    console.log(`[WebSocket] Connected to ${matchId}`);
    connection.isConnecting = false;
    connection.reconnectAttempts = 0;
    connection.lastHeartbeat = new Date();

    // Start heartbeat
    connection.heartbeatInterval = setInterval(
      () => this.sendHeartbeat(matchId),
      WEBSOCKET_CONFIG.HEARTBEAT_INTERVAL
    );

    this.notifyStatus();
  }

  /**
   * Handle incoming message
   */
  private handleMessage(matchId: string, event: MessageEvent): void {
    const connection = this.connections.get(matchId);
    if (!connection) return;

    connection.lastHeartbeat = new Date();

    try {
      const data = JSON.parse(event.data);
      
      // Handle different message types
      if (data.type === 'heartbeat') {
        return; // Just update lastHeartbeat
      }

      if (data.type === 'score_update') {
        const liveScore = this.parseScoreUpdate(matchId, connection.league, data);
        
        // Notify all handlers for this match
        const handlers = this.messageHandlers.get(matchId) || [];
        handlers.forEach(handler => handler(liveScore));
      }
    } catch (error) {
      console.warn(`[WebSocket] Failed to parse message for ${matchId}:`, error);
    }
  }

  /**
   * Parse score update from WebSocket message
   */
  private parseScoreUpdate(matchId: string, league: League, data: any): LiveScoreData {
    return {
      matchId,
      league,
      score: {
        home: data.homeScore ?? 0,
        away: data.awayScore ?? 0,
      },
      period: data.period || '',
      clock: data.clock || '',
      gameState: data.gameState || 'live',
      possession: data.possession,
      events: (data.events || []).map((e: any): GameEvent => ({
        id: e.id || crypto.randomUUID(),
        type: e.type || 'other',
        team: e.team || 'home',
        time: e.time || '',
        period: e.period || '',
        player: e.player,
        description: e.description || '',
        timestamp: e.timestamp || new Date().toISOString(),
      })),
      lastUpdate: new Date().toISOString(),
      updateType: data.updateType || 'full',
      changedFields: data.changedFields || [],
      source: 'websocket',
      isStale: false,
      connectionQuality: 'good',
    };
  }

  /**
   * Handle WebSocket close
   */
  private handleClose(matchId: string, event: CloseEvent): void {
    const connection = this.connections.get(matchId);
    if (!connection) return;

    console.log(`[WebSocket] Disconnected from ${matchId}: ${event.code}`);
    
    if (connection.heartbeatInterval) {
      clearInterval(connection.heartbeatInterval);
      connection.heartbeatInterval = null;
    }

    connection.socket = null;
    connection.isConnecting = false;

    // Only reconnect if we still have handlers
    if (this.messageHandlers.has(matchId)) {
      this.scheduleReconnect(matchId);
    } else {
      this.connections.delete(matchId);
    }

    this.notifyStatus();
  }

  /**
   * Handle WebSocket error
   */
  private handleError(matchId: string, error: Event): void {
    console.warn(`[WebSocket] Error for ${matchId}:`, error);
    
    const connection = this.connections.get(matchId);
    if (connection) {
      connection.isConnecting = false;
    }

    // Notify error handlers
    this.errorHandlers.forEach(handler => 
      handler(new Error('WebSocket connection error'), matchId)
    );
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(matchId: string): void {
    const connection = this.connections.get(matchId);
    if (!connection) return;

    if (connection.reconnectAttempts >= BACKOFF_CONFIG.MAX_RETRIES) {
      console.log(`[WebSocket] Max retries reached for ${matchId}, falling back to polling`);
      this.connections.delete(matchId);
      this.notifyStatus();
      return;
    }

    const delay = BACKOFF_CONFIG.INITIAL_DELAY * Math.pow(
      BACKOFF_CONFIG.MULTIPLIER,
      connection.reconnectAttempts
    );
    const actualDelay = Math.min(delay, BACKOFF_CONFIG.MAX_DELAY);

    console.log(`[WebSocket] Reconnecting to ${matchId} in ${actualDelay}ms (attempt ${connection.reconnectAttempts + 1})`);

    connection.reconnectTimeout = setTimeout(() => {
      connection.reconnectAttempts++;
      this.connect(matchId, connection.league, connection.priority);
    }, actualDelay);
  }

  /**
   * Send heartbeat to keep connection alive
   */
  private sendHeartbeat(matchId: string): void {
    const connection = this.connections.get(matchId);
    if (!connection?.socket || connection.socket.readyState !== WebSocket.OPEN) return;

    try {
      connection.socket.send(JSON.stringify({ type: 'heartbeat' }));
    } catch (error) {
      console.warn(`[WebSocket] Failed to send heartbeat for ${matchId}`);
    }
  }

  /**
   * Queue connection for when slots become available
   */
  private queueConnection(matchId: string, league: League, priority: number): void {
    // Don't queue if already queued
    if (this.connectionQueue.some(c => c.matchId === matchId)) return;

    this.connectionQueue.push({ matchId, league, priority });
    // Sort by priority (higher priority = lower number = first)
    this.connectionQueue.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Process connection queue
   */
  private processQueue(): void {
    while (
      this.connectionQueue.length > 0 &&
      this.connections.size < WEBSOCKET_CONFIG.MAX_CONNECTIONS
    ) {
      const next = this.connectionQueue.shift();
      if (next && this.messageHandlers.has(next.matchId)) {
        this.connect(next.matchId, next.league, next.priority);
      }
    }
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    const activeConnections = Array.from(this.connections.values()).filter(
      c => c.socket?.readyState === WebSocket.OPEN
    );

    const recentHeartbeats = activeConnections.filter(
      c => c.lastHeartbeat && 
           Date.now() - c.lastHeartbeat.getTime() < WEBSOCKET_CONFIG.HEARTBEAT_INTERVAL * 2
    );

    let quality: ConnectionStatus['quality'] = 'disconnected';
    if (activeConnections.length > 0) {
      const healthRatio = recentHeartbeats.length / activeConnections.length;
      if (healthRatio >= 0.9) quality = 'good';
      else if (healthRatio >= 0.5) quality = 'degraded';
      else quality = 'poor';
    }

    return {
      type: 'websocket',
      isConnected: activeConnections.length > 0,
      lastHeartbeat: activeConnections[0]?.lastHeartbeat?.toISOString() || null,
      reconnectAttempts: Math.max(...Array.from(this.connections.values()).map(c => c.reconnectAttempts), 0),
      quality,
      activeConnections: activeConnections.length,
      maxConnections: WEBSOCKET_CONFIG.MAX_CONNECTIONS,
    };
  }

  /**
   * Check if a match has an active WebSocket connection
   */
  hasConnection(matchId: string): boolean {
    const connection = this.connections.get(matchId);
    return connection?.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Add status change handler
   */
  onStatusChange(handler: ConnectionStatusHandler): () => void {
    this.statusHandlers.push(handler);
    return () => {
      const index = this.statusHandlers.indexOf(handler);
      if (index > -1) this.statusHandlers.splice(index, 1);
    };
  }

  /**
   * Add error handler
   */
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.push(handler);
    return () => {
      const index = this.errorHandlers.indexOf(handler);
      if (index > -1) this.errorHandlers.splice(index, 1);
    };
  }

  /**
   * Notify all status handlers
   */
  private notifyStatus(): void {
    const status = this.getStatus();
    this.statusHandlers.forEach(handler => handler(status));
  }

  /**
   * Enable/disable WebSocket connections
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      // Disconnect all
      for (const matchId of this.connections.keys()) {
        this.disconnect(matchId);
      }
    }
  }

  /**
   * Disconnect all connections
   */
  disconnectAll(): void {
    for (const matchId of this.connections.keys()) {
      this.disconnect(matchId);
    }
    this.connectionQueue = [];
  }
}

// Singleton instance
export const liveScoreWebSocket = new LiveScoreWebSocketService();

export default liveScoreWebSocket;
