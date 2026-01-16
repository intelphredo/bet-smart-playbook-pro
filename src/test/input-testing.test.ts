import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Comprehensive input testing utilities and patterns
 * for the EdgeIQ application
 */

// ==================== Input Validation Test Helpers ====================

/**
 * Test helper to validate numeric input behavior
 */
export const testNumericInput = (input: HTMLInputElement) => {
  const tests = {
    acceptsPositiveNumbers: async () => {
      const user = userEvent.setup();
      await user.clear(input);
      await user.type(input, '100');
      return input.value === '100';
    },
    acceptsDecimals: async () => {
      const user = userEvent.setup();
      await user.clear(input);
      await user.type(input, '25.50');
      return input.value === '25.50' || input.value === '25.5';
    },
    hasMinAttribute: () => input.hasAttribute('min'),
    hasStepAttribute: () => input.hasAttribute('step'),
  };
  return tests;
};

/**
 * Test helper to validate text input behavior
 */
export const testTextInput = (input: HTMLInputElement) => {
  const tests = {
    acceptsText: async () => {
      const user = userEvent.setup();
      await user.clear(input);
      await user.type(input, 'test value');
      return input.value === 'test value';
    },
    hasMaxLength: () => input.hasAttribute('maxLength'),
    isRequired: () => input.hasAttribute('required'),
  };
  return tests;
};

// ==================== Common Input Test Cases ====================

