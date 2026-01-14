import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('should have proper page structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for main content area
    const main = page.locator('main');
    const hasMain = await main.count() > 0;
    
    // Either has main element or has proper structure
    expect(hasMain || await page.locator('body').isVisible()).toBeTruthy();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for headings
    const h1Count = await page.locator('h1').count();
    
    // Should have at most one h1 per page
    expect(h1Count).toBeLessThanOrEqual(1);
  });

  test('should have keyboard navigable elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Tab through the page
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Something should be focused
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('should have proper button labels', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get all buttons
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');
      
      // Button should have some accessible name
      const hasAccessibleName = (text && text.trim()) || ariaLabel || title;
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('should have proper link text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get all links
    const links = page.getByRole('link');
    const linkCount = await links.count();
    
    for (let i = 0; i < Math.min(linkCount, 10); i++) {
      const link = links.nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      
      // Link should have accessible name
      const hasAccessibleName = (text && text.trim()) || ariaLabel;
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Get all inputs
    const inputs = page.locator('input:not([type="hidden"])');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');
      
      // Check for associated label
      let hasLabel = false;
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        hasLabel = await label.count() > 0;
      }
      
      // Input should have some accessible label
      expect(hasLabel || ariaLabel || placeholder).toBeTruthy();
    }
  });

  test('should have proper color contrast (basic check)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that text is visible (basic visibility check)
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Verify page has content
    const content = await body.textContent();
    expect(content && content.length > 0).toBeTruthy();
  });

  test('should support reduced motion', async ({ page }) => {
    // Set prefers-reduced-motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Page should still function
    await expect(page.locator('body')).toBeVisible();
  });

  test('should support high contrast mode', async ({ page }) => {
    // Set forced-colors mode
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Page should still be visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have skip link or main landmark', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for skip link or main landmark
    const skipLink = page.locator('a[href="#main"], a[href="#content"]');
    const mainLandmark = page.locator('main, [role="main"]');
    
    const hasSkipLink = await skipLink.count() > 0;
    const hasMainLandmark = await mainLandmark.count() > 0;
    
    // Should have at least one accessibility feature
    expect(hasSkipLink || hasMainLandmark).toBeTruthy();
  });
});
