import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, subMonths, startOfDay, eachDayOfInterval } from "date-fns";
import { toast } from "sonner";
import { fetchAllPredictions } from "@/utils/fetchAllPredictions";

export type TimeRange = "1d" | "7d" | "14d" | "1m" | "3m" | "all";
export type PredictionType = "all" | "live" | "prelive";

export interface HistoricalPrediction {
  id: string;
  match_id: string;
  league: string | null;
  algorithm_id: string | null;
  prediction: string | null;
  confidence: number | null;
  projected_score_home: number | null;
  projected_score_away: number | null;
  actual_score_home: number | null;
  actual_score_away: number | null;
  status: string;
  accuracy_rating: number | null;
  predicted_at: string;
  result_updated_at: string | null;
  is_live_prediction: boolean | null;
  home_team: string | null;
  away_team: string | null;
  match_title: string | null;
}

export interface DailyStats {
  date: string;
  dateLabel: string;
  won: number;
  lost: number;
  pending: number;
  total: number;
  winRate: number;
  cumulativeWinRate: number;
  avgConfidence: number;
  dailyPL: number;
  cumulativePL: number;
}

export interface LeaguePerformance {
  league: string;
  won: number;
  lost: number;
  pending: number;
  total: number;
  winRate: number;
  totalPL: number;
  roi: number;
  currentStreak: number;
  bestStreak: number;
  worstStreak: number;
}

export interface LeagueDailyStats {
  date: string;
  dateLabel: string;
  [league: string]: number | string;
}

export interface PredictionStats {
  total: number;
  won: number;
  lost: number;
  pending: number;
  settled: number;
  winRate: number;
  avgConfidence: number;
  byLeague: Record<string, { won: number; lost: number; pending: number }>;
  dailyStats: DailyStats[];
  leaguePerformance: LeaguePerformance[];
  confidenceVsAccuracy: { confidence: number; winRate: number; count: number }[];
  leagueDailyTrends: LeagueDailyStats[];
  totalPL: number;
  totalUnitsStaked: number;
  roi: number;
  unitSize: number;
  dollarPL: number;
  breakEvenWinRate: number;
  liveStats: { total: number; won: number; lost: number; pending: number; winRate: number };
  preliveStats: { total: number; won: number; lost: number; pending: number; winRate: number };
  dataValidation: {
    winsAndLossesEqualSettled: boolean;
    settledCount: number;
    pendingCount: number;
    missingConfidence: number;
    avgOdds: number;
  };
}

const getDateFromRange = (range: TimeRange): Date | null => {
  const now = new Date();
  switch (range) {
    case "1d": return subDays(now, 1);
    case "7d": return subDays(now, 7);
    case "14d": return subDays(now, 14);
    case "1m": return subMonths(now, 1);
    case "3m": return subMonths(now, 3);
    case "all":
    default: return null;
  }
};

const getDaysForRange = (range: TimeRange): number => {
  switch (range) {
    case "1d": return 1;
    case "7d": return 7;
    case "14d": return 14;
    case "1m": return 30;
    case "3m": return 90;
    case "all": return 30;
    default: return 14;
  }
};

/**
 * Compute stats from predictions array. Memoized separately from the fetch.
 */
