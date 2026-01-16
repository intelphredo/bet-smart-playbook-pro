import { test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

/**
 * Percy Visual Regression Tests for Legal Compliance Components
 * 
 * Captures visual snapshots of:
 * - Cookie Consent Banner (initial and preferences views)
 * - Prediction Disclaimer (all variants)
 * - Responsible Gambling Badge
 * - Affiliate Disclosure components
 * - Legal Pages (Terms, Privacy, Responsible Gambling)
 * 
 * Run: npx percy exec -- npx playwright test e2e/percy-legal-compliance.spec.ts
 */

test.describe('Percy Visual Testing - Cookie Consent', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('betsmart_cookie_consent');
      localStorage.removeItem('betsmart_cookie_preferences');
    });
  });

  test('cookie consent banner - initial view', async ({ page }) => {
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for cookie banner to appear (1 second delay + animation)
    await page.waitForTimeout(1800);
    
    await percySnapshot(page, 'Cookie Consent - Initial Banner', {
      widths: [375, 768, 1280],
      minHeight: 800,
      percyCSS: `
        /* Disable animations for consistent snapshots */
        *, *::before, *::after {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
      `,
    });
  });

  test('cookie consent banner - preferences panel', async ({ page }) => {
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1800);
    
    // Open preferences panel
    const customizeButton = page.getByRole('button', { name: /Customize/i });
    if (await customizeButton.isVisible()) {
      await customizeButton.click();
      await page.waitForTimeout(500);
      
      await percySnapshot(page, 'Cookie Consent - Preferences Panel', {
        widths: [375, 768, 1280],
        minHeight: 900,
        percyCSS: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            transition-duration: 0s !important;
          }
        `,
      });
    }
  });

  test('cookie consent - analytics toggle enabled', async ({ page }) => {
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1800);
    
    // Open preferences and toggle analytics
    const customizeButton = page.getByRole('button', { name: /Customize/i });
    if (await customizeButton.isVisible()) {
      await customizeButton.click();
      await page.waitForTimeout(300);
      
      // Toggle analytics switch
      const analyticsSection = page.locator('text=Analytics Cookies').locator('..').locator('..');
      const analyticsSwitch = analyticsSection.locator('button[role="switch"]');
      if (await analyticsSwitch.isVisible()) {
        await analyticsSwitch.click();
        await page.waitForTimeout(200);
      }
      
      await percySnapshot(page, 'Cookie Consent - Analytics Enabled', {
        widths: [375, 1280],
        percyCSS: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            transition-duration: 0s !important;
          }
        `,
      });
    }
  });

  test('cookie consent - mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1800);
    
    await percySnapshot(page, 'Cookie Consent - Mobile', {
      widths: [375],
      minHeight: 667,
      percyCSS: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
      `,
    });
  });
});

test.describe('Percy Visual Testing - Responsible Gambling Badge', () => {
  test('responsible gambling badge - desktop', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for badge animation (2 second delay + animation)
    await page.waitForTimeout(3000);
    
    await percySnapshot(page, 'Responsible Gambling Badge - Desktop', {
      widths: [1280],
      minHeight: 800,
      percyCSS: `
        /* Disable pulsing animation */
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0s !important;
        }
      `,
    });
  });

  test('responsible gambling badge - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    await percySnapshot(page, 'Responsible Gambling Badge - Mobile', {
      widths: [375],
      minHeight: 667,
      percyCSS: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0s !important;
        }
      `,
    });
  });

  test('responsible gambling badge - hover state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Hover over the badge
    const badge = page.getByRole('link', { name: /Gamble Responsibly/i });
    if (await badge.isVisible()) {
      await badge.hover();
      await page.waitForTimeout(200);
      
      await percySnapshot(page, 'Responsible Gambling Badge - Hover', {
        widths: [1280],
        percyCSS: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            transition-duration: 0s !important;
          }
        `,
      });
    }
  });

  test('responsible gambling badge - on different pages', async ({ page }) => {
    const pages = [
      { path: '/predictions', name: 'Predictions' },
      { path: '/ai-predictions', name: 'AI Predictions' },
      { path: '/bet-history', name: 'Bet History' },
    ];

    for (const { path, name } of pages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      await percySnapshot(page, `Responsible Gambling Badge - ${name} Page`, {
        widths: [1280],
        percyCSS: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0s !important;
          }
        `,
      });
    }
  });
});

