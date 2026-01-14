import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ScoreboardStrip } from '../ScoreboardStrip';
import { Match } from '@/types/sports';

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

vi.mock('@/providers/LiveScoresProvider', () => ({
  useLiveScoresContext: () => ({
    getUpdatedScore: mockGetUpdatedScore,
    getPeriod: mockGetPeriod,
    isStale: mockIsStale,
    getLastUpdate: mockGetLastUpdate,
    hasLiveData: vi.fn().mockReturnValue(false),
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
  LivePulse: ({ isLive }: { isLive: boolean }) => 
    isLive ? <span data-testid="live-pulse" /> : null,
  StaleDataWarning: ({ lastUpdate }: { lastUpdate: string | null }) =>
    lastUpdate ? <span data-testid="stale-warning">Stale</span> : null,
}));

// Mock AnimatedScore component
vi.mock('@/components/ui/AnimatedScore', () => ({
  default: ({ score, matchId, teamKey }: { score: number; matchId: string; teamKey: string }) => (
    <span data-testid={`score-${matchId}-${teamKey}`}>{score}</span>
  ),
}));

// Mock TeamLogoImage
vi.mock('@/components/ui/TeamLogoImage', () => ({
  TeamLogoImage: ({ teamName }: { teamName: string }) => (
    <span data-testid={`logo-${teamName}`} />
  ),
}));

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

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ScoreboardStrip with Live Scores Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUpdatedScore.mockReturnValue({ home: 0, away: 0 });
    mockGetPeriod.mockReturnValue('');
    mockIsStale.mockReturnValue(false);
    mockGetLastUpdate.mockReturnValue(null);
  });

  describe('rendering', () => {
    it('renders empty when no matches', () => {
      const { container } = renderWithRouter(<ScoreboardStrip matches={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders score cards for each match', () => {
      const matches = [
        createMockMatch({ id: 'match-1' }),
        createMockMatch({ id: 'match-2' }),
        createMockMatch({ id: 'match-3' }),
      ];

      mockGetUpdatedScore.mockReturnValue({ home: 85, away: 78 });

      const { getAllByTestId } = renderWithRouter(<ScoreboardStrip matches={matches} />);

      expect(getAllByTestId(/^score-match-/)).toHaveLength(6); // 2 scores per match (home + away)
    });
  });

  describe('live score integration', () => {
    it('uses getUpdatedScore from context', () => {
      const match = createMockMatch({ status: 'live' });
      mockGetUpdatedScore.mockReturnValue({ home: 100, away: 95 });

      renderWithRouter(<ScoreboardStrip matches={[match]} />);

      expect(mockGetUpdatedScore).toHaveBeenCalledWith(
        'match-1',
        expect.any(Object)
      );
    });

    it('displays updated scores from live context', () => {
      const match = createMockMatch({ 
        status: 'live',
        score: { home: 50, away: 45 } 
      });
      mockGetUpdatedScore.mockReturnValue({ home: 100, away: 95 });

      const { getByTestId } = renderWithRouter(<ScoreboardStrip matches={[match]} />);

      expect(getByTestId('score-match-1-home')).toHaveTextContent('100');
      expect(getByTestId('score-match-1-away')).toHaveTextContent('95');
    });

    it('uses getPeriod from context', () => {
      const match = createMockMatch({ status: 'live' });
      mockGetPeriod.mockReturnValue('3Q 5:30');

      renderWithRouter(<ScoreboardStrip matches={[match]} />);

      expect(mockGetPeriod).toHaveBeenCalledWith('match-1', undefined);
    });
  });

  describe('stale data handling', () => {
    it('shows stale warning when data is stale', () => {
      const match = createMockMatch({ status: 'live' });
      mockIsStale.mockReturnValue(true);
      mockGetLastUpdate.mockReturnValue('2024-01-15T19:00:00Z');

      const { getByTestId } = renderWithRouter(<ScoreboardStrip matches={[match]} />);

      expect(getByTestId('stale-warning')).toBeInTheDocument();
    });

    it('does not show stale warning when data is fresh', () => {
      const match = createMockMatch({ status: 'live' });
      mockIsStale.mockReturnValue(false);

      const { queryByTestId } = renderWithRouter(<ScoreboardStrip matches={[match]} />);

      expect(queryByTestId('stale-warning')).not.toBeInTheDocument();
    });
  });

  describe('live pulse indicator', () => {
    it('shows live pulse for live matches', () => {
      const match = createMockMatch({ status: 'live' });

      const { getByTestId } = renderWithRouter(<ScoreboardStrip matches={[match]} />);

      expect(getByTestId('live-pulse')).toBeInTheDocument();
    });

    it('does not show live pulse for finished matches', () => {
      const match = createMockMatch({ status: 'finished' });

      const { queryByTestId } = renderWithRouter(<ScoreboardStrip matches={[match]} />);

      expect(queryByTestId('live-pulse')).not.toBeInTheDocument();
    });
  });

  describe('winner determination with live scores', () => {
    it('determines winner using live score data', () => {
      const match = createMockMatch({ status: 'finished' });
      mockGetUpdatedScore.mockReturnValue({ home: 110, away: 105 });

      const { container } = renderWithRouter(<ScoreboardStrip matches={[match]} />);

      // Home team should have winner styling
      const homeTeamRow = container.querySelector('[class*="bg-emerald"]');
      expect(homeTeamRow).toBeInTheDocument();
    });
  });

  describe('period display with live scores', () => {
    it('displays period from live context', () => {
      const match = createMockMatch({ status: 'live' });
      mockGetPeriod.mockReturnValue('4th Quarter');
      mockGetUpdatedScore.mockReturnValue({ home: 95, away: 92 });

      const { getByText } = renderWithRouter(<ScoreboardStrip matches={[match]} />);

      expect(getByText('4th Quarter')).toBeInTheDocument();
    });

    it('shows LIVE when no period available', () => {
      const match = createMockMatch({ status: 'live' });
      mockGetPeriod.mockReturnValue('');

      const { getByText } = renderWithRouter(<ScoreboardStrip matches={[match]} />);

      expect(getByText('LIVE')).toBeInTheDocument();
    });

    it('shows Final for finished matches', () => {
      const match = createMockMatch({ status: 'finished' });

      const { getByText } = renderWithRouter(<ScoreboardStrip matches={[match]} />);

      expect(getByText('Final')).toBeInTheDocument();
    });
  });

  describe('multiple matches with different states', () => {
    it('handles mixed live and finished matches', () => {
      const matches = [
        createMockMatch({ id: 'live-1', status: 'live' }),
        createMockMatch({ id: 'finished-1', status: 'finished' }),
        createMockMatch({ id: 'scheduled-1', status: 'scheduled' }),
      ];

      mockGetUpdatedScore.mockImplementation((matchId) => {
        if (matchId === 'live-1') return { home: 85, away: 80 };
        if (matchId === 'finished-1') return { home: 100, away: 95 };
        return { home: 0, away: 0 };
      });

      const { getAllByTestId, getByText } = renderWithRouter(<ScoreboardStrip matches={matches} />);

      // Should have one live pulse for the live match
      expect(getAllByTestId('live-pulse')).toHaveLength(1);
      
      // Should show Final for finished match
      expect(getByText('Final')).toBeInTheDocument();
    });
  });
});