function computeStats(
  predictions: HistoricalPrediction[],
  timeRange: TimeRange,
  predictionType: PredictionType
): PredictionStats {
  // Standard -110 odds payout factor
  const PAYOUT_FACTOR = 0.9091; // Win $0.91 per $1 risked at -110
  const UNIT_SIZE = 10; // $10 per unit

  // Filter by prediction type
  let filtered = predictions;
  if (predictionType === "live") {
    filtered = predictions.filter(p => p.is_live_prediction);
  } else if (predictionType === "prelive") {
    filtered = predictions.filter(p => !p.is_live_prediction);
  }

  const livePredictions = filtered.filter(p => p.is_live_prediction);
  const prelivePredictions = filtered.filter(p => !p.is_live_prediction);

  const calcTypeStats = (preds: HistoricalPrediction[]) => {
    const won = preds.filter(p => p.status === "won").length;
    const lost = preds.filter(p => p.status === "lost").length;
    const pending = preds.filter(p => p.status === "pending").length;
    const settled = won + lost;
    return { total: preds.length, won, lost, pending, winRate: settled > 0 ? (won / settled) * 100 : 0 };
  };

  const won = filtered.filter(p => p.status === "won").length;
  const lost = filtered.filter(p => p.status === "lost").length;
  const pending = filtered.filter(p => p.status === "pending").length;
  const settled = won + lost;
  const missingConfidence = filtered.filter(p => p.confidence === null || p.confidence === undefined).length;

  // Break-even win rate at -110 odds = 1 / (1 + PAYOUT_FACTOR) ≈ 52.4%
  const breakEvenWinRate = (1 / (1 + PAYOUT_FACTOR)) * 100;

  const stats: PredictionStats = {
    total: filtered.length,
    won,
    lost,
    pending,
    settled,
    winRate: 0,
    avgConfidence: 0,
    byLeague: {},
    dailyStats: [],
    leaguePerformance: [],
    confidenceVsAccuracy: [],
    leagueDailyTrends: [],
    totalPL: 0,
    totalUnitsStaked: 0,
    roi: 0,
    unitSize: UNIT_SIZE,
    dollarPL: 0,
    breakEvenWinRate,
    liveStats: calcTypeStats(livePredictions),
    preliveStats: calcTypeStats(prelivePredictions),
    dataValidation: {
      winsAndLossesEqualSettled: won + lost === settled,
      settledCount: settled,
      pendingCount: pending,
      missingConfidence,
      avgOdds: -110,
    },
  };

  stats.winRate = settled > 0 ? (won / settled) * 100 : 0;

  const confidences = filtered.filter(p => p.confidence).map(p => p.confidence!);
  stats.avgConfidence = confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0;

  // Group by league
  filtered.forEach(p => {
    const league = p.league || "Unknown";
    if (!stats.byLeague[league]) stats.byLeague[league] = { won: 0, lost: 0, pending: 0 };
    if (p.status === "won") stats.byLeague[league].won++;
    else if (p.status === "lost") stats.byLeague[league].lost++;
    else stats.byLeague[league].pending++;
  });

  // Daily stats
  const daysToShow = getDaysForRange(timeRange);
  const today = startOfDay(new Date());
  const rangeStart = subDays(today, daysToShow - 1);
  const dateRange = eachDayOfInterval({ start: rangeStart, end: today });

  let cumulativeWon = 0;
  let cumulativeLost = 0;
  let cumulativePL = 0;

  // Pre-group predictions by date for O(n) instead of O(n*d)
  const predsByDate = new Map<string, HistoricalPrediction[]>();
  filtered.forEach(p => {
    const dateStr = format(new Date(p.predicted_at), "yyyy-MM-dd");
    const arr = predsByDate.get(dateStr) || [];
    arr.push(p);
    predsByDate.set(dateStr, arr);
  });

  stats.dailyStats = dateRange.map(date => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dayPredictions = predsByDate.get(dateStr) || [];

    const won = dayPredictions.filter(p => p.status === "won").length;
    const lost = dayPredictions.filter(p => p.status === "lost").length;
    const pending = dayPredictions.filter(p => p.status === "pending").length;
    const total = dayPredictions.length;
    const daySettled = won + lost;
    const winRate = daySettled > 0 ? (won / daySettled) * 100 : 0;

    cumulativeWon += won;
    cumulativeLost += lost;
    const cumulativeSettled = cumulativeWon + cumulativeLost;
    const cumulativeWinRate = cumulativeSettled > 0 ? (cumulativeWon / cumulativeSettled) * 100 : 0;

    const dayConfidences = dayPredictions.filter(p => p.confidence).map(p => p.confidence!);
    const avgConfidence = dayConfidences.length > 0 ? dayConfidences.reduce((a, b) => a + b, 0) / dayConfidences.length : 0;

    const dailyPL = (won * PAYOUT_FACTOR) - lost;
    cumulativePL += dailyPL;

    return {
      date: dateStr,
      dateLabel: format(date, "MMM d"),
      won, lost, pending, total, winRate,
      cumulativeWinRate, avgConfidence,
      dailyPL: parseFloat(dailyPL.toFixed(2)),
      cumulativePL: parseFloat(cumulativePL.toFixed(2)),
    };
  });

  // Total P/L and ROI - using proper unit-based calculation
  stats.totalUnitsStaked = settled;
  stats.totalPL = (stats.won * PAYOUT_FACTOR) - stats.lost;
  stats.dollarPL = stats.totalPL * UNIT_SIZE;
  stats.roi = stats.totalUnitsStaked > 0 ? (stats.totalPL / stats.totalUnitsStaked) * 100 : 0;

  // League performance
  stats.leaguePerformance = Object.entries(stats.byLeague).map(([league, data]) => {
    const total = data.won + data.lost + data.pending;
    const leagueSettled = data.won + data.lost;
    const winRate = leagueSettled > 0 ? (data.won / leagueSettled) * 100 : 0;
    const totalPL = (data.won * PAYOUT_FACTOR) - data.lost;
    const roi = leagueSettled > 0 ? (totalPL / leagueSettled) * 100 : 0;

    const leaguePredictions = filtered
      .filter(p => (p.league || "Unknown") === league && (p.status === "won" || p.status === "lost"))
      .sort((a, b) => new Date(b.result_updated_at || b.predicted_at).getTime() - new Date(a.result_updated_at || a.predicted_at).getTime());

    let currentStreak = 0;
    let bestStreak = 0;
    let worstStreak = 0;
    let tempStreak = 0;

    if (leaguePredictions.length > 0) {
      const firstStatus = leaguePredictions[0].status;
      for (const pred of leaguePredictions) {
        if (pred.status === firstStatus) {
          currentStreak = firstStatus === 'won' ? currentStreak + 1 : currentStreak - 1;
        } else break;
      }
    }

    for (const pred of leaguePredictions) {
      if (pred.status === 'won') {
        tempStreak = tempStreak >= 0 ? tempStreak + 1 : 1;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = tempStreak <= 0 ? tempStreak - 1 : -1;
        worstStreak = Math.min(worstStreak, tempStreak);
      }
    }

    return { league, ...data, total, winRate, totalPL: parseFloat(totalPL.toFixed(2)), roi: parseFloat(roi.toFixed(1)), currentStreak, bestStreak, worstStreak };
  }).sort((a, b) => b.total - a.total);

  // League daily trends (top 6 only)
  const topLeagues = stats.leaguePerformance.slice(0, 6).map(l => l.league);
  stats.leagueDailyTrends = dateRange.map(date => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dayPredictions = predsByDate.get(dateStr) || [];

    const result: LeagueDailyStats = { date: dateStr, dateLabel: format(date, "MMM d") };
    topLeagues.forEach(league => {
      const leaguePreds = dayPredictions.filter(p => (p.league || "Unknown") === league);
      const won = leaguePreds.filter(p => p.status === "won").length;
      const lost = leaguePreds.filter(p => p.status === "lost").length;
      const s = won + lost;
      result[league] = s > 0 ? Math.round((won / s) * 100) : 0;
    });
    return result;
  });

  // Confidence vs accuracy buckets
  const confidenceBuckets: Record<number, { won: number; lost: number }> = {};
  filtered.filter(p => p.confidence && p.status !== "pending").forEach(p => {
    const bucket = Math.floor(p.confidence! / 10) * 10;
    if (!confidenceBuckets[bucket]) confidenceBuckets[bucket] = { won: 0, lost: 0 };
    if (p.status === "won") confidenceBuckets[bucket].won++;
    else confidenceBuckets[bucket].lost++;
  });

  stats.confidenceVsAccuracy = Object.entries(confidenceBuckets)
    .map(([conf, data]) => {
      const total = data.won + data.lost;
      return { confidence: parseInt(conf), winRate: total > 0 ? (data.won / total) * 100 : 0, count: total };
    })
    .sort((a, b) => a.confidence - b.confidence);

  return stats;
}

