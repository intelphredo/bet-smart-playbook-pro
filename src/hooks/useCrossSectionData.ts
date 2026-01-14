// Cross-Section Data Integration Hook
// Aggregates related data from multiple sources for a given match or context

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Match, League } from "@/types/sports";
import { useMatchBettingTrend } from "@/hooks/useBettingTrends";
import { useMatchInjuryImpact } from "@/hooks/useMatchInjuryImpact";
import { HistoricalPrediction } from "@/hooks/useHistoricalPredictions";
import { BettingScenario } from "@/utils/scenarioAnalysis/types";
import { detectScenariosForMatch } from "@/utils/scenarioAnalysis/scenarioDetector";

export interface CrossSectionInsight {
  type: 'warning' | 'opportunity' | 'info' | 'validation';
  source: string;
  title: string;
  description: string;
  confidence: number;
  action?: string;
  relatedData?: any;
}

export interface HistoricalMatchup {
  date: string;
  homeTeam: string;
  awayTeam: string;
  prediction: string;
  confidence: number;
  status: 'won' | 'lost' | 'pending';
  actualScore?: { home: number; away: number };
}

export interface CrossSectionData {
  // Injury Data
  injuries: {
    homeTeam: any[];
    awayTeam: any[];
    totalImpact: number;
    keyInjuries: string[];
  } | null;

  // AI History for Similar Matchups
  historicalMatchups: HistoricalMatchup[];
  historicalWinRate: number;
  modelConfidenceHistory: number[];

  // Betting Trends
  bettingTrend: {
    publicPercent: number;
    sharpPercent: number;
    lineMovement: number;
    isReverseLineMovement: boolean;
    sharpSide: 'home' | 'away' | null;
  } | null;

  // Detected Scenarios
  scenarios: BettingScenario[];
  primaryScenario: BettingScenario | null;

  // Cross-Section Insights
  insights: CrossSectionInsight[];

  // Validation Flags
  validations: {
    aiAlignedWithSharps: boolean;
    injuryAccountedFor: boolean;
    scenarioMatchesHistory: boolean;
    trendSupportsProjection: boolean;
  };

  // Loading states
  isLoading: boolean;
  hasData: boolean;
}

// Fetch historical predictions for similar matchups
async function fetchSimilarMatchups(
  homeTeam: string,
  awayTeam: string,
  league: string
): Promise<HistoricalPrediction[]> {
  // Query predictions involving these teams
  const { data, error } = await supabase
    .from("algorithm_predictions")
    .select("*")
    .or(`home_team.ilike.%${homeTeam}%,away_team.ilike.%${homeTeam}%,home_team.ilike.%${awayTeam}%,away_team.ilike.%${awayTeam}%`)
    .eq("league", league)
    .in("status", ["won", "lost"])
    .order("predicted_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching similar matchups:", error);
    return [];
  }

  return data || [];
}

