import { Page, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

/**
 * Visual Testing Utilities
 * Helper functions for Percy and Playwright visual testing
 */

export interface VisualTestOptions {
  /** Name for the snapshot */
  name: string;
  /** Responsive widths to test */
  widths?: number[];
  /** Minimum viewport height */
  minHeight?: number;
  /** Wait time for animations (ms) */
  waitTime?: number;
  /** Whether to capture full page */
  fullPage?: boolean;
  /** CSS to inject before snapshot */
  percyCSS?: string;
  /** Max diff pixel ratio for Playwright snapshots */
  maxDiffPixelRatio?: number;
}

const DEFAULT_OPTIONS: Partial<VisualTestOptions> = {
  widths: [375, 768, 1280],
  minHeight: 1024,
  waitTime: 500,
  fullPage: true,
  maxDiffPixelRatio: 0.01,
};

/**
 * Take a Percy snapshot with sensible defaults
 */
export async function takePercySnapshot(
  page: Page,
  options: VisualTestOptions
): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(opts.waitTime!);
  
  await percySnapshot(page, opts.name, {
    widths: opts.widths,
    minHeight: opts.minHeight,
    percyCSS: opts.percyCSS,
  });
}

/**
 * Take a Playwright screenshot with sensible defaults
 */
export async function takePlaywrightSnapshot(
  page: Page,
  options: VisualTestOptions
): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(opts.waitTime!);
  
  await expect(page).toHaveScreenshot(`${opts.name}.png`, {
    fullPage: opts.fullPage,
    maxDiffPixelRatio: opts.maxDiffPixelRatio,
  });
}

/**
 * Capture snapshots at all responsive breakpoints
 */
export async function captureResponsiveSnapshots(
  page: Page,
  baseName: string,
  path: string
): Promise<void> {
  const breakpoints = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'wide', width: 1536, height: 864 },
  ];

  for (const { name, width, height } of breakpoints) {
    await page.setViewportSize({ width, height });
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
    
    await expect(page).toHaveScreenshot(`${baseName}-${name}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  }
}

/**
 * Stabilize page for consistent screenshots
 * - Disables animations
 * - Hides dynamic content
 * - Waits for fonts
 */
export async function stabilizePage(page: Page): Promise<void> {
  // Disable CSS animations and transitions
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  });

  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready);

  // Small delay for any remaining renders
  await page.waitForTimeout(100);
}

/**
 * Hide dynamic content that changes between runs
 */
export async function hideDynamicContent(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      /* Hide timestamps */
      [data-testid*="timestamp"],
      [class*="timestamp"],
      time {
        visibility: hidden !important;
      }
      
      /* Hide avatars that might load differently */
      [data-testid*="avatar"] img {
        visibility: hidden !important;
      }
      
      /* Hide loading spinners */
      [data-testid="loading"],
      .animate-spin {
        visibility: hidden !important;
      }
    `,
  });
}

/**
 * Set up dark mode for testing
 */
export async function enableDarkMode(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  });
  await page.waitForTimeout(100);
}

/**
 * Set up light mode for testing
 */
export async function enableLightMode(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  });
  await page.waitForTimeout(100);
}

/**
 * Mock API responses for consistent snapshots
 */
export async function mockApiResponses(page: Page): Promise<void> {
  await page.route('**/functions/v1/**', async (route) => {
    const url = route.request().url();
    
    if (url.includes('fetch-odds')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          events: [
            {
              id: 'mock-1',
              name: 'Team A vs Team B',
              commence_time: new Date().toISOString(),
              home_team: 'Team A',
              away_team: 'Team B',
            },
          ],
        }),
      });
    } else {
      await route.continue();
    }
  });
}
