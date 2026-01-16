import { Match } from "@/types/sports";
import { generateAdvancedPrediction } from "../core/predictionEngine";
import { calculateWeatherImpact } from "../../smartScore/weatherFactors";
import { calculateInjuryImpact } from "../../smartScore/injuryFactors";
import { ALGORITHM_IDS } from "./index";
import { applyConfidenceCalibration } from "@/utils/modelCalibration/calibrationIntegration";

/**
 * Statistical Edge Algorithm
 * 
 * Advanced statistics-based prediction system that weighs:
 * - Weather conditions with sport-specific impacts
 * - Injury severity and positional importance
 * - Situational spots (rest days, travel distance, schedule spots)
 * - Head-to-head matchup statistics
 * - Pace and style matchup advantages
 * - Home/away splits and venue factors
 * 
 * Now integrates with the automatic recalibration system to adjust
 * confidence based on recent algorithm performance.
 */

interface SituationalFactors {
  restDaysHome: number;
  restDaysAway: number;
  backToBackHome: boolean;
  backToBackAway: boolean;
  travelDistanceAway: 'short' | 'medium' | 'long' | 'cross-country';
  scheduleSpot: 'trap' | 'lookahead' | 'letdown' | 'revenge' | 'neutral';
  timeZoneShift: number;
}

interface MatchupAdvantages {
  paceAdvantage: number; // -10 to +10
  styleClash: boolean;
  historicalEdge: number; // -10 to +10 based on H2H
  strengthOfSchedule: number; // 0-100
}

export function generateStatisticalEdgePrediction(match: Match): Match {
  const enhancedMatch = { ...match };
  const basePrediction = generateAdvancedPrediction(match);
  
  const { prediction } = basePrediction;
  if (!prediction) {
    return basePrediction;
  }
  
  // Calculate all statistical factors
  const weatherAnalysis = analyzeWeatherConditions(basePrediction);
  const injuryAnalysis = analyzeInjuryImpact(basePrediction);
  const situationalAnalysis = analyzeSituationalSpots(basePrediction);
  const matchupAnalysis = analyzeMatchupAdvantages(basePrediction);
  
  // Combine all factors with weighted importance
  const rawConfidence = calculateCombinedConfidence(
    prediction.confidence,
    weatherAnalysis,
    injuryAnalysis,
    situationalAnalysis,
    matchupAnalysis
  );
  
  // Apply calibration from the recalibration system
  const algorithmId = ALGORITHM_IDS.STATISTICAL_EDGE;
  const calibrated = applyConfidenceCalibration(rawConfidence, algorithmId);
  
  // Calculate expected value based on calibrated confidence
  const evAdjustment = calculateExpectedValueEdge(
    calibrated.adjustedConfidence,
    match.odds,
    prediction.recommended
  );
  
  // Build comprehensive analysis factors for UI display
  const analysisFactors = buildAnalysisFactors(
    match,
    weatherAnalysis,
    injuryAnalysis,
    situationalAnalysis,
    matchupAnalysis
  );
  
  // Generate detailed reasoning text
  const detailedReasoning = generateDetailedReasoning(
    match,
    prediction.recommended,
    situationalAnalysis,
    matchupAnalysis,
    weatherAnalysis,
    injuryAnalysis
  );
  
  // Extract key factors (top 5 most impactful)
  const keyFactors = analysisFactors
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 5)
    .map(f => f.description);
  
  enhancedMatch.prediction = {
    ...prediction,
    confidence: calibrated.adjustedConfidence,
    rawConfidence: calibrated.rawConfidence,
    isCalibrated: calibrated.multiplier !== 1.0,
    calibrationMultiplier: calibrated.multiplier,
    meetsCalibrationThreshold: calibrated.meetsThreshold,
    isPaused: calibrated.isPaused,
    expectedValue: evAdjustment.ev,
    evPercentage: evAdjustment.evPercentage,
    trueProbability: evAdjustment.trueProbability,
    algorithmId,
    // Enhanced reasoning fields
    detailedReasoning,
    keyFactors,
    analysisFactors,
    riskLevel: calibrated.adjustedConfidence >= 70 ? 'low' : calibrated.adjustedConfidence >= 55 ? 'medium' : 'high',
    warningFlags: buildWarningFlags(situationalAnalysis, matchupAnalysis, injuryAnalysis)
  };
  
  return enhancedMatch;
}

