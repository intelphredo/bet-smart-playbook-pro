import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MatchCard } from '../MatchCard';
import { UnifiedGame } from '@/hooks/useGames';

// Mock the sportsbook utils
vi.mock('@/utils/sportsbook', () => ({
  getPrimaryOdds: vi.fn().mockReturnValue(null),
  formatMoneylineOdds: vi.fn((odds) => odds > 0 ? `+${odds}` : `${odds}`),
  PRIMARY_SPORTSBOOK: 'fanduel',
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

describe('MatchCard', () => {
  describe('rendering', () => {
    it('renders team names correctly', () => {
      const game = createMockGame();
      const { getByText } = render(<MatchCard game={game} />);
      
      expect(getByText('Lakers')).toBeInTheDocument();
      expect(getByText('Celtics')).toBeInTheDocument();
    });

    it('renders league badge', () => {
      const game = createMockGame({ league: 'NBA' });
      const { getByText } = render(<MatchCard game={game} />);
      
      expect(getByText('NBA')).toBeInTheDocument();
    });

    it('renders source badge', () => {
      const game = createMockGame({ source: 'espn' });
      const { getByText } = render(<MatchCard game={game} />);
      
      expect(getByText('espn')).toBeInTheDocument();
    });

    it('renders vs when no score is available', () => {
      const game = createMockGame({ score: undefined });
      const { getByText } = render(<MatchCard game={game} />);
      
      expect(getByText('vs')).toBeInTheDocument();
    });
  });

  describe('live games', () => {
    it('displays LIVE badge for live games', () => {
      const game = createMockGame({ status: 'live' });
      const { getByText } = render(<MatchCard game={game} />);
      
      expect(getByText('LIVE')).toBeInTheDocument();
    });

    it('displays LIVE badge for "in" status games', () => {
      const game = createMockGame({ status: 'in' });
      const { getByText } = render(<MatchCard game={game} />);
      
      expect(getByText('LIVE')).toBeInTheDocument();
    });

    it('displays score for live games', () => {
      const game = createMockGame({
        status: 'live',
        score: { home: 45, away: 42, period: 'Q2' },
      });
      const { getByText } = render(<MatchCard game={game} />);
      
      expect(getByText('45')).toBeInTheDocument();
      expect(getByText('42')).toBeInTheDocument();
    });

    it('displays period info for live games', () => {
      const game = createMockGame({
        status: 'live',
        score: { home: 45, away: 42, period: 'Q2' },
      });
      const { getByText } = render(<MatchCard game={game} />);
      
      expect(getByText('Q2')).toBeInTheDocument();
    });
  });

  describe('finished games', () => {
    it('displays Final badge for finished games', () => {
      const game = createMockGame({ status: 'finished' });
      const { getByText } = render(<MatchCard game={game} />);
      
      expect(getByText('Final')).toBeInTheDocument();
    });

    it('displays Final badge for "post" status games', () => {
      const game = createMockGame({ status: 'post' });
      const { getByText } = render(<MatchCard game={game} />);
      
      expect(getByText('Final')).toBeInTheDocument();
    });

    it('displays final scores correctly', () => {
      const game = createMockGame({
        status: 'finished',
        score: { home: 112, away: 105 },
      });
      const { getByText } = render(<MatchCard game={game} />);
      
      expect(getByText('112')).toBeInTheDocument();
      expect(getByText('105')).toBeInTheDocument();
    });
  });

  describe('scheduled games', () => {
    it('does not display LIVE or Final badges', () => {
      const game = createMockGame({ status: 'scheduled' });
      const { queryByText } = render(<MatchCard game={game} />);
      
      expect(queryByText('LIVE')).not.toBeInTheDocument();
      expect(queryByText('Final')).not.toBeInTheDocument();
    });

    it('displays vs separator', () => {
      const game = createMockGame({ status: 'scheduled', score: undefined });
      const { getByText } = render(<MatchCard game={game} />);
      
      expect(getByText('vs')).toBeInTheDocument();
    });
  });

  describe('default values', () => {
    it('displays SPORTS when league is not provided', () => {
      const game = createMockGame({ league: undefined });
      const { getByText } = render(<MatchCard game={game} />);
      
      expect(getByText('SPORTS')).toBeInTheDocument();
    });

    it('handles zero scores correctly', () => {
      const game = createMockGame({
        status: 'live',
        score: { home: 0, away: 0 },
      });
      const { getAllByText } = render(<MatchCard game={game} />);
      
      // Should show two 0s
      const zeros = getAllByText('0');
      expect(zeros).toHaveLength(2);
    });
  });
});
