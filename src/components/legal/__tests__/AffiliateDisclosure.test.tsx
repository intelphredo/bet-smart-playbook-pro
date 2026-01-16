import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AffiliateDisclosure, AffiliateLink } from '../AffiliateDisclosure';

// Wrapper for components that need router and tooltip provider
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <TooltipProvider>
        {ui}
      </TooltipProvider>
    </BrowserRouter>
  );
};

describe('AffiliateDisclosure', () => {
  describe('Inline variant (default)', () => {
    it('renders generic disclosure text without sportsbook name', () => {
      const { getByText } = renderWithProviders(<AffiliateDisclosure />);
      
      expect(getByText(/This is an affiliate link/i)).toBeInTheDocument();
      expect(getByText(/We may receive compensation/i)).toBeInTheDocument();
    });

    it('renders specific disclosure text with sportsbook name', () => {
      const { getByText } = renderWithProviders(<AffiliateDisclosure sportsbookName="DraftKings" />);
      
      expect(getByText(/This link to DraftKings is an affiliate link/i)).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = renderWithProviders(
        <AffiliateDisclosure className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Badge variant', () => {
    it('renders as a badge with text', () => {
      const { getByText } = renderWithProviders(<AffiliateDisclosure variant="badge" />);
      
      expect(getByText(/Affiliate Link/i)).toBeInTheDocument();
    });

    it('has appropriate styling classes', () => {
      const { container } = renderWithProviders(<AffiliateDisclosure variant="badge" />);
      
      const badge = container.firstChild;
      expect(badge).toHaveClass('rounded-full');
      expect(badge).toHaveClass('uppercase');
    });
  });

  describe('Tooltip variant', () => {
    it('renders with "Affiliate" text visible', () => {
      const { getByText } = renderWithProviders(<AffiliateDisclosure variant="tooltip" />);
      
      expect(getByText('Affiliate')).toBeInTheDocument();
    });

    it('includes sportsbook name in tooltip content when provided', () => {
      const { getByText } = renderWithProviders(<AffiliateDisclosure variant="tooltip" sportsbookName="FanDuel" />);
      
      expect(getByText('Affiliate')).toBeInTheDocument();
    });
  });
});

describe('AffiliateLink', () => {
  it('renders a link with correct href and attributes', () => {
    const { getByRole } = renderWithProviders(
      <AffiliateLink href="https://example.com" sportsbookName="TestBook">
        Click Here
      </AffiliateLink>
    );
    
    const link = getByRole('link', { name: /Click Here/i });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer sponsored');
  });

  it('renders children correctly', () => {
    const { getByText } = renderWithProviders(
      <AffiliateLink href="https://example.com" sportsbookName="TestBook">
        Sign Up Now
      </AffiliateLink>
    );
    
    expect(getByText('Sign Up Now')).toBeInTheDocument();
  });

  it('shows disclosure by default', () => {
    const { getByText } = renderWithProviders(
      <AffiliateLink href="https://example.com" sportsbookName="TestBook">
        Link Text
      </AffiliateLink>
    );
    
    expect(getByText('Affiliate')).toBeInTheDocument();
  });

  it('hides disclosure when showDisclosure is false', () => {
    const { queryByText } = renderWithProviders(
      <AffiliateLink 
        href="https://example.com" 
        sportsbookName="TestBook"
        showDisclosure={false}
      >
        Link Text
      </AffiliateLink>
    );
    
    expect(queryByText('Affiliate')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = renderWithProviders(
      <AffiliateLink 
        href="https://example.com" 
        sportsbookName="TestBook"
        className="my-custom-class"
      >
        Link Text
      </AffiliateLink>
    );
    
    expect(container.firstChild).toHaveClass('my-custom-class');
  });
});