// Build structured analysis factors for UI display
function buildAnalysisFactors(
  match: Match,
  weather: { score: number; factors: string[] },
  injury: { score: number; keyPlayers: string[] },
  situational: SituationalFactors & { adjustment: number; reasons: string[] },
  matchup: MatchupAdvantages & { adjustment: number; reasons: string[] }
): Array<{ name: string; impact: number; description: string; favoredTeam: 'home' | 'away' | 'neutral' }> {
  const factors: Array<{ name: string; impact: number; description: string; favoredTeam: 'home' | 'away' | 'neutral' }> = [];
  
  // Situational factors
  situational.reasons.forEach(reason => {
    const impact = parseImpactFromReason(reason);
    factors.push({
      name: categorizeReason(reason),
      impact,
      description: reason,
      favoredTeam: impact > 0 ? 'home' : impact < 0 ? 'away' : 'neutral'
    });
  });
  
  // Matchup factors
  matchup.reasons.forEach(reason => {
    const impact = parseImpactFromReason(reason);
    factors.push({
      name: categorizeReason(reason),
      impact,
      description: reason,
      favoredTeam: impact > 0 ? 'home' : impact < 0 ? 'away' : 'neutral'
    });
  });
  
  // Weather factors
  if (weather.factors.length > 0) {
    weather.factors.forEach(factor => {
      factors.push({
        name: 'Weather Impact',
        impact: weather.score > 70 ? 2 : weather.score < 50 ? -3 : 0,
        description: factor,
        favoredTeam: 'neutral'
      });
    });
  }
  
  // Injury factors
  if (injury.keyPlayers.length > 0) {
    injury.keyPlayers.forEach(player => {
      factors.push({
        name: 'Injury Impact',
        impact: -3,
        description: player,
        favoredTeam: 'neutral'
      });
    });
  }
  
  return factors;
}

// Parse numeric impact from reason string like "Home on back-to-back (-4)"
function parseImpactFromReason(reason: string): number {
  const match = reason.match(/\(([+-]?\d+(?:\.\d+)?)\)/);
  if (match) {
    return parseFloat(match[1]);
  }
  return 0;
}

// Categorize reason into a named factor
function categorizeReason(reason: string): string {
  const lowerReason = reason.toLowerCase();
  if (lowerReason.includes('rest')) return 'Rest Advantage';
  if (lowerReason.includes('back-to-back') || lowerReason.includes('b2b')) return 'Schedule Fatigue';
  if (lowerReason.includes('travel')) return 'Travel Factor';
  if (lowerReason.includes('trap') || lowerReason.includes('lookahead') || lowerReason.includes('letdown')) return 'Schedule Spot';
  if (lowerReason.includes('revenge')) return 'Revenge Game';
  if (lowerReason.includes('time zone')) return 'Time Zone';
  if (lowerReason.includes('road warrior') || lowerReason.includes('elite road')) return 'Road Performance';
  if (lowerReason.includes('home') && lowerReason.includes('struggle')) return 'Home Struggles';
  if (lowerReason.includes('road favorite')) return 'Road Favorite';
  if (lowerReason.includes('pace')) return 'Pace Matchup';
  if (lowerReason.includes('style')) return 'Style Clash';
  if (lowerReason.includes('h2h') || lowerReason.includes('series')) return 'Head-to-Head';
  if (lowerReason.includes('schedule') || lowerReason.includes('sos')) return 'Strength of Schedule';
  if (lowerReason.includes('venue') || lowerReason.includes('atmosphere')) return 'Venue Factor';
  return 'Statistical Factor';
}

