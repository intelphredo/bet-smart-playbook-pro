/**
 * Zod validation schemas for Edge Functions
 * Server-side validation to ensure data integrity
 */

// Note: Edge functions use esm.sh for imports
import { z } from "https://esm.sh/zod@3.23.8";

// ==================== Betting Schemas ====================

export const StakeSchema = z
  .number()
  .positive("Stake must be greater than 0")
  .max(1000000, "Stake cannot exceed $1,000,000");

export const AmericanOddsSchema = z
  .number()
  .refine(
    (val) => val <= -100 || val >= 100,
    "Invalid American odds format"
  );

export const DecimalOddsSchema = z
  .number()
  .min(1.01, "Decimal odds must be at least 1.01")
  .max(10000, "Odds out of reasonable range");

// ==================== Sharp Money Schemas ====================

export const SharpMoneyInsertSchema = z.object({
  match_id: z.string().min(1).max(100),
  league: z.string().min(1).max(50),
  home_team: z.string().min(1).max(100),
  away_team: z.string().min(1).max(100),
  match_title: z.string().min(1).max(200),
  signal_type: z.enum(["STEAM_MOVE", "REVERSE_LINE", "SHARP_ACTION", "LINE_FREEZE"]),
  sharp_side: z.string().min(1).max(100),
  market_type: z.enum(["moneyline", "spread", "total"]).default("moneyline"),
  confidence: z.number().min(0).max(100).default(70),
  signal_strength: z.enum(["weak", "moderate", "strong"]).default("moderate"),
  opening_line: z.number().optional(),
  detection_line: z.number().optional(),
  sharp_pct_at_detection: z.number().min(0).max(100).optional(),
  public_pct_at_detection: z.number().min(0).max(100).optional(),
  game_start_time: z.string().datetime().optional(),
});

export const SharpMoneyUpdateSchema = z.object({
  actual_score_home: z.number().int().min(0).max(999).optional(),
  actual_score_away: z.number().int().min(0).max(999).optional(),
  game_result: z.enum(["win", "loss", "push", "pending"]).optional(),
  closing_line: z.number().optional(),
  beat_closing_line: z.boolean().optional(),
  result_verified_at: z.string().datetime().optional(),
});

// ==================== Odds Recording Schemas ====================

export const OddsRecordSchema = z.object({
  match_id: z.string().min(1).max(100),
  match_title: z.string().max(200).optional(),
  league: z.string().max(50).optional(),
  sportsbook_id: z.string().min(1).max(50),
  sportsbook_name: z.string().min(1).max(100),
  market_type: z.enum(["moneyline", "spread", "total"]),
  home_odds: DecimalOddsSchema.optional().nullable(),
  away_odds: DecimalOddsSchema.optional().nullable(),
  draw_odds: DecimalOddsSchema.optional().nullable(),
  spread_home: z.number().optional().nullable(),
  spread_home_odds: DecimalOddsSchema.optional().nullable(),
  spread_away: z.number().optional().nullable(),
  spread_away_odds: DecimalOddsSchema.optional().nullable(),
  total_line: z.number().min(0).max(500).optional().nullable(),
  over_odds: DecimalOddsSchema.optional().nullable(),
  under_odds: DecimalOddsSchema.optional().nullable(),
});

// ==================== Prediction Schemas ====================

export const PredictionInsertSchema = z.object({
  match_id: z.string().min(1).max(100),
  match_title: z.string().max(200).optional(),
  league: z.string().max(50).optional(),
  home_team: z.string().max(100).optional(),
  away_team: z.string().max(100).optional(),
  algorithm_id: z.string().max(50).optional(),
  prediction: z.string().max(500).optional(),
  confidence: z.number().min(0).max(100).optional(),
  projected_score_home: z.number().int().min(0).max(999).optional(),
  projected_score_away: z.number().int().min(0).max(999).optional(),
  is_live_prediction: z.boolean().default(false),
});

export const PredictionGradeSchema = z.object({
  prediction_id: z.string().uuid(),
  actual_score_home: z.number().int().min(0).max(999),
  actual_score_away: z.number().int().min(0).max(999),
  status: z.enum(["correct", "incorrect", "push"]),
  accuracy_rating: z.number().min(0).max(100).optional(),
});

// ==================== Line Movement Schemas ====================

export const LineMovementSchema = z.object({
  match_id: z.string().min(1).max(100),
  match_title: z.string().max(200).optional(),
  league: z.string().max(50).optional(),
  sportsbook_id: z.string().min(1).max(50),
  market_type: z.enum(["moneyline", "spread", "total"]),
  previous_odds: z.record(z.unknown()),
  current_odds: z.record(z.unknown()),
  movement_percentage: z.number().optional(),
  movement_direction: z.enum(["up", "down", "stable"]).optional(),
});

// ==================== Weather Schemas ====================

export const WeatherRequestSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  venue: z.string().max(200).optional(),
});

export const WeatherResponseSchema = z.object({
  temperature: z.number(),
  temperature_celsius: z.number(),
  condition: z.string(),
  condition_description: z.string().optional(),
  humidity: z.number().min(0).max(100).optional(),
  wind_speed: z.number().min(0).optional(),
  wind_direction: z.string().optional(),
  wind_gust: z.number().optional(),
  precipitation: z.number().min(0).optional(),
  visibility: z.number().optional(),
  pressure: z.number().optional(),
  uv_index: z.number().min(0).max(15).optional(),
  feels_like: z.number().optional(),
  is_outdoor_playable: z.boolean().optional(),
});

// ==================== Bet Grading Schemas ====================

export const BetGradeSchema = z.object({
  bet_id: z.string().uuid(),
  status: z.enum(["won", "lost", "push", "void"]),
  result_profit: z.number(),
  closing_odds: DecimalOddsSchema.optional(),
  clv_percentage: z.number().optional(),
});

// ==================== Validation Helpers ====================

export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; errors: string[] };

export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.errors.map(
    (err) => `${err.path.join(".")}: ${err.message}`
  );
  
  return { success: false, errors };
}

export function validateOrThrow<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  const result = validate(schema, data);
  
  if (!result.success) {
    const prefix = context ? `[${context}] ` : "";
    throw new Error(`${prefix}Validation failed: ${result.errors.join(", ")}`);
  }
  
  return result.data;
}

/**
 * Batch validate an array of records
 */
export function batchValidate<T>(
  schema: z.ZodSchema<T>,
  records: unknown[]
): { valid: T[]; invalid: Array<{ record: unknown; errors: string[] }> } {
  const valid: T[] = [];
  const invalid: Array<{ record: unknown; errors: string[] }> = [];
  
  for (const record of records) {
    const result = validate(schema, record);
    if (result.success) {
      valid.push(result.data);
    } else {
      invalid.push({ record, errors: result.errors });
    }
  }
  
  return { valid, invalid };
}

/**
 * Sanitize string to prevent injection attacks
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .slice(0, 10000) // Limit length
    .trim();
}

/**
 * Create JSON error response for validation failures
 */
export function validationErrorResponse(errors: string[], status = 400): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: "Validation failed",
      details: errors,
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}