// Generate cross-section insights based on all data
function generateInsights(
  match: Match,
  injuries: any,
  historicalMatchups: HistoricalMatchup[],
  bettingTrend: any,
  scenarios: BettingScenario[]
): CrossSectionInsight[] {
  const insights: CrossSectionInsight[] = [];
  const prediction = match.prediction;

  // 1. Sharp Money vs AI Alignment
  if (bettingTrend && prediction) {
    const aiRecommends = prediction.recommended;
    const sharpSide = bettingTrend.sharpPercent > bettingTrend.publicPercent 
      ? (bettingTrend.lineMovement > 0 ? 'home' : 'away')
      : null;

    if (sharpSide && aiRecommends === sharpSide) {
      insights.push({
        type: 'validation',
        source: 'Betting Trends + AI',
        title: 'Sharp Money Confirms AI Pick',
        description: `Professional bettors (${bettingTrend.sharpPercent}%) align with our ${prediction.confidence}% confidence pick on ${aiRecommends}.`,
        confidence: 85,
        action: 'Consider increasing stake'
      });
    } else if (sharpSide && aiRecommends !== sharpSide) {
      insights.push({
        type: 'warning',
        source: 'Betting Trends vs AI',
        title: 'Sharp Money Disagrees',
        description: `Sharp bettors favor ${sharpSide} but AI recommends ${aiRecommends}. Evaluate additional factors.`,
        confidence: 60,
        action: 'Review injury and momentum data'
      });
    }

    // Reverse line movement detection
    if (bettingTrend.isReverseLineMovement) {
      insights.push({
        type: 'opportunity',
        source: 'Line Movement',
        title: 'Reverse Line Movement Detected',
        description: 'Line moving opposite to public betting - indicates sharp action.',
        confidence: 75,
        action: 'Consider betting with the line movement'
      });
    }
  }

  // 2. Injury Impact Assessment
  if (injuries && injuries.totalImpact > 15) {
    const impactedTeam = injuries.homeTeam.length > injuries.awayTeam.length ? 'home' : 'away';
    insights.push({
      type: 'warning',
      source: 'Injuries',
      title: 'Significant Injury Impact',
      description: `${injuries.keyInjuries.slice(0, 2).join(", ")} - Total impact: ${injuries.totalImpact.toFixed(0)}% on ${impactedTeam} team.`,
      confidence: 70,
      action: prediction?.recommended === impactedTeam ? 'Reconsider pick or reduce stake' : 'Injury favors your pick'
    });
  }

  // 3. Historical Pattern Analysis
  if (historicalMatchups.length >= 3) {
    const wonCount = historicalMatchups.filter(m => m.status === 'won').length;
    const winRate = (wonCount / historicalMatchups.length) * 100;

    if (winRate >= 70) {
      insights.push({
        type: 'validation',
        source: 'AI History',
        title: 'Strong Historical Performance',
        description: `Model has ${winRate.toFixed(0)}% accuracy in ${historicalMatchups.length} similar matchups.`,
        confidence: 80,
        relatedData: { winRate, sampleSize: historicalMatchups.length }
      });
    } else if (winRate <= 40 && historicalMatchups.length >= 5) {
      insights.push({
        type: 'warning',
        source: 'AI History',
        title: 'Weak Historical Performance',
        description: `Only ${winRate.toFixed(0)}% accuracy in similar matchups. Consider reducing exposure.`,
        confidence: 65,
        action: 'Use fractional Kelly or skip'
      });
    }
  }

  // 4. Scenario Analysis Insights
  if (scenarios.length > 0) {
    const topScenario = scenarios[0];
    if (topScenario.expectedROI > 5) {
      insights.push({
        type: 'opportunity',
        source: 'Scenario Analysis',
        title: `Favorable Scenario: ${topScenario.name}`,
        description: `Historical ROI of ${topScenario.expectedROI.toFixed(1)}% in similar situations.`,
        confidence: topScenario.historicalWinRate,
        action: `Apply ${topScenario.category} strategy`
      });
    } else if (topScenario.expectedROI < -5) {
      insights.push({
        type: 'warning',
        source: 'Scenario Analysis',
        title: `Unfavorable Scenario: ${topScenario.name}`,
        description: `Historical ROI of ${topScenario.expectedROI.toFixed(1)}% suggests caution.`,
        confidence: 60,
        action: 'Consider passing on this game'
      });
    }
  }

  // 5. Confidence Calibration Check
  if (prediction && historicalMatchups.length >= 5) {
    const avgHistoricalConfidence = historicalMatchups.reduce((sum, m) => sum + m.confidence, 0) / historicalMatchups.length;
    const currentConfidence = prediction.confidence;

    if (currentConfidence > avgHistoricalConfidence + 15) {
      insights.push({
        type: 'info',
        source: 'Calibration',
        title: 'Higher Than Usual Confidence',
        description: `Current ${currentConfidence}% vs historical average of ${avgHistoricalConfidence.toFixed(0)}% for similar games.`,
        confidence: 70
      });
    }
  }

  return insights.sort((a, b) => {
    const typeOrder = { opportunity: 0, warning: 1, validation: 2, info: 3 };
    return typeOrder[a.type] - typeOrder[b.type];
  });
}

