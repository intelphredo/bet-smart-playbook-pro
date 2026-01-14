import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MatchCard } from '../MatchCard';
import { UnifiedGame } from '@/hooks/useGames';

// Mock the sportsbook utils
vi.mock('@/utils/sportsbook', () => ({
  getPrimaryOdds: vi.fn().mockReturnValue(null),
  formatMoneylineOdds: vi.fn((odds) => odds > 0 ? `+${odds}` : `${odds}`),
  PRIMARY_SPORTSBOOK: 'fanduel',
}));

// Mock matchStatus utilities
vi.mock('@/utils/matchStatus', () => ({
  isMatchLive: vi.fn((status) => status === 'live' || status === 'in'),
  isMatchFinished: vi.fn((status) => status === 'finished' || status === 'post'),
}));

// Mock LiveScoresContext
const mockGetUpdatedScore = vi.fn();
const mockGetPeriod = vi.fn();
const mockIsStale = vi.fn();
const mockGetLastUpdate = vi.fn();
const mockHasLiveData = vi.fn();

vi.mock('@/providers/LiveScoresProvider', () => ({
  useLiveScoresContext: () => ({
    getUpdatedScore: mockGetUpdatedScore,
    getPeriod: mockGetPeriod,
    isStale: mockIsStale,
    getLastUpdate: mockGetLastUpdate,
    hasLiveData: mockHasLiveData,
    getScore: vi.fn(),
    connectionStatus: {
      type: 'polling',
      isConnected: true,
      lastHeartbeat: null,
      reconnectAttempts: 0,
      quality: 'good',
      activeConnections: 0,
      maxConnections: 3,
    },
    refresh: vi.fn(),
    stats: { activePolling: 0, activeWebSocket: 0, staleCount: 0, errorCount: 0 },
    subscriptions: new Map(),
    isLoading: false,
  }),
}));

// Mock LiveScoreIndicators
vi.mock('@/components/ui/LiveScoreIndicators', () => ({
  LivePulse: ({ isLive, showLabel }: { isLive: boolean; showLabel?: boolean }) => 
    isLive ? <span data-testid="live-pulse">{showLabel && 'Live'}</span> : null,
  StaleDataWarning: ({ lastUpdate }: { lastUpdate: string | null }) =>
    lastUpdate ? <span data-testid="stale-warning">Stale</span> : null,
}));

const createMockGame = (overrides: Partial<UnifiedGame> = {}): UnifiedGame => ({
  id: 'test-game-1',
  homeTeam: 'Lakers',
  awayTeam: 'Celtics',
  startTime: '2024-01-15T19:00:00Z',
  status: 'scheduled',
  league: 'NBA',
  source: 'espn',
  lastUpdated: new Date().toISOString(),
  ...overrides,
});