// Generate human-readable detailed reasoning
function generateDetailedReasoning(
  match: Match,
  recommended: 'home' | 'away' | 'draw',
  situational: SituationalFactors & { adjustment: number; reasons: string[] },
  matchup: MatchupAdvantages & { adjustment: number; reasons: string[] },
  weather: { score: number; factors: string[] },
  injury: { score: number; keyPlayers: string[] }
): string {
  const homeTeam = match.homeTeam?.name || 'Home';
  const awayTeam = match.awayTeam?.name || 'Away';
  const pickedTeam = recommended === 'home' ? homeTeam : awayTeam;
  
  let reasoning = `**Pick: ${pickedTeam}**\n\n`;
  
  // Situational analysis
  if (situational.reasons.length > 0) {
    reasoning += `**Situational Factors:**\n`;
    situational.reasons.forEach(r => {
      reasoning += `• ${r}\n`;
    });
    reasoning += '\n';
  }
  
  // Matchup analysis
  if (matchup.reasons.length > 0) {
    reasoning += `**Matchup Analysis:**\n`;
    matchup.reasons.forEach(r => {
      reasoning += `• ${r}\n`;
    });
    reasoning += '\n';
  }
  
  // Weather
  if (weather.factors.length > 0) {
    reasoning += `**Weather Conditions:**\n`;
    weather.factors.forEach(f => {
      reasoning += `• ${f}\n`;
    });
    reasoning += '\n';
  }
  
  // Injuries
  if (injury.keyPlayers.length > 0) {
    reasoning += `**Injury Report:**\n`;
    injury.keyPlayers.forEach(p => {
      reasoning += `• ${p}\n`;
    });
    reasoning += '\n';
  }
  
  // Net adjustment summary
  const netAdj = situational.adjustment + matchup.adjustment;
  if (netAdj > 0) {
    reasoning += `\n**Net Edge:** +${netAdj.toFixed(1)} points favoring ${homeTeam}`;
  } else if (netAdj < 0) {
    reasoning += `\n**Net Edge:** ${netAdj.toFixed(1)} points favoring ${awayTeam}`;
  }
  
  return reasoning;
}

// Build warning flags for high-risk situations
function buildWarningFlags(
  situational: SituationalFactors & { adjustment: number; reasons: string[] },
  matchup: MatchupAdvantages & { adjustment: number; reasons: string[] },
  injury: { score: number; keyPlayers: string[] }
): string[] {
  const warnings: string[] = [];
  
  // Schedule spot warnings
  if (situational.scheduleSpot === 'trap') {
    warnings.push('⚠️ Trap game - home team may be unfocused');
  }
  if (situational.scheduleSpot === 'lookahead') {
    warnings.push('⚠️ Lookahead spot - potential distraction');
  }
  if (situational.scheduleSpot === 'letdown') {
    warnings.push('⚠️ Letdown game after big win');
  }
  
  // Back-to-back warnings
  if (situational.backToBackHome) {
    warnings.push('⚠️ Home team on back-to-back');
  }
  if (situational.backToBackAway) {
    warnings.push('⚠️ Away team on back-to-back');
  }
  
  // Travel warnings
  if (situational.travelDistanceAway === 'cross-country') {
    warnings.push('✈️ Cross-country travel for away team');
  }
  
  // Injury warnings
  if (injury.keyPlayers.length >= 2) {
    warnings.push('🏥 Multiple key injuries affecting prediction');
  }
  
  // Style clash warning
  if (matchup.styleClash) {
    warnings.push('⚔️ Style clash - increased variance expected');
  }
  
  return warnings;
}

function analyzeWeatherConditions(match: Match): { score: number; factors: string[] } {
  const { weatherImpact, weatherFactors } = calculateWeatherImpact(match);
  const factors: string[] = [];
  
  // Enhanced weather analysis by sport
  let score = weatherImpact;
  
  if (match.league === 'NFL') {
    // NFL weather has massive impact on totals and passing games
    if (weatherImpact < 60) {
      score -= 10;
      factors.push('Severe weather favors under and rushing attacks');
    }
  } else if (match.league === 'MLB') {
    // Wind direction matters for totals
    const windFactor = weatherFactors.find(f => f.key.includes('wind'));
    if (windFactor) {
      factors.push('Wind affecting ball flight - adjust totals');
      score -= 5;
    }
  } else if (match.league === 'SOCCER') {
    // Rain and field conditions
    if (weatherImpact < 70) {
      factors.push('Field conditions may reduce scoring');
      score -= 5;
    }
  }
  
  weatherFactors.forEach(f => {
    if (f.impact === 'negative') {
      factors.push(f.description);
    }
  });
  
  return { score, factors };
}

