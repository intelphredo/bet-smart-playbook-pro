import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  generateCacheKey,
  buildLogoUrl,
  getTeamLogo,
  getCacheStats,
  clearLogoCache,
  preloadFromLocalStorage,
  LOGO_SIZES,
} from '../logo-service';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((i: number) => Object.keys(store)[i] || null),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
  } as Response)
);

describe('Logo Service', () => {
  beforeEach(() => {
    clearLogoCache();
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateCacheKey', () => {
    it('should generate consistent cache keys', () => {
      const key1 = generateCacheKey('Lakers', 'NBA', 'medium');
      const key2 = generateCacheKey('Lakers', 'NBA', 'medium');
      expect(key1).toBe(key2);
    });

    it('should normalize team names', () => {
      const key1 = generateCacheKey('Los Angeles Lakers', 'NBA', 'small');
      const key2 = generateCacheKey('los angeles lakers', 'NBA', 'small');
      expect(key1).toBe(key2);
    });

    it('should differentiate by size', () => {
      const keySmall = generateCacheKey('Lakers', 'NBA', 'small');
      const keyMedium = generateCacheKey('Lakers', 'NBA', 'medium');
      const keyLarge = generateCacheKey('Lakers', 'NBA', 'large');
      
      expect(keySmall).not.toBe(keyMedium);
      expect(keyMedium).not.toBe(keyLarge);
    });

    it('should differentiate by sport', () => {
      const keyNBA = generateCacheKey('Lakers', 'nba', 'medium');
      const keyNFL = generateCacheKey('Lakers', 'nfl', 'medium');
      expect(keyNBA).not.toBe(keyNFL);
    });
  });

  describe('buildLogoUrl', () => {
    it('should build NBA logo URLs correctly', () => {
      const url = buildLogoUrl('Lakers', 'NBA');
      expect(url).toContain('espncdn.com');
      expect(url).toContain('nba');
    });

    it('should build NFL logo URLs correctly', () => {
      const url = buildLogoUrl('Patriots', 'NFL');
      expect(url).toContain('espncdn.com');
      expect(url).toContain('nfl');
    });

    it('should build NCAAB logo URLs with team ID', () => {
      const url = buildLogoUrl('Duke', 'NCAAB', '150');
      expect(url).toContain('ncaa');
      expect(url).toContain('150');
    });

    it('should build MLB logo URLs correctly', () => {
      const url = buildLogoUrl('Yankees', 'MLB', '147');
      expect(url).toContain('mlbstatic.com');
    });
  });

  describe('LOGO_SIZES', () => {
    it('should have correct size configurations', () => {
      expect(LOGO_SIZES.small.width).toBe(40);
      expect(LOGO_SIZES.small.height).toBe(40);
      
      expect(LOGO_SIZES.medium.width).toBe(80);
      expect(LOGO_SIZES.medium.height).toBe(80);
      
      expect(LOGO_SIZES.large.width).toBe(120);
      expect(LOGO_SIZES.large.height).toBe(120);
    });
  });

  describe('getTeamLogo', () => {
    it('should return a logo object with URL', async () => {
      const logo = await getTeamLogo('Lakers', 'NBA', 'medium');
      
      expect(logo).toHaveProperty('url');
      expect(logo).toHaveProperty('timestamp');
      expect(logo).toHaveProperty('size');
      expect(logo.size).toBe('medium');
    });

    it('should cache logos in memory', async () => {
      // First call
      await getTeamLogo('Lakers', 'NBA', 'medium');
      const stats1 = getCacheStats();
      
      // Second call should hit memory cache
      await getTeamLogo('Lakers', 'NBA', 'medium');
      const stats2 = getCacheStats();
      
      expect(stats2.memoryHits).toBeGreaterThan(stats1.memoryHits);
    });

    it('should cache logos in localStorage', async () => {
      await getTeamLogo('Celtics', 'NBA', 'small');
      
      // Check localStorage was called
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      const stats = getCacheStats();
      
      expect(stats).toHaveProperty('memoryHits');
      expect(stats).toHaveProperty('localStorageHits');
      expect(stats).toHaveProperty('networkFetches');
      expect(stats).toHaveProperty('failures');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('memoryCacheSize');
    });

    it('should calculate hit rate correctly', async () => {
      // Make some requests
      await getTeamLogo('Lakers', 'NBA', 'medium');
      await getTeamLogo('Lakers', 'NBA', 'medium'); // Should hit cache
      
      const stats = getCacheStats();
      expect(stats.hitRate).toBeGreaterThan(0);
    });
  });

  describe('clearLogoCache', () => {
    it('should clear all cached logos', async () => {
      // Add some logos to cache
      await getTeamLogo('Lakers', 'NBA', 'medium');
      await getTeamLogo('Celtics', 'NBA', 'small');
      
      const statsBefore = getCacheStats();
      expect(statsBefore.memoryCacheSize).toBeGreaterThan(0);
      
      clearLogoCache();
      
      const statsAfter = getCacheStats();
      expect(statsAfter.memoryCacheSize).toBe(0);
    });
  });

  describe('preloadFromLocalStorage', () => {
    it('should load cached entries from localStorage', () => {
      // This function runs automatically on module load
      // Just verify it doesn't throw
      expect(() => preloadFromLocalStorage()).not.toThrow();
    });
  });
});
