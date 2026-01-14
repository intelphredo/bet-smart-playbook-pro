import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BetSlipDrawer from '../BetSlipDrawer';
import { BetSlipProvider } from '../BetSlipContext';
import type { BetSlipItem } from '@/types/betting';

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock isDevMode
vi.mock('@/utils/devMode', () => ({
  isDevMode: vi.fn().mockReturnValue(false),
}));

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock bet slip items
const mockBetSlipItems: BetSlipItem[] = [];
const mockClearBetSlip = vi.fn();
const mockStats = {
  id: 'stats-1',
  user_id: 'user-1',
  total_bets: 25,
  pending_bets: 3,
  wins: 15,
  losses: 7,
  pushes: 0,
  total_staked: 1000,
  total_profit: 250,
  roi_percentage: 12.5,
  avg_odds: 1.95,
  avg_clv: 2.1,
  best_streak: 5,
  current_streak: 2,
  last_updated: new Date().toISOString(),
};

vi.mock('../BetSlipContext', async () => {
  const actual = await vi.importActual('../BetSlipContext');
  return {
    ...actual,
    useBetSlip: () => ({
      betSlip: mockBetSlipItems,
      clearBetSlip: mockClearBetSlip,
      stats: mockStats,
      bets: [],
      isLoading: false,
      addToBetSlip: vi.fn(),
      removeFromBetSlip: vi.fn(),
      placeBet: vi.fn(),
      fetchBets: vi.fn(),
      fetchStats: vi.fn(),
    }),
  };
});

const renderBetSlipDrawer = () => {
  return render(
    <BrowserRouter>
      <BetSlipProvider>
        <BetSlipDrawer />
      </BetSlipProvider>
    </BrowserRouter>
  );
};

describe('BetSlipDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: null });
    mockBetSlipItems.length = 0;
  });

  describe('trigger button', () => {
    it('renders Bet Slip button', () => {
      const { getByText } = renderBetSlipDrawer();
      expect(getByText('Bet Slip')).toBeInTheDocument();
    });

    it('shows count badge when items are in slip', () => {
      mockBetSlipItems.push({
        matchId: 'match-1',
        matchTitle: 'Lakers vs Celtics',
        selection: 'Lakers',
        odds: -110,
        betType: 'moneyline',
      });
      
      const { getByText } = renderBetSlipDrawer();
      expect(getByText('1')).toBeInTheDocument();
    });
  });

  describe('unauthenticated state', () => {
    it('shows login prompt when not authenticated', async () => {
      mockUseAuth.mockReturnValue({ user: null });
      const { getByText, findByText } = renderBetSlipDrawer();
      
      // Open the drawer by clicking the trigger
      await act(async () => {
        getByText('Bet Slip').click();
      });
      
      await act(async () => {
        expect(await findByText('Please login to track your bets')).toBeTruthy();
      });
    });
  });

  describe('authenticated empty state', () => {
    it('shows empty message when authenticated with no bets', async () => {
      mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
      const { getByText, findByText } = renderBetSlipDrawer();
      
      // Open the drawer
      await act(async () => {
        getByText('Bet Slip').click();
      });
      
      await act(async () => {
        expect(await findByText(/Your bet slip is empty/)).toBeTruthy();
      });
    });
  });

  describe('authenticated with bets', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
      mockBetSlipItems.push(
        {
          matchId: 'match-1',
          matchTitle: 'Lakers vs Celtics',
          selection: 'Lakers',
          odds: -110,
          betType: 'moneyline',
        },
        {
          matchId: 'match-2',
          matchTitle: 'Warriors vs Suns',
          selection: 'Warriors',
          odds: 150,
          betType: 'moneyline',
        }
      );
    });

    it('shows bet count in header', async () => {
      const { getByText, findByText } = renderBetSlipDrawer();
      
      await act(async () => {
        getByText('Bet Slip').click();
      });
      
      expect(await findByText('2 selections')).toBeTruthy();
    });

    it('shows parlay mode toggle when 2+ bets', async () => {
      const { getByText, findByText } = renderBetSlipDrawer();
      
      await act(async () => {
        getByText('Bet Slip').click();
      });
      
      expect(await findByText('Parlay Mode')).toBeTruthy();
    });

    it('shows clear all button', async () => {
      const { getByText, findByText } = renderBetSlipDrawer();
      
      await act(async () => {
        getByText('Bet Slip').click();
      });
      
      expect(await findByText('Clear All')).toBeTruthy();
    });

    it('shows view history button', async () => {
      const { getByText, findByText } = renderBetSlipDrawer();
      
      await act(async () => {
        getByText('Bet Slip').click();
      });
      
      expect(await findByText('View History')).toBeTruthy();
    });
  });

  describe('stats display', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
    });

    it('displays user betting stats', async () => {
      const { getByText, findByText } = renderBetSlipDrawer();
      
      await act(async () => {
        getByText('Bet Slip').click();
      });
      
      expect(await findByText('Your Stats')).toBeTruthy();
    });
  });
});
