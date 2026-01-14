import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for Critical User Flows
 * Captures screenshots at each step of important user journeys
 * to ensure consistent UI throughout the experience.
 */

test.describe('Visual Regression - Authentication Flow', () => {
  test('complete auth flow screenshots', async ({ page }) => {
    // Step 1: Initial auth page
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
    
    await expect(page).toHaveScreenshot('auth-flow-01-initial.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });

    // Step 2: Email entered
    const emailInput = page.getByPlaceholder(/email/i);
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
      await page.waitForTimeout(200);
      
      await expect(page).toHaveScreenshot('auth-flow-02-email-entered.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      });
    }

    // Step 3: Password entered
    const passwordInput = page.getByPlaceholder(/password/i);
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('password123');
      await page.waitForTimeout(200);
      
      await expect(page).toHaveScreenshot('auth-flow-03-password-entered.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      });
    }
  });
});

test.describe('Visual Regression - Navigation Flow', () => {
  test('page navigation screenshots', async ({ page }) => {
    // Home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('nav-flow-01-home.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });

    // Navigate to predictions
    await page.goto('/predictions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('nav-flow-02-predictions.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });

    // Navigate to auth
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('nav-flow-03-auth.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });
});

test.describe('Visual Regression - Loading States', () => {
  test('page loading skeleton', async ({ page }) => {
    // Navigate with slower connection to capture loading state
    await page.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.continue();
    });

    await page.goto('/');
    
    // Try to capture loading state (if visible)
    const loading = page.locator('[data-testid="loading"], .animate-pulse, [class*="skeleton"]');
    if (await loading.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(page).toHaveScreenshot('loading-state.png', {
        maxDiffPixelRatio: 0.1, // Higher tolerance for loading animations
      });
    }
    
    // Then capture loaded state
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('loaded-state.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Visual Regression - Empty States', () => {
  test('empty predictions state', async ({ page }) => {
    // Mock empty data response
    await page.route('**/functions/v1/**', async (route) => {
      if (route.request().url().includes('fetch-odds')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ events: [] }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/predictions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('empty-predictions.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Visual Regression - Breakpoints', () => {
  const breakpoints = [
    { name: 'xs', width: 320, height: 568 },
    { name: 'sm', width: 640, height: 800 },
    { name: 'md', width: 768, height: 1024 },
    { name: 'lg', width: 1024, height: 768 },
    { name: 'xl', width: 1280, height: 800 },
    { name: '2xl', width: 1536, height: 864 },
  ];

  for (const { name, width, height } of breakpoints) {
    test(`home page at ${name} breakpoint (${width}x${height})`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot(`home-breakpoint-${name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
      });
    });
  }
});
