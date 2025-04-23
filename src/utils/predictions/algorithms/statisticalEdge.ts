
import { Match } from "@/types/sports";
import { generateAdvancedPrediction } from "../core/predictionEngine";
import { calculateWeatherImpact } from "../../smartScore/factors/weatherFactors";
import { calculateInjuryImpact } from "../../smartScore/factors/injuryFactors";

/**
 * Statistical Edge Algorithm
 * 
 * This algorithm focuses on statistical analysis with:
 * - Weather factor amplification
 * - Injury impact assessment with severity analysis
 * - Situational spots (back-to-backs, rest advantage, travel)
 * - Statistical matchup advantages with positional factors
 * - Advanced historical analysis with regression to the mean
 */
export function generateStatisticalEdgePrediction(match: Match): Match {
  // Clone the match to avoid mutation
  const enhancedMatch = { ...match };
  
  // Start with the base prediction
  const basePrediction = generateAdvancedPrediction(match);
  
  // Extract the prediction from the base prediction
  const { prediction } = basePrediction;
  if (!prediction) {
    return basePrediction; // Return the base prediction if no prediction is available
  }
  
  // Apply Statistical Edge specific adjustments
  const adjustedConfidence = applyStatisticalEdgeAdjustments(basePrediction);
  
  // Create the Statistical Edge algorithm-specific prediction
  enhancedMatch.prediction = {
    ...prediction,
    confidence: Math.round(adjustedConfidence),
    algorithmId: "85c48bbe-5b1a-4c1e-a0d5-e284e9e952f1" // Statistical Edge algorithm UUID
  };
  
  return enhancedMatch;
}

function applyStatisticalEdgeAdjustments(match: Match): number {
  if (!match.prediction) return 50;
  
  // Start with the base confidence
  let confidence = match.prediction.confidence;
  
  // Track feature contributions for debugging
  const featureContributions: Record<string, number> = {};
  
  // 1. Enhanced weather impact analysis
  const { weatherImpact, weatherFactors } = calculateWeatherImpact(match);
  if (weatherImpact < 50) {
    // Bad weather causes more uncertainty - stronger reduction
    const weatherEffect = (50 - weatherImpact) * 0.4;
    confidence -= weatherEffect;
    featureContributions.weatherImpact = -weatherEffect;
  }
  
  // 2. Enhanced injury impact analysis with severity and position importance
  const { injuriesScore, injuryFactors } = calculateInjuryImpact(match);
  if (injuriesScore < 50) {
    // Significant injuries cause more uncertainty - stronger adjustment
    const injuryEffect = (50 - injuriesScore) * 0.35;
    confidence -= injuryEffect;
    featureContributions.injuryImpact = -injuryEffect;
  }
  
  // 3. Improved rest and schedule analysis
  const restAdvantageImpact = calculateRestAdvantage(match);
  confidence += restAdvantageImpact;
  featureContributions.restAdvantage = restAdvantageImpact;
  
  // 4. Travel impact analysis
  const travelImpact = calculateTravelImpact(match);
  confidence += travelImpact;
  featureContributions.travel = travelImpact;
  
  // 5. Enhanced statistical matchup analysis
  const matchupImpact = calculateMatchupAdvantages(match);
  confidence += matchupImpact;
  featureContributions.matchupAdvantages = matchupImpact;
  
  // 6. League-specific statistical adjustments
  const leagueAdjustment = getLeagueAdjustment(match.league);
  confidence += leagueAdjustment;
  featureContributions.leagueAdjustment = leagueAdjustment;
  
  // 7. Regression to the mean adjustment for extreme stats
  const regressionAdjustment = calculateRegressionToMean(match);
  confidence += regressionAdjustment;
  featureContributions.regression = regressionAdjustment;

  // Log feature contributions to global object for debugging
  if (typeof window !== "undefined" && window.__BetSmart) {
    window.__BetSmart.addLog(`Statistical Edge feature contributions: ${JSON.stringify(featureContributions)}`);
  }
  
  // Ensure confidence stays within reasonable bounds
  return Math.max(40, Math.min(85, confidence));
}

/**
 * Calculate the impact of rest advantage between teams
 * Rest advantage is a significant situational factor across all sports
 */
