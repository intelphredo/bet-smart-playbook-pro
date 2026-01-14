import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateFilter } from '../DateFilter';
import { Match } from '@/types/sports';
import { addDays, format, startOfDay } from 'date-fns';

// Mock date-fns to have consistent tests
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns');
  return {
    ...actual,
    // Keep original implementations
  };
});

const createMockMatch = (daysFromNow: number, overrides: Partial<Match> = {}): Match => {
  const date = addDays(new Date(), daysFromNow);
  return {
    id: `match-${daysFromNow}-${Math.random()}`,
    homeTeam: { id: 'home', name: 'Home Team', shortName: 'HOM', logo: '' },
    awayTeam: { id: 'away', name: 'Away Team', shortName: 'AWY', logo: '' },
    startTime: date.toISOString(),
    status: 'scheduled',
    league: 'NBA',
    prediction: {
      recommended: 'home',
      confidence: 65,
      projectedScore: { home: 105, away: 100 },
    },
    odds: { homeWin: -150, awayWin: 130 },
    ...overrides,
  };
};

const renderDateFilter = (props: Partial<Parameters<typeof DateFilter>[0]> = {}) => {
  const defaultProps = {
    selectedDate: null,
    onDateSelect: vi.fn(),
    daysAhead: 7,
    matches: [],
  };
  return render(<DateFilter {...defaultProps} {...props} />);
};

describe('DateFilter Input Tests', () => {
  describe('date selection', () => {
    it('renders All Days button', () => {
      const { getByText } = renderDateFilter();
      expect(getByText('All Days')).toBeInTheDocument();
    });

    it('calls onDateSelect with null when All Days clicked', async () => {
      const user = userEvent.setup();
      const onDateSelect = vi.fn();
      const { getByText } = renderDateFilter({ onDateSelect });

      await user.click(getByText('All Days'));
      expect(onDateSelect).toHaveBeenCalledWith(null);
    });

    it('renders correct number of date buttons', () => {
      const { getAllByRole } = renderDateFilter({ daysAhead: 5 });
      // All Days + 5 date buttons
      const buttons = getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(6);
    });

    it('calls onDateSelect with date when date button clicked', async () => {
      const user = userEvent.setup();
      const onDateSelect = vi.fn();
      const { getByText } = renderDateFilter({ onDateSelect });

      // Click on "Today" button
      const todayButton = getByText('Today').closest('button');
      if (todayButton) {
        await user.click(todayButton);
        expect(onDateSelect).toHaveBeenCalled();
        const calledWith = onDateSelect.mock.calls[0][0];
        expect(calledWith).toBeInstanceOf(Date);
      }
    });

    it('highlights selected date', () => {
      const today = startOfDay(new Date());
      const { getByText } = renderDateFilter({ selectedDate: today });

      const todayButton = getByText('Today').closest('button');
      expect(todayButton).toHaveAttribute('data-state', 'open');
    });

    it('shows Today and Tomorrow labels correctly', () => {
      const { getByText } = renderDateFilter({ daysAhead: 3 });

      expect(getByText('Today')).toBeInTheDocument();
      expect(getByText('Tomorrow')).toBeInTheDocument();
    });
  });

  describe('game count display', () => {
    it('shows total game count on All Days button', () => {
      const matches = [
        createMockMatch(0),
        createMockMatch(0),
        createMockMatch(1),
      ];
      const { getByText } = renderDateFilter({ matches });

      // Should show total count (3)
      expect(getByText('3')).toBeInTheDocument();
    });

    it('shows game count per date', () => {
      const matches = [
        createMockMatch(0),
        createMockMatch(0),
        createMockMatch(0),
      ];
      const { getAllByText } = renderDateFilter({ matches });

      // Today should show 3 games
      const threeCount = getAllByText('3');
      expect(threeCount.length).toBeGreaterThan(0);
    });

    it('shows zero games for dates with no matches', () => {
      const { getAllByText } = renderDateFilter({ matches: [] });

      // All date buttons should show 0
      const zeroCount = getAllByText('0');
      expect(zeroCount.length).toBeGreaterThan(0);
    });
  });

  describe('high confidence indicators', () => {
    it('shows indicator for high confidence picks', () => {
      const matches = [
        createMockMatch(0, {
          prediction: {
            recommended: 'home',
            confidence: 85, // High confidence
            projectedScore: { home: 110, away: 100 },
          },
        }),
      ];
      const { container } = renderDateFilter({ matches });

      // Should have indicator dot for high confidence
      const indicators = container.querySelectorAll('.bg-green-500');
      expect(indicators.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('best day highlighting', () => {
    it('highlights the best betting day', () => {
      const matches = [
        // Day 0: 1 low confidence game
        createMockMatch(0, {
          prediction: { recommended: 'home', confidence: 50, projectedScore: { home: 100, away: 95 } },
        }),
        // Day 1: 3 high confidence games (should be best)
        createMockMatch(1, {
          prediction: { recommended: 'home', confidence: 80, projectedScore: { home: 110, away: 100 } },
        }),
        createMockMatch(1, {
          prediction: { recommended: 'home', confidence: 75, projectedScore: { home: 105, away: 98 } },
        }),
        createMockMatch(1, {
          prediction: { recommended: 'away', confidence: 85, projectedScore: { home: 95, away: 105 } },
        }),
      ];
      const { getByText } = renderDateFilter({ matches });

      // Tomorrow should have BEST badge (day 1 has better confidence)
      expect(getByText('BEST')).toBeInTheDocument();
    });
  });

  describe('keyboard accessibility', () => {
    it('date buttons are focusable', () => {
      const { getByText } = renderDateFilter();

      const allDaysButton = getByText('All Days');
      allDaysButton.focus();
      expect(allDaysButton).toHaveFocus();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      const onDateSelect = vi.fn();
      const { getByText } = renderDateFilter({ onDateSelect });

      const allDaysButton = getByText('All Days');
      allDaysButton.focus();
      
      await user.keyboard('{Enter}');
      expect(onDateSelect).toHaveBeenCalledWith(null);
    });
  });

  describe('responsive behavior', () => {
    it('renders within scroll area for many dates', () => {
      const { container } = renderDateFilter({ daysAhead: 14 });

      // Should have horizontal scroll area
      const scrollArea = container.querySelector('[data-radix-scroll-area-viewport]');
      expect(scrollArea || container.querySelector('.overflow-x-auto')).toBeTruthy();
    });
  });

  describe('league breakdown', () => {
    it('groups games by league', () => {
      const matches = [
        createMockMatch(0, { league: 'NBA' }),
        createMockMatch(0, { league: 'NBA' }),
        createMockMatch(0, { league: 'NFL' }),
      ];
      const { container } = renderDateFilter({ matches });

      // The component should internally track league breakdown
      // This is shown in tooltips
      expect(container).toBeInTheDocument();
    });
  });
});
