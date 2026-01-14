import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, renderHook, act } from '@testing-library/react';
import { LiveScoresProvider, useLiveScoresContext, useMatchLiveScore } from '../LiveScoresProvider';
import { Match } from '@/types/sports';
import { LiveScoreData } from '@/types/live-scores';

// Mock useLiveScores hook
const mockScores = new Map<string, LiveScoreData>();
const mockRefresh = vi.fn();
const mockUseLiveScores = vi.fn().mockReturnValue({
  scores: mockScores,
  isLoading: false,
  error: null,
  connectionStatus: {
    type: 'polling' as const,
    isConnected: true,
    lastHeartbeat: new Date().toISOString(),
    reconnectAttempts: 0,
    quality: 'good' as const,
    activeConnections: 0,
    maxConnections: 3,
  },
  subscriptions: new Map(),
  refresh: mockRefresh,
  lastUpdate: new Date(),
  stats: {
    activePolling: 2,
    activeWebSocket: 0,
    staleCount: 0,
    errorCount: 0,
  },
});

vi.mock('@/hooks/useLiveScores', () => ({
  useLiveScores: (options: unknown) => mockUseLiveScores(options),
}));

// Helper to create mock match
const createMockMatch = (overrides: Partial<Match> = {}): Match => ({
  id: 'match-1',
  homeTeam: { id: 'lal', name: 'Los Angeles Lakers', shortName: 'LAL', logo: '' },
  awayTeam: { id: 'bos', name: 'Boston Celtics', shortName: 'BOS', logo: '' },
  startTime: '2024-01-15T19:00:00Z',
  status: 'live',
  league: 'NBA',
  odds: { homeWin: -150, awayWin: 130 },
  prediction: {
    recommended: 'home',
    confidence: 65,
    projectedScore: { home: 110, away: 105 },
  },
  ...overrides,
});

// Helper to create mock live score data
const createMockLiveScore = (overrides: Partial<LiveScoreData> = {}): LiveScoreData => ({
  matchId: 'match-1',
  league: 'NBA',
  score: { home: 85, away: 78 },
  period: '3rd Quarter',
  clock: '5:30',
  gameState: 'live',
  events: [],
  lastUpdate: new Date().toISOString(),
  updateType: 'full',
  changedFields: [],
  source: 'polling',
  isStale: false,
  connectionQuality: 'good',
  ...overrides,
});

describe('LiveScoresProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockScores.clear();
  });

  describe('rendering', () => {
    it('renders children correctly', () => {
      const { getByText } = render(
        <LiveScoresProvider matches={[createMockMatch()]}>
          <div>Test Child</div>
        </LiveScoresProvider>
      );

      expect(getByText('Test Child')).toBeInTheDocument();
    });

    it('passes matches to useLiveScores', () => {
      const matches = [createMockMatch(), createMockMatch({ id: 'match-2' })];
      
      render(
        <LiveScoresProvider matches={matches}>
          <div>Test</div>
        </LiveScoresProvider>
      );

      expect(mockUseLiveScores).toHaveBeenCalledWith(
        expect.objectContaining({
          matches,
          enabled: true,
          useWebSocket: true,
        })
      );
    });

    it('passes matchesWithBets to useLiveScores', () => {
      const matches = [createMockMatch()];
      const matchesWithBets = ['match-1'];
      
      render(
        <LiveScoresProvider matches={matches} matchesWithBets={matchesWithBets}>
          <div>Test</div>
        </LiveScoresProvider>
      );

      expect(mockUseLiveScores).toHaveBeenCalledWith(
        expect.objectContaining({
          matchesWithBets,
        })
      );
    });

    it('respects enabled prop', () => {
      const matches = [createMockMatch()];
      
      render(
        <LiveScoresProvider matches={matches} enabled={false}>
          <div>Test</div>
        </LiveScoresProvider>
      );

      expect(mockUseLiveScores).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        })
      );
    });
  });

  describe('onScoreChange callback', () => {
    it('passes onScoreChange to useLiveScores', () => {
      const onScoreChange = vi.fn();
      const matches = [createMockMatch()];
      
      render(
        <LiveScoresProvider matches={matches} onScoreChange={onScoreChange}>
          <div>Test</div>
        </LiveScoresProvider>
      );

      expect(mockUseLiveScores).toHaveBeenCalledWith(
        expect.objectContaining({
          onScoreChange,
        })
      );
    });
  });
});

