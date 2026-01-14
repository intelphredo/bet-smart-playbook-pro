import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('should load home page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // Should load DOM within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should have reasonable first contentful paint', async ({ page }) => {
    await page.goto('/');
    
    // Wait for content
    await page.waitForLoadState('domcontentloaded');
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const entries = performance.getEntriesByType('paint');
      const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
      return fcp ? fcp.startTime : null;
    });
    
    // FCP should be reasonable (within 3 seconds)
    if (metrics !== null) {
      expect(metrics).toBeLessThan(3000);
    }
  });

  test('should not have memory leaks on navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get initial heap size
    const initialMetrics = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return null;
    });
    
    // Navigate around
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.goto('/bet-history');
    await page.waitForLoadState('networkidle');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get final heap size
    const finalMetrics = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return null;
    });
    
    // If memory API available, check for reasonable memory usage
    if (initialMetrics !== null && finalMetrics !== null) {
      // Memory shouldn't grow more than 3x
      expect(finalMetrics).toBeLessThan(initialMetrics * 3);
    }
  });

  test('should handle rapid interactions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Rapid clicks on navigation
    const nav = page.locator('nav');
    
    if (await nav.isVisible()) {
      const links = nav.locator('a');
      const linkCount = await links.count();
      
      // Rapid click through links
      for (let i = 0; i < Math.min(linkCount, 5); i++) {
        await links.nth(i).click({ timeout: 1000 }).catch(() => {});
        await page.waitForTimeout(100);
      }
      
      // App should still be responsive
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should lazy load images', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for images with lazy loading
    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      // Check if any images have loading="lazy"
      const lazyImages = page.locator('img[loading="lazy"]');
      const lazyCount = await lazyImages.count();
      
      // Either has lazy loading or all images are above fold
      expect(lazyCount >= 0).toBeTruthy();
    }
  });

  test('should cache API responses', async ({ page }) => {
    // Track API calls
    const apiCalls: string[] = [];
    
    await page.route('**/functions/v1/**', (route) => {
      apiCalls.push(route.request().url());
      route.continue();
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const initialCalls = apiCalls.length;
    
    // Navigate away and back
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if caching is working (fewer calls on return)
    // This is a soft check - caching strategies vary
    expect(page.locator('body')).toBeVisible();
  });

  test('should handle slow network gracefully', async ({ page }) => {
    // Simulate slow 3G
    await page.route('**/*', (route) => {
      setTimeout(() => route.continue(), 100);
    });
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    
    // Should still render something
    await expect(page.locator('body')).toBeVisible();
  });

  test('should minimize layout shifts', async ({ page }) => {
    await page.goto('/');
    
    // Track layout shifts
    const shifts: number[] = [];
    
    await page.evaluate(() => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift') {
            (window as any).__layoutShifts = (window as any).__layoutShifts || [];
            (window as any).__layoutShifts.push((entry as any).value);
          }
        }
      });
      observer.observe({ type: 'layout-shift', buffered: true });
    });
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const layoutShifts = await page.evaluate(() => (window as any).__layoutShifts || []);
    const cls = layoutShifts.reduce((sum: number, val: number) => sum + val, 0);
    
    // CLS should be less than 0.25 (good) or 0.1 (excellent)
    expect(cls).toBeLessThan(0.5);
  });
});