describe('MatchCard with Live Scores Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUpdatedScore.mockReturnValue({ home: 0, away: 0 });
    mockGetPeriod.mockReturnValue('');
    mockIsStale.mockReturnValue(false);
    mockGetLastUpdate.mockReturnValue(null);
    mockHasLiveData.mockReturnValue(false);
  });

  describe('rendering with live scores', () => {
    it('displays live score from context when available', () => {
      mockGetUpdatedScore.mockReturnValue({ home: 85, away: 78 });
      mockHasLiveData.mockReturnValue(true);
      
      const game = createMockGame({ status: 'live' });
      const { getByText } = render(<MatchCard game={game} />);

      expect(getByText('85')).toBeInTheDocument();
      expect(getByText('78')).toBeInTheDocument();
    });

    it('displays period from context when available', () => {
      mockGetUpdatedScore.mockReturnValue({ home: 85, away: 78 });
      mockGetPeriod.mockReturnValue('3rd Quarter 5:30');
      mockHasLiveData.mockReturnValue(true);
      
      const game = createMockGame({ status: 'live' });
      const { getByText } = render(<MatchCard game={game} />);

      expect(getByText('3rd Quarter 5:30')).toBeInTheDocument();
    });

    it('shows LIVE DATA badge when live data is available', () => {
      mockHasLiveData.mockReturnValue(true);
      
      const game = createMockGame({ status: 'live' });
      const { getByText } = render(<MatchCard game={game} />);

      expect(getByText('LIVE DATA')).toBeInTheDocument();
    });

    it('does not show LIVE DATA badge when no live data', () => {
      mockHasLiveData.mockReturnValue(false);
      
      const game = createMockGame({ status: 'live' });
      const { queryByText } = render(<MatchCard game={game} />);

      expect(queryByText('LIVE DATA')).not.toBeInTheDocument();
    });
  });

  describe('stale data handling', () => {
    it('shows stale warning when data is stale', () => {
      mockIsStale.mockReturnValue(true);
      mockGetLastUpdate.mockReturnValue('2024-01-15T19:00:00Z');
      
      const game = createMockGame({ status: 'live' });
      const { getByTestId } = render(<MatchCard game={game} />);

      expect(getByTestId('stale-warning')).toBeInTheDocument();
    });

    it('does not show stale warning when data is fresh', () => {
      mockIsStale.mockReturnValue(false);
      
      const game = createMockGame({ status: 'live' });
      const { queryByTestId } = render(<MatchCard game={game} />);

      expect(queryByTestId('stale-warning')).not.toBeInTheDocument();
    });

    it('does not show stale warning for non-live games', () => {
      mockIsStale.mockReturnValue(true);
      mockGetLastUpdate.mockReturnValue('2024-01-15T19:00:00Z');
      
      const game = createMockGame({ status: 'scheduled' });
      const { queryByTestId } = render(<MatchCard game={game} />);

      expect(queryByTestId('stale-warning')).not.toBeInTheDocument();
    });
  });

  describe('live pulse indicator', () => {
    it('shows live pulse for live games', () => {
      const game = createMockGame({ status: 'live' });
      const { getByTestId } = render(<MatchCard game={game} />);

      expect(getByTestId('live-pulse')).toBeInTheDocument();
    });

    it('does not show live pulse for scheduled games', () => {
      const game = createMockGame({ status: 'scheduled' });
      const { queryByTestId } = render(<MatchCard game={game} />);

      expect(queryByTestId('live-pulse')).not.toBeInTheDocument();
    });

    it('does not show live pulse for finished games', () => {
      const game = createMockGame({ status: 'finished' });
      const { queryByTestId } = render(<MatchCard game={game} />);

      expect(queryByTestId('live-pulse')).not.toBeInTheDocument();
    });
  });

  describe('last update timestamp', () => {
    it('displays live data last update time when available', () => {
      const liveTimestamp = '2024-01-15T20:30:00Z';
      mockGetLastUpdate.mockReturnValue(liveTimestamp);
      
      const game = createMockGame();
      const { getByText } = render(<MatchCard game={game} />);

      // Check that the time is displayed (format depends on locale)
      expect(getByText(/Last updated:/)).toBeInTheDocument();
    });

    it('falls back to game.lastUpdated when no live update', () => {
      mockGetLastUpdate.mockReturnValue(null);
      
      const game = createMockGame();
      const { getByText } = render(<MatchCard game={game} />);

      expect(getByText(/Last updated:/)).toBeInTheDocument();
    });
  });

  describe('score styling', () => {
    it('applies live styling to scores during live games', () => {
      mockGetUpdatedScore.mockReturnValue({ home: 85, away: 78 });
      
      const game = createMockGame({ status: 'live' });
      const { container } = render(<MatchCard game={game} />);

      // Check for text-red-500 class on live scores
      const liveScores = container.querySelectorAll('.text-red-500');
      expect(liveScores.length).toBeGreaterThan(0);
    });

    it('applies winner styling for finished games', () => {
      mockGetUpdatedScore.mockReturnValue({ home: 100, away: 95 });
      
      const game = createMockGame({ status: 'finished' });
      const { container } = render(<MatchCard game={game} />);

      // Winner should have green styling
      const winnerScore = container.querySelectorAll('.text-green-500');
      expect(winnerScore.length).toBeGreaterThan(0);
    });
  });

  describe('context integration', () => {
    it('calls getUpdatedScore with correct parameters', () => {
      const game = createMockGame({
        score: { home: 50, away: 45 },
      });
      
      render(<MatchCard game={game} />);

      expect(mockGetUpdatedScore).toHaveBeenCalledWith(
        'test-game-1',
        { home: 50, away: 45 }
      );
    });

    it('calls getPeriod with correct parameters', () => {
      const game = createMockGame({
        score: { home: 50, away: 45, period: 'Q2' },
      });
      
      render(<MatchCard game={game} />);

      expect(mockGetPeriod).toHaveBeenCalledWith('test-game-1', 'Q2');
    });

    it('calls isStale with match ID', () => {
      const game = createMockGame();
      
      render(<MatchCard game={game} />);

      expect(mockIsStale).toHaveBeenCalledWith('test-game-1');
    });

    it('calls hasLiveData with match ID', () => {
      const game = createMockGame();
      
      render(<MatchCard game={game} />);

      expect(mockHasLiveData).toHaveBeenCalledWith('test-game-1');
    });
  });
});