export const useHistoricalPredictions = (
  timeRange: TimeRange = "all",
  predictionType: PredictionType = "all"
) => {
  const queryClient = useQueryClient();
  // Separate fetch key from computation - only refetch data when timeRange changes
  const fetchKey = ["historicalPredictions", "data", timeRange];

  // Set up realtime subscription for prediction updates
  useEffect(() => {
    const channel = supabase
      .channel('prediction-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'algorithm_predictions' },
        () => {
          queryClient.invalidateQueries({ queryKey: ["historicalPredictions"] });
          queryClient.invalidateQueries({ queryKey: ["algorithmPerformance"] });
          queryClient.invalidateQueries({ queryKey: ["algorithmAccuracy"] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'algorithm_predictions' },
        () => {
          queryClient.invalidateQueries({ queryKey: ["historicalPredictions"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Fetch raw predictions (heavy network call, cached separately)
  const { data: rawPredictions, isLoading, isError, error, refetch } = useQuery({
    queryKey: fetchKey,
    queryFn: async (): Promise<HistoricalPrediction[]> => {
      const startDate = getDateFromRange(timeRange);

      const data = await fetchAllPredictions({
        orFilter: startDate ? `predicted_at.gte.${startDate.toISOString()},result_updated_at.gte.${startDate.toISOString()}` : undefined,
      }) as HistoricalPrediction[];

      // Normalize and sort
      return (data || [])
        .map(p => ({
          ...p,
          is_live_prediction: p.is_live_prediction ?? (
            p.match_id?.includes("live") ||
            (p.actual_score_home !== null && p.projected_score_home === null) ||
            (p.algorithm_id?.includes("live"))
          ),
        }))
        .sort((a, b) => {
          const aIsSettled = a.status === 'won' || a.status === 'lost';
          const bIsSettled = b.status === 'won' || b.status === 'lost';
          const aTime = aIsSettled && a.result_updated_at ? new Date(a.result_updated_at).getTime() : new Date(a.predicted_at).getTime();
          const bTime = bIsSettled && b.result_updated_at ? new Date(b.result_updated_at).getTime() : new Date(b.predicted_at).getTime();
          return bTime - aTime;
        });
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - predictions don't change every second
    gcTime: 10 * 60 * 1000, // Keep in cache 10 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes instead of 1 minute
  });

  // Compute stats client-side with memoization (no refetch needed when predictionType changes)
  const result = useMemo(() => {
    const predictions = rawPredictions ?? [];
    const stats = computeStats(predictions, timeRange, predictionType);

    // Filter predictions for the result based on type
    let filteredPredictions = predictions;
    if (predictionType === "live") {
      filteredPredictions = predictions.filter(p => p.is_live_prediction);
    } else if (predictionType === "prelive") {
      filteredPredictions = predictions.filter(p => !p.is_live_prediction);
    }

    return { predictions: filteredPredictions, stats };
  }, [rawPredictions, timeRange, predictionType]);

  return {
    data: result,
    isLoading,
    isError,
    error,
    refetch,
  };
};
