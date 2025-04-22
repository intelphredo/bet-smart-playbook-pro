
import { Match } from "@/types/sports";

/**
 * Apply prediction validation to check for biases and improve quality
 */
export function applyPredictionValidation(matches: Match[]): Match[] {
  return matches.map(validateMatchPrediction);
}

/**
 * Validate a single match prediction
 * Checks for common biases and adds validation metadata
 */
function validateMatchPrediction(match: Match): Match {
  // Skip validation if no prediction exists
  if (!match.prediction) {
    return match;
  }
  
  // Clone match to avoid mutation
  const validatedMatch = { ...match };
  
  // Add validation metadata if not present
  if (!validatedMatch.prediction.validation) {
    validatedMatch.prediction.validation = {
      biasDetected: false,
      biasType: null,
      validationScore: 100,
      notes: []
    };
  }
  
  const validation = validatedMatch.prediction.validation;
  
  // Check for home team bias
  const homeTeamBias = detectHomeTeamBias(match);
  if (homeTeamBias) {
    validation.biasDetected = true;
    validation.biasType = "home-team";
    validation.validationScore -= 15;
    validation.notes.push("Possible home team bias detected");
  }
  
  // Check for favorite team bias
  const favoriteTeamBias = detectFavoriteTeamBias(match);
  if (favoriteTeamBias) {
    validation.biasDetected = true;
    validation.biasType = "favorite-team";
    validation.validationScore -= 10;
    validation.notes.push("Possible favorite team bias detected");
  }
  
  // Check for consistency
  if (match.prediction.recommended === "home" && match.prediction.confidence < 50) {
    validation.notes.push("Recommendation/confidence mismatch");
    validation.validationScore -= 5;
  }
  
  // Cap validation score between 0-100
  validation.validationScore = Math.max(0, Math.min(100, validation.validationScore));
  
  return validatedMatch;
}

/**
 * Detect potential home team bias in prediction
 */
function detectHomeTeamBias(match: Match): boolean {
  if (!match.prediction) return false;
  
  // Check if home team is consistently favored
  if (match.prediction.recommended === "home") {
    // If home team has significantly worse record but is still favored
    const homeRecord = parseTeamRecord(match.homeTeam.record);
    const awayRecord = parseTeamRecord(match.awayTeam.record);
    
    if (homeRecord && awayRecord) {
      const homeWinPct = homeRecord.wins / (homeRecord.wins + homeRecord.losses);
      const awayWinPct = awayRecord.wins / (awayRecord.wins + awayRecord.losses);
      
      // If away team has at least 15% better win rate but home team is still favored with high confidence
      if ((awayWinPct - homeWinPct) > 0.15 && match.prediction.confidence > 60) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Detect potential favorite team bias (favoring teams with better records)
 */
function detectFavoriteTeamBias(match: Match): boolean {
  if (!match.prediction) return false;
  
  const recommendation = match.prediction.recommended;
  const favoredTeam = recommendation === "home" ? match.homeTeam : match.awayTeam;
  const underdogTeam = recommendation === "home" ? match.awayTeam : match.homeTeam;
  
  // Check if favorite is overly favored
  if (match.prediction.confidence > 75) {
    // If teams have similar records, high confidence may indicate bias
    const favoredRecord = parseTeamRecord(favoredTeam.record);
    const underdogRecord = parseTeamRecord(underdogTeam.record);
    
    if (favoredRecord && underdogRecord) {
      const favoredWinPct = favoredRecord.wins / (favoredRecord.wins + favoredRecord.losses);
      const underdogWinPct = underdogRecord.wins / (underdogRecord.wins + underdogRecord.losses);
      
      // If teams have similar win rates but prediction is very confident
      if (Math.abs(favoredWinPct - underdogWinPct) < 0.1) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Parse team record string into wins/losses
 */
function parseTeamRecord(record?: string): { wins: number; losses: number } | null {
  if (!record) return null;
  
  const parts = record.split('-');
  if (parts.length !== 2) return null;
  
  const wins = parseInt(parts[0], 10);
  const losses = parseInt(parts[1], 10);
  
  if (isNaN(wins) || isNaN(losses)) return null;
  
  return { wins, losses };
}
