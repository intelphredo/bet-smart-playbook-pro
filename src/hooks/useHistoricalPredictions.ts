import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, subMonths, startOfDay, eachDayOfInterval } from "date-fns";
import { toast } from "sonner";

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
  currentStreak: number; // Positive = wins, Negative = losses
  bestStreak: number;
  worstStreak: number;
}

export interface LeagueDailyStats {
  date: string;
  dateLabel: string;
  [league: string]: number | string; // Dynamic league win rates
}

export interface PredictionStats {
  total: number;
  won: number;
  lost: number;
  pending: number;
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
  liveStats: { total: number; won: number; lost: number; pending: number; winRate: number };
  preliveStats: { total: number; won: number; lost: number; pending: number; winRate: number };
}

const getDateFromRange = (range: TimeRange): Date | null => {
  const now = new Date();
  switch (range) {
    case "1d":
      return subDays(now, 1);
    case "7d":
      return subDays(now, 7);
    case "14d":
      return subDays(now, 14);
    case "1m":
      return subMonths(now, 1);
    case "3m":
      return subMonths(now, 3);
    case "all":
    default:
      return null;
  }
};

const getDaysForRange = (range: TimeRange): number => {
  switch (range) {
    case "1d": return 1;
    case "7d": return 7;
    case "14d": return 14;
    case "1m": return 30;
    case "3m": return 90;
    case "all": return 30; // Default to 30 days for chart
    default: return 14;
  }
};

