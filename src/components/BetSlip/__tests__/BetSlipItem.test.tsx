import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import BetSlipItem from '../BetSlipItem';
import { BetSlipItem as BetSlipItemType } from '@/types/betting';

// Mock BetSlipContext
const mockRemoveFromBetSlip = vi.fn();
const mockPlaceBet = vi.fn();

vi.mock('../BetSlipContext', () => ({
  useBetSlip: () => ({
    removeFromBetSlip: mockRemoveFromBetSlip,
    placeBet: mockPlaceBet,
  }),
}));

const createMockItem = (overrides: Partial<BetSlipItemType> = {}): BetSlipItemType => ({
  matchId: 'match-123',
  matchTitle: 'Lakers vs Celtics',
  league: 'NBA',
  betType: 'moneyline',
  selection: 'Lakers',
  odds: -150,
  ...overrides,
});

const renderBetSlipItem = (props: Partial<{ item: BetSlipItemType; showLegNumber?: boolean; legNumber?: number }> = {}) => {
  const item = props.item || createMockItem();
  return render(
    <BrowserRouter>
      <BetSlipItem item={item} {...props} />
    </BrowserRouter>
  );
};

describe('BetSlipItem Input Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('stake input', () => {
    it('renders stake input field', () => {
      const { getByPlaceholderText } = renderBetSlipItem();
      expect(getByPlaceholderText('0.00')).toBeInTheDocument();
    });

    it('accepts numeric stake input', async () => {
      const user = userEvent.setup();
      const { getByPlaceholderText } = renderBetSlipItem();
      const stakeInput = getByPlaceholderText('0.00');

      await user.type(stakeInput, '50');
      expect(stakeInput).toHaveValue(50);
    });

    it('accepts decimal stake values', async () => {
      const user = userEvent.setup();
      const { getByPlaceholderText } = renderBetSlipItem();
      const stakeInput = getByPlaceholderText('0.00');

      await user.type(stakeInput, '25.50');
      expect(stakeInput).toHaveValue(25.5);
    });

    it('has type number', () => {
      const { getByPlaceholderText } = renderBetSlipItem();
      const stakeInput = getByPlaceholderText('0.00');
      expect(stakeInput).toHaveAttribute('type', 'number');
    });

    it('has min attribute of 0', () => {
      const { getByPlaceholderText } = renderBetSlipItem();
      const stakeInput = getByPlaceholderText('0.00');
      expect(stakeInput).toHaveAttribute('min', '0');
    });

    it('has step attribute for decimal precision', () => {
      const { getByPlaceholderText } = renderBetSlipItem();
      const stakeInput = getByPlaceholderText('0.00');
      expect(stakeInput).toHaveAttribute('step', '0.01');
    });
  });

  describe('payout calculation', () => {
    it('shows potential payout when stake is entered', async () => {
      const user = userEvent.setup();
      const { getByPlaceholderText, getByText } = renderBetSlipItem({
        item: createMockItem({ odds: -150 }),
      });

      await user.type(getByPlaceholderText('0.00'), '100');

      // -150 odds: win $66.67 on $100 bet
      expect(getByText(/to win/i)).toBeInTheDocument();
    });

    it('calculates positive odds correctly', async () => {
      const user = userEvent.setup();
      const { getByPlaceholderText, getByText } = renderBetSlipItem({
        item: createMockItem({ odds: 150 }),
      });

      await user.type(getByPlaceholderText('0.00'), '100');

      // +150 odds: win $150 on $100 bet
      expect(getByText(/\+\$150\.00/)).toBeInTheDocument();
    });

    it('calculates negative odds correctly', async () => {
      const user = userEvent.setup();
      const { getByPlaceholderText, getByText } = renderBetSlipItem({
        item: createMockItem({ odds: -200 }),
      });

      await user.type(getByPlaceholderText('0.00'), '100');

      // -200 odds: win $50 on $100 bet
      expect(getByText(/\+\$50\.00/)).toBeInTheDocument();
    });

    it('hides payout when stake is zero or empty', () => {
      const { queryByText } = renderBetSlipItem();
      expect(queryByText(/to win/i)).not.toBeInTheDocument();
    });
  });

  describe('place bet button', () => {
    it('is disabled when stake is empty', () => {
      const { getByRole } = renderBetSlipItem();
      const button = getByRole('button', { name: /place bet/i });
      expect(button).toBeDisabled();
    });

    it('is disabled when stake is zero', async () => {
      const user = userEvent.setup();
      const { getByPlaceholderText, getByRole } = renderBetSlipItem();

      await user.type(getByPlaceholderText('0.00'), '0');

      const button = getByRole('button', { name: /place bet/i });
      expect(button).toBeDisabled();
    });

    it('is enabled when valid stake is entered', async () => {
      const user = userEvent.setup();
      const { getByPlaceholderText, getByRole } = renderBetSlipItem();

      await user.type(getByPlaceholderText('0.00'), '25');

      const button = getByRole('button', { name: /place bet.*\$25/i });
      expect(button).not.toBeDisabled();
    });

    it('calls placeBet with correct arguments', async () => {
      const user = userEvent.setup();
      mockPlaceBet.mockResolvedValue(undefined);

      const item = createMockItem();
      const { getByPlaceholderText, getByRole } = renderBetSlipItem({ item });

      await user.type(getByPlaceholderText('0.00'), '50');
      
      const button = getByRole('button', { name: /place bet/i });
      await user.click(button);

      expect(mockPlaceBet).toHaveBeenCalledWith(item, 50);
    });

    it('shows loading state when placing bet', async () => {
      const user = userEvent.setup();
      let resolvePlaceBet: () => void;
      const placeBetPromise = new Promise<void>((resolve) => {
        resolvePlaceBet = resolve;
      });
      mockPlaceBet.mockReturnValue(placeBetPromise);

      const { getByPlaceholderText, getByRole, getByText } = renderBetSlipItem();

      await user.type(getByPlaceholderText('0.00'), '50');
      
      const button = getByRole('button', { name: /place bet/i });
      await user.click(button);

      expect(getByText(/placing/i)).toBeInTheDocument();

      await act(async () => {
        resolvePlaceBet!();
      });
    });
  });

  describe('kelly stake button', () => {
    it('shows Kelly stake button when recommendation available', () => {
      const { getByText } = renderBetSlipItem({
        item: createMockItem({ kellyRecommended: 25 }),
      });

      expect(getByText(/kelly.*\$25/i)).toBeInTheDocument();
    });

    it('applies Kelly stake on click', async () => {
      const user = userEvent.setup();
      const { getByText, getByPlaceholderText } = renderBetSlipItem({
        item: createMockItem({ kellyRecommended: 25 }),
      });

      await user.click(getByText(/kelly.*\$25/i));

      expect(getByPlaceholderText('0.00')).toHaveValue(25);
    });

    it('hides Kelly button when no recommendation', () => {
      const { queryByText } = renderBetSlipItem({
        item: createMockItem({ kellyRecommended: undefined }),
      });

      expect(queryByText(/kelly/i)).not.toBeInTheDocument();
    });
  });

  describe('remove button', () => {
    it('calls removeFromBetSlip when clicked', async () => {
      const user = userEvent.setup();
      const item = createMockItem();
      const { getByLabelText } = renderBetSlipItem({ item });

      await user.click(getByLabelText(/remove from bet slip/i));

      expect(mockRemoveFromBetSlip).toHaveBeenCalledWith(
        item.matchId,
        item.betType,
        item.selection
      );
    });
  });

  describe('risk warning', () => {
    it('shows warning when stake exceeds 2x Kelly', async () => {
      const user = userEvent.setup();
      const { getByPlaceholderText, getByText } = renderBetSlipItem({
        item: createMockItem({ kellyRecommended: 25 }),
      });

      await user.type(getByPlaceholderText('0.00'), '60'); // More than 2x 25

      expect(getByText(/exceeds.*kelly/i)).toBeInTheDocument();
    });

    it('hides warning when stake is within Kelly range', async () => {
      const user = userEvent.setup();
      const { getByPlaceholderText, queryByText } = renderBetSlipItem({
        item: createMockItem({ kellyRecommended: 25 }),
      });

      await user.type(getByPlaceholderText('0.00'), '30'); // Less than 2x 25

      expect(queryByText(/exceeds.*kelly/i)).not.toBeInTheDocument();
    });
  });

  describe('odds display', () => {
    it('displays positive odds with plus sign', () => {
      const { getByText } = renderBetSlipItem({
        item: createMockItem({ odds: 150 }),
      });

      expect(getByText('+150')).toBeInTheDocument();
    });

    it('displays negative odds without plus sign', () => {
      const { getByText } = renderBetSlipItem({
        item: createMockItem({ odds: -150 }),
      });

      expect(getByText('-150')).toBeInTheDocument();
    });

    it('rounds odds to whole numbers', () => {
      const { getByText } = renderBetSlipItem({
        item: createMockItem({ odds: 149.7 }),
      });

      expect(getByText('+150')).toBeInTheDocument();
    });
  });
});