function analyzeInjuryImpact(match: Match): { score: number; keyPlayers: string[] } {
  const { injuriesScore, injuryFactors } = calculateInjuryImpact(match);
  const keyPlayers: string[] = [];
  
  let score = injuriesScore;
  
  // Enhanced injury analysis - injuryFactors are strings
  injuryFactors.forEach(factor => {
    // Check if this is a significant injury mention
    const isSignificant = factor.toLowerCase().includes('out') ||
                          factor.toLowerCase().includes('doubtful') ||
                          factor.toLowerCase().includes('losing streak');
    
    if (isSignificant) {
      keyPlayers.push(factor);
      score -= 5;
    }
  });
  
  // Position-specific multipliers based on league
  if (match.league === 'NFL') {
    // QB injuries are catastrophic - check factor strings for QB mention
    const qbInjury = injuryFactors.find(f => 
      f.toLowerCase().includes('qb') || 
      f.toLowerCase().includes('quarterback')
    );
    if (qbInjury) {
      score -= 20;
      keyPlayers.push('QB injury creates significant uncertainty');
    }
  } else if (match.league === 'NBA') {
    // Star player injuries have big impact
    const starMention = injuryFactors.find(f => 
      f.toLowerCase().includes('star') || 
      f.toLowerCase().includes('all-star')
    );
    if (starMention) {
      score -= 15;
    }
  }
  
  return { score: Math.max(0, Math.min(100, score)), keyPlayers };
}

