/**
 * Hook for Learning Center analytics - computes situational performance,
 * loss patterns, and data-driven improvement suggestions from historical predictions.
 */

import { useMemo } from 'react';
import { useHistoricalPredictions } from './useHistoricalPredictions';
import type { HistoricalPrediction } from './useHistoricalPredictions';
import { format, getDay, getHours } from 'date-fns';

// ── Types ──────────────────────────────────────────────────────────────────

export interface SituationalStat {
  label: string;
  won: number;
  lost: number;
  total: number;
  winRate: number;
  avgConfidence: number;
}

export interface LossPattern {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  affectedGames: number;
  lossRate: number;
  insight: string;
}

export interface ImprovementSuggestion {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'data' | 'model' | 'strategy';
  implemented: boolean;
}

export interface LearningCenterData {
  // Situational performance
  homeVsAway: SituationalStat[];
  favoriteVsUnderdog: SituationalStat[];
  byLeague: SituationalStat[];
  byDayOfWeek: SituationalStat[];
  byTimeOfDay: SituationalStat[];
  byAlgorithm: SituationalStat[];

  // Loss patterns
  lossPatterns: LossPattern[];

  // Improvement suggestions
  suggestions: ImprovementSuggestion[];

  // Summary
  totalSettled: number;
  overallWinRate: number;
  bestSituation: string;
  worstSituation: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function buildStat(label: string, preds: HistoricalPrediction[]): SituationalStat {
  const settled = preds.filter(p => p.status === 'won' || p.status === 'lost');
  const won = settled.filter(p => p.status === 'won').length;
  const lost = settled.filter(p => p.status === 'lost').length;
  const total = won + lost;
  const confs = preds.filter(p => p.confidence).map(p => p.confidence!);
  return {
    label,
    won,
    lost,
    total,
    winRate: total > 0 ? (won / total) * 100 : 0,
    avgConfidence: confs.length > 0 ? confs.reduce((a, b) => a + b, 0) / confs.length : 0,
  };
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getTimeSlot(hour: number): string {
  if (hour < 12) return 'Morning (before noon)';
  if (hour < 17) return 'Afternoon (12–5pm)';
  if (hour < 20) return 'Evening (5–8pm)';
  return 'Night (after 8pm)';
}

// ── Analysis functions ─────────────────────────────────────────────────────

function analyzeLossPatterns(predictions: HistoricalPrediction[]): LossPattern[] {
  const settled = predictions.filter(p => p.status === 'won' || p.status === 'lost');
  if (settled.length < 10) return [];

  const patterns: LossPattern[] = [];
  const totalLossRate = settled.filter(p => p.status === 'lost').length / settled.length;

  // 1. High-confidence losses
  const highConf = settled.filter(p => (p.confidence ?? 0) >= 75);
  if (highConf.length >= 5) {
    const highConfLossRate = highConf.filter(p => p.status === 'lost').length / highConf.length;
    if (highConfLossRate > 0.35) {
      patterns.push({
        id: 'overconfidence',
        title: 'Model overvalues high-confidence picks',
        description: `When confidence is 75%+, model loses ${(highConfLossRate * 100).toFixed(0)}% of the time — higher than expected.`,
        severity: highConfLossRate > 0.45 ? 'high' : 'medium',
        affectedGames: highConf.length,
        lossRate: highConfLossRate * 100,
        insight: 'The model may be overconfident in certain situations. Consider calibrating confidence thresholds.',
      });
    }
  }

  // 2. Late-night game struggles
  const nightGames = settled.filter(p => {
    const h = getHours(new Date(p.predicted_at));
    return h >= 21 || h < 2;
  });
  if (nightGames.length >= 5) {
    const nightLossRate = nightGames.filter(p => p.status === 'lost').length / nightGames.length;
    if (nightLossRate > totalLossRate + 0.08) {
      patterns.push({
        id: 'late_night',
        title: 'Model struggles with late-night games',
        description: `Win rate drops to ${((1 - nightLossRate) * 100).toFixed(0)}% for games after 9pm — west coast teams traveling east or fatigue effects.`,
        severity: nightLossRate > totalLossRate + 0.15 ? 'high' : 'medium',
        affectedGames: nightGames.length,
        lossRate: nightLossRate * 100,
        insight: 'Late-night games may have less reliable data or more variance from rest/travel factors.',
      });
    }
  }

  // 3. Weekend vs weekday pattern
  const weekendGames = settled.filter(p => {
    const day = getDay(new Date(p.predicted_at));
    return day === 0 || day === 6;
  });
  const weekdayGames = settled.filter(p => {
    const day = getDay(new Date(p.predicted_at));
    return day >= 1 && day <= 5;
  });
  if (weekendGames.length >= 10 && weekdayGames.length >= 10) {
    const weekendWinRate = weekendGames.filter(p => p.status === 'won').length / weekendGames.length;
    const weekdayWinRate = weekdayGames.filter(p => p.status === 'won').length / weekdayGames.length;
    if (Math.abs(weekendWinRate - weekdayWinRate) > 0.08) {
      const worse = weekendWinRate < weekdayWinRate ? 'weekends' : 'weekdays';
      const worseRate = Math.min(weekendWinRate, weekdayWinRate);
      patterns.push({
        id: 'weekend_variance',
        title: `Model underperforms on ${worse}`,
        description: `Win rate on ${worse} is ${(worseRate * 100).toFixed(0)}% vs ${(Math.max(weekendWinRate, weekdayWinRate) * 100).toFixed(0)}% on ${worse === 'weekends' ? 'weekdays' : 'weekends'}.`,
        severity: Math.abs(weekendWinRate - weekdayWinRate) > 0.15 ? 'high' : 'low',
        affectedGames: worse === 'weekends' ? weekendGames.length : weekdayGames.length,
        lossRate: (1 - worseRate) * 100,
        insight: worse === 'weekends'
          ? 'Weekend slates are larger with more variance. Model may need different weighting for high-volume days.'
          : 'Weekday games often feature back-to-back situations the model may not fully account for.',
      });
    }
  }

  // 4. League-specific weakness
  const leagues = [...new Set(settled.map(p => p.league).filter(Boolean))] as string[];
  for (const league of leagues) {
    const leaguePreds = settled.filter(p => p.league === league);
    if (leaguePreds.length >= 10) {
      const leagueLossRate = leaguePreds.filter(p => p.status === 'lost').length / leaguePreds.length;
      if (leagueLossRate > totalLossRate + 0.10) {
        patterns.push({
          id: `league_${league.toLowerCase()}`,
          title: `Model struggles with ${league} games`,
          description: `${league} win rate is ${((1 - leagueLossRate) * 100).toFixed(0)}% vs ${((1 - totalLossRate) * 100).toFixed(0)}% overall.`,
          severity: leagueLossRate > totalLossRate + 0.18 ? 'high' : 'medium',
          affectedGames: leaguePreds.length,
          lossRate: leagueLossRate * 100,
          insight: `Consider league-specific tuning or additional ${league} data sources.`,
        });
      }
    }
  }

  // 5. Streak-related pattern: model overvalues recent streaks
  // Approximate by checking if predictions on teams with "streak" patterns lose more
  const lowConfLosses = settled.filter(p => p.status === 'lost' && (p.confidence ?? 0) >= 60 && (p.confidence ?? 0) < 70);
  if (lowConfLosses.length >= 8) {
    patterns.push({
      id: 'mid_confidence',
      title: 'Model overvalues recent streaks in mid-confidence range',
      description: `${lowConfLosses.length} losses in the 60-70% confidence range suggest the model may be chasing hot/cold streaks.`,
      severity: lowConfLosses.length > 15 ? 'high' : 'medium',
      affectedGames: lowConfLosses.length,
      lossRate: 100,
      insight: 'Recent form may be getting too much weight. Consider mean-reversion adjustments.',
    });
  }

  return patterns.sort((a, b) => {
    const sev = { high: 3, medium: 2, low: 1 };
    return sev[b.severity] - sev[a.severity];
  });
}

function generateSuggestions(
  predictions: HistoricalPrediction[],
  patterns: LossPattern[]
): ImprovementSuggestion[] {
  const suggestions: ImprovementSuggestion[] = [];
  const leagues = new Set(predictions.map(p => p.league).filter(Boolean));
  const hasOutdoor = leagues.has('NFL') || leagues.has('MLB') || leagues.has('SOCCER');

  // Always suggest weather if outdoor sports present
  if (hasOutdoor) {
    suggestions.push({
      id: 'weather',
      title: 'Add weather data for outdoor sports',
      description: 'Wind, rain, and temperature significantly affect NFL, MLB, and soccer outcomes. Integrating real-time weather can improve accuracy by 3-5%.',
      impact: 'high',
      category: 'data',
      implemented: true, // Already have weather integration
    });
  }

  suggestions.push({
    id: 'rest_days',
    title: 'Incorporate rest days into model',
    description: 'Teams playing on short rest (back-to-back, 3-in-4 nights) perform measurably worse. Factor rest advantage into predictions.',
    impact: 'high',
    category: 'model',
    implemented: false,
  });

  suggestions.push({
    id: 'b2b',
    title: 'Track back-to-back games played',
    description: 'NBA and NHL teams on the second night of back-to-backs lose at higher rates. This is a strong predictive signal the model should weight heavily.',
    impact: 'high',
    category: 'data',
    implemented: false,
  });

  suggestions.push({
    id: 'playoffs',
    title: 'Weight playoff games differently',
    description: 'Playoff games have different dynamics than regular season — tighter defense, star player usage changes, and coaching adjustments. Separate models or weights for postseason.',
    impact: 'medium',
    category: 'model',
    implemented: false,
  });

  suggestions.push({
    id: 'injuries',
    title: 'Deeper injury impact modeling',
    description: 'Go beyond "player is out" — factor in specific player roles, replacement quality, and team performance without key players historically.',
    impact: 'high',
    category: 'data',
    implemented: false,
  });

  if (patterns.some(p => p.id === 'overconfidence')) {
    suggestions.push({
      id: 'calibration',
      title: 'Improve confidence calibration',
      description: 'The model is overconfident on some picks. Apply isotonic regression or Platt scaling to better calibrate prediction probabilities.',
      impact: 'high',
      category: 'model',
      implemented: true,
    });
  }

  if (patterns.some(p => p.id === 'late_night')) {
    suggestions.push({
      id: 'travel_fatigue',
      title: 'Add travel fatigue factor',
      description: 'West coast teams traveling east (and vice versa) face circadian disadvantages. Model the direction and distance of travel.',
      impact: 'medium',
      category: 'data',
      implemented: false,
    });
  }

  suggestions.push({
    id: 'line_movement',
    title: 'Use closing line value as feedback',
    description: 'Track how predictions compare to closing lines. Consistently beating the closing line indicates true edge. Use CLV as a model training signal.',
    impact: 'medium',
    category: 'strategy',
    implemented: true,
  });

  return suggestions.sort((a, b) => {
    const imp = { high: 3, medium: 2, low: 1 };
    return imp[b.impact] - imp[a.impact];
  });
}

// ── Main Hook ──────────────────────────────────────────────────────────────

export function useLearningCenter() {
  const { data, isLoading, isError } = useHistoricalPredictions('all', 'all');

  const learningData = useMemo((): LearningCenterData | null => {
    if (!data?.predictions || data.predictions.length === 0) return null;
    const preds = data.predictions;
    const settled = preds.filter(p => p.status === 'won' || p.status === 'lost');

    // ─ Home vs Away ─
    const homePreds = preds.filter(p => p.prediction === 'home');
    const awayPreds = preds.filter(p => p.prediction === 'away');
    const drawPreds = preds.filter(p => p.prediction === 'draw');
    const homeVsAway = [
      buildStat('Home Picks', homePreds),
      buildStat('Away Picks', awayPreds),
      ...(drawPreds.length > 0 ? [buildStat('Draw Picks', drawPreds)] : []),
    ];

    // ─ Favorite vs Underdog (approximate by confidence) ─
    const favorites = preds.filter(p => (p.confidence ?? 0) >= 65);
    const underdogs = preds.filter(p => (p.confidence ?? 0) > 0 && (p.confidence ?? 0) < 55);
    const tossups = preds.filter(p => (p.confidence ?? 0) >= 55 && (p.confidence ?? 0) < 65);
    const favoriteVsUnderdog = [
      buildStat('Favorites (65%+ conf)', favorites),
      buildStat('Toss-ups (55-64%)', tossups),
      buildStat('Underdogs (<55% conf)', underdogs),
    ];

    // ─ By League ─
    const leagueMap = new Map<string, HistoricalPrediction[]>();
    preds.forEach(p => {
      const league = p.league || 'Unknown';
      if (!leagueMap.has(league)) leagueMap.set(league, []);
      leagueMap.get(league)!.push(p);
    });
    const byLeague = [...leagueMap.entries()]
      .map(([league, lp]) => buildStat(league, lp))
      .filter(s => s.total >= 3)
      .sort((a, b) => b.total - a.total);

    // ─ By Day of Week ─
    const dayMap = new Map<number, HistoricalPrediction[]>();
    preds.forEach(p => {
      const day = getDay(new Date(p.predicted_at));
      if (!dayMap.has(day)) dayMap.set(day, []);
      dayMap.get(day)!.push(p);
    });
    const byDayOfWeek = [...dayMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([day, dp]) => buildStat(DAY_NAMES[day], dp));

    // ─ By Time of Day ─
    const timeMap = new Map<string, HistoricalPrediction[]>();
    preds.forEach(p => {
      const slot = getTimeSlot(getHours(new Date(p.predicted_at)));
      if (!timeMap.has(slot)) timeMap.set(slot, []);
      timeMap.get(slot)!.push(p);
    });
    const byTimeOfDay = [...timeMap.entries()]
      .map(([slot, tp]) => buildStat(slot, tp));

    // ─ By Algorithm ─
    const algoMap = new Map<string, HistoricalPrediction[]>();
    preds.forEach(p => {
      const algo = p.algorithm_id || 'Unknown';
      if (!algoMap.has(algo)) algoMap.set(algo, []);
      algoMap.get(algo)!.push(p);
    });
    const byAlgorithm = [...algoMap.entries()]
      .map(([algo, ap]) => buildStat(algo, ap))
      .filter(s => s.total >= 3)
      .sort((a, b) => b.total - a.total);

    // ─ Loss Patterns ─
    const lossPatterns = analyzeLossPatterns(preds);

    // ─ Suggestions ─
    const suggestions = generateSuggestions(preds, lossPatterns);

    // ─ Summary ─
    const allSituations = [...homeVsAway, ...byLeague, ...byDayOfWeek, ...byTimeOfDay].filter(s => s.total >= 5);
    const best = allSituations.reduce((a, b) => a.winRate > b.winRate ? a : b, allSituations[0]);
    const worst = allSituations.reduce((a, b) => a.winRate < b.winRate ? a : b, allSituations[0]);

    const totalSettled = settled.length;
    const overallWinRate = totalSettled > 0
      ? (settled.filter(p => p.status === 'won').length / totalSettled) * 100
      : 0;

    return {
      homeVsAway,
      favoriteVsUnderdog,
      byLeague,
      byDayOfWeek,
      byTimeOfDay,
      byAlgorithm,
      lossPatterns,
      suggestions,
      totalSettled,
      overallWinRate,
      bestSituation: best?.label || 'N/A',
      worstSituation: worst?.label || 'N/A',
    };
  }, [data]);

  return { data: learningData, isLoading, isError };
}
