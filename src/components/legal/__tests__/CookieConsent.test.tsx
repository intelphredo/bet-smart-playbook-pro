import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { CookieConsent, useCookiePreferences } from '../CookieConsent';

// Wrapper for router context
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('CookieConsent', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows banner after delay when no consent exists', async () => {
    const { queryByText, getByText } = renderWithRouter(<CookieConsent />);
    
    // Initially not visible
    expect(queryByText('We Value Your Privacy')).not.toBeInTheDocument();
    
    // Advance timers to show banner
    await act(async () => {
      vi.advanceTimersByTime(1100);
    });
    
    expect(getByText('We Value Your Privacy')).toBeInTheDocument();
  });

  it('does not show banner when consent already exists', async () => {
    localStorage.setItem('edgeiq_cookie_consent', 'true');
    
    const { queryByText } = renderWithRouter(<CookieConsent />);
    
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    
    expect(queryByText('We Value Your Privacy')).not.toBeInTheDocument();
  });

  it('shows Accept All, Necessary Only, and Customize buttons', async () => {
    const { getByRole } = renderWithRouter(<CookieConsent />);
    
    await act(async () => {
      vi.advanceTimersByTime(1100);
    });
    
    expect(getByRole('button', { name: /Accept All/i })).toBeInTheDocument();
    expect(getByRole('button', { name: /Necessary Only/i })).toBeInTheDocument();
    expect(getByRole('button', { name: /Customize/i })).toBeInTheDocument();
  });

  it('saves consent and hides banner when Accept All is clicked', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const { getByRole, queryByText, getByText } = renderWithRouter(<CookieConsent />);
    
    // Wait for banner to appear
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    expect(getByText('We Value Your Privacy')).toBeInTheDocument();
    
    await user.click(getByRole('button', { name: /Accept All/i }));
    
    expect(queryByText('We Value Your Privacy')).not.toBeInTheDocument();
    expect(localStorage.getItem('edgeiq_cookie_consent')).toBe('true');
    
    const prefs = JSON.parse(localStorage.getItem('edgeiq_cookie_preferences') || '{}');
    expect(prefs.necessary).toBe(true);
    expect(prefs.analytics).toBe(true);
    expect(prefs.marketing).toBe(true);
  });

  it('saves only necessary cookies when Necessary Only is clicked', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const { getByRole, getByText } = renderWithRouter(<CookieConsent />);
    
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    expect(getByText('We Value Your Privacy')).toBeInTheDocument();
    
    await user.click(getByRole('button', { name: /Necessary Only/i }));
    
    const prefs = JSON.parse(localStorage.getItem('edgeiq_cookie_preferences') || '{}');
    expect(prefs.necessary).toBe(true);
    expect(prefs.analytics).toBe(false);
    expect(prefs.marketing).toBe(false);
  });

  it('shows settings panel when Customize is clicked', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const { getByRole, getByText } = renderWithRouter(<CookieConsent />);
    
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    await user.click(getByRole('button', { name: /Customize/i }));
    
    expect(getByText('Cookie Preferences')).toBeInTheDocument();
    expect(getByText('Necessary Cookies')).toBeInTheDocument();
    expect(getByText('Analytics Cookies')).toBeInTheDocument();
    expect(getByText('Marketing Cookies')).toBeInTheDocument();
  });

  it('has Privacy Policy link', async () => {
    const { getAllByRole } = renderWithRouter(<CookieConsent />);
    
    await act(async () => {
      vi.advanceTimersByTime(1100);
    });
    
    const links = getAllByRole('link', { name: /Privacy Policy/i });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute('href', '/privacy');
  });
});

describe('useCookiePreferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default preferences when no consent exists', () => {
    const TestComponent = () => {
      const prefs = useCookiePreferences();
      return (
        <div>
          <span data-testid="necessary">{prefs.necessary.toString()}</span>
          <span data-testid="analytics">{prefs.analytics.toString()}</span>
          <span data-testid="marketing">{prefs.marketing.toString()}</span>
        </div>
      );
    };
    
    const { getByTestId } = render(<TestComponent />);
    
    expect(getByTestId('necessary')).toHaveTextContent('true');
    expect(getByTestId('analytics')).toHaveTextContent('false');
    expect(getByTestId('marketing')).toHaveTextContent('false');
  });

  it('returns saved preferences from localStorage', () => {
    const savedPrefs = {
      necessary: true,
      analytics: true,
      marketing: false,
      timestamp: Date.now()
    };
    localStorage.setItem('edgeiq_cookie_preferences', JSON.stringify(savedPrefs));
    
    const TestComponent = () => {
      const prefs = useCookiePreferences();
      return (
        <div>
          <span data-testid="analytics">{prefs.analytics.toString()}</span>
          <span data-testid="marketing">{prefs.marketing.toString()}</span>
        </div>
      );
    };
    
    const { getByTestId } = render(<TestComponent />);
    
    expect(getByTestId('analytics')).toHaveTextContent('true');
    expect(getByTestId('marketing')).toHaveTextContent('false');
  });
});
