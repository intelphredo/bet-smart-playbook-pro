import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import SmartScoreCard from '../SmartScoreCard';
import { Match, SmartScore } from '@/types/sports';

// Mock InfoExplainer component
vi.mock('@/components/ui/InfoExplainer', () => ({
  InfoExplainer: ({ term }: { term: string }) => <span data-testid={`info-${term}`} />,
}));

const createMockSmartScore = (overrides: Partial<SmartScore> = {}): SmartScore => ({
  overall: 75,
  components: {
    momentum: 80,
    value: 70,
    oddsMovement: 65,
    weather: 50,
    injuries: 60,
    arbitrage: 40,
  },
  factors: {
    momentum: [],
    value: [],
    oddsMovement: [],
    weather: [],
    injuries: [],
    arbitrage: [],
  },
  recommendation: {
    betOn: 'home',
    confidence: 'high',
    reasoning: 'Strong home advantage and recent form.',
  },
  hasArbitrageOpportunity: false,
  ...overrides,
});

const createMockMatch = (overrides: Partial<Match> = {}): Match => ({
  id: 'match-1',
  homeTeam: { id: 'lal', name: 'Los Angeles Lakers', shortName: 'LAL', logo: '' },
  awayTeam: { id: 'bos', name: 'Boston Celtics', shortName: 'BOS', logo: '' },
  startTime: '2024-01-15T19:00:00Z',
  status: 'scheduled',
  league: 'NBA',
  prediction: {
    recommended: 'home',
    confidence: 75,
    projectedScore: { home: 110, away: 102 },
  },
  odds: {
    homeWin: -150,
    awayWin: 130,
  },
  smartScore: createMockSmartScore(),
  ...overrides,
});

describe('SmartScoreCard', () => {
  describe('rendering', () => {
    it('renders nothing when smartScore is not available', () => {
      const match = createMockMatch({ smartScore: undefined });
      const { container } = render(<SmartScoreCard match={match} />);
      
      expect(container.firstChild).toBeNull();
    });

    it('renders team names correctly', () => {
      const match = createMockMatch();
      const { getByText } = render(<SmartScoreCard match={match} />);
      
      expect(getByText('LAL vs BOS')).toBeInTheDocument();
    });

    it('displays overall score badge', () => {
      const match = createMockMatch();
      const { getByText } = render(<SmartScoreCard match={match} />);
      
      expect(getByText('75')).toBeInTheDocument();
    });

    it('displays component scores', () => {
      const match = createMockMatch();
      const { getByText } = render(<SmartScoreCard match={match} />);
      
      expect(getByText('80')).toBeInTheDocument(); // momentum
      expect(getByText('70')).toBeInTheDocument(); // value
      expect(getByText('65')).toBeInTheDocument(); // oddsMovement
    });

    it('shows click for details hint', () => {
      const match = createMockMatch();
      const { getByText } = render(<SmartScoreCard match={match} />);
      
      expect(getByText('Click for details')).toBeInTheDocument();
    });
  });

  describe('score colors', () => {
    it('applies styling for scores >= 80', () => {
      const match = createMockMatch({
        smartScore: createMockSmartScore({
          overall: 85,
          components: {
            momentum: 90,
            value: 80,
            oddsMovement: 85,
            weather: 75,
            injuries: 80,
            arbitrage: 70,
          },
        }),
      });
      const { getByText } = render(<SmartScoreCard match={match} />);
      
      expect(getByText('85')).toBeInTheDocument();
      expect(getByText('90')).toBeInTheDocument();
    });

    it('applies styling for scores >= 65', () => {
      const match = createMockMatch({
        smartScore: createMockSmartScore({
          overall: 70,
          components: {
            momentum: 70,
            value: 68,
            oddsMovement: 72,
            weather: 65,
            injuries: 70,
            arbitrage: 60,
          },
        }),
      });
      const { getByText } = render(<SmartScoreCard match={match} />);
      
      expect(getByText('70')).toBeInTheDocument();
    });

    it('applies styling for scores >= 50', () => {
      const match = createMockMatch({
        smartScore: createMockSmartScore({
          overall: 55,
          components: {
            momentum: 50,
            value: 55,
            oddsMovement: 60,
            weather: 50,
            injuries: 55,
            arbitrage: 45,
          },
        }),
      });
      const { getByText } = render(<SmartScoreCard match={match} />);
      
      expect(getByText('55')).toBeInTheDocument();
    });

    it('applies styling for scores < 50', () => {
      const match = createMockMatch({
        smartScore: createMockSmartScore({
          overall: 40,
          components: {
            momentum: 35,
            value: 45,
            oddsMovement: 40,
            weather: 30,
            injuries: 35,
            arbitrage: 25,
          },
        }),
      });
      const { getByText } = render(<SmartScoreCard match={match} />);
      
      expect(getByText('40')).toBeInTheDocument();
    });
  });

  describe('arbitrage alert', () => {
    it('shows arbitrage badge when opportunity exists and showArbitrageAlert is true', () => {
      const match = createMockMatch({
        smartScore: createMockSmartScore({
          hasArbitrageOpportunity: true,
        }),
      });
      const { getByText } = render(<SmartScoreCard match={match} showArbitrageAlert={true} />);
      
      expect(getByText('Arbitrage')).toBeInTheDocument();
    });

    it('does not show arbitrage badge when showArbitrageAlert is false', () => {
      const match = createMockMatch({
        smartScore: createMockSmartScore({
          hasArbitrageOpportunity: true,
        }),
      });
      const { queryByText } = render(<SmartScoreCard match={match} showArbitrageAlert={false} />);
      
      expect(queryByText('Arbitrage')).not.toBeInTheDocument();
    });

    it('does not show arbitrage badge when no opportunity exists', () => {
      const match = createMockMatch();
      const { queryByText } = render(<SmartScoreCard match={match} showArbitrageAlert={true} />);
      
      expect(queryByText('Arbitrage')).not.toBeInTheDocument();
    });
  });

  describe('modal interaction', () => {
    it('opens modal on card click', async () => {
      const match = createMockMatch();
      const { getByText, findByText } = render(<SmartScoreCard match={match} />);
      
      const card = getByText('LAL vs BOS').closest('[class*="cursor-pointer"]');
      
      await act(async () => {
        card?.click();
      });
      
      // Modal should show full team names
      expect(await findByText('Los Angeles Lakers vs Boston Celtics')).toBeTruthy();
    });

    it('displays all component scores in modal', async () => {
      const match = createMockMatch();
      const { getByText, findByText, getAllByText } = render(<SmartScoreCard match={match} />);
      
      const card = getByText('LAL vs BOS').closest('[class*="cursor-pointer"]');
      
      await act(async () => {
        card?.click();
      });
      
      // Check for SmartScore label in modal
      expect(await findByText('SmartScore™')).toBeTruthy();
      
      // Check for component labels (may have multiple instances)
      expect(getAllByText('Momentum').length).toBeGreaterThan(0);
      expect(getAllByText('Value').length).toBeGreaterThan(0);
    });

    it('displays recommendation when available', async () => {
      const match = createMockMatch();
      const { getByText, findByText } = render(<SmartScoreCard match={match} />);
      
      const card = getByText('LAL vs BOS').closest('[class*="cursor-pointer"]');
      
      await act(async () => {
        card?.click();
      });
      
      expect(await findByText('AI Recommendation')).toBeTruthy();
      expect(getByText('Strong home advantage and recent form.')).toBeInTheDocument();
    });

    it('displays arbitrage warning in modal when opportunity exists', async () => {
      const match = createMockMatch({
        smartScore: createMockSmartScore({
          hasArbitrageOpportunity: true,
        }),
      });
      const { getByText, findByText } = render(<SmartScoreCard match={match} showArbitrageAlert={true} />);
      
      const card = getByText('LAL vs BOS').closest('[class*="cursor-pointer"]');
      
      await act(async () => {
        card?.click();
      });
      
      expect(await findByText('Arbitrage Opportunity Detected')).toBeTruthy();
    });
  });

  describe('info explainers', () => {
    it('renders info explainers for key terms', () => {
      const match = createMockMatch();
      const { getByTestId } = render(<SmartScoreCard match={match} />);
      
      expect(getByTestId('info-momentum')).toBeInTheDocument();
      expect(getByTestId('info-expected_value')).toBeInTheDocument();
      expect(getByTestId('info-line_movement')).toBeInTheDocument();
    });
  });
});
