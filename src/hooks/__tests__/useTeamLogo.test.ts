import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTeamLogo, getLogoDimensions, getLogoSrcSet } from '../useTeamLogo';

// Mock the logo service
vi.mock('@/services/logo-service', () => ({
  getTeamLogo: vi.fn().mockResolvedValue({
    url: 'https://example.com/logo.png',
    timestamp: Date.now(),
    size: 'medium',
  }),
  prefetchLogos: vi.fn().mockResolvedValue(undefined),
  generateCacheKey: vi.fn().mockReturnValue('test-key'),
  getCacheStats: vi.fn().mockReturnValue({
    memoryHits: 0,
    localStorageHits: 0,
    networkFetches: 1,
    failures: 0,
    hitRate: 0,
    memoryCacheSize: 1,
  }),
  LOGO_SIZES: {
    small: { width: 40, height: 40, suffix: 'sm' },
    medium: { width: 80, height: 80, suffix: 'md' },
    large: { width: 120, height: 120, suffix: 'lg' },
  },
}));

describe('useTeamLogo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return logo URL and loading state', async () => {
    const { result } = renderHook(() =>
      useTeamLogo({
        teamId: 'Lakers',
        sport: 'NBA',
        size: 'medium',
      })
    );

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for logo to load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.logoUrl).toBeTruthy();
    expect(result.current.hasError).toBe(false);
  });

  it('should use direct URL when provided', async () => {
    const directUrl = 'https://direct.com/logo.png';
    
    const { result } = renderHook(() =>
      useTeamLogo({
        teamId: 'Lakers',
        sport: 'NBA',
        directUrl,
      })
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.logoUrl).toBe(directUrl);
  });

  it('should not fetch when disabled', () => {
    const { result } = renderHook(() =>
      useTeamLogo({
        teamId: 'Lakers',
        sport: 'NBA',
        enabled: false,
      })
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.logoUrl).toBe(null);
  });

  it('should provide retry function', async () => {
    const { result } = renderHook(() =>
      useTeamLogo({
        teamId: 'Lakers',
        sport: 'NBA',
      })
    );

    expect(typeof result.current.retry).toBe('function');
  });

  it('should track cache status', async () => {
    const { result } = renderHook(() =>
      useTeamLogo({
        teamId: 'Lakers',
        sport: 'NBA',
      })
    );

    // Initially pending
    expect(result.current.cacheStatus).toBe('pending');

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });
});

describe('getLogoDimensions', () => {
  it('should return correct dimensions for small size', () => {
    const dims = getLogoDimensions('small');
    expect(dims.width).toBe(40);
    expect(dims.height).toBe(40);
  });

  it('should return correct dimensions for medium size', () => {
    const dims = getLogoDimensions('medium');
    expect(dims.width).toBe(80);
    expect(dims.height).toBe(80);
  });

  it('should return correct dimensions for large size', () => {
    const dims = getLogoDimensions('large');
    expect(dims.width).toBe(120);
    expect(dims.height).toBe(120);
  });
});

describe('getLogoSrcSet', () => {
  it('should generate srcset string', () => {
    const srcset = getLogoSrcSet('https://example.com/logo.png');
    
    expect(srcset).toContain('1x');
    expect(srcset).toContain('2x');
    expect(srcset).toContain('3x');
  });
});