export function useCrossSectionData(match: Match | null): CrossSectionData {
  const homeTeam = match?.homeTeam?.name || '';
  const awayTeam = match?.awayTeam?.name || '';
  const league = (match?.league as League) || 'NBA';
  const matchId = match?.id || '';

  // Fetch betting trends
  const { data: bettingTrendRaw, isLoading: trendLoading } = useMatchBettingTrend(
    matchId,
    homeTeam,
    awayTeam,
    league,
    !!match
  );

  // Fetch injury impact
  const { injuryImpact, homeInjuries, awayInjuries, isLoading: injuryLoading } = useMatchInjuryImpact(match);

  // Fetch historical similar matchups
  const { data: historicalRaw, isLoading: historyLoading } = useQuery({
    queryKey: ['similar-matchups', homeTeam, awayTeam, league],
    queryFn: () => fetchSimilarMatchups(homeTeam, awayTeam, league),
    enabled: !!(homeTeam && awayTeam && league),
    staleTime: 5 * 60 * 1000,
  });

  // Compute derived data
  const crossSectionData = useMemo((): CrossSectionData => {
    const isLoading = trendLoading || injuryLoading || historyLoading;
    
    if (!match) {
      return {
        injuries: null,
        historicalMatchups: [],
        historicalWinRate: 0,
        modelConfidenceHistory: [],
        bettingTrend: null,
        scenarios: [],
        primaryScenario: null,
        insights: [],
        validations: {
          aiAlignedWithSharps: false,
          injuryAccountedFor: false,
          scenarioMatchesHistory: false,
          trendSupportsProjection: false,
        },
        isLoading,
        hasData: false,
      };
    }

    // Process injuries
    const totalImpact = (injuryImpact?.homeTeamImpact?.overallImpact || 0) + 
                        (injuryImpact?.awayTeamImpact?.overallImpact || 0);
    const injuries = (homeInjuries.length > 0 || awayInjuries.length > 0) ? {
      homeTeam: homeInjuries || [],
      awayTeam: awayInjuries || [],
      totalImpact,
      keyInjuries: [
        ...homeInjuries.slice(0, 2).map((i: any) => `${i.name} (${i.status})`),
        ...awayInjuries.slice(0, 2).map((i: any) => `${i.name} (${i.status})`),
      ],
    } : null;

    // Process historical matchups
    const historicalMatchups: HistoricalMatchup[] = (historicalRaw || []).map((p: HistoricalPrediction) => ({
      date: p.predicted_at,
      homeTeam: p.home_team || '',
      awayTeam: p.away_team || '',
      prediction: p.prediction || '',
      confidence: p.confidence || 0,
      status: p.status as 'won' | 'lost' | 'pending',
      actualScore: p.actual_score_home !== null ? {
        home: p.actual_score_home,
        away: p.actual_score_away!,
      } : undefined,
    }));

    const wonCount = historicalMatchups.filter(m => m.status === 'won').length;
    const historicalWinRate = historicalMatchups.length > 0 
      ? (wonCount / historicalMatchups.length) * 100 
      : 0;

    const modelConfidenceHistory = historicalMatchups.map(m => m.confidence);

    // Process betting trend
    const bettingTrend = bettingTrendRaw ? {
      publicPercent: bettingTrendRaw.publicBetting?.moneylineHome || 50,
      sharpPercent: bettingTrendRaw.sharpBetting?.confidence || 50,
      lineMovement: bettingTrendRaw.lineMovement?.spreadMovement || 0,
      isReverseLineMovement: bettingTrendRaw.lineMovement?.reverseLineMovement || false,
      sharpSide: bettingTrendRaw.sharpBetting?.moneylineFavorite === 'home' ? 'home' as const : 
                 bettingTrendRaw.sharpBetting?.moneylineFavorite === 'away' ? 'away' as const : null,
    } : null;

    // Detect scenarios
    const scenarioResults = detectScenariosForMatch(match);
    const scenarios = scenarioResults.map(r => r.scenario);
    const primaryScenario = scenarios.length > 0 ? scenarios[0] : null;

    // Generate insights
    const insights = generateInsights(match, injuries, historicalMatchups, bettingTrend, scenarios);

    // Compute validations
    const prediction = match.prediction;
    const aiSide = prediction?.recommended;
    const sharpSide = bettingTrend?.sharpSide;

    const validations = {
      aiAlignedWithSharps: !!(aiSide && sharpSide && aiSide === sharpSide),
      injuryAccountedFor: !injuries || injuries.totalImpact < 10,
      scenarioMatchesHistory: !primaryScenario || primaryScenario.expectedROI > 0,
      trendSupportsProjection: !bettingTrend || !bettingTrend.isReverseLineMovement || 
        (bettingTrend.lineMovement > 0 ? 'home' : 'away') === aiSide,
    };

    return {
      injuries,
      historicalMatchups,
      historicalWinRate,
      modelConfidenceHistory,
      bettingTrend,
      scenarios,
      primaryScenario,
      insights,
      validations,
      isLoading,
      hasData: !!(injuries || historicalMatchups.length > 0 || bettingTrend || scenarios.length > 0),
    };
  }, [match, injuryImpact, homeInjuries, awayInjuries, historicalRaw, bettingTrendRaw, trendLoading, injuryLoading, historyLoading]);

  return crossSectionData;
}

// Hook to validate backtest strategy against live data
export function useBacktestValidation(strategyResults: any) {
  return useMemo(() => {
    if (!strategyResults) return null;

    const { winRate, roi, sampleSize } = strategyResults;
    const isReliable = sampleSize >= 50;
    const isPositiveEV = roi > 0 && winRate > 52.4; // Break-even at -110

    return {
      isReliable,
      isPositiveEV,
      recommendation: !isReliable 
        ? 'Insufficient data - continue paper trading'
        : isPositiveEV 
        ? 'Strategy shows edge - consider live implementation'
        : 'Negative expectation - adjust parameters',
      suggestedAdjustments: !isPositiveEV ? [
        'Increase minimum confidence threshold',
        'Add injury filter',
        'Consider only home games',
        'Reduce stake on low-confidence picks',
      ] : [],
    };
  }, [strategyResults]);
}
