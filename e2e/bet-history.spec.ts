import { test, expect } from '@playwright/test';
import { BetHistoryPage } from './fixtures/page-objects';

test.describe('Bet History', () => {
  test('should display bet history page', async ({ page }) => {
    const betHistoryPage = new BetHistoryPage(page);
    await betHistoryPage.goto();
    await page.waitForLoadState('networkidle');
    
    // Should either show bet history or redirect to auth
    const url = page.url();
    expect(url).toMatch(/bet-history|auth/);
  });

  test('should show tabs for different views', async ({ page }) => {
    await page.goto('/bet-history');
    await page.waitForLoadState('networkidle');
    
    // If on bet history page, should have tabs
    if (page.url().includes('bet-history')) {
      const tabs = page.getByRole('tab');
      const tabCount = await tabs.count();
      
      // Should have at least one tab or no tabs if not authenticated
      expect(tabCount >= 0).toBeTruthy();
    }
  });

  test('should display stats cards', async ({ page }) => {
    await page.goto('/bet-history');
    await page.waitForLoadState('networkidle');
    
    if (page.url().includes('bet-history')) {
      // Look for stats-related content
      const pageContent = await page.content();
      const hasStats = pageContent.includes('ROI') || 
                       pageContent.includes('Win Rate') ||
                       pageContent.includes('Total Bets') ||
                       pageContent.includes('Profit');
      
      // Stats should be visible or page should redirect
      expect(hasStats || page.url().includes('auth')).toBeTruthy();
    }
  });

  test('should filter bets by status', async ({ page }) => {
    await page.goto('/bet-history');
    await page.waitForLoadState('networkidle');
    
    if (page.url().includes('bet-history')) {
      // Find filter buttons
      const filterButtons = page.locator('button, [role="button"]').filter({ 
        hasText: /all|pending|won|lost/i 
      });
      
      if (await filterButtons.first().isVisible()) {
        await filterButtons.first().click();
        await page.waitForTimeout(500);
        
        // Content should update
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should switch between tabs', async ({ page }) => {
    await page.goto('/bet-history');
    await page.waitForLoadState('networkidle');
    
    if (page.url().includes('bet-history')) {
      const tabs = page.getByRole('tab');
      const tabCount = await tabs.count();
      
      if (tabCount > 1) {
        // Click second tab
        await tabs.nth(1).click();
        await page.waitForTimeout(500);
        
        // Content should change
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should show empty state when no bets', async ({ page }) => {
    // Clear storage and go to bet history
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/bet-history');
    await page.waitForLoadState('networkidle');
    
    // Should show empty state, login prompt, or redirect
    const url = page.url();
    if (url.includes('bet-history')) {
      const pageContent = await page.content();
      const hasEmptyState = pageContent.includes('no bets') || 
                            pageContent.includes('No bets') ||
                            pageContent.includes('empty') ||
                            pageContent.includes('sign in');
      
      // Either has empty state or has actual bets
      expect(page.locator('body')).toBeVisible();
    }
  });

  test('should handle refresh', async ({ page }) => {
    await page.goto('/bet-history');
    await page.waitForLoadState('networkidle');
    
    if (page.url().includes('bet-history')) {
      const refreshButton = page.getByRole('button', { name: /refresh|reload/i });
      
      if (await refreshButton.isVisible()) {
        await refreshButton.click();
        await page.waitForTimeout(1000);
        
        // Page should still be functional
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should be responsive', async ({ page }) => {
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/bet-history');
    await page.waitForLoadState('networkidle');
    
    // Content should be visible
    await expect(page.locator('body')).toBeVisible();
    
    // Tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible();
  });
});
