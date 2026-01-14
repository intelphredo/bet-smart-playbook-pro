/**
 * Zod validation schemas for all user inputs
 * Centralized validation to ensure data integrity and security
 */

import { z } from "zod";

// ==================== Betting Schemas ====================

/**
 * Stake amount validation - must be positive number with 2 decimal precision
 */
export const StakeSchema = z
  .number()
  .positive("Stake must be greater than 0")
  .max(1000000, "Stake cannot exceed $1,000,000")
  .refine(
    (val) => Number.isFinite(val) && !Number.isNaN(val),
    "Stake must be a valid number"
  );

/**
 * American odds validation (-99999 to +99999, excluding -100 to +100)
 */
export const AmericanOddsSchema = z
  .number()
  .refine(
    (val) => val <= -100 || val >= 100,
    "Invalid American odds format (must be ≤ -100 or ≥ +100)"
  )
  .refine(
    (val) => val >= -99999 && val <= 99999,
    "Odds out of reasonable range"
  );

/**
 * Decimal odds validation (must be >= 1.01)
 */
export const DecimalOddsSchema = z
  .number()
  .min(1.01, "Decimal odds must be at least 1.01")
  .max(10000, "Odds out of reasonable range");

/**
 * Bet slip item validation
 */
export const BetSlipItemSchema = z.object({
  matchId: z.string().min(1, "Match ID is required").max(100),
  matchTitle: z.string().min(1, "Match title is required").max(200),
  league: z.string().max(50).optional(),
  betType: z.enum(["moneyline", "spread", "total", "prop", "parlay"]),
  selection: z.string().min(1, "Selection is required").max(200),
  odds: AmericanOddsSchema,
  sportsbook: z.string().max(100).optional(),
  modelConfidence: z.number().min(0).max(100).optional(),
  modelEvPercentage: z.number().min(-100).max(1000).optional(),
  kellyRecommended: z.number().positive().optional(),
});

/**
 * Complete bet placement validation
 */
export const PlaceBetSchema = z.object({
  item: BetSlipItemSchema,
  stake: StakeSchema,
});

/**
 * Bet status update validation
 */
export const BetStatusUpdateSchema = z.object({
  betId: z.string().uuid("Invalid bet ID format"),
  status: z.enum(["pending", "won", "lost", "push", "void"]),
  resultProfit: z.number().optional(),
});

// ==================== Prediction Correction Schemas ====================

/**
 * Single prediction correction
 */
export const PredictionCorrectionSchema = z.object({
  predictionId: z.string().uuid("Invalid prediction ID"),
  actualHomeScore: z.number().int().min(0).max(999).optional(),
  actualAwayScore: z.number().int().min(0).max(999).optional(),
  status: z.enum(["pending", "correct", "incorrect", "push", "void"]).optional(),
  confidence: z.number().min(0).max(100).optional(),
});

/**
 * Bulk correction entry
 */
export const BulkCorrectionEntrySchema = z.object({
  matchId: z.string().min(1, "Match ID is required").max(100),
  homeScore: z.number().int().min(0).max(999),
  awayScore: z.number().int().min(0).max(999),
});

// ==================== User Preferences Schemas ====================

/**
 * Bankroll settings validation
 */
export const BankrollSettingsSchema = z.object({
  initialBankroll: z.number().positive().max(100000000),
  currentBankroll: z.number().min(0).max(100000000),
  unitSize: z.number().positive().max(1000000),
  riskTolerance: z.enum(["conservative", "moderate", "aggressive"]),
  stopLossPercentage: z.number().min(0).max(100).optional(),
  stopWinPercentage: z.number().min(0).max(1000).optional(),
  maxExposurePerGame: z.number().min(0).max(100).optional(),
});

/**
 * Notification preferences
 */
export const NotificationPreferencesSchema = z.object({
  sharpMoneyAlerts: z.boolean(),
  lineMovementAlerts: z.boolean(),
  gameStartReminders: z.boolean(),
  betResultNotifications: z.boolean(),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
});

// ==================== API Request Schemas ====================

/**
 * Edge function request validation for odds
 */
export const OddsRequestSchema = z.object({
  league: z.enum(["NFL", "NBA", "MLB", "NHL", "NCAAF", "NCAAB", "SOCCER", "ALL"]),
  markets: z.array(z.enum(["h2h", "spreads", "totals"])).optional(),
  regions: z.array(z.string()).optional(),
  bookmakers: z.array(z.string()).optional(),
});

/**
 * Sharp money API request
 */
export const SharpMoneyRequestSchema = z.object({
  matchId: z.string().min(1).max(100),
  league: z.string().min(1).max(50),
  homeTeam: z.string().min(1).max(100),
  awayTeam: z.string().min(1).max(100),
  matchTitle: z.string().min(1).max(200),
  signalType: z.enum(["STEAM_MOVE", "REVERSE_LINE", "SHARP_ACTION"]),
  sharpSide: z.string().min(1).max(50),
  confidence: z.number().min(0).max(100),
});

/**
 * Weather fetch request
 */
export const WeatherRequestSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  venue: z.string().min(1).max(200).optional(),
});

// ==================== Search and Filter Schemas ====================

/**
 * Game search/filter parameters
 */
export const GameFilterSchema = z.object({
  leagues: z.array(z.string()).optional(),
  status: z.enum(["upcoming", "live", "finished", "all"]).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  minConfidence: z.number().min(0).max(100).optional(),
  showOnlyValueBets: z.boolean().optional(),
});

// ==================== Validation Helpers ====================

/**
 * Safely parse and validate data with detailed error messages
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.errors.map(
    (err) => `${err.path.join(".")}: ${err.message}`
  );
  
  return { success: false, errors };
}

/**
 * Validate or throw with formatted error
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.errors.map(
      (err) => `${err.path.join(".")}: ${err.message}`
    );
    throw new Error(`Validation failed: ${errors.join(", ")}`);
  }
  
  return result.data;
}

/**
 * Sanitize string input - remove potential XSS vectors
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim();
}

/**
 * Create a sanitized string schema
 */
export const SanitizedStringSchema = z.string().transform(sanitizeString);

// Export type helpers
export type BetSlipItem = z.infer<typeof BetSlipItemSchema>;
export type PlaceBet = z.infer<typeof PlaceBetSchema>;
export type BankrollSettings = z.infer<typeof BankrollSettingsSchema>;
export type PredictionCorrection = z.infer<typeof PredictionCorrectionSchema>;
