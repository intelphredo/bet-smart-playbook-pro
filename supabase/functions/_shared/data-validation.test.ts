// Test suite for shared data validation utilities
// Run with: deno test --allow-net --allow-env supabase/functions/_shared/data-validation.test.ts

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  validatePredictionTeamData,
  validateOddsRecord,
  validateWeatherData,
  parseTeamsFromTitle,
  validateLineMovement,
  batchValidate,
} from "./data-validation.ts";

// =============================================================================
// Prediction Team Data Validation Tests
// =============================================================================

Deno.test("validatePredictionTeamData: valid with all fields", () => {
  const result = validatePredictionTeamData({
    match_id: "match-001",
    home_team: "Lakers",
    away_team: "Celtics",
    match_title: "Celtics @ Lakers",
  });

  assertEquals(result.isValid, true);
  assertEquals(result.issues.length, 0);
});

Deno.test("validatePredictionTeamData: valid with just match_title @ format", () => {
  const result = validatePredictionTeamData({
    match_id: "match-001",
    match_title: "Celtics @ Lakers",
  });

  assertEquals(result.isValid, true);
});

Deno.test("validatePredictionTeamData: valid with just match_title vs format", () => {
  const result = validatePredictionTeamData({
    match_id: "match-001",
    match_title: "Celtics vs Lakers",
  });

  assertEquals(result.isValid, true);
});

Deno.test("validatePredictionTeamData: invalid without match_id", () => {
  const result = validatePredictionTeamData({
    match_id: "",
    home_team: "Lakers",
    away_team: "Celtics",
  });

  assertEquals(result.isValid, false);
  assertEquals(result.issues.includes("Missing match_id"), true);
});

Deno.test("validatePredictionTeamData: invalid without team data", () => {
  const result = validatePredictionTeamData({
    match_id: "match-001",
  });

  assertEquals(result.isValid, false);
});

Deno.test("validatePredictionTeamData: invalid match_title format", () => {
  const result = validatePredictionTeamData({
    match_id: "match-001",
    match_title: "Lakers Celtics Game", // No @ or vs
  });

  assertEquals(result.isValid, false);
  assertEquals(result.issues.some(i => i.includes("format")), true);
});

// =============================================================================
// Odds Record Validation Tests
// =============================================================================

Deno.test("validateOddsRecord: valid moneyline record", () => {
  const result = validateOddsRecord({
    match_id: "match-001",
    sportsbook_id: "fanduel",
    market_type: "moneyline",
    home_odds: 1.65,
    away_odds: 2.20,
  });

  assertEquals(result.isValid, true);
});

Deno.test("validateOddsRecord: valid spread record", () => {
  const result = validateOddsRecord({
    match_id: "match-001",
    sportsbook_id: "draftkings",
    market_type: "spread",
    spread_home: -3.5,
  });

  assertEquals(result.isValid, true);
});

Deno.test("validateOddsRecord: valid total record", () => {
  const result = validateOddsRecord({
    match_id: "match-001",
    sportsbook_id: "betmgm",
    market_type: "total",
    total_line: 220.5,
  });

  assertEquals(result.isValid, true);
});

Deno.test("validateOddsRecord: invalid - missing match_id", () => {
  const result = validateOddsRecord({
    match_id: "",
    sportsbook_id: "fanduel",
    market_type: "moneyline",
    home_odds: 1.65,
  });

  assertEquals(result.isValid, false);
});

Deno.test("validateOddsRecord: invalid - moneyline missing both odds", () => {
  const result = validateOddsRecord({
    match_id: "match-001",
    sportsbook_id: "fanduel",
    market_type: "moneyline",
    home_odds: null,
    away_odds: null,
  });

  assertEquals(result.isValid, false);
});

Deno.test("validateOddsRecord: invalid - unreasonable odds value", () => {
  const result = validateOddsRecord({
    match_id: "match-001",
    sportsbook_id: "fanduel",
    market_type: "moneyline",
    home_odds: 0.5, // Too low
  });

  assertEquals(result.isValid, false);
  assertEquals(result.issues.some(i => i.includes("outside reasonable range")), true);
});

// =============================================================================
// Weather Data Validation Tests
// =============================================================================

Deno.test("validateWeatherData: valid weather data", () => {
  const result = validateWeatherData({
    temperature: 72,
    condition: "clear",
    latitude: 34.05,
    longitude: -118.24,
  });

  assertEquals(result.isValid, true);
});

Deno.test("validateWeatherData: invalid - missing temperature", () => {
  const result = validateWeatherData({
    condition: "clear",
  });

  assertEquals(result.isValid, false);
  assertEquals(result.issues.includes("Missing temperature"), true);
});

Deno.test("validateWeatherData: invalid - extreme temperature", () => {
  const result = validateWeatherData({
    temperature: 200, // Too hot
    condition: "clear",
  });

  assertEquals(result.isValid, false);
  assertEquals(result.issues.some(i => i.includes("outside reasonable range")), true);
});

