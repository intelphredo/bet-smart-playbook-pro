import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests
 * These tests capture screenshots and compare against baseline images
 * to detect unintended UI changes automatically.
 * 
 * First run creates baseline snapshots in e2e/__screenshots__/
 * Subsequent runs compare against baselines and fail on differences.
 * 
 * To update baselines: npx playwright test --update-snapshots
 */

test.describe('Visual Regression - Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for fonts and images to load
    await page.waitForLoadState('networkidle');
  });

  test('home page matches snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for dynamic content to settle
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('home-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01, // Allow 1% difference for anti-aliasing
    });
  });

  test('auth page matches snapshot', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('auth-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('predictions page matches snapshot', async ({ page }) => {
    await page.goto('/predictions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('predictions-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });
});

test.describe('Visual Regression - Responsive', () => {
  test('home page mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('home-page-mobile.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02, // Slightly higher tolerance for mobile
    });
  });

  test('home page tablet view', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('home-page-tablet.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test('auth page mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('auth-page-mobile.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Visual Regression - Components', () => {
  test('navigation component', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const nav = page.locator('nav');
    if (await nav.isVisible()) {
      await expect(nav).toHaveScreenshot('navigation.png', {
        maxDiffPixelRatio: 0.01,
      });
    }
  });

  test('auth form component', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    const form = page.locator('form').first();
    if (await form.isVisible()) {
      await expect(form).toHaveScreenshot('auth-form.png', {
        maxDiffPixelRatio: 0.01,
      });
    }
  });
});

test.describe('Visual Regression - Dark Mode', () => {
  test('home page dark mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if dark mode toggle exists and click it
    const darkModeToggle = page.locator('[data-testid="theme-toggle"]');
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click();
      await page.waitForTimeout(300); // Wait for theme transition
    }
    
    await expect(page).toHaveScreenshot('home-page-dark.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Visual Regression - Interactive States', () => {
  test('button hover states', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    const button = page.getByRole('button').first();
    if (await button.isVisible()) {
      await button.hover();
      await page.waitForTimeout(200);
      
      await expect(button).toHaveScreenshot('button-hover.png', {
        maxDiffPixelRatio: 0.05, // Higher tolerance for hover effects
      });
    }
  });

  test('input focus states', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    const input = page.getByPlaceholder(/email/i);
    if (await input.isVisible()) {
      await input.focus();
      await page.waitForTimeout(200);
      
      await expect(input).toHaveScreenshot('input-focus.png', {
        maxDiffPixelRatio: 0.05,
      });
    }
  });
});

test.describe('Visual Regression - Error States', () => {
  test('auth validation error', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /sign in/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(500);
      
      // Capture form with validation errors
      const form = page.locator('form').first();
      if (await form.isVisible()) {
        await expect(form).toHaveScreenshot('auth-form-error.png', {
          maxDiffPixelRatio: 0.02,
        });
      }
    }
  });
});