function calculateRestAdvantage(match: Match): number {
  // In a real implementation, we would have actual rest days data
  // For now, we'll estimate based on schedule data if available
  
  if (!match.homeTeam.schedule || !match.awayTeam.schedule) {
    return 0; // No schedule data available
  }
  
  // Calculate days since last game
  const calculateRestDays = (team: typeof match.homeTeam) => {
    if (!team.schedule || !team.schedule.previousGame) return 3; // Default to average rest

    const lastGameDate = new Date(team.schedule.previousGame.date);
    const matchDate = new Date(match.startTime);
    const diffTime = Math.abs(matchDate.getTime() - lastGameDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.min(7, diffDays); // Cap at 7 days
  };
  
  const homeRestDays = calculateRestDays(match.homeTeam);
  const awayRestDays = calculateRestDays(match.awayTeam);
  
  // Calculate rest advantage
  const restAdvantage = homeRestDays - awayRestDays;
  
  // Significant rest advantage has proven statistical impact
  // >=2 days advantage is significant in most sports
  if (Math.abs(restAdvantage) >= 2) {
    // Rest advantage favors home team
    if (restAdvantage > 0 && match.prediction?.recommended === 'home') {
      return restAdvantage * 1.5; // Stronger impact for home team with rest
    }
    // Rest advantage favors away team
    else if (restAdvantage < 0 && match.prediction?.recommended === 'away') {
      return Math.abs(restAdvantage) * 1.5;
    }
    // Rest advantage contradicts our prediction
    else if (restAdvantage > 0 && match.prediction?.recommended === 'away') {
      return -restAdvantage * 1.3;
    }
    else if (restAdvantage < 0 && match.prediction?.recommended === 'home') {
      return restAdvantage * 1.3;
    }
  }
  
  return 0;
}

/**
 * Calculate the impact of travel distance on team performance
 */
function calculateTravelImpact(match: Match): number {
  // In a real implementation, we would have actual travel distance data
  // For now, we'll estimate based on team locations if available
  
  // Away teams traveling long distances typically underperform
  // Home teams typically have an advantage
  
  // For simplicity, we'll apply a small boost to home team predictions and
  // a small penalty to away team predictions based on the league
  
  if (match.prediction?.recommended === 'home') {
    // Apply league-specific home court advantage
    switch (match.league) {
      case 'NBA':
        return 1.5;  // NBA has moderate home court advantage
      case 'NHL': 
        return 1.0;  // NHL has lower home ice advantage
      case 'NFL':
        return 2.0;  // NFL has significant home field advantage
      case 'MLB':
        return 0.5;  // MLB has minimal home field advantage
      default:
        return 1.0;
    }
  } else if (match.prediction?.recommended === 'away') {
    // Apply league-specific road disadvantage
    switch (match.league) {
      case 'NBA':
        return -1.0;  // NBA road teams at disadvantage
      case 'NHL': 
        return -0.5;  // NHL road teams at slight disadvantage
      case 'NFL':
        return -2.0;  // NFL road teams at significant disadvantage
      case 'MLB':
        return -0.25; // MLB road teams at minimal disadvantage
      default:
        return -0.5;
    }
  }
  
  return 0;
}

/**
 * Calculate statistical matchup advantages between teams
 */
function calculateMatchupAdvantages(match: Match): number {
  if (!match.homeTeam.stats || !match.awayTeam.stats) return 0;
  
  let matchupScore = 0;
  const homeStats = match.homeTeam.stats;
  const awayStats = match.awayTeam.stats;
  
  // League-specific matchup analyses
  switch (match.league) {
    case 'NBA':
      // NBA-specific matchup factors
      if (
        homeStats.threePtPercentage && 
        awayStats.threePtPercentage && 
        homeStats.threePtDefense && 
        awayStats.threePtDefense
      ) {
        // Three-point shooting advantage
        const homeThreePtAdvantage = (
          (homeStats.threePtPercentage as number) - (awayStats.threePtDefense as number)
        ) - (
          (awayStats.threePtPercentage as number) - (homeStats.threePtDefense as number)
        );
        
        if (Math.abs(homeThreePtAdvantage) > 0.03) { // 3% is significant
          if ((homeThreePtAdvantage > 0 && match.prediction?.recommended === 'home') ||
              (homeThreePtAdvantage < 0 && match.prediction?.recommended === 'away')) {
            matchupScore += 3;
          }
        }
      }
      break;
      
    case 'NFL':
      // NFL-specific matchup factors
      if (
        homeStats.passingYards && 
        awayStats.passingYards && 
        homeStats.passingDefense && 
        awayStats.passingDefense
      ) {
        // Passing offense vs defense advantage
        const homePassingAdvantage = (
          (homeStats.passingYards as number) - (awayStats.passingDefense as number)
        ) - (
          (awayStats.passingYards as number) - (homeStats.passingDefense as number)
        );
        
        if (Math.abs(homePassingAdvantage) > 50) { // 50 yards is significant
          if ((homePassingAdvantage > 0 && match.prediction?.recommended === 'home') ||
              (homePassingAdvantage < 0 && match.prediction?.recommended === 'away')) {
            matchupScore += 2;
          }
        }
      }
      break;
      
    case 'MLB':
      // MLB-specific matchup factors
      if (
        homeStats.battingAvg && 
        awayStats.battingAvg && 
        homeStats.era && 
        awayStats.era
      ) {
        // Hitting vs pitching advantage
        const homeOffenseAdvantage = (homeStats.battingAvg as number) - (awayStats.era as number / 10);
        const awayOffenseAdvantage = (awayStats.battingAvg as number) - (homeStats.era as number / 10);
        
        if (Math.abs(homeOffenseAdvantage - awayOffenseAdvantage) > 0.02) { // 0.02 is significant
          if (
            (homeOffenseAdvantage > awayOffenseAdvantage && match.prediction?.recommended === 'home') ||
            (homeOffenseAdvantage < awayOffenseAdvantage && match.prediction?.recommended === 'away')
          ) {
            matchupScore += 3;
          }
        }
      }
      break;
  }
  
  return matchupScore;
}

/**
 * League-specific statistical adjustments
 */
function getLeagueAdjustment(league: string): number {
  switch (league) {
    case 'NFL':
      return 2; // NFL is more statistical in nature
    case 'MLB':
      return 2.5; // MLB is highly statistical
    case 'NHL':
      return -2; // NHL has high variance
    case 'NBA':
      return 1; // NBA has moderate statistical predictability
    default:
      return 0;
  }
}

/**
 * Calculate regression to the mean adjustment for extreme statistics
 */
function calculateRegressionToMean(match: Match): number {
  let regressionImpact = 0;
  
  // Check for teams performing far above or below their long-term averages
  if (match.homeTeam.stats?.winPercentage && match.homeTeam.stats?.expectedWinPercentage) {
    const homeOverperformance = (match.homeTeam.stats.winPercentage as number) - 
                                (match.homeTeam.stats.expectedWinPercentage as number);
    
    // If team is overperforming by more than 10%, expect regression
    if (homeOverperformance > 0.1 && match.prediction?.recommended === 'home') {
      regressionImpact -= 3; // Expect regression downward
    }
    // If team is underperforming, expect positive regression
    else if (homeOverperformance < -0.1 && match.prediction?.recommended === 'home') {
      regressionImpact += 2; // Expect regression upward
    }
  }
  
  if (match.awayTeam.stats?.winPercentage && match.awayTeam.stats?.expectedWinPercentage) {
    const awayOverperformance = (match.awayTeam.stats.winPercentage as number) - 
                                (match.awayTeam.stats.expectedWinPercentage as number);
    
    // If team is overperforming, expect regression
    if (awayOverperformance > 0.1 && match.prediction?.recommended === 'away') {
      regressionImpact -= 3; // Expect regression downward
    }
    // If team is underperforming, expect positive regression
    else if (awayOverperformance < -0.1 && match.prediction?.recommended === 'away') {
      regressionImpact += 2; // Expect regression upward
    }
  }
  
  return regressionImpact;
}

// Function to apply Statistical Edge to a collection of matches
export function applyStatisticalEdgePredictions(matches: Match[]): Match[] {
  return matches.map(match => generateStatisticalEdgePrediction(match));
}