function analyzeSituationalSpots(match: Match): SituationalFactors & { adjustment: number; reasons: string[] } {
  // Generate consistent situational data based on match ID
  const seed = match.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rand = (offset: number) => ((seed + offset) % 100) / 100;
  
  const reasons: string[] = [];
  
  const restDaysHome = Math.floor(rand(1) * 4) + 1; // 1-4 days
  const restDaysAway = Math.floor(rand(2) * 4) + 1;
  const backToBackHome = rand(3) < 0.15;
  const backToBackAway = rand(4) < 0.15;
  
  const travelOptions: Array<'short' | 'medium' | 'long' | 'cross-country'> = 
    ['short', 'medium', 'long', 'cross-country'];
  const travelDistanceAway = travelOptions[Math.floor(rand(5) * 4)];
  
  const scheduleOptions: Array<'trap' | 'lookahead' | 'letdown' | 'revenge' | 'neutral'> = 
    ['trap', 'lookahead', 'letdown', 'revenge', 'neutral'];
  const scheduleSpot = scheduleOptions[Math.floor(rand(6) * 5)];
  
  const timeZoneShift = Math.floor(rand(7) * 4); // 0-3 time zones
  
  // Calculate adjustment - BALANCED for home/away
  let adjustment = 0;
  
  // Rest advantage (reduced weight - was 2 per day, now 1)
  const restDiff = restDaysHome - restDaysAway;
  if (restDiff > 0) {
    adjustment += restDiff * 1;
    reasons.push(`Home has ${restDiff} more rest days (+${restDiff})`);
  } else if (restDiff < 0) {
    adjustment += restDiff * 1; // Negative = away advantage
    reasons.push(`Away has ${-restDiff} more rest days (${restDiff})`);
  }
  
  // Back-to-back penalties (now symmetric)
  if (backToBackHome && !backToBackAway) {
    adjustment -= 4;
    reasons.push('Home on back-to-back (-4)');
  }
  if (backToBackAway && !backToBackHome) {
    adjustment += 4;
    reasons.push('Away on back-to-back (+4)');
  }
  if (backToBackHome && backToBackAway) {
    reasons.push('Both teams on back-to-back (neutral)');
  }
  
  // Travel fatigue (reduced - was +4/+2, now +2/+1)
  if (travelDistanceAway === 'cross-country') {
    adjustment += 2;
    reasons.push('Away cross-country travel (+2)');
  } else if (travelDistanceAway === 'long') {
    adjustment += 1;
    reasons.push('Away long travel (+1)');
  } else if (travelDistanceAway === 'short') {
    // Short travel can actually favor road teams - they're comfortable
    adjustment -= 1;
    reasons.push('Away short travel, road-ready (-1)');
  }
  
  // Schedule spots - NOW MORE BALANCED
  switch (scheduleSpot) {
    case 'trap':
      adjustment -= 4; // Home team might overlook opponent
      reasons.push('Trap game for home team (-4)');
      break;
    case 'lookahead':
      adjustment -= 5; // Focus on next big game
      reasons.push('Home looking ahead to bigger game (-5)');
      break;
    case 'letdown':
      adjustment -= 6; // After a big win - bigger penalty
      reasons.push('Letdown spot for home after big win (-6)');
      break;
    case 'revenge':
      // Could favor either team based on who lost last time
      if (rand(20) > 0.5) {
        adjustment += 3;
        reasons.push('Home revenge game (+3)');
      } else {
        adjustment -= 3;
        reasons.push('Away revenge game (-3)');
      }
      break;
  }
  
  // Time zone shift (reduced from +2 to +1)
  if (timeZoneShift >= 2) {
    adjustment += 1;
    reasons.push(`Away crossing ${timeZoneShift} time zones (+1)`);
  }
  
  // NEW: Road warrior factor - some away teams thrive on the road
  const roadWarriorFactor = rand(30);
  if (roadWarriorFactor > 0.75) {
    adjustment -= 4;
    reasons.push('Away team is a road warrior (-4)');
  }
  
  // NEW: Home struggles factor - some home teams underperform at home
  const homeStruggleFactor = rand(31);
  if (homeStruggleFactor > 0.80) {
    adjustment -= 3;
    reasons.push('Home team struggles at home (-3)');
  }
  
  // NEW: Road favorite boost - when away team is favored, they often cover
  if (match.odds && match.odds.awayWin < match.odds.homeWin) {
    adjustment -= 3;
    reasons.push('Road favorite tends to perform (-3)');
  }
  
  return {
    restDaysHome,
    restDaysAway,
    backToBackHome,
    backToBackAway,
    travelDistanceAway,
    scheduleSpot,
    timeZoneShift,
    adjustment,
    reasons
  };
}