export const useHistoricalPredictions = (
  timeRange: TimeRange = "14d",
  predictionType: PredictionType = "all"
) => {
  const queryClient = useQueryClient();
  const queryKey = ["historicalPredictions", timeRange, predictionType];

  // Set up realtime subscription for prediction updates
  useEffect(() => {
    const channel = supabase
      .channel('prediction-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'algorithm_predictions',
        },
        (payload) => {
          const newRecord = payload.new as { status?: string; match_title?: string; home_team?: string; away_team?: string };
          const oldRecord = payload.old as { status?: string };
          
          // Show toast when prediction is graded (status changed from pending to won/lost)
          if (oldRecord?.status === 'pending' && (newRecord?.status === 'won' || newRecord?.status === 'lost')) {
            const matchName = newRecord.match_title || 
              (newRecord.home_team && newRecord.away_team 
                ? `${newRecord.away_team} @ ${newRecord.home_team}` 
                : 'Prediction');
            
            if (newRecord.status === 'won') {
              toast.success(`✅ ${matchName} - Won!`, {
                description: "Prediction graded successfully",
                duration: 5000,
              });
            } else {
              toast.error(`❌ ${matchName} - Lost`, {
                description: "Prediction graded",
                duration: 5000,
              });
            }
          }
          
          // Invalidate and refetch when predictions are updated
          queryClient.invalidateQueries({ queryKey: ["historicalPredictions"] });
          queryClient.invalidateQueries({ queryKey: ["algorithmPerformance"] });
          queryClient.invalidateQueries({ queryKey: ["algorithmAccuracy"] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'algorithm_predictions',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["historicalPredictions"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey,
    queryFn: async (): Promise<{ predictions: HistoricalPrediction[]; stats: PredictionStats }> => {
      // Fetch all predictions matching time range - remove default 1000 row limit
      let query = supabase
        .from("algorithm_predictions")
        .select("*")
        .order("predicted_at", { ascending: false })
        .limit(10000); // Explicit high limit to get all predictions

      // Apply time range filter based on when prediction was created OR graded
      const startDate = getDateFromRange(timeRange);
      if (startDate) {
        // Include predictions made OR graded within the time range
        query = query.or(`predicted_at.gte.${startDate.toISOString()},result_updated_at.gte.${startDate.toISOString()}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching historical predictions:", error);
        throw error;
      }

      // Use database column for is_live_prediction, with fallback for old records
      // Sort by most recent activity: graded predictions by result_updated_at, pending by predicted_at
      let predictions = (data || []).map(p => ({
        ...p,
        // Use the database column if set, otherwise infer for backwards compatibility
        is_live_prediction: p.is_live_prediction ?? (
          p.match_id?.includes("live") || 
          (p.actual_score_home !== null && p.projected_score_home === null) ||
          (p.algorithm_id?.includes("live"))
        )
      })) as HistoricalPrediction[];

      // Sort: settled predictions (won/lost) by result_updated_at DESC, then pending by predicted_at DESC
      predictions.sort((a, b) => {
        const aIsSettled = a.status === 'won' || a.status === 'lost';
        const bIsSettled = b.status === 'won' || b.status === 'lost';
        
        // Get the relevant timestamp for sorting
        const aTime = aIsSettled && a.result_updated_at 
          ? new Date(a.result_updated_at).getTime() 
          : new Date(a.predicted_at).getTime();
        const bTime = bIsSettled && b.result_updated_at 
          ? new Date(b.result_updated_at).getTime() 
          : new Date(b.predicted_at).getTime();
        
        return bTime - aTime; // Descending (most recent first)
      });

      // Filter by prediction type
      if (predictionType === "live") {
        predictions = predictions.filter(p => p.is_live_prediction);
      } else if (predictionType === "prelive") {
        predictions = predictions.filter(p => !p.is_live_prediction);
      }

      // Calculate live vs prelive stats
      const livePredictions = predictions.filter(p => p.is_live_prediction);
      const prelivePredictions = predictions.filter(p => !p.is_live_prediction);

      const calcTypeStats = (preds: HistoricalPrediction[]) => {
        const won = preds.filter(p => p.status === "won").length;
        const lost = preds.filter(p => p.status === "lost").length;
        const pending = preds.filter(p => p.status === "pending").length;
        const settled = won + lost;
        return {
          total: preds.length,
          won,
          lost,
          pending,
          winRate: settled > 0 ? (won / settled) * 100 : 0,
        };
      };

      // Calculate basic stats
      const stats: PredictionStats = {
        total: predictions.length,
        won: predictions.filter(p => p.status === "won").length,
        lost: predictions.filter(p => p.status === "lost").length,
        pending: predictions.filter(p => p.status === "pending").length,
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
        liveStats: calcTypeStats(livePredictions),
        preliveStats: calcTypeStats(prelivePredictions),
      };

      // Calculate win rate (excluding pending)
      const settled = stats.won + stats.lost;
      stats.winRate = settled > 0 ? (stats.won / settled) * 100 : 0;

      // Calculate average confidence
      const confidences = predictions.filter(p => p.confidence).map(p => p.confidence!);
      stats.avgConfidence = confidences.length > 0
        ? confidences.reduce((a, b) => a + b, 0) / confidences.length
        : 0;

      // Group by league
      predictions.forEach(p => {
        const league = p.league || "Unknown";
        if (!stats.byLeague[league]) {
          stats.byLeague[league] = { won: 0, lost: 0, pending: 0 };
        }
        if (p.status === "won") stats.byLeague[league].won++;
        else if (p.status === "lost") stats.byLeague[league].lost++;
        else stats.byLeague[league].pending++;
      });

      // Calculate daily stats for charts based on time range
      const daysToShow = getDaysForRange(timeRange);
      const today = startOfDay(new Date());
      const rangeStart = subDays(today, daysToShow - 1);
      const dateRange = eachDayOfInterval({ start: rangeStart, end: today });

      let cumulativeWon = 0;
      let cumulativeLost = 0;
      let cumulativePL = 0;

      stats.dailyStats = dateRange.map(date => {
        const dateStr = format(date, "yyyy-MM-dd");
        const dayPredictions = predictions.filter(p => {
          const predDate = format(new Date(p.predicted_at), "yyyy-MM-dd");
          return predDate === dateStr;
        });

        const won = dayPredictions.filter(p => p.status === "won").length;
        const lost = dayPredictions.filter(p => p.status === "lost").length;
        const pending = dayPredictions.filter(p => p.status === "pending").length;
        const total = dayPredictions.length;
        const daySettled = won + lost;
        const winRate = daySettled > 0 ? (won / daySettled) * 100 : 0;

        cumulativeWon += won;
        cumulativeLost += lost;
        const cumulativeSettled = cumulativeWon + cumulativeLost;
        const cumulativeWinRate = cumulativeSettled > 0 
          ? (cumulativeWon / cumulativeSettled) * 100 
          : 0;

        const dayConfidences = dayPredictions.filter(p => p.confidence).map(p => p.confidence!);
        const avgConfidence = dayConfidences.length > 0
          ? dayConfidences.reduce((a, b) => a + b, 0) / dayConfidences.length
          : 0;

        // Calculate daily P/L (assuming 1 unit stake per bet, -110 odds)
        // Won = +0.91 units, Lost = -1 unit
        const dailyPL = (won * 0.91) - lost;
        cumulativePL += dailyPL;

        return {
          date: dateStr,
          dateLabel: format(date, "MMM d"),
          won,
          lost,
          pending,
          total,
          winRate,
          cumulativeWinRate,
          avgConfidence,
          dailyPL: parseFloat(dailyPL.toFixed(2)),
          cumulativePL: parseFloat(cumulativePL.toFixed(2)),
        };
      });

      // Calculate total P/L and ROI
      const settledBets = stats.won + stats.lost;
      stats.totalUnitsStaked = settledBets; // 1 unit per bet
      stats.totalPL = (stats.won * 0.91) - stats.lost; // Won = +0.91 units, Lost = -1 unit at -110 odds
      stats.roi = stats.totalUnitsStaked > 0 
        ? (stats.totalPL / stats.totalUnitsStaked) * 100 
        : 0;

      // Calculate league performance for chart with ROI and streaks
      stats.leaguePerformance = Object.entries(stats.byLeague).map(([league, data]) => {
        const total = data.won + data.lost + data.pending;
        const leagueSettled = data.won + data.lost;
        const winRate = leagueSettled > 0 ? (data.won / leagueSettled) * 100 : 0;
        // Calculate P/L and ROI per league (1 unit stakes, -110 odds)
        const totalPL = (data.won * 0.91) - data.lost;
        const roi = leagueSettled > 0 ? (totalPL / leagueSettled) * 100 : 0;
        
        // Calculate streaks for this league
        const leaguePredictions = predictions
          .filter(p => (p.league || "Unknown") === league && (p.status === "won" || p.status === "lost"))
          .sort((a, b) => new Date(b.result_updated_at || b.predicted_at).getTime() - new Date(a.result_updated_at || a.predicted_at).getTime());
        
        let currentStreak = 0;
        let bestStreak = 0;
        let worstStreak = 0;
        let tempStreak = 0;
        
        // Calculate current streak (from most recent)
        if (leaguePredictions.length > 0) {
          const firstStatus = leaguePredictions[0].status;
          for (const pred of leaguePredictions) {
            if (pred.status === firstStatus) {
              currentStreak = firstStatus === 'won' ? currentStreak + 1 : currentStreak - 1;
            } else {
              break;
            }
          }
        }
        
        // Calculate best and worst streaks
        for (const pred of leaguePredictions) {
          if (pred.status === 'won') {
            if (tempStreak >= 0) {
              tempStreak++;
              bestStreak = Math.max(bestStreak, tempStreak);
            } else {
              tempStreak = 1;
            }
          } else {
            if (tempStreak <= 0) {
              tempStreak--;
              worstStreak = Math.min(worstStreak, tempStreak);
            } else {
              tempStreak = -1;
            }
          }
        }
        
        return { 
          league, 
          ...data, 
          total, 
          winRate, 
          totalPL: parseFloat(totalPL.toFixed(2)), 
          roi: parseFloat(roi.toFixed(1)),
          currentStreak,
          bestStreak,
          worstStreak,
        };
      }).sort((a, b) => b.total - a.total);

      // Calculate league daily trends (win rate over time per league)
      const topLeagues = stats.leaguePerformance.slice(0, 6).map(l => l.league);
      stats.leagueDailyTrends = dateRange.map(date => {
        const dateStr = format(date, "yyyy-MM-dd");
        const dayPredictions = predictions.filter(p => {
          const predDate = format(new Date(p.predicted_at), "yyyy-MM-dd");
          return predDate === dateStr;
        });

        const result: LeagueDailyStats = {
          date: dateStr,
          dateLabel: format(date, "MMM d"),
        };

        topLeagues.forEach(league => {
          const leaguePreds = dayPredictions.filter(p => (p.league || "Unknown") === league);
          const won = leaguePreds.filter(p => p.status === "won").length;
          const lost = leaguePreds.filter(p => p.status === "lost").length;
          const settled = won + lost;
          result[league] = settled > 0 ? Math.round((won / settled) * 100) : 0;
        });

        return result;
      });

      // Calculate confidence vs accuracy buckets
      const confidenceBuckets: Record<number, { won: number; lost: number }> = {};
      predictions.filter(p => p.confidence && p.status !== "pending").forEach(p => {
        const bucket = Math.floor(p.confidence! / 10) * 10;
        if (!confidenceBuckets[bucket]) {
          confidenceBuckets[bucket] = { won: 0, lost: 0 };
        }
        if (p.status === "won") confidenceBuckets[bucket].won++;
        else confidenceBuckets[bucket].lost++;
      });

      stats.confidenceVsAccuracy = Object.entries(confidenceBuckets)
        .map(([conf, data]) => {
          const total = data.won + data.lost;
          return {
            confidence: parseInt(conf),
            winRate: total > 0 ? (data.won / total) * 100 : 0,
            count: total,
          };
        })
        .sort((a, b) => a.confidence - b.confidence);

      return { predictions, stats };
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });
};