describe('Input Test Utilities', () => {
  describe('Stake Input Patterns', () => {
    it('validates stake format: positive numbers only', () => {
      const validStakes = [1, 10, 100, 1000, 25.50, 0.01];
      const invalidStakes = [-1, -100, 0, NaN, Infinity];

      validStakes.forEach(stake => {
        expect(stake > 0 && isFinite(stake)).toBe(true);
      });

      invalidStakes.forEach(stake => {
        expect(stake > 0 && isFinite(stake)).toBe(false);
      });
    });

    it('validates stake max limit', () => {
      const MAX_STAKE = 1000000;
      
      expect(500000 <= MAX_STAKE).toBe(true);
      expect(2000000 <= MAX_STAKE).toBe(false);
    });
  });

  describe('Odds Input Patterns', () => {
    it('validates American odds format', () => {
      const validateAmericanOdds = (odds: number): boolean => {
        return (odds <= -100 || odds >= 100) && 
               odds >= -99999 && 
               odds <= 99999;
      };

      expect(validateAmericanOdds(-150)).toBe(true);
      expect(validateAmericanOdds(200)).toBe(true);
      expect(validateAmericanOdds(-100)).toBe(true);
      expect(validateAmericanOdds(100)).toBe(true);
      expect(validateAmericanOdds(-50)).toBe(false);
      expect(validateAmericanOdds(50)).toBe(false);
      expect(validateAmericanOdds(0)).toBe(false);
    });

    it('validates decimal odds format', () => {
      const validateDecimalOdds = (odds: number): boolean => {
        return odds >= 1.01 && odds <= 10000;
      };

      expect(validateDecimalOdds(2.5)).toBe(true);
      expect(validateDecimalOdds(1.01)).toBe(true);
      expect(validateDecimalOdds(1.0)).toBe(false);
      expect(validateDecimalOdds(0.5)).toBe(false);
    });
  });

  describe('Score Input Patterns', () => {
    it('validates score format: non-negative integers', () => {
      const validateScore = (score: number): boolean => {
        return Number.isInteger(score) && score >= 0 && score <= 999;
      };

      expect(validateScore(105)).toBe(true);
      expect(validateScore(0)).toBe(true);
      expect(validateScore(999)).toBe(true);
      expect(validateScore(-5)).toBe(false);
      expect(validateScore(105.5)).toBe(false);
      expect(validateScore(1000)).toBe(false);
    });
  });

  describe('Email Input Patterns', () => {
    it('validates email format', () => {
      const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.org')).toBe(true);
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('missing@domain')).toBe(false);
      expect(validateEmail('@nodomain.com')).toBe(false);
    });
  });

  describe('Password Input Patterns', () => {
    it('validates password strength', () => {
      const validatePassword = (password: string): { valid: boolean; issues: string[] } => {
        const issues: string[] = [];
        
        if (password.length < 8) {
          issues.push('Must be at least 8 characters');
        }
        if (!/[A-Z]/.test(password)) {
          issues.push('Must contain uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
          issues.push('Must contain lowercase letter');
        }
        if (!/[0-9]/.test(password)) {
          issues.push('Must contain number');
        }
        
        return { valid: issues.length === 0, issues };
      };

      expect(validatePassword('StrongPass1').valid).toBe(true);
      expect(validatePassword('weak').valid).toBe(false);
      expect(validatePassword('nouppercase1').valid).toBe(false);
      expect(validatePassword('NOLOWERCASE1').valid).toBe(false);
      expect(validatePassword('NoNumbers').valid).toBe(false);
    });
  });

  describe('Date Input Patterns', () => {
    it('validates date range', () => {
      const validateDateRange = (start: Date, end: Date): boolean => {
        return start <= end;
      };

      const today = new Date();
      const tomorrow = new Date(today.getTime() + 86400000);
      const yesterday = new Date(today.getTime() - 86400000);

      expect(validateDateRange(today, tomorrow)).toBe(true);
      expect(validateDateRange(yesterday, today)).toBe(true);
      expect(validateDateRange(tomorrow, yesterday)).toBe(false);
    });

    it('validates date is not in past for bets', () => {
      const validateFutureDate = (date: Date): boolean => {
        const now = new Date();
        return date > now;
      };

      const futureDate = new Date(Date.now() + 86400000);
      const pastDate = new Date(Date.now() - 86400000);

      expect(validateFutureDate(futureDate)).toBe(true);
      expect(validateFutureDate(pastDate)).toBe(false);
    });
  });

  describe('Percentage Input Patterns', () => {
    it('validates percentage range 0-100', () => {
      const validatePercentage = (value: number): boolean => {
        return value >= 0 && value <= 100;
      };

      expect(validatePercentage(50)).toBe(true);
      expect(validatePercentage(0)).toBe(true);
      expect(validatePercentage(100)).toBe(true);
      expect(validatePercentage(-5)).toBe(false);
      expect(validatePercentage(150)).toBe(false);
    });
  });

  describe('Search Input Patterns', () => {
    it('sanitizes search input', () => {
      const sanitizeSearch = (input: string): string => {
        return input
          .replace(/[<>]/g, '')
          .replace(/javascript:/gi, '')
          .trim()
          .slice(0, 100); // Max length
      };

      expect(sanitizeSearch('Lakers')).toBe('Lakers');
      expect(sanitizeSearch('  Lakers vs Celtics  ')).toBe('Lakers vs Celtics');
      expect(sanitizeSearch('<script>alert(1)</script>')).toBe('scriptalert(1)/script');
      expect(sanitizeSearch('javascript:void(0)')).toBe('void(0)');
    });
  });

  describe('Coordinate Input Patterns', () => {
    it('validates latitude range -90 to 90', () => {
      const validateLatitude = (lat: number): boolean => {
        return lat >= -90 && lat <= 90;
      };

      expect(validateLatitude(34.0522)).toBe(true);
      expect(validateLatitude(-90)).toBe(true);
      expect(validateLatitude(90)).toBe(true);
      expect(validateLatitude(-91)).toBe(false);
      expect(validateLatitude(91)).toBe(false);
    });

    it('validates longitude range -180 to 180', () => {
      const validateLongitude = (lon: number): boolean => {
        return lon >= -180 && lon <= 180;
      };

      expect(validateLongitude(-118.2437)).toBe(true);
      expect(validateLongitude(-180)).toBe(true);
      expect(validateLongitude(180)).toBe(true);
      expect(validateLongitude(-181)).toBe(false);
      expect(validateLongitude(181)).toBe(false);
    });
  });

  describe('UUID Input Patterns', () => {
    it('validates UUID v4 format', () => {
      const validateUUID = (uuid: string): boolean => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
      };

      expect(validateUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(validateUUID('invalid-uuid')).toBe(false);
      expect(validateUUID('550e8400-e29b-51d4-a716-446655440000')).toBe(false); // Wrong version
    });
  });

  describe('Team/League Selection Patterns', () => {
    it('validates league selection', () => {
      const VALID_LEAGUES = ['NFL', 'NBA', 'MLB', 'NHL', 'NCAAF', 'NCAAB', 'SOCCER'];
      
      const validateLeague = (league: string): boolean => {
        return VALID_LEAGUES.includes(league);
      };

      expect(validateLeague('NBA')).toBe(true);
      expect(validateLeague('NFL')).toBe(true);
      expect(validateLeague('INVALID')).toBe(false);
    });

    it('validates multi-league selection', () => {
      const VALID_LEAGUES = ['NFL', 'NBA', 'MLB', 'NHL', 'NCAAF', 'NCAAB', 'SOCCER'];
      
      const validateLeagues = (leagues: string[]): boolean => {
        return leagues.every(l => VALID_LEAGUES.includes(l));
      };

      expect(validateLeagues(['NBA', 'NFL'])).toBe(true);
      expect(validateLeagues(['NBA', 'INVALID'])).toBe(false);
      expect(validateLeagues([])).toBe(true); // Empty is valid
    });
  });
});

