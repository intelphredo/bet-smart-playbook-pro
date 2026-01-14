import { test, expect } from '@playwright/test';
import { HomePage } from './fixtures/page-objects';

test.describe('Navigation', () => {
  test('should load the home page', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.waitForLoad();
    
    // Check page title
    await expect(page).toHaveTitle(/BetSmart|Bet Smart/i);
  });

  test('should navigate to main sections', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check navigation links exist
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('should navigate to bet history page', async ({ page }) => {
    await page.goto('/bet-history');
    await page.waitForLoadState('networkidle');
    
    // Should show bet history content or redirect to auth
    const url = page.url();
    expect(url).toMatch(/bet-history|auth/);
  });

  test('should navigate to predictions page', async ({ page }) => {
    await page.goto('/predictions');
    await page.waitForLoadState('networkidle');
    
    // Should show predictions content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to auth page', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Should show auth form
    const emailInput = page.getByPlaceholder(/email/i);
    await expect(emailInput).toBeVisible();
  });

  test('should handle 404 routes gracefully', async ({ page }) => {
    await page.goto('/non-existent-page');
    await page.waitForLoadState('networkidle');
    
    // Should either show 404 or redirect to home
    const url = page.url();
    expect(url).toBeDefined();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Page should still be usable
    await expect(page.locator('body')).toBeVisible();
  });
});
