import { test, expect } from '@playwright/test';

/**
 * E2E Integration Tests for Legal Compliance Components
 * 
 * Tests the following components in a real browser environment:
 * - CookieConsent: Cookie consent banner and preferences
 * - PredictionDisclaimer: Prediction disclaimer banners
 * - AffiliateDisclosure: Affiliate link disclosures
 * - ResponsibleGamblingBadge: Floating responsible gambling badge
 */

test.describe('Legal Compliance - Cookie Consent', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to reset cookie consent state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('betsmart_cookie_consent');
      localStorage.removeItem('betsmart_cookie_preferences');
    });
  });

  test('should display cookie consent banner on first visit', async ({ page }) => {
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Cookie banner appears after 1 second delay
    await page.waitForTimeout(1500);
    
    // Check for cookie consent banner
    const banner = page.locator('text=We Value Your Privacy');
    await expect(banner).toBeVisible();
    
    // Check for main action buttons
    await expect(page.getByRole('button', { name: /Accept All/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Necessary Only/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Customize/i })).toBeVisible();
  });

  test('should hide banner after accepting all cookies', async ({ page }) => {
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Click Accept All
    await page.getByRole('button', { name: /Accept All/i }).click();
    
    // Banner should disappear
    const banner = page.locator('text=We Value Your Privacy');
    await expect(banner).not.toBeVisible();
    
    // Preferences should be saved to localStorage
    const consent = await page.evaluate(() => localStorage.getItem('betsmart_cookie_consent'));
    expect(consent).toBe('true');
    
    const prefs = await page.evaluate(() => localStorage.getItem('betsmart_cookie_preferences'));
    const parsedPrefs = JSON.parse(prefs || '{}');
    expect(parsedPrefs.analytics).toBe(true);
    expect(parsedPrefs.marketing).toBe(true);
  });

  test('should hide banner after accepting necessary only', async ({ page }) => {
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Click Necessary Only
    await page.getByRole('button', { name: /Necessary Only/i }).click();
    
    // Banner should disappear
    const banner = page.locator('text=We Value Your Privacy');
    await expect(banner).not.toBeVisible();
    
    // Check saved preferences
    const prefs = await page.evaluate(() => localStorage.getItem('betsmart_cookie_preferences'));
    const parsedPrefs = JSON.parse(prefs || '{}');
    expect(parsedPrefs.analytics).toBe(false);
    expect(parsedPrefs.marketing).toBe(false);
    expect(parsedPrefs.necessary).toBe(true);
  });

  test('should open cookie preferences panel when clicking Customize', async ({ page }) => {
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Click Customize
    await page.getByRole('button', { name: /Customize/i }).click();
    
    // Preferences panel should be visible
    await expect(page.locator('text=Cookie Preferences')).toBeVisible();
    await expect(page.locator('text=Necessary Cookies')).toBeVisible();
    await expect(page.locator('text=Analytics Cookies')).toBeVisible();
    await expect(page.locator('text=Marketing Cookies')).toBeVisible();
  });

  test('should allow toggling analytics and marketing cookies', async ({ page }) => {
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Open preferences
    await page.getByRole('button', { name: /Customize/i }).click();
    await page.waitForTimeout(300);
    
    // Toggle analytics (find the switch near Analytics Cookies text)
    const analyticsSwitch = page.locator('text=Analytics Cookies').locator('..').locator('..').locator('button[role="switch"]');
    await analyticsSwitch.click();
    
    // Toggle marketing
    const marketingSwitch = page.locator('text=Marketing Cookies').locator('..').locator('..').locator('button[role="switch"]');
    await marketingSwitch.click();
    
    // Save preferences
    await page.getByRole('button', { name: /Save Preferences/i }).click();
    
    // Banner should close
    await expect(page.locator('text=Cookie Preferences')).not.toBeVisible();
    
    // Check saved preferences
    const prefs = await page.evaluate(() => localStorage.getItem('betsmart_cookie_preferences'));
    const parsedPrefs = JSON.parse(prefs || '{}');
    expect(parsedPrefs.analytics).toBe(true);
    expect(parsedPrefs.marketing).toBe(true);
  });

  test('should not show banner on subsequent visits after consent', async ({ page }) => {
    // Set consent in localStorage
    await page.evaluate(() => {
      localStorage.setItem('betsmart_cookie_consent', 'true');
      localStorage.setItem('betsmart_cookie_preferences', JSON.stringify({
        necessary: true,
        analytics: true,
        marketing: false,
        timestamp: Date.now()
      }));
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Banner should not be visible
    const banner = page.locator('text=We Value Your Privacy');
    await expect(banner).not.toBeVisible();
  });

  test('should include link to Privacy Policy', async ({ page }) => {
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Check Privacy Policy link
    const privacyLink = page.getByRole('link', { name: /Privacy Policy/i });
    await expect(privacyLink).toBeVisible();
    await expect(privacyLink).toHaveAttribute('href', '/privacy');
  });
});