test.describe('Percy Visual Testing - Prediction Disclaimer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('betsmart_disclaimer_dismissed');
    });
  });

  test('prediction disclaimer - predictions page', async ({ page }) => {
    await page.goto('/predictions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await percySnapshot(page, 'Prediction Disclaimer - Predictions Page', {
      widths: [375, 768, 1280],
      minHeight: 800,
      percyCSS: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
      `,
    });
  });

  test('prediction disclaimer - AI predictions page', async ({ page }) => {
    await page.goto('/ai-predictions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await percySnapshot(page, 'Prediction Disclaimer - AI Predictions Page', {
      widths: [375, 768, 1280],
      minHeight: 800,
      percyCSS: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
      `,
    });
  });

  test('prediction disclaimer - mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/predictions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await percySnapshot(page, 'Prediction Disclaimer - Mobile', {
      widths: [375],
      minHeight: 667,
      percyCSS: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
      `,
    });
  });
});

test.describe('Percy Visual Testing - Legal Pages', () => {
  test('terms of service page', async ({ page }) => {
    await page.goto('/terms');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await percySnapshot(page, 'Legal - Terms of Service', {
      widths: [375, 768, 1280],
      minHeight: 1200,
      percyCSS: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
      `,
    });
  });

  test('privacy policy page', async ({ page }) => {
    await page.goto('/privacy');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await percySnapshot(page, 'Legal - Privacy Policy', {
      widths: [375, 768, 1280],
      minHeight: 1200,
      percyCSS: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
      `,
    });
  });

  test('responsible gambling page', async ({ page }) => {
    await page.goto('/responsible-gambling');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await percySnapshot(page, 'Legal - Responsible Gambling', {
      widths: [375, 768, 1280],
      minHeight: 1200,
      percyCSS: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
      `,
    });
  });

  test('legal pages - full page scrolling', async ({ page }) => {
    const legalPages = [
      { path: '/terms', name: 'Terms' },
      { path: '/privacy', name: 'Privacy' },
      { path: '/responsible-gambling', name: 'Responsible Gambling' },
    ];

    for (const { path, name } of legalPages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      
      // Capture full page height
      await percySnapshot(page, `Legal Page Full - ${name}`, {
        widths: [1280],
        minHeight: 2000,
        percyCSS: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            transition-duration: 0s !important;
          }
        `,
      });
    }
  });
});

test.describe('Percy Visual Testing - Affiliate Disclosures', () => {
  test('affiliate disclosure components', async ({ page }) => {
    // Check pages that may have affiliate links
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Capture any page with potential affiliate content
    await percySnapshot(page, 'Affiliate Disclosures - Home Page', {
      widths: [375, 1280],
      percyCSS: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
      `,
    });
  });
});

test.describe('Percy Visual Testing - Legal Components Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('betsmart_cookie_consent');
      localStorage.removeItem('betsmart_disclaimer_dismissed');
    });
  });

  test('cookie consent - dark mode', async ({ page }) => {
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Force dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(1800);
    
    await percySnapshot(page, 'Cookie Consent - Dark Mode', {
      widths: [375, 1280],
      percyCSS: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
      `,
    });
  });

  test('legal pages - dark mode', async ({ page }) => {
    // Force dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    
    await page.goto('/terms');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(300);
    
    await percySnapshot(page, 'Terms Page - Dark Mode', {
      widths: [1280],
      percyCSS: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
      `,
    });

    await page.goto('/privacy');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(300);
    
    await percySnapshot(page, 'Privacy Page - Dark Mode', {
      widths: [1280],
      percyCSS: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
      `,
    });

    await page.goto('/responsible-gambling');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(300);
    
    await percySnapshot(page, 'Responsible Gambling Page - Dark Mode', {
      widths: [1280],
      percyCSS: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
      `,
    });
  });

  test('responsible gambling badge - dark mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Force dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(3000);
    
    await percySnapshot(page, 'Responsible Gambling Badge - Dark Mode', {
      widths: [1280],
      percyCSS: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0s !important;
        }
      `,
    });
  });
});

test.describe('Percy Visual Testing - Legal Components Responsive', () => {
  test('legal pages responsive breakpoints', async ({ page }) => {
    const legalPages = [
      { path: '/terms', name: 'Terms' },
      { path: '/privacy', name: 'Privacy' },
      { path: '/responsible-gambling', name: 'Responsible Gambling' },
    ];

    for (const { path, name } of legalPages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);
      
      await percySnapshot(page, `Responsive Legal - ${name}`, {
        widths: [320, 375, 640, 768, 1024, 1280, 1536],
        minHeight: 800,
        percyCSS: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            transition-duration: 0s !important;
          }
        `,
      });
    }
  });
});
