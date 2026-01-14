/**
 * Live Score Monitoring Service
 * 
 * Tracks performance metrics for the tiered live score system:
 * - Request counts by league tier
 * - Cache hit rates
 * - Polling frequency
 * - WebSocket connection status
 * - Error rates and latency
 */

import { League } from '@/types/sports';
import { getLeagueTier } from '@/config/live-scores';

export interface PollingMetrics {
  requestCount: number;
  successCount: number;
  errorCount: number;
  totalLatency: number;
  lastRequest: Date | null;
  avgLatency: number;
  successRate: number;
}

export interface TierMetrics {
  tier: 1 | 2 | 3;
  leagues: League[];
  activeMatches: number;
  requestsPerMinute: number;
  avgInterval: number;
  metrics: PollingMetrics;
}

export interface WebSocketMetrics {
  activeConnections: number;
  maxConnections: number;
  messagesReceived: number;
  reconnectAttempts: number;
  fallbacksToPolling: number;
  connectionUptime: number;
  lastMessage: Date | null;
}

export interface StaleDataMetrics {
  staleCount: number;
  totalMatches: number;
  staleRate: number;
  oldestUpdate: Date | null;
  avgDataAge: number;
}

export interface LiveScoreMonitoringStats {
  timestamp: Date;
  uptime: number;
  polling: {
    tier1: TierMetrics;
    tier2: TierMetrics;
    tier3: TierMetrics;
    total: PollingMetrics;
  };
  websocket: WebSocketMetrics;
  staleData: StaleDataMetrics;
  requestsPerMinute: number;
  bandwidthSaved: number; // Estimated bytes saved through tiered polling
  recommendations: string[];
}

type MetricsListener = (stats: LiveScoreMonitoringStats) => void;

class LiveScoreMonitoringService {
  private startTime: Date = new Date();
  private listeners: MetricsListener[] = [];
  private updateInterval: ReturnType<typeof setInterval> | null = null;

  // Request tracking
  private requestLog: Array<{
    timestamp: Date;
    league: League;
    tier: 1 | 2 | 3;
    success: boolean;
    latency: number;
  }> = [];

  // WebSocket tracking
  private wsMetrics: WebSocketMetrics = {
    activeConnections: 0,
    maxConnections: 3,
    messagesReceived: 0,
    reconnectAttempts: 0,
    fallbacksToPolling: 0,
    connectionUptime: 0,
    lastMessage: null,
  };

  // Stale data tracking
  private matchUpdates: Map<string, Date> = new Map();
  private activeMatches: Map<string, { league: League; tier: 1 | 2 | 3 }> = new Map();

  // Keep only last 5 minutes of data
  private readonly LOG_RETENTION_MS = 5 * 60 * 1000;
  private readonly UPDATE_INTERVAL_MS = 1000;

  constructor() {
    this.startPeriodicCleanup();
  }

  /**
   * Start the monitoring service
   */
  start(): void {
    if (this.updateInterval) return;
    
    this.startTime = new Date();
    this.updateInterval = setInterval(() => {
      this.notifyListeners();
    }, this.UPDATE_INTERVAL_MS);

    console.log('[LiveScoreMonitor] Started');
  }