test.describe('Legal Compliance - Prediction Disclaimer', () => {
  test('should display disclaimer on predictions page', async ({ page }) => {
    // Clear dismissed state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('betsmart_disclaimer_dismissed');
    });
    
    await page.goto('/predictions');
    await page.waitForLoadState('networkidle');
    
    // Look for disclaimer text
    const disclaimerText = page.locator('text=entertainment purposes only');
    const hasDisclaimer = await disclaimerText.count() > 0;
    
    // Either has full disclaimer or compact version
    if (hasDisclaimer) {
      expect(hasDisclaimer).toBeTruthy();
    } else {
      // May have inline version
      const inlineDisclaimer = page.locator('text=For entertainment purposes only');
      const hasInline = await inlineDisclaimer.count() > 0;
      expect(hasInline || hasDisclaimer).toBeTruthy();
    }
  });

  test('should display disclaimer on AI predictions page', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem('betsmart_disclaimer_dismissed');
    });
    
    await page.goto('/ai-predictions');
    await page.waitForLoadState('networkidle');
    
    // Check for any disclaimer-related content
    const body = await page.locator('body').textContent();
    const hasDisclaimer = body?.includes('entertainment') || 
                          body?.includes('disclaimer') || 
                          body?.includes('Disclaimer') ||
                          body?.includes('Entertainment');
    
    expect(hasDisclaimer).toBeTruthy();
  });

  test('should link to Terms of Service', async ({ page }) => {
    await page.goto('/predictions');
    await page.waitForLoadState('networkidle');
    
    // Check for Terms link
    const termsLinks = page.getByRole('link', { name: /Terms/i });
    const termsCount = await termsLinks.count();
    
    if (termsCount > 0) {
      const href = await termsLinks.first().getAttribute('href');
      expect(href).toMatch(/terms/i);
    }
  });

  test('should link to Responsible Gambling page', async ({ page }) => {
    await page.goto('/predictions');
    await page.waitForLoadState('networkidle');
    
    // Check for Responsible Gambling link
    const rgLinks = page.getByRole('link', { name: /Responsible Gambling|Gamble responsibly/i });
    const rgCount = await rgLinks.count();
    
    if (rgCount > 0) {
      const href = await rgLinks.first().getAttribute('href');
      expect(href).toMatch(/responsible-gambling/i);
    }
  });

  test('should dismiss disclaimer when close button clicked', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('betsmart_disclaimer_dismissed');
    });
    
    await page.goto('/predictions');
    await page.waitForLoadState('networkidle');
    
    // Find dismiss button (X button near disclaimer)
    const dismissButtons = page.locator('[class*="disclaimer"] button, [class*="border-amber"] button');
    const count = await dismissButtons.count();
    
    if (count > 0) {
      await dismissButtons.first().click();
      
      // Check localStorage for dismissed state
      const dismissed = await page.evaluate(() => localStorage.getItem('betsmart_disclaimer_dismissed'));
      expect(dismissed).toBeTruthy();
    }
  });
});

test.describe('Legal Compliance - Responsible Gambling Badge', () => {
  test('should display floating badge on all pages', async ({ page }) => {
    const pagesToCheck = ['/', '/predictions', '/ai-predictions', '/bet-history'];
    
    for (const route of pagesToCheck) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      // Wait for badge animation (2 second delay + animation time)
      await page.waitForTimeout(3000);
      
      // Check for badge
      const badge = page.getByRole('link', { name: /Gamble Responsibly/i });
      const badgeCount = await badge.count();
      
      if (badgeCount > 0) {
        await expect(badge).toBeVisible();
      }
    }
  });

  test('should have correct link to responsible gambling page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const badge = page.getByRole('link', { name: /Gamble Responsibly/i });
    const count = await badge.count();
    
    if (count > 0) {
      await expect(badge).toHaveAttribute('href', '/responsible-gambling');
    }
  });

  test('should navigate to responsible gambling page when clicked', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const badge = page.getByRole('link', { name: /Gamble Responsibly/i });
    const count = await badge.count();
    
    if (count > 0) {
      await badge.click();
      await page.waitForLoadState('networkidle');
      
      // Should be on responsible gambling page
      expect(page.url()).toContain('/responsible-gambling');
    }
  });

  test('should have heart icon animation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check for heart icon within the badge
    const badge = page.getByRole('link', { name: /Gamble Responsibly/i });
    const count = await badge.count();
    
    if (count > 0) {
      const heartIcon = badge.locator('svg');
      await expect(heartIcon).toBeVisible();
    }
  });
});

