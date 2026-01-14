import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  StakeSchema,
  AmericanOddsSchema,
  DecimalOddsSchema,
  BetSlipItemSchema,
  BankrollSettingsSchema,
  PredictionCorrectionSchema,
  safeValidate,
  validateOrThrow,
  sanitizeString,
} from '../schemas';

describe('Validation Schemas', () => {
  describe('StakeSchema', () => {
    it('should accept valid positive stakes', () => {
      expect(StakeSchema.safeParse(100).success).toBe(true);
      expect(StakeSchema.safeParse(0.01).success).toBe(true);
      expect(StakeSchema.safeParse(999999).success).toBe(true);
    });

    it('should reject zero or negative stakes', () => {
      expect(StakeSchema.safeParse(0).success).toBe(false);
      expect(StakeSchema.safeParse(-50).success).toBe(false);
    });

    it('should reject stakes over $1,000,000', () => {
      expect(StakeSchema.safeParse(1000001).success).toBe(false);
    });

    it('should reject non-numbers', () => {
      expect(StakeSchema.safeParse('100').success).toBe(false);
      expect(StakeSchema.safeParse(NaN).success).toBe(false);
    });
  });

  describe('AmericanOddsSchema', () => {
    it('should accept valid American odds', () => {
      expect(AmericanOddsSchema.safeParse(-150).success).toBe(true);
      expect(AmericanOddsSchema.safeParse(-110).success).toBe(true);
      expect(AmericanOddsSchema.safeParse(-100).success).toBe(true);
      expect(AmericanOddsSchema.safeParse(100).success).toBe(true);
      expect(AmericanOddsSchema.safeParse(150).success).toBe(true);
      expect(AmericanOddsSchema.safeParse(500).success).toBe(true);
    });

    it('should reject odds between -100 and +100', () => {
      expect(AmericanOddsSchema.safeParse(-99).success).toBe(false);
      expect(AmericanOddsSchema.safeParse(0).success).toBe(false);
      expect(AmericanOddsSchema.safeParse(99).success).toBe(false);
    });
  });

  describe('DecimalOddsSchema', () => {
    it('should accept valid decimal odds', () => {
      expect(DecimalOddsSchema.safeParse(1.5).success).toBe(true);
      expect(DecimalOddsSchema.safeParse(2.0).success).toBe(true);
      expect(DecimalOddsSchema.safeParse(10.0).success).toBe(true);
    });

    it('should reject odds below 1.01', () => {
      expect(DecimalOddsSchema.safeParse(1.0).success).toBe(false);
      expect(DecimalOddsSchema.safeParse(0.5).success).toBe(false);
    });

    it('should reject odds above 10000', () => {
      expect(DecimalOddsSchema.safeParse(10001).success).toBe(false);
    });
  });

  describe('BetSlipItemSchema', () => {
    const validItem = {
      matchId: 'match-123',
      matchTitle: 'Lakers vs Celtics',
      league: 'NBA',
      betType: 'moneyline',
      selection: 'Lakers ML',
      odds: -150,
      sportsbook: 'FanDuel',
    };

    it('should accept valid bet slip item', () => {
      expect(BetSlipItemSchema.safeParse(validItem).success).toBe(true);
    });

    it('should require matchId', () => {
      const item = { ...validItem, matchId: '' };
      expect(BetSlipItemSchema.safeParse(item).success).toBe(false);
    });

    it('should require matchTitle', () => {
      const item = { ...validItem, matchTitle: '' };
      expect(BetSlipItemSchema.safeParse(item).success).toBe(false);
    });

    it('should validate betType enum', () => {
      const validTypes = ['moneyline', 'spread', 'total', 'prop', 'parlay'];
      validTypes.forEach(type => {
        const item = { ...validItem, betType: type };
        expect(BetSlipItemSchema.safeParse(item).success).toBe(true);
      });

      const item = { ...validItem, betType: 'invalid' };
      expect(BetSlipItemSchema.safeParse(item).success).toBe(false);
    });

    it('should validate odds format', () => {
      const itemWithValidOdds = { ...validItem, odds: -110 };
      expect(BetSlipItemSchema.safeParse(itemWithValidOdds).success).toBe(true);

      const itemWithInvalidOdds = { ...validItem, odds: -50 };
      expect(BetSlipItemSchema.safeParse(itemWithInvalidOdds).success).toBe(false);
    });

    it('should accept optional model insights', () => {
      const itemWithInsights = {
        ...validItem,
        modelConfidence: 75,
        modelEvPercentage: 5.5,
        kellyRecommended: 25,
      };
      expect(BetSlipItemSchema.safeParse(itemWithInsights).success).toBe(true);
    });

    it('should validate modelConfidence range', () => {
      expect(BetSlipItemSchema.safeParse({ 
        ...validItem, 
        modelConfidence: 101 
      }).success).toBe(false);
      
      expect(BetSlipItemSchema.safeParse({ 
        ...validItem, 
        modelConfidence: -1 
      }).success).toBe(false);
    });
  });

  describe('BankrollSettingsSchema', () => {
    const validSettings = {
      initialBankroll: 10000,
      currentBankroll: 10500,
      unitSize: 100,
      riskTolerance: 'moderate',
    };

    it('should accept valid bankroll settings', () => {
      expect(BankrollSettingsSchema.safeParse(validSettings).success).toBe(true);
    });

    it('should validate riskTolerance enum', () => {
      ['conservative', 'moderate', 'aggressive'].forEach(tolerance => {
        const settings = { ...validSettings, riskTolerance: tolerance };
        expect(BankrollSettingsSchema.safeParse(settings).success).toBe(true);
      });

      const settings = { ...validSettings, riskTolerance: 'extreme' };
      expect(BankrollSettingsSchema.safeParse(settings).success).toBe(false);
    });

    it('should require positive bankroll values', () => {
      expect(BankrollSettingsSchema.safeParse({
        ...validSettings,
        initialBankroll: -1000,
      }).success).toBe(false);
    });

    it('should accept optional stop loss/win percentages', () => {
      const settings = {
        ...validSettings,
        stopLossPercentage: 20,
        stopWinPercentage: 50,
        maxExposurePerGame: 5,
      };
      expect(BankrollSettingsSchema.safeParse(settings).success).toBe(true);
    });
  });

  describe('PredictionCorrectionSchema', () => {
    it('should accept valid correction', () => {
      const correction = {
        predictionId: '550e8400-e29b-41d4-a716-446655440000',
        actualHomeScore: 110,
        actualAwayScore: 105,
        status: 'correct',
      };
      expect(PredictionCorrectionSchema.safeParse(correction).success).toBe(true);
    });

    it('should require valid UUID for predictionId', () => {
      const correction = {
        predictionId: 'not-a-uuid',
        actualHomeScore: 110,
        actualAwayScore: 105,
      };
      expect(PredictionCorrectionSchema.safeParse(correction).success).toBe(false);
    });

    it('should reject negative scores', () => {
      const correction = {
        predictionId: '550e8400-e29b-41d4-a716-446655440000',
        actualHomeScore: -5,
      };
      expect(PredictionCorrectionSchema.safeParse(correction).success).toBe(false);
    });

    it('should validate status enum', () => {
      ['pending', 'correct', 'incorrect', 'push', 'void'].forEach(status => {
        const correction = {
          predictionId: '550e8400-e29b-41d4-a716-446655440000',
          status,
        };
        expect(PredictionCorrectionSchema.safeParse(correction).success).toBe(true);
      });
    });
  });

  describe('safeValidate helper', () => {
    it('should return success with data for valid input', () => {
      const result = safeValidate(StakeSchema, 100);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(100);
      }
    });

    it('should return errors for invalid input', () => {
      const result = safeValidate(StakeSchema, -100);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
  });

  describe('validateOrThrow helper', () => {
    it('should return data for valid input', () => {
      const data = validateOrThrow(StakeSchema, 100);
      expect(data).toBe(100);
    });

    it('should throw for invalid input', () => {
      expect(() => validateOrThrow(StakeSchema, -100)).toThrow('Validation failed');
    });
  });

  describe('sanitizeString helper', () => {
    it('should remove angle brackets', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
    });

    it('should remove javascript: protocol', () => {
      expect(sanitizeString('javascript:alert(1)')).toBe('alert(1)');
    });

    it('should remove event handlers', () => {
      expect(sanitizeString('onclick=malicious() data')).toBe(' data');
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  hello world  ')).toBe('hello world');
    });

    it('should handle normal strings unchanged', () => {
      expect(sanitizeString('Lakers vs Celtics')).toBe('Lakers vs Celtics');
    });
  });
});