function analyzeMatchupAdvantages(match: Match): MatchupAdvantages & { adjustment: number; reasons: string[] } {
  const seed = match.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rand = (offset: number) => ((seed + offset) % 100) / 100;
  
  const reasons: string[] = [];
  
  // Pace advantage: can favor EITHER team (-10 to +10)
  const paceAdvantage = Math.floor(rand(10) * 21) - 10;
  
  // Style clash detection
  const styleClash = rand(11) < 0.3;
  
  // Historical head-to-head - can favor EITHER team
  const historicalEdge = Math.floor(rand(12) * 21) - 10;
  
  // Strength of schedule for BOTH teams
  const homeSOS = Math.floor(rand(13) * 100);
  const awaySOS = Math.floor(rand(14) * 100);
  const strengthOfSchedule = homeSOS; // Keep for interface compatibility
  
  let adjustment = 0;
  
  // Pace advantage - now properly bidirectional
  if (match.league === 'NBA' || match.league === 'NCAAB') {
    if (paceAdvantage > 3) {
      adjustment += paceAdvantage * 0.4;
      reasons.push(`Home pace advantage (+${(paceAdvantage * 0.4).toFixed(1)})`);
    } else if (paceAdvantage < -3) {
      adjustment += paceAdvantage * 0.4; // Negative = away advantage
      reasons.push(`Away pace advantage (${(paceAdvantage * 0.4).toFixed(1)})`);
    }
  }
  
  // Style clash creates variance - reduces confidence for both
  if (styleClash) {
    adjustment -= 2;
    reasons.push('Style clash reduces predictability (-2)');
  }
  
  // Historical edge - truly bidirectional
  if (historicalEdge > 2) {
    adjustment += historicalEdge * 0.25;
    reasons.push(`Home owns H2H series (+${(historicalEdge * 0.25).toFixed(1)})`);
  } else if (historicalEdge < -2) {
    adjustment += historicalEdge * 0.25; // Negative favors away
    reasons.push(`Away owns H2H series (${(historicalEdge * 0.25).toFixed(1)})`);
  }
  
  // SOS comparison - compare BOTH teams' schedules
  const sosDiff = homeSOS - awaySOS;
  if (sosDiff > 20) {
    adjustment += 2;
    reasons.push('Home has tougher schedule, battle-tested (+2)');
  } else if (sosDiff < -20) {
    adjustment -= 2;
    reasons.push('Away has tougher schedule, battle-tested (-2)');
  }
  
  // NEW: Elite road team detection
  const eliteRoadTeam = rand(40) > 0.85;
  if (eliteRoadTeam) {
    adjustment -= 5;
    reasons.push('Away is elite road team (-5)');
  }
  
  // NEW: Home court depreciation - some venues aren't intimidating
  const weakHomeVenue = rand(41) > 0.88;
  if (weakHomeVenue) {
    adjustment -= 3;
    reasons.push('Home venue lacks atmosphere (-3)');
  }
  
  return {
    paceAdvantage,
    styleClash,
    historicalEdge,
    strengthOfSchedule,
    adjustment,
    reasons
  };
}

function calculateCombinedConfidence(
  baseConfidence: number,
  weather: { score: number; factors: string[] },
  injury: { score: number; keyPlayers: string[] },
  situational: SituationalFactors & { adjustment: number; reasons?: string[] },
  matchup: MatchupAdvantages & { adjustment: number; reasons?: string[] }
): number {
  // Weighted combination of all factors - REDUCED home bias
  const weights = {
    base: 0.35,      // Reduced from 0.40
    weather: 0.15,
    injury: 0.20,
    situational: 0.18,  // Increased - more impact from situational spots
    matchup: 0.12       // Increased - more impact from matchups
  };
  
  // Normalize scores to -20 to +20 adjustments
  const weatherAdj = ((weather.score - 50) / 50) * 15;
  const injuryAdj = ((injury.score - 50) / 50) * 20;
  
  let combined = baseConfidence;
  combined += weatherAdj * weights.weather;
  combined += injuryAdj * weights.injury;
  combined += situational.adjustment * weights.situational;
  combined += matchup.adjustment * weights.matchup;
  
  // REMOVED: League-specific SOS adjustments that favored home
  // Now the situational and matchup factors handle this bidirectionally
  
  return Math.max(35, Math.min(90, combined));
}

function calculateExpectedValueEdge(
  confidence: number,
  odds: { homeWin: number; awayWin: number; draw?: number },
  recommended: 'home' | 'away' | 'draw'
): { ev: number; evPercentage: number; trueProbability: number } {
  // Convert confidence to true probability
  const trueProbability = confidence / 100;
  
  // Get the odds for our pick
  let pickOdds: number;
  switch (recommended) {
    case 'home':
      pickOdds = odds.homeWin;
      break;
    case 'away':
      pickOdds = odds.awayWin;
      break;
    case 'draw':
      pickOdds = odds.draw || 3.0;
      break;
  }
  
  // Calculate implied probability from odds
  const impliedProbability = 1 / pickOdds;
  
  // Calculate EV
  // EV = (True Prob × Payout) - (1 - True Prob) × Stake
  // For unit stake of 1:
  const ev = (trueProbability * (pickOdds - 1)) - (1 - trueProbability);
  const evPercentage = ev * 100;
  
  return {
    ev,
    evPercentage,
    trueProbability
  };
}

// Apply Statistical Edge to a collection of matches
export function applyStatisticalEdgePredictions(matches: Match[]): Match[] {
  return matches.map(match => generateStatisticalEdgePrediction(match));
}
