import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ResponsibleGamblingBadge } from '../ResponsibleGamblingBadge';

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('ResponsibleGamblingBadge', () => {
  it('renders the badge with correct text', () => {
    const { getByText } = renderWithRouter(<ResponsibleGamblingBadge />);
    
    expect(getByText('Gamble Responsibly')).toBeInTheDocument();
  });

  it('links to the responsible gambling page', () => {
    const { getByRole } = renderWithRouter(<ResponsibleGamblingBadge />);
    
    const link = getByRole('link', { name: /Gamble Responsibly/i });
    expect(link).toHaveAttribute('href', '/responsible-gambling');
  });

  it('applies custom className', () => {
    const { container } = renderWithRouter(
      <ResponsibleGamblingBadge className="custom-position-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-position-class');
  });

  it('has fixed positioning', () => {
    const { container } = renderWithRouter(<ResponsibleGamblingBadge />);
    
    expect(container.firstChild).toHaveClass('fixed');
    expect(container.firstChild).toHaveClass('bottom-20');
    expect(container.firstChild).toHaveClass('right-4');
  });

  it('contains a heart icon', () => {
    const { getByRole } = renderWithRouter(<ResponsibleGamblingBadge />);
    
    const link = getByRole('link');
    const svg = link.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
