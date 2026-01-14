import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  StakeSchema,
  AmericanOddsSchema,
  DecimalOddsSchema,
  BetSlipItemSchema,
  BankrollSettingsSchema,
  PredictionCorrectionSchema,
  NotificationPreferencesSchema,
  GameFilterSchema,
  WeatherRequestSchema,
  safeValidate,
  validateOrThrow,
  sanitizeString,
} from '../schemas';

describe('Input Validation Schemas', () => {
  // ==================== Stake Validation ====================
  describe('StakeSchema', () => {
    it('accepts valid positive stake', () => {
      const result = StakeSchema.safeParse(100);
      expect(result.success).toBe(true);
    });

    it('accepts stake with decimal places', () => {
      const result = StakeSchema.safeParse(25.50);
      expect(result.success).toBe(true);
    });

    it('rejects zero stake', () => {
      const result = StakeSchema.safeParse(0);
      expect(result.success).toBe(false);
    });

    it('rejects negative stake', () => {
      const result = StakeSchema.safeParse(-50);
      expect(result.success).toBe(false);
    });

    it('rejects stake exceeding max', () => {
      const result = StakeSchema.safeParse(2000000);
      expect(result.success).toBe(false);
    });

    it('rejects NaN', () => {
      const result = StakeSchema.safeParse(NaN);
      expect(result.success).toBe(false);
    });

    it('rejects Infinity', () => {
      const result = StakeSchema.safeParse(Infinity);
      expect(result.success).toBe(false);
    });

    it('rejects non-numeric values', () => {
      const result = StakeSchema.safeParse('100');
      expect(result.success).toBe(false);
    });
  });

  // ==================== American Odds Validation ====================
  describe('AmericanOddsSchema', () => {
    it('accepts valid negative odds', () => {
      const result = AmericanOddsSchema.safeParse(-150);
      expect(result.success).toBe(true);
    });

    it('accepts valid positive odds', () => {
      const result = AmericanOddsSchema.safeParse(200);
      expect(result.success).toBe(true);
    });

    it('accepts -100 (edge case)', () => {
      const result = AmericanOddsSchema.safeParse(-100);
      expect(result.success).toBe(true);
    });

    it('accepts +100 (edge case)', () => {
      const result = AmericanOddsSchema.safeParse(100);
      expect(result.success).toBe(true);
    });

    it('rejects odds between -99 and +99', () => {
      expect(AmericanOddsSchema.safeParse(-50).success).toBe(false);
      expect(AmericanOddsSchema.safeParse(50).success).toBe(false);
      expect(AmericanOddsSchema.safeParse(0).success).toBe(false);
    });

    it('rejects extremely high odds', () => {
      const result = AmericanOddsSchema.safeParse(100000);
      expect(result.success).toBe(false);
    });

    it('rejects extremely low odds', () => {
      const result = AmericanOddsSchema.safeParse(-100000);
      expect(result.success).toBe(false);
    });
  });

  // ==================== Decimal Odds Validation ====================
  describe('DecimalOddsSchema', () => {
    it('accepts valid decimal odds', () => {
      const result = DecimalOddsSchema.safeParse(2.5);
      expect(result.success).toBe(true);
    });

    it('accepts minimum valid odds (1.01)', () => {
      const result = DecimalOddsSchema.safeParse(1.01);
      expect(result.success).toBe(true);
    });

    it('rejects odds below 1.01', () => {
      expect(DecimalOddsSchema.safeParse(1.0).success).toBe(false);
      expect(DecimalOddsSchema.safeParse(0.5).success).toBe(false);
    });

    it('rejects odds above max', () => {
      const result = DecimalOddsSchema.safeParse(15000);
      expect(result.success).toBe(false);
    });
  });

  // ==================== Bet Slip Item Validation ====================
  describe('BetSlipItemSchema', () => {
    const validItem = {
      matchId: 'game-123',
      matchTitle: 'Lakers vs Celtics',
      betType: 'moneyline' as const,
      selection: 'Lakers',
      odds: -150,
    };

    it('accepts valid bet slip item', () => {
      const result = BetSlipItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it('accepts optional fields', () => {
      const result = BetSlipItemSchema.safeParse({
        ...validItem,
        league: 'NBA',
        sportsbook: 'FanDuel',
        modelConfidence: 75,
        modelEvPercentage: 5.5,
        kellyRecommended: 25,
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty matchId', () => {
      const result = BetSlipItemSchema.safeParse({
        ...validItem,
        matchId: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty matchTitle', () => {
      const result = BetSlipItemSchema.safeParse({
        ...validItem,
        matchTitle: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid betType', () => {
      const result = BetSlipItemSchema.safeParse({
        ...validItem,
        betType: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('accepts all valid betTypes', () => {
      const betTypes = ['moneyline', 'spread', 'total', 'prop', 'parlay'];
      for (const betType of betTypes) {
        const result = BetSlipItemSchema.safeParse({ ...validItem, betType });
        expect(result.success).toBe(true);
      }
    });

    it('rejects invalid odds format', () => {
      const result = BetSlipItemSchema.safeParse({
        ...validItem,
        odds: 50, // Between -99 and +99
      });
      expect(result.success).toBe(false);
    });

    it('rejects confidence outside 0-100 range', () => {
      expect(BetSlipItemSchema.safeParse({
        ...validItem,
        modelConfidence: 150,
      }).success).toBe(false);

      expect(BetSlipItemSchema.safeParse({
        ...validItem,
        modelConfidence: -10,
      }).success).toBe(false);
    });
  });

  // ==================== Bankroll Settings Validation ====================
  describe('BankrollSettingsSchema', () => {
    const validSettings = {
      initialBankroll: 10000,
      currentBankroll: 10500,
      unitSize: 100,
      riskTolerance: 'moderate' as const,
    };

    it('accepts valid bankroll settings', () => {
      const result = BankrollSettingsSchema.safeParse(validSettings);
      expect(result.success).toBe(true);
    });

    it('accepts all risk tolerance levels', () => {
      const levels = ['conservative', 'moderate', 'aggressive'];
      for (const riskTolerance of levels) {
        const result = BankrollSettingsSchema.safeParse({
          ...validSettings,
          riskTolerance,
        });
        expect(result.success).toBe(true);
      }
    });

    it('rejects invalid risk tolerance', () => {
      const result = BankrollSettingsSchema.safeParse({
        ...validSettings,
        riskTolerance: 'extreme',
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative bankroll', () => {
      const result = BankrollSettingsSchema.safeParse({
        ...validSettings,
        currentBankroll: -500,
      });
      expect(result.success).toBe(false);
    });

    it('accepts stop loss percentage 0-100', () => {
      const result = BankrollSettingsSchema.safeParse({
        ...validSettings,
        stopLossPercentage: 25,
      });
      expect(result.success).toBe(true);
    });

    it('rejects stop loss percentage over 100', () => {
      const result = BankrollSettingsSchema.safeParse({
        ...validSettings,
        stopLossPercentage: 150,
      });
      expect(result.success).toBe(false);
    });
  });

  // ==================== Prediction Correction Validation ====================
  describe('PredictionCorrectionSchema', () => {
    it('accepts valid correction', () => {
      const result = PredictionCorrectionSchema.safeParse({
        predictionId: '550e8400-e29b-41d4-a716-446655440000',
        actualHomeScore: 105,
        actualAwayScore: 98,
        status: 'correct',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid UUID format', () => {
      const result = PredictionCorrectionSchema.safeParse({
        predictionId: 'invalid-uuid',
        actualHomeScore: 105,
        actualAwayScore: 98,
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative scores', () => {
      const result = PredictionCorrectionSchema.safeParse({
        predictionId: '550e8400-e29b-41d4-a716-446655440000',
        actualHomeScore: -5,
        actualAwayScore: 98,
      });
      expect(result.success).toBe(false);
    });

    it('rejects decimal scores', () => {
      const result = PredictionCorrectionSchema.safeParse({
        predictionId: '550e8400-e29b-41d4-a716-446655440000',
        actualHomeScore: 105.5,
      });
      expect(result.success).toBe(false);
    });

    it('accepts all valid statuses', () => {
      const statuses = ['pending', 'correct', 'incorrect', 'push', 'void'];
      for (const status of statuses) {
        const result = PredictionCorrectionSchema.safeParse({
          predictionId: '550e8400-e29b-41d4-a716-446655440000',
          status,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  // ==================== Notification Preferences Validation ====================
  describe('NotificationPreferencesSchema', () => {
    it('accepts valid preferences', () => {
      const result = NotificationPreferencesSchema.safeParse({
        sharpMoneyAlerts: true,
        lineMovementAlerts: true,
        gameStartReminders: false,
        betResultNotifications: true,
        emailNotifications: false,
        pushNotifications: true,
      });
      expect(result.success).toBe(true);
    });

    it('rejects non-boolean values', () => {
      const result = NotificationPreferencesSchema.safeParse({
        sharpMoneyAlerts: 'yes',
        lineMovementAlerts: true,
        gameStartReminders: false,
        betResultNotifications: true,
        emailNotifications: false,
        pushNotifications: true,
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing required fields', () => {
      const result = NotificationPreferencesSchema.safeParse({
        sharpMoneyAlerts: true,
      });
      expect(result.success).toBe(false);
    });
  });

  // ==================== Game Filter Validation ====================
  describe('GameFilterSchema', () => {
    it('accepts valid filter', () => {
      const result = GameFilterSchema.safeParse({
        leagues: ['NBA', 'NFL'],
        status: 'upcoming',
        minConfidence: 70,
        showOnlyValueBets: true,
      });
      expect(result.success).toBe(true);
    });

    it('accepts empty filter', () => {
      const result = GameFilterSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('accepts all valid statuses', () => {
      const statuses = ['upcoming', 'live', 'finished', 'all'];
      for (const status of statuses) {
        const result = GameFilterSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it('rejects invalid status', () => {
      const result = GameFilterSchema.safeParse({
        status: 'cancelled',
      });
      expect(result.success).toBe(false);
    });

    it('rejects confidence outside 0-100', () => {
      expect(GameFilterSchema.safeParse({ minConfidence: 150 }).success).toBe(false);
      expect(GameFilterSchema.safeParse({ minConfidence: -10 }).success).toBe(false);
    });
  });

  // ==================== Weather Request Validation ====================
  describe('WeatherRequestSchema', () => {
    it('accepts valid coordinates', () => {
      const result = WeatherRequestSchema.safeParse({
        latitude: 34.0522,
        longitude: -118.2437,
      });
      expect(result.success).toBe(true);
    });

    it('accepts coordinates with venue', () => {
      const result = WeatherRequestSchema.safeParse({
        latitude: 34.0522,
        longitude: -118.2437,
        venue: 'Crypto.com Arena',
      });
      expect(result.success).toBe(true);
    });

    it('rejects latitude out of range', () => {
      expect(WeatherRequestSchema.safeParse({
        latitude: 100,
        longitude: -118,
      }).success).toBe(false);

      expect(WeatherRequestSchema.safeParse({
        latitude: -95,
        longitude: -118,
      }).success).toBe(false);
    });

    it('rejects longitude out of range', () => {
      expect(WeatherRequestSchema.safeParse({
        latitude: 34,
        longitude: 200,
      }).success).toBe(false);

      expect(WeatherRequestSchema.safeParse({
        latitude: 34,
        longitude: -200,
      }).success).toBe(false);
    });
  });

  // ==================== Helper Functions ====================
  describe('safeValidate', () => {
    it('returns success with valid data', () => {
      const result = safeValidate(StakeSchema, 100);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(100);
      }
    });

    it('returns errors array for invalid data', () => {
      const result = safeValidate(StakeSchema, -50);
      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('validateOrThrow', () => {
    it('returns data for valid input', () => {
      const result = validateOrThrow(StakeSchema, 100);
      expect(result).toBe(100);
    });

    it('throws error for invalid input', () => {
      expect(() => validateOrThrow(StakeSchema, -50)).toThrow();
    });

    it('includes error details in thrown error', () => {
      expect(() => validateOrThrow(StakeSchema, -50)).toThrow(/validation failed/i);
    });
  });

  describe('sanitizeString', () => {
    it('removes HTML angle brackets', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
    });

    it('removes javascript: protocol', () => {
      expect(sanitizeString('javascript:alert("xss")')).toBe('alert("xss")');
    });

    it('removes event handlers', () => {
      expect(sanitizeString('onerror=alert("xss")')).toBe('alert("xss")');
      expect(sanitizeString('onclick=doSomething()')).toBe('doSomething()');
    });

    it('trims whitespace', () => {
      expect(sanitizeString('  hello world  ')).toBe('hello world');
    });

    it('handles clean strings unchanged', () => {
      expect(sanitizeString('Lakers vs Celtics')).toBe('Lakers vs Celtics');
    });
  });
});
