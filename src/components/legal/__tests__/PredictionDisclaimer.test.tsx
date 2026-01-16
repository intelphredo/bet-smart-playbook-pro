import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { PredictionDisclaimer } from '../PredictionDisclaimer';

// Wrapper component for router context
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('PredictionDisclaimer', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Banner variant (default)', () => {
    it('renders the banner with disclaimer text', () => {
      const { getByText } = renderWithRouter(<PredictionDisclaimer />);
      
      expect(getByText('Disclaimer: For Entertainment Only')).toBeInTheDocument();
      expect(getByText(/educational and entertainment purposes only/i)).toBeInTheDocument();
    });

    it('renders links to Terms of Service and Responsible Gambling', () => {
      const { getByRole } = renderWithRouter(<PredictionDisclaimer />);
      
      expect(getByRole('link', { name: /Terms of Service/i })).toHaveAttribute('href', '/terms');
      expect(getByRole('link', { name: /Responsible Gambling/i })).toHaveAttribute('href', '/responsible-gambling');
    });

    it('renders the helpline phone number', () => {
      const { getByRole } = renderWithRouter(<PredictionDisclaimer />);
      
      expect(getByRole('link', { name: /1-800-522-4700/i })).toHaveAttribute('href', 'tel:1-800-522-4700');
    });

    it('can be dismissed and saves to localStorage', async () => {
      vi.useRealTimers(); // Need real timers for userEvent
      const user = userEvent.setup();
      const { getByRole, queryByText } = renderWithRouter(<PredictionDisclaimer />);
      
      const dismissButton = getByRole('button');
      await user.click(dismissButton);
      
      expect(queryByText('Disclaimer: For Entertainment Only')).not.toBeInTheDocument();
      expect(localStorage.getItem('betsmart_disclaimer_dismissed')).toBeTruthy();
    });

    it('stays dismissed if dismissed within 24 hours', () => {
      // Set dismissed time to 12 hours ago
      const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000);
      localStorage.setItem('betsmart_disclaimer_dismissed', twelveHoursAgo.toString());
      
      const { queryByText } = renderWithRouter(<PredictionDisclaimer />);
      
      expect(queryByText('Disclaimer: For Entertainment Only')).not.toBeInTheDocument();
    });

    it('reappears after 24 hours', () => {
      // Set dismissed time to 25 hours ago
      const twentyFiveHoursAgo = Date.now() - (25 * 60 * 60 * 1000);
      localStorage.setItem('betsmart_disclaimer_dismissed', twentyFiveHoursAgo.toString());
      
      const { getByText } = renderWithRouter(<PredictionDisclaimer />);
      
      expect(getByText('Disclaimer: For Entertainment Only')).toBeInTheDocument();
    });

    it('cannot be dismissed when dismissible is false', () => {
      const { queryByRole } = renderWithRouter(<PredictionDisclaimer dismissible={false} />);
      
      expect(queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Compact variant', () => {
    it('renders compact version with shorter text', () => {
      const { getByText, getByRole } = renderWithRouter(<PredictionDisclaimer variant="compact" />);
      
      expect(getByText(/Predictions are for entertainment only/i)).toBeInTheDocument();
      expect(getByRole('link', { name: /View disclaimer/i })).toHaveAttribute('href', '/terms');
    });

    it('can be dismissed in compact mode', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      const { getByRole, queryByText } = renderWithRouter(<PredictionDisclaimer variant="compact" />);
      
      const dismissButton = getByRole('button');
      await user.click(dismissButton);
      
      expect(queryByText(/Predictions are for entertainment only/i)).not.toBeInTheDocument();
    });
  });

  describe('Inline variant', () => {
    it('renders inline version with minimal text', () => {
      const { getByText, getByRole } = renderWithRouter(<PredictionDisclaimer variant="inline" />);
      
      expect(getByText(/For entertainment purposes only/i)).toBeInTheDocument();
      expect(getByRole('link', { name: /Gamble responsibly/i })).toHaveAttribute('href', '/responsible-gambling');
    });

    it('inline variant has no dismiss button', () => {
      const { queryByRole } = renderWithRouter(<PredictionDisclaimer variant="inline" />);
      
      expect(queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('applies custom className to the component', () => {
      const { container } = renderWithRouter(
        <PredictionDisclaimer className="custom-test-class" />
      );
      
      expect(container.firstChild?.firstChild).toHaveClass('custom-test-class');
    });
  });
});