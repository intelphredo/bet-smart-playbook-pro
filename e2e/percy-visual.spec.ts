import { test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

/**
 * Percy Visual Regression Tests
 * 
 * Percy provides cloud-based visual testing with:
 * - Automatic baseline management
 * - Visual review workflows with approval/rejection
 * - Cross-browser rendering comparisons
 * - Responsive width testing
 * - Integration with CI/CD pipelines
 * 
 * Setup:
 * 1. Create Percy account at https://percy.io
 * 2. Add PERCY_TOKEN to your environment/CI secrets
 * 3. Run: npx percy exec -- npx playwright test e2e/percy-visual.spec.ts
 * 
 * Percy Dashboard: Review visual changes at https://percy.io
 */

test.describe('Percy Visual Testing - Core Pages', () => {
  test('home page visual snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Wait for animations
    
    await percySnapshot(page, 'Home Page', {
      widths: [375, 768, 1280], // Test multiple responsive widths
      minHeight: 1024,
    });
  });

  test('auth page visual snapshot', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
    
    await percySnapshot(page, 'Auth Page', {
      widths: [375, 768, 1280],
      minHeight: 800,
    });
  });

  test('predictions page visual snapshot', async ({ page }) => {
    await page.goto('/predictions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await percySnapshot(page, 'Predictions Page', {
      widths: [375, 768, 1280],
      minHeight: 1024,
    });
  });
});

test.describe('Percy Visual Testing - User Flows', () => {
  test('authentication flow snapshots', async ({ page }) => {
    // Initial state
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    await percySnapshot(page, 'Auth Flow - Initial', {
      widths: [1280],
    });

    // With email entered
    const emailInput = page.getByPlaceholder(/email/i);
    if (await emailInput.isVisible()) {
      await emailInput.fill('user@example.com');
      await percySnapshot(page, 'Auth Flow - Email Entered', {
        widths: [1280],
      });
    }

    // With password entered
    const passwordInput = page.getByPlaceholder(/password/i);
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('securepassword');
      await percySnapshot(page, 'Auth Flow - Form Filled', {
        widths: [1280],
      });
    }
  });

  test('navigation flow snapshots', async ({ page }) => {
    // Home
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await percySnapshot(page, 'Navigation - Home', { widths: [1280] });

    // Predictions
    await page.goto('/predictions');
    await page.waitForLoadState('networkidle');
    await percySnapshot(page, 'Navigation - Predictions', { widths: [1280] });

    // Bet History (may redirect to auth)
    await page.goto('/bet-history');
    await page.waitForLoadState('networkidle');
    await percySnapshot(page, 'Navigation - Bet History', { widths: [1280] });
  });
});

test.describe('Percy Visual Testing - Component States', () => {
  test('form validation states', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    // Try to submit empty form to trigger validation
    const submitButton = page.getByRole('button', { name: /sign in/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(500);
      
      await percySnapshot(page, 'Auth Form - Validation Errors', {
        widths: [375, 1280],
      });
    }
  });

  test('interactive element states', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    // Focus state
    const emailInput = page.getByPlaceholder(/email/i);
    if (await emailInput.isVisible()) {
      await emailInput.focus();
      await percySnapshot(page, 'Input - Focus State', {
        widths: [1280],
        percyCSS: `
          /* Stabilize focus ring for consistent snapshots */
          *:focus { outline-offset: 2px !important; }
        `,
      });
    }
  });
});

test.describe('Percy Visual Testing - Responsive Breakpoints', () => {
  const pages = [
    { path: '/', name: 'Home' },
    { path: '/auth', name: 'Auth' },
    { path: '/predictions', name: 'Predictions' },
  ];

  for (const { path, name } of pages) {
    test(`${name} page responsive snapshots`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);
      
      // Percy will automatically capture at all specified widths
      await percySnapshot(page, `Responsive - ${name}`, {
        widths: [320, 375, 640, 768, 1024, 1280, 1536],
        minHeight: 800,
      });
    });
  }
});

test.describe('Percy Visual Testing - Dark Mode', () => {
  test('dark mode page snapshots', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Try to toggle dark mode
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(500); // Wait for theme transition
    } else {
      // Fallback: Force dark mode via class
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
      await page.waitForTimeout(300);
    }
    
    await percySnapshot(page, 'Home Page - Dark Mode', {
      widths: [375, 1280],
    });

    // Auth page dark mode
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Auth Page - Dark Mode', {
      widths: [375, 1280],
    });
  });
});