  /**
   * Stop the monitoring service
   */
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    console.log('[LiveScoreMonitor] Stopped');
  }

  /**
   * Record a polling request
   */
  recordRequest(league: League, success: boolean, latencyMs: number): void {
    const tier = getLeagueTier(league);
    this.requestLog.push({
      timestamp: new Date(),
      league,
      tier,
      success,
      latency: latencyMs,
    });
  }

  /**
   * Record a match becoming active/inactive
   */
  recordMatchState(matchId: string, league: League, isActive: boolean): void {
    if (isActive) {
      const tier = getLeagueTier(league);
      this.activeMatches.set(matchId, { league, tier });
    } else {
      this.activeMatches.delete(matchId);
    }
  }

  /**
   * Record a score update timestamp
   */
  recordScoreUpdate(matchId: string): void {
    this.matchUpdates.set(matchId, new Date());
  }

  /**
   * Record WebSocket metrics
   */
  recordWebSocketEvent(event: 'connect' | 'disconnect' | 'message' | 'reconnect' | 'fallback'): void {
    switch (event) {
      case 'connect':
        this.wsMetrics.activeConnections++;
        break;
      case 'disconnect':
        this.wsMetrics.activeConnections = Math.max(0, this.wsMetrics.activeConnections - 1);
        break;
      case 'message':
        this.wsMetrics.messagesReceived++;
        this.wsMetrics.lastMessage = new Date();
        break;
      case 'reconnect':
        this.wsMetrics.reconnectAttempts++;
        break;
      case 'fallback':
        this.wsMetrics.fallbacksToPolling++;
        break;
    }
  }

  /**
   * Update WebSocket connection count
   */
  updateWebSocketConnections(count: number): void {
    this.wsMetrics.activeConnections = count;
  }

  /**
   * Get current monitoring statistics
   */
  getStats(): LiveScoreMonitoringStats {
    this.cleanupOldLogs();

    const now = new Date();
    const uptime = now.getTime() - this.startTime.getTime();
    const oneMinuteAgo = new Date(now.getTime() - 60000);

    // Calculate metrics by tier
    const tier1Metrics = this.calculateTierMetrics(1, oneMinuteAgo);
    const tier2Metrics = this.calculateTierMetrics(2, oneMinuteAgo);
    const tier3Metrics = this.calculateTierMetrics(3, oneMinuteAgo);
    const totalMetrics = this.calculateTotalMetrics();

    // Calculate stale data metrics
    const staleMetrics = this.calculateStaleMetrics();

    // Calculate requests per minute
    const recentRequests = this.requestLog.filter(r => r.timestamp >= oneMinuteAgo);
    const requestsPerMinute = recentRequests.length;

    // Estimate bandwidth saved (compared to polling all at tier 1 rate)
    const bandwidthSaved = this.estimateBandwidthSaved();

    // Generate recommendations
    const recommendations = this.generateRecommendations(tier1Metrics, tier2Metrics, tier3Metrics, staleMetrics);

    return {
      timestamp: now,
      uptime,
      polling: {
        tier1: tier1Metrics,
        tier2: tier2Metrics,
        tier3: tier3Metrics,
        total: totalMetrics,
      },
      websocket: {
        ...this.wsMetrics,
        connectionUptime: this.wsMetrics.activeConnections > 0 ? uptime : 0,
      },
      staleData: staleMetrics,
      requestsPerMinute,
      bandwidthSaved,
      recommendations,
    };
  }

  /**
   * Subscribe to stats updates
   */
  subscribe(listener: MetricsListener): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }

  /**
   * Calculate metrics for a specific tier
   */
  private calculateTierMetrics(tier: 1 | 2 | 3, since: Date): TierMetrics {
    const tierRequests = this.requestLog.filter(r => r.tier === tier && r.timestamp >= since);
    const tierMatches = Array.from(this.activeMatches.entries())
      .filter(([_, data]) => data.tier === tier);

    const leagues = [...new Set(tierMatches.map(([_, data]) => data.league))];
    
    const metrics = this.calculateMetricsFromLogs(tierRequests);

    // Calculate average interval between requests
    let avgInterval = 0;
    if (tierRequests.length > 1) {
      const intervals = tierRequests.slice(1).map((r, i) => 
        r.timestamp.getTime() - tierRequests[i].timestamp.getTime()
      );
      avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }

    return {
      tier,
      leagues,
      activeMatches: tierMatches.length,
      requestsPerMinute: tierRequests.length,
      avgInterval,
      metrics,
    };
  }

  /**
   * Calculate total polling metrics
   */
  private calculateTotalMetrics(): PollingMetrics {
    return this.calculateMetricsFromLogs(this.requestLog);
  }

  /**
   * Calculate metrics from a log subset
   */
  private calculateMetricsFromLogs(logs: typeof this.requestLog): PollingMetrics {
    const successLogs = logs.filter(r => r.success);
    const errorLogs = logs.filter(r => !r.success);
    const totalLatency = successLogs.reduce((sum, r) => sum + r.latency, 0);

    return {
      requestCount: logs.length,
      successCount: successLogs.length,
      errorCount: errorLogs.length,
      totalLatency,
      lastRequest: logs.length > 0 ? logs[logs.length - 1].timestamp : null,
      avgLatency: successLogs.length > 0 ? totalLatency / successLogs.length : 0,
      successRate: logs.length > 0 ? (successLogs.length / logs.length) * 100 : 100,
    };
  }

  /**
   * Calculate stale data metrics
   */
  private calculateStaleMetrics(): StaleDataMetrics {
    const now = new Date();
    const STALE_THRESHOLD = 30000; // 30 seconds

    let staleCount = 0;
    let oldestUpdate: Date | null = null;
    let totalAge = 0;

    for (const [matchId, lastUpdate] of this.matchUpdates.entries()) {
      if (!this.activeMatches.has(matchId)) continue;

      const age = now.getTime() - lastUpdate.getTime();
      totalAge += age;

      if (age > STALE_THRESHOLD) {
        staleCount++;
      }

      if (!oldestUpdate || lastUpdate < oldestUpdate) {
        oldestUpdate = lastUpdate;
      }
    }

    const totalMatches = this.activeMatches.size;

    return {
      staleCount,
      totalMatches,
      staleRate: totalMatches > 0 ? (staleCount / totalMatches) * 100 : 0,
      oldestUpdate,
      avgDataAge: totalMatches > 0 ? totalAge / totalMatches : 0,
    };
  }

  /**
   * Estimate bandwidth saved through tiered polling
   */
  private estimateBandwidthSaved(): number {
    const ESTIMATED_RESPONSE_SIZE = 2048; // bytes per response
    const TIER_1_INTERVAL = 10000;
    
    // Calculate what total requests would be at tier 1 rate
    const uptime = Date.now() - this.startTime.getTime();
    const totalMatches = this.activeMatches.size;
    const theoreticalRequestsAtTier1 = Math.floor(uptime / TIER_1_INTERVAL) * totalMatches;
    
    // Actual requests made
    const actualRequests = this.requestLog.length;
    
    // Bandwidth saved
    return Math.max(0, (theoreticalRequestsAtTier1 - actualRequests) * ESTIMATED_RESPONSE_SIZE);
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    tier1: TierMetrics,
    tier2: TierMetrics,
    tier3: TierMetrics,
    stale: StaleDataMetrics
  ): string[] {
    const recommendations: string[] = [];

    // High error rate warning
    if (tier1.metrics.successRate < 90) {
      recommendations.push('⚠️ Tier 1 error rate is high. Consider checking API health.');
    }
    if (tier2.metrics.successRate < 90) {
      recommendations.push('⚠️ Tier 2 error rate is high. Consider checking API health.');
    }

    // Stale data warning
    if (stale.staleRate > 20) {
      recommendations.push(`⚠️ ${stale.staleRate.toFixed(0)}% of matches have stale data. Consider reducing poll intervals.`);
    }

    // WebSocket recommendations
    if (this.wsMetrics.fallbacksToPolling > 5) {
      recommendations.push('⚠️ Multiple WebSocket fallbacks. Network may be unstable.');
    }

    // High latency warning
    if (tier1.metrics.avgLatency > 2000) {
      recommendations.push(`⚠️ Tier 1 avg latency is ${tier1.metrics.avgLatency.toFixed(0)}ms. API may be slow.`);
    }

    // Success message
    if (recommendations.length === 0 && this.requestLog.length > 10) {
      recommendations.push('✅ All systems operating normally.');
    }

    return recommendations;
  }

  /**
   * Clean up old log entries
   */
  private cleanupOldLogs(): void {
    const cutoff = new Date(Date.now() - this.LOG_RETENTION_MS);
    this.requestLog = this.requestLog.filter(r => r.timestamp >= cutoff);
  }

  /**
   * Start periodic cleanup
   */
  private startPeriodicCleanup(): void {
    setInterval(() => this.cleanupOldLogs(), 60000);
  }

  /**
   * Notify all listeners of updated stats
   */
  private notifyListeners(): void {
    const stats = this.getStats();
    this.listeners.forEach(listener => listener(stats));
  }

  /**
   * Reset all metrics (for testing)
   */
  reset(): void {
    this.startTime = new Date();
    this.requestLog = [];
    this.matchUpdates.clear();
    this.activeMatches.clear();
    this.wsMetrics = {
      activeConnections: 0,
      maxConnections: 3,
      messagesReceived: 0,
      reconnectAttempts: 0,
      fallbacksToPolling: 0,
      connectionUptime: 0,
      lastMessage: null,
    };
  }

  /**
   * Export metrics for debugging
   */
  exportMetrics(): object {
    return {
      stats: this.getStats(),
      requestLog: this.requestLog.slice(-100), // Last 100 requests
      activeMatches: Array.from(this.activeMatches.entries()),
    };
  }
}

// Singleton instance
export const liveScoreMonitor = new LiveScoreMonitoringService();

export default liveScoreMonitor;
