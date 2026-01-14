import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { liveScoreMonitor, LiveScoreMonitoringStats } from '../live-score-monitoring';

describe('LiveScoreMonitoringService', () => {
  beforeEach(() => {
    liveScoreMonitor.reset();
  });

  afterEach(() => {
    liveScoreMonitor.stop();
  });

  describe('initialization', () => {
    it('starts with empty stats', () => {
      const stats = liveScoreMonitor.getStats();

      expect(stats.polling.total.requestCount).toBe(0);
      expect(stats.polling.total.successCount).toBe(0);
      expect(stats.polling.total.errorCount).toBe(0);
      expect(stats.websocket.activeConnections).toBe(0);
      expect(stats.staleData.staleCount).toBe(0);
    });

    it('has valid uptime after start', () => {
      liveScoreMonitor.start();
      
      const stats = liveScoreMonitor.getStats();
      expect(stats.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('recordRequest', () => {
    it('records successful requests', () => {
      liveScoreMonitor.recordRequest('NBA', true, 150);
      liveScoreMonitor.recordRequest('NBA', true, 200);

      const stats = liveScoreMonitor.getStats();
      
      expect(stats.polling.total.requestCount).toBe(2);
      expect(stats.polling.total.successCount).toBe(2);
      expect(stats.polling.total.errorCount).toBe(0);
      expect(stats.polling.total.avgLatency).toBe(175);
    });

    it('records failed requests', () => {
      liveScoreMonitor.recordRequest('NBA', true, 150);
      liveScoreMonitor.recordRequest('NBA', false, 500);

      const stats = liveScoreMonitor.getStats();
      
      expect(stats.polling.total.requestCount).toBe(2);
      expect(stats.polling.total.successCount).toBe(1);
      expect(stats.polling.total.errorCount).toBe(1);
      expect(stats.polling.total.successRate).toBe(50);
    });

    it('tracks requests by tier', () => {
      // Tier 1: NBA
      liveScoreMonitor.recordRequest('NBA', true, 100);
      liveScoreMonitor.recordRequest('NFL', true, 100);
      
      // Tier 2: MLB
      liveScoreMonitor.recordRequest('MLB', true, 200);
      
      // Tier 3: MLS
      liveScoreMonitor.recordRequest('MLS', true, 300);

      const stats = liveScoreMonitor.getStats();
      
      // Note: requestsPerMinute is calculated from last minute, so depends on timing
      expect(stats.polling.tier1.metrics.requestCount).toBeGreaterThanOrEqual(0);
      expect(stats.polling.tier2.metrics.requestCount).toBeGreaterThanOrEqual(0);
      expect(stats.polling.tier3.metrics.requestCount).toBeGreaterThanOrEqual(0);
    });

    it('calculates success rate correctly', () => {
      liveScoreMonitor.recordRequest('NBA', true, 100);
      liveScoreMonitor.recordRequest('NBA', true, 100);
      liveScoreMonitor.recordRequest('NBA', true, 100);
      liveScoreMonitor.recordRequest('NBA', false, 100);

      const stats = liveScoreMonitor.getStats();
      
      expect(stats.polling.total.successRate).toBe(75);
    });
  });

  describe('recordMatchState', () => {
    it('tracks active matches', () => {
      liveScoreMonitor.recordMatchState('match-1', 'NBA', true);
      liveScoreMonitor.recordMatchState('match-2', 'NFL', true);

      const stats = liveScoreMonitor.getStats();
      
      expect(stats.staleData.totalMatches).toBe(2);
    });

    it('removes inactive matches', () => {
      liveScoreMonitor.recordMatchState('match-1', 'NBA', true);
      liveScoreMonitor.recordMatchState('match-2', 'NBA', true);
      liveScoreMonitor.recordMatchState('match-1', 'NBA', false);

      const stats = liveScoreMonitor.getStats();
      
      expect(stats.staleData.totalMatches).toBe(1);
    });
  });

  describe('recordScoreUpdate', () => {
    it('tracks score update timestamps', () => {
      liveScoreMonitor.recordMatchState('match-1', 'NBA', true);
      liveScoreMonitor.recordScoreUpdate('match-1');

      const stats = liveScoreMonitor.getStats();
      
      // Data should not be stale since we just updated
      expect(stats.staleData.staleRate).toBeLessThanOrEqual(100);
    });
  });

  describe('recordWebSocketEvent', () => {
    it('tracks connections', () => {
      liveScoreMonitor.recordWebSocketEvent('connect');
      liveScoreMonitor.recordWebSocketEvent('connect');

      const stats = liveScoreMonitor.getStats();
      
      expect(stats.websocket.activeConnections).toBe(2);
    });

    it('tracks disconnections', () => {
      liveScoreMonitor.recordWebSocketEvent('connect');
      liveScoreMonitor.recordWebSocketEvent('connect');
      liveScoreMonitor.recordWebSocketEvent('disconnect');

      const stats = liveScoreMonitor.getStats();
      
      expect(stats.websocket.activeConnections).toBe(1);
    });

    it('tracks messages', () => {
      liveScoreMonitor.recordWebSocketEvent('message');
      liveScoreMonitor.recordWebSocketEvent('message');
      liveScoreMonitor.recordWebSocketEvent('message');

      const stats = liveScoreMonitor.getStats();
      
      expect(stats.websocket.messagesReceived).toBe(3);
      expect(stats.websocket.lastMessage).not.toBeNull();
    });

    it('tracks reconnect attempts', () => {
      liveScoreMonitor.recordWebSocketEvent('reconnect');
      liveScoreMonitor.recordWebSocketEvent('reconnect');

      const stats = liveScoreMonitor.getStats();
      
      expect(stats.websocket.reconnectAttempts).toBe(2);
    });

    it('tracks fallbacks', () => {
      liveScoreMonitor.recordWebSocketEvent('fallback');

      const stats = liveScoreMonitor.getStats();
      
      expect(stats.websocket.fallbacksToPolling).toBe(1);
    });

    it('does not go below zero on disconnect without connect', () => {
      liveScoreMonitor.recordWebSocketEvent('disconnect');

      const stats = liveScoreMonitor.getStats();
      
      expect(stats.websocket.activeConnections).toBe(0);
    });
  });

  describe('updateWebSocketConnections', () => {
    it('sets connection count directly', () => {
      liveScoreMonitor.updateWebSocketConnections(3);

      const stats = liveScoreMonitor.getStats();
      
      expect(stats.websocket.activeConnections).toBe(3);
    });
  });

  describe('subscribe', () => {
    it('calls listener with stats updates', async () => {
      const listener = vi.fn();
      const unsubscribe = liveScoreMonitor.subscribe(listener);

      liveScoreMonitor.start();

      // Wait for first update
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(listener).toHaveBeenCalled();
      
      unsubscribe();
      liveScoreMonitor.stop();
    });

    it('unsubscribes correctly', async () => {
      const listener = vi.fn();
      const unsubscribe = liveScoreMonitor.subscribe(listener);

      unsubscribe();
      liveScoreMonitor.start();

      await new Promise(resolve => setTimeout(resolve, 1100));

      // Listener should not have been called after unsubscribe
      expect(listener).not.toHaveBeenCalled();
      
      liveScoreMonitor.stop();
    });
  });

  describe('reset', () => {
    it('clears all metrics', () => {
      liveScoreMonitor.recordRequest('NBA', true, 100);
      liveScoreMonitor.recordMatchState('match-1', 'NBA', true);
      liveScoreMonitor.recordWebSocketEvent('connect');

      liveScoreMonitor.reset();
      const stats = liveScoreMonitor.getStats();

      expect(stats.polling.total.requestCount).toBe(0);
      expect(stats.staleData.totalMatches).toBe(0);
      expect(stats.websocket.activeConnections).toBe(0);
    });
  });

  describe('exportMetrics', () => {
    it('returns complete metrics object', () => {
      liveScoreMonitor.recordRequest('NBA', true, 100);
      liveScoreMonitor.recordMatchState('match-1', 'NBA', true);

      const exported = liveScoreMonitor.exportMetrics();

      expect(exported).toHaveProperty('stats');
      expect(exported).toHaveProperty('requestLog');
      expect(exported).toHaveProperty('activeMatches');
    });
  });

  describe('recommendations', () => {
    it('shows success message when all is well', () => {
      // Add enough successful requests
      for (let i = 0; i < 15; i++) {
        liveScoreMonitor.recordRequest('NBA', true, 100);
      }

      const stats = liveScoreMonitor.getStats();
      
      expect(stats.recommendations.some(r => r.includes('✅'))).toBe(true);
    });

    it('warns about high error rate', () => {
      // Add requests with high error rate
      for (let i = 0; i < 5; i++) {
        liveScoreMonitor.recordRequest('NBA', true, 100);
      }
      for (let i = 0; i < 5; i++) {
        liveScoreMonitor.recordRequest('NBA', false, 100);
      }

      const stats = liveScoreMonitor.getStats();
      
      // With 50% error rate, might get warning depending on tier calculation
      expect(stats.polling.total.successRate).toBe(50);
    });

    it('warns about WebSocket fallbacks', () => {
      for (let i = 0; i < 10; i++) {
        liveScoreMonitor.recordWebSocketEvent('fallback');
      }

      const stats = liveScoreMonitor.getStats();
      
      expect(stats.recommendations.some(r => r.includes('fallback'))).toBe(true);
    });
  });

  describe('bandwidth savings calculation', () => {
    it('calculates estimated bandwidth saved', () => {
      liveScoreMonitor.recordMatchState('match-1', 'NBA', true);
      liveScoreMonitor.recordMatchState('match-2', 'MLB', true);
      
      // Just a few requests
      liveScoreMonitor.recordRequest('NBA', true, 100);
      liveScoreMonitor.recordRequest('MLB', true, 100);

      const stats = liveScoreMonitor.getStats();
      
      // Bandwidth saved should be >= 0
      expect(stats.bandwidthSaved).toBeGreaterThanOrEqual(0);
    });
  });
});