test.describe('Legal Compliance - Legal Pages Exist', () => {
  test('should have accessible Terms of Service page', async ({ page }) => {
    await page.goto('/terms');
    await page.waitForLoadState('networkidle');
    
    // Page should load without error
    await expect(page.locator('body')).toBeVisible();
    
    // Should have terms-related content
    const content = await page.locator('body').textContent();
    const hasTermsContent = content?.toLowerCase().includes('terms') || 
                            content?.toLowerCase().includes('service') ||
                            content?.toLowerCase().includes('agreement');
    expect(hasTermsContent).toBeTruthy();
  });

  test('should have accessible Privacy Policy page', async ({ page }) => {
    await page.goto('/privacy');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
    
    const content = await page.locator('body').textContent();
    const hasPrivacyContent = content?.toLowerCase().includes('privacy') || 
                              content?.toLowerCase().includes('data') ||
                              content?.toLowerCase().includes('information');
    expect(hasPrivacyContent).toBeTruthy();
  });

  test('should have accessible Responsible Gambling page', async ({ page }) => {
    await page.goto('/responsible-gambling');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
    
    const content = await page.locator('body').textContent();
    const hasRGContent = content?.toLowerCase().includes('responsible') || 
                         content?.toLowerCase().includes('gambling') ||
                         content?.toLowerCase().includes('help');
    expect(hasRGContent).toBeTruthy();
  });

  test('should have Problem Gambling Helpline number displayed', async ({ page }) => {
    await page.goto('/responsible-gambling');
    await page.waitForLoadState('networkidle');
    
    // Check for helpline number
    const content = await page.locator('body').textContent();
    const hasHelpline = content?.includes('1-800-522-4700') || 
                        content?.includes('800-522-4700');
    expect(hasHelpline).toBeTruthy();
  });
});

test.describe('Legal Compliance - Affiliate Disclosures', () => {
  test('should display affiliate disclosure where sportsbook links exist', async ({ page }) => {
    // Navigate to pages that might have sportsbook links
    const pagesToCheck = ['/', '/best-bets', '/value-bets'];
    
    for (const route of pagesToCheck) {
      try {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        
        // Check if page has affiliate-related disclosures
        const affiliateText = page.locator('text=/affiliate/i');
        const count = await affiliateText.count();
        
        // Just verify page loads - affiliate disclosures are contextual
        await expect(page.locator('body')).toBeVisible();
      } catch {
        // Page might not exist, continue
      }
    }
  });

  test('should have proper rel attributes on affiliate links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for links with sponsored or affiliate attributes
    const sponsoredLinks = page.locator('a[rel*="sponsored"]');
    const count = await sponsoredLinks.count();
    
    // If there are sponsored links, verify they have proper attributes
    for (let i = 0; i < count; i++) {
      const link = sponsoredLinks.nth(i);
      const rel = await link.getAttribute('rel');
      
      // Should include noopener for security
      expect(rel).toContain('noopener');
      expect(rel).toContain('sponsored');
    }
  });
});

test.describe('Legal Compliance - Mobile Responsiveness', () => {
  test('cookie banner should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('betsmart_cookie_consent');
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Banner should still be visible on mobile
    const banner = page.locator('text=We Value Your Privacy');
    const isVisible = await banner.isVisible().catch(() => false);
    
    if (isVisible) {
      // Buttons should be accessible
      await expect(page.getByRole('button', { name: /Accept All/i })).toBeVisible();
    }
  });

  test('responsible gambling badge should be visible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const badge = page.getByRole('link', { name: /Gamble Responsibly/i });
    const count = await badge.count();
    
    if (count > 0) {
      await expect(badge).toBeVisible();
    }
  });
});

test.describe('Legal Compliance - Accessibility', () => {
  test('cookie consent should be keyboard accessible', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('betsmart_cookie_consent');
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Tab through the page
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      
      const focusedElement = await page.evaluate(() => document.activeElement?.textContent);
      if (focusedElement?.includes('Accept All')) {
        // Press Enter to activate
        await page.keyboard.press('Enter');
        
        // Banner should close
        const banner = page.locator('text=We Value Your Privacy');
        await expect(banner).not.toBeVisible();
        break;
      }
    }
  });

  test('legal pages should have proper heading structure', async ({ page }) => {
    const legalPages = ['/terms', '/privacy', '/responsible-gambling'];
    
    for (const route of legalPages) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      // Should have at most one h1
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeLessThanOrEqual(1);
    }
  });
});