Deno.test("validateWeatherData: invalid - bad latitude", () => {
  const result = validateWeatherData({
    temperature: 72,
    condition: "clear",
    latitude: 100, // Invalid
  });

  assertEquals(result.isValid, false);
  assertEquals(result.issues.some(i => i.includes("Latitude")), true);
});

Deno.test("validateWeatherData: invalid - missing condition", () => {
  const result = validateWeatherData({
    temperature: 72,
    condition: null,
  });

  assertEquals(result.isValid, false);
});

// =============================================================================
// Parse Teams From Title Tests
// =============================================================================

Deno.test("parseTeamsFromTitle: @ format", () => {
  const result = parseTeamsFromTitle("Celtics @ Lakers");

  assertEquals(result.away, "Celtics");
  assertEquals(result.home, "Lakers");
  assertEquals(result.format, "away_at_home");
});

Deno.test("parseTeamsFromTitle: vs format", () => {
  const result = parseTeamsFromTitle("Celtics vs Lakers");

  assertEquals(result.away, "Celtics");
  assertEquals(result.home, "Lakers");
  assertEquals(result.format, "away_vs_home");
});

Deno.test("parseTeamsFromTitle: vs. format (with period)", () => {
  const result = parseTeamsFromTitle("Lakers vs. Celtics");

  assertEquals(result.home, "Lakers");
  assertEquals(result.away, "Celtics");
  assertEquals(result.format, "home_vs_away");
});

Deno.test("parseTeamsFromTitle: unrecognized format", () => {
  const result = parseTeamsFromTitle("Lakers Celtics Game");

  assertEquals(result.away, null);
  assertEquals(result.home, null);
  assertEquals(result.format, null);
});

Deno.test("parseTeamsFromTitle: handles extra spaces", () => {
  const result = parseTeamsFromTitle("  Celtics  @  Lakers  ");

  assertEquals(result.away, "Celtics");
  assertEquals(result.home, "Lakers");
});

// =============================================================================
// Line Movement Validation Tests
// =============================================================================

Deno.test("validateLineMovement: valid movement", () => {
  const result = validateLineMovement({
    match_id: "match-001",
    previous_odds: { home: -110 },
    current_odds: { home: -125 },
    movement_percentage: -15,
  });

  assertEquals(result.isValid, true);
});

Deno.test("validateLineMovement: invalid - missing match_id", () => {
  const result = validateLineMovement({
    match_id: "",
    previous_odds: { home: -110 },
    current_odds: { home: -125 },
  });

  assertEquals(result.isValid, false);
});

Deno.test("validateLineMovement: invalid - unusually large movement", () => {
  const result = validateLineMovement({
    match_id: "match-001",
    previous_odds: { home: -110 },
    current_odds: { home: -1500 },
    movement_percentage: 5000, // Way too large
  });

  assertEquals(result.isValid, false);
  assertEquals(result.issues.some(i => i.includes("unusually large")), true);
});

// =============================================================================
// Batch Validation Tests
// =============================================================================

Deno.test("batchValidate: separates valid and invalid records", () => {
  const records = [
    { match_id: "m1", home_team: "Lakers", away_team: "Celtics" },
    { match_id: "", home_team: "Lakers", away_team: "Celtics" }, // Invalid
    { match_id: "m2", match_title: "Heat @ Bulls" },
    { match_id: "m3" }, // Invalid - no team data
  ];

  const result = batchValidate(records, validatePredictionTeamData);

  assertEquals(result.summary.total, 4);
  assertEquals(result.summary.valid, 2);
  assertEquals(result.summary.invalid, 2);
  assertEquals(result.validRecords.length, 2);
  assertEquals(result.invalidRecords.length, 2);
});

Deno.test("batchValidate: returns empty arrays for empty input", () => {
  const result = batchValidate([], validatePredictionTeamData);

  assertEquals(result.summary.total, 0);
  assertEquals(result.summary.valid, 0);
  assertEquals(result.summary.invalid, 0);
});

Deno.test("batchValidate: all valid records", () => {
  const records = [
    { match_id: "m1", home_team: "Lakers", away_team: "Celtics" },
    { match_id: "m2", home_team: "Heat", away_team: "Bulls" },
  ];

  const result = batchValidate(records, validatePredictionTeamData);

  assertEquals(result.summary.valid, 2);
  assertEquals(result.summary.invalid, 0);
});

Deno.test("batchValidate: captures issues for each invalid record", () => {
  const records = [
    { match_id: "", home_team: "Lakers" }, // Missing match_id
    { match_id: "m1" }, // Missing team data
  ];

  const result = batchValidate(records, validatePredictionTeamData);

  assertEquals(result.invalidRecords.length, 2);
  assertExists(result.invalidRecords[0].issues);
  assertExists(result.invalidRecords[1].issues);
});