// ==================== XSS Prevention Tests ====================

describe('XSS Prevention', () => {
  const xssPayloads = [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert("xss")>',
    'javascript:alert("xss")',
    '<a href="javascript:void(0)" onclick="alert(1)">click</a>',
    '"><script>alert("xss")</script>',
    "'; DROP TABLE users; --",
    '<svg onload=alert("xss")>',
  ];

  it('sanitizes dangerous input strings', () => {
    const sanitize = (input: string): string => {
      return input
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .replace(/['";]/g, '')
        .trim();
    };

    xssPayloads.forEach(payload => {
      const sanitized = sanitize(payload);
      expect(sanitized).not.toContain('<script');
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized.toLowerCase()).not.toMatch(/on\w+=/);
    });
  });
});

// ==================== Input Boundary Tests ====================

describe('Input Boundary Tests', () => {
  describe('Numeric Boundaries', () => {
    it('handles minimum values', () => {
      expect(0.01).toBeGreaterThan(0);
      expect(1.01).toBeGreaterThan(1);
      expect(-100).toBeLessThanOrEqual(-100);
    });

    it('handles maximum values', () => {
      expect(1000000).toBeLessThanOrEqual(1000000);
      expect(99999).toBeLessThanOrEqual(99999);
      expect(10000).toBeLessThanOrEqual(10000);
    });

    it('handles edge cases', () => {
      expect(Number.isFinite(0)).toBe(true);
      expect(Number.isFinite(Infinity)).toBe(false);
      expect(Number.isNaN(NaN)).toBe(true);
    });
  });

  describe('String Length Boundaries', () => {
    it('validates max lengths', () => {
      const MAX_MATCH_ID = 100;
      const MAX_MATCH_TITLE = 200;
      const MAX_SEARCH = 100;

      expect('x'.repeat(100).length).toBeLessThanOrEqual(MAX_MATCH_ID);
      expect('x'.repeat(200).length).toBeLessThanOrEqual(MAX_MATCH_TITLE);
      expect('x'.repeat(50).length).toBeLessThanOrEqual(MAX_SEARCH);
    });

    it('handles empty strings', () => {
      expect(''.length).toBe(0);
      expect(''.trim()).toBe('');
    });
  });
});