describe('useLiveScoresContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockScores.clear();
  });

  describe('when used outside provider', () => {
    it('returns noop implementation', () => {
      const { result } = renderHook(() => useLiveScoresContext());

      expect(result.current.getScore('any-id')).toBeUndefined();
      expect(result.current.hasLiveData('any-id')).toBe(false);
      expect(result.current.getUpdatedScore('any-id', { home: 10, away: 5 })).toEqual({ home: 10, away: 5 });
      expect(result.current.getPeriod('any-id', 'Q1')).toBe('Q1');
      expect(result.current.isStale('any-id')).toBe(false);
      expect(result.current.getLastUpdate('any-id')).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('returns default connection status', () => {
      const { result } = renderHook(() => useLiveScoresContext());

      expect(result.current.connectionStatus.type).toBe('polling');
      expect(result.current.connectionStatus.isConnected).toBe(false);
      expect(result.current.connectionStatus.quality).toBe('disconnected');
    });
  });

  describe('when used inside provider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LiveScoresProvider matches={[createMockMatch()]}>
        {children}
      </LiveScoresProvider>
    );

    it('returns live score data for known match', () => {
      const liveScore = createMockLiveScore();
      mockScores.set('match-1', liveScore);

      const { result } = renderHook(() => useLiveScoresContext(), { wrapper });

      expect(result.current.getScore('match-1')).toEqual(liveScore);
    });

    it('returns undefined for unknown match', () => {
      const { result } = renderHook(() => useLiveScoresContext(), { wrapper });

      expect(result.current.getScore('unknown-match')).toBeUndefined();
    });

    it('hasLiveData returns true for tracked match', () => {
      mockScores.set('match-1', createMockLiveScore());

      const { result } = renderHook(() => useLiveScoresContext(), { wrapper });

      expect(result.current.hasLiveData('match-1')).toBe(true);
      expect(result.current.hasLiveData('unknown')).toBe(false);
    });

    it('getUpdatedScore returns live score when available', () => {
      mockScores.set('match-1', createMockLiveScore({ score: { home: 100, away: 95 } }));

      const { result } = renderHook(() => useLiveScoresContext(), { wrapper });

      expect(result.current.getUpdatedScore('match-1', { home: 50, away: 45 })).toEqual({
        home: 100,
        away: 95,
      });
    });

    it('getUpdatedScore returns original when no live data', () => {
      const { result } = renderHook(() => useLiveScoresContext(), { wrapper });

      expect(result.current.getUpdatedScore('unknown', { home: 50, away: 45 })).toEqual({
        home: 50,
        away: 45,
      });
    });

    it('getUpdatedScore returns zeros when no data', () => {
      const { result } = renderHook(() => useLiveScoresContext(), { wrapper });

      expect(result.current.getUpdatedScore('unknown')).toEqual({ home: 0, away: 0 });
    });

    it('getPeriod returns live period with clock', () => {
      mockScores.set('match-1', createMockLiveScore({ period: 'Q3', clock: '5:30' }));

      const { result } = renderHook(() => useLiveScoresContext(), { wrapper });

      expect(result.current.getPeriod('match-1', 'Q1')).toBe('Q3 5:30');
    });

    it('getPeriod returns period without clock if not available', () => {
      mockScores.set('match-1', createMockLiveScore({ period: 'Halftime', clock: '' }));

      const { result } = renderHook(() => useLiveScoresContext(), { wrapper });

      expect(result.current.getPeriod('match-1', 'Q1')).toBe('Halftime');
    });

    it('getPeriod returns original when no live data', () => {
      const { result } = renderHook(() => useLiveScoresContext(), { wrapper });

      expect(result.current.getPeriod('unknown', 'Q2')).toBe('Q2');
    });

    it('isStale returns correct stale status', () => {
      mockScores.set('match-1', createMockLiveScore({ isStale: true }));
      mockScores.set('match-2', createMockLiveScore({ matchId: 'match-2', isStale: false }));

      const { result } = renderHook(() => useLiveScoresContext(), { wrapper });

      expect(result.current.isStale('match-1')).toBe(true);
      expect(result.current.isStale('match-2')).toBe(false);
      expect(result.current.isStale('unknown')).toBe(false);
    });

    it('getLastUpdate returns timestamp', () => {
      const timestamp = '2024-01-15T19:30:00Z';
      mockScores.set('match-1', createMockLiveScore({ lastUpdate: timestamp }));

      const { result } = renderHook(() => useLiveScoresContext(), { wrapper });

      expect(result.current.getLastUpdate('match-1')).toBe(timestamp);
      expect(result.current.getLastUpdate('unknown')).toBeNull();
    });

    it('refresh calls underlying refresh function', () => {
      const { result } = renderHook(() => useLiveScoresContext(), { wrapper });

      result.current.refresh();

      expect(mockRefresh).toHaveBeenCalled();
    });

    it('exposes stats correctly', () => {
      const { result } = renderHook(() => useLiveScoresContext(), { wrapper });

      expect(result.current.stats).toEqual({
        activePolling: 2,
        activeWebSocket: 0,
        staleCount: 0,
        errorCount: 0,
      });
    });
  });
});

describe('useMatchLiveScore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockScores.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <LiveScoresProvider matches={[createMockMatch()]}>
      {children}
    </LiveScoresProvider>
  );

  it('returns live score data for specific match', () => {
    const liveScore = createMockLiveScore();
    mockScores.set('match-1', liveScore);

    const { result } = renderHook(() => useMatchLiveScore('match-1'), { wrapper });

    expect(result.current.liveScore).toEqual(liveScore);
    expect(result.current.hasLiveData).toBe(true);
    expect(result.current.isStale).toBe(false);
    expect(result.current.lastUpdate).toBe(liveScore.lastUpdate);
  });

  it('returns empty state for unknown match', () => {
    const { result } = renderHook(() => useMatchLiveScore('unknown'), { wrapper });

    expect(result.current.liveScore).toBeUndefined();
    expect(result.current.hasLiveData).toBe(false);
    expect(result.current.isStale).toBe(false);
    expect(result.current.lastUpdate).toBeNull();
  });

  it('reflects stale data status', () => {
    mockScores.set('match-1', createMockLiveScore({ isStale: true }));

    const { result } = renderHook(() => useMatchLiveScore('match-1'), { wrapper });

    expect(result.current.isStale).toBe(true);
  });
});
