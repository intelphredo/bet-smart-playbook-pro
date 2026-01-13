// Shared data validation utilities for edge functions
// These help catch data issues early before they propagate

/**
 * Validates that a prediction has required team data
 */
export function validatePredictionTeamData(prediction: {
  match_id: string;
  home_team?: string | null;
  away_team?: string | null;
  match_title?: string | null;
}): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!prediction.match_id) {
    issues.push("Missing match_id");
  }

  if (!prediction.home_team && !prediction.away_team && !prediction.match_title) {
    issues.push("Missing all team identification (home_team, away_team, match_title)");
  }

  if (prediction.match_title && !prediction.home_team && !prediction.away_team) {
    // Try to extract team names from match_title
    const canExtractTeams = 
      prediction.match_title.includes(" @ ") || 
      prediction.match_title.includes(" vs ");
    
    if (!canExtractTeams) {
      issues.push("match_title format doesn't allow team extraction");
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Validates odds data structure
 */
export function validateOddsRecord(record: {
  match_id: string;
  sportsbook_id: string;
  market_type: string;
  home_odds?: number | null;
  away_odds?: number | null;
  spread_home?: number | null;
  total_line?: number | null;
}): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!record.match_id) {
    issues.push("Missing match_id");
  }

  if (!record.sportsbook_id) {
    issues.push("Missing sportsbook_id");
  }

  if (!record.market_type) {
    issues.push("Missing market_type");
  }

  // Validate based on market type
  if (record.market_type === "moneyline") {
    if (record.home_odds === null && record.away_odds === null) {
      issues.push("Moneyline market missing both home and away odds");
    }
  }

  if (record.market_type === "spread") {
    if (record.spread_home === null) {
      issues.push("Spread market missing spread_home value");
    }
  }

  if (record.market_type === "total") {
    if (record.total_line === null) {
      issues.push("Total market missing total_line value");
    }
  }

  // Validate odds are reasonable
  if (record.home_odds !== null && record.home_odds !== undefined) {
    if (record.home_odds < 1.01 || record.home_odds > 1000) {
      issues.push(`home_odds value ${record.home_odds} is outside reasonable range`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Validates weather data
 */
export function validateWeatherData(weather: {
  temperature?: number | null;
  condition?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (weather.temperature === null || weather.temperature === undefined) {
    issues.push("Missing temperature");
  } else if (weather.temperature < -100 || weather.temperature > 150) {
    issues.push(`Temperature ${weather.temperature} is outside reasonable range`);
  }

  if (!weather.condition) {
    issues.push("Missing weather condition");
  }

  if (weather.latitude !== null && weather.latitude !== undefined) {
    if (weather.latitude < -90 || weather.latitude > 90) {
      issues.push(`Latitude ${weather.latitude} is invalid`);
    }
  }

  if (weather.longitude !== null && weather.longitude !== undefined) {
    if (weather.longitude < -180 || weather.longitude > 180) {
      issues.push(`Longitude ${weather.longitude} is invalid`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Parses team names from match_title
 */
export function parseTeamsFromTitle(matchTitle: string): { 
  away: string | null; 
  home: string | null; 
  format: string | null;
} {
  // Format: "Away @ Home"
  if (matchTitle.includes(" @ ")) {
    const parts = matchTitle.split(" @ ");
    if (parts.length === 2) {
      return {
        away: parts[0].trim(),
        home: parts[1].trim(),
        format: "away_at_home",
      };
    }
  }

  // Format: "Away vs Home"
  if (matchTitle.includes(" vs ")) {
    const parts = matchTitle.split(" vs ");
    if (parts.length === 2) {
      return {
        away: parts[0].trim(),
        home: parts[1].trim(),
        format: "away_vs_home",
      };
    }
  }

  // Format: "Home vs. Away" (with period)
  if (matchTitle.includes(" vs. ")) {
    const parts = matchTitle.split(" vs. ");
    if (parts.length === 2) {
      return {
        home: parts[0].trim(),
        away: parts[1].trim(),
        format: "home_vs_away",
      };
    }
  }

  return {
    away: null,
    home: null,
    format: null,
  };
}

/**
 * Validates line movement data
 */
export function validateLineMovement(movement: {
  match_id: string;
  previous_odds: unknown;
  current_odds: unknown;
  movement_percentage?: number | null;
}): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!movement.match_id) {
    issues.push("Missing match_id");
  }

  if (!movement.previous_odds) {
    issues.push("Missing previous_odds");
  }

  if (!movement.current_odds) {
    issues.push("Missing current_odds");
  }

  if (movement.movement_percentage !== null && movement.movement_percentage !== undefined) {
    if (Math.abs(movement.movement_percentage) > 1000) {
      issues.push(`Movement percentage ${movement.movement_percentage} is unusually large`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Batch validates an array of records
 */
export function batchValidate<T>(
  records: T[],
  validator: (record: T) => { isValid: boolean; issues: string[] }
): {
  validRecords: T[];
  invalidRecords: Array<{ record: T; issues: string[] }>;
  summary: { total: number; valid: number; invalid: number };
} {
  const validRecords: T[] = [];
  const invalidRecords: Array<{ record: T; issues: string[] }> = [];

  for (const record of records) {
    const result = validator(record);
    if (result.isValid) {
      validRecords.push(record);
    } else {
      invalidRecords.push({ record, issues: result.issues });
    }
  }

  return {
    validRecords,
    invalidRecords,
    summary: {
      total: records.length,
      valid: validRecords.length,
      invalid: invalidRecords.length,
    },
  };
}
