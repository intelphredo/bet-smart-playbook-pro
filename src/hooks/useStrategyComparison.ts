import { useQueries } from '@tanstack/react-query';
import { getAlgorithmNameFromId } from '@/utils/predictions/algorithms';
import { subDays, startOfDay, format, parseISO } from 'date-fns';
import { fetchAllPredictions } from '@/utils/fetchAllPredictions';
import type { BacktestStrategy, BacktestBet, BacktestResult } from './useBacktestSimulator';
import { getStrategyDisplayName } from './useBacktestSimulator';

export interface StrategyComparisonConfig {
  strategies: BacktestStrategy[];
  startingBankroll: number;
  stakeType: 'flat' | 'percentage' | 'kelly';
  stakeAmount: number;
  minConfidence: number;
  days: number;
  league?: string;
}

export interface StrategyComparisonResult {
  strategy: BacktestStrategy;
  strategyName: string;
  result: BacktestResult;
  monteCarloSummary: {
    profitProbability: number;
    bustProbability: number;
    medianProfit: number;
    p5Profit: number;
    p95Profit: number;
    avgMaxDrawdown: number;
  } | null;
}

// Run Monte Carlo simulation inline
function runMonteCarloForStrategy(
  betHistory: BacktestBet[],
  startingBankroll: number,
  stakeType: 'flat' | 'percentage' | 'kelly',
  stakeAmount: number,
  numSimulations: number = 500
): StrategyComparisonResult['monteCarloSummary'] {
  if (betHistory.length < 5) return null;

  const simulations: { profit: number; maxDrawdownPct: number; bust: boolean }[] = [];

  for (let sim = 0; sim < numSimulations; sim++) {
    // Fisher-Yates shuffle
    const shuffled = [...betHistory];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    let bankroll = startingBankroll;
    let peakBankroll = startingBankroll;
    let maxDrawdownPct = 0;
    let bust = false;

    for (const bet of shuffled) {
      let stake = 0;
      switch (stakeType) {
        case 'flat':
          stake = Math.min(stakeAmount, bankroll);
          break;
        case 'percentage':
          stake = bankroll * (stakeAmount / 100);
          break;
        case 'kelly':
          const confidence = bet.confidence / 100;
          const edge = confidence - 0.5238;
          if (edge > 0) {
            const kellyFraction = (edge / 0.4762) * (stakeAmount / 100);
            stake = Math.min(bankroll * kellyFraction, bankroll * 0.25);
          }
          break;
      }

      if (stake <= 0 || stake > bankroll) continue;

      const profit = bet.result === 'won' ? stake * 0.9091 : -stake;
      bankroll += profit;

      if (bankroll > peakBankroll) peakBankroll = bankroll;
      const dd = ((peakBankroll - bankroll) / peakBankroll) * 100;
      if (dd > maxDrawdownPct) maxDrawdownPct = dd;

      if (bankroll <= 0) {
        bust = true;
        break;
      }
    }

    simulations.push({
      profit: bankroll - startingBankroll,
      maxDrawdownPct,
      bust,
    });
  }

  const sortedProfits = simulations.map(s => s.profit).sort((a, b) => a - b);
  const getPercentile = (arr: number[], p: number) => {
    const idx = Math.ceil((p / 100) * arr.length) - 1;
    return arr[Math.max(0, Math.min(idx, arr.length - 1))];
  };

  return {
    profitProbability: (simulations.filter(s => s.profit > 0).length / numSimulations) * 100,
    bustProbability: (simulations.filter(s => s.bust).length / numSimulations) * 100,
    medianProfit: getPercentile(sortedProfits, 50),
    p5Profit: getPercentile(sortedProfits, 5),
    p95Profit: getPercentile(sortedProfits, 95),
    avgMaxDrawdown: simulations.reduce((sum, s) => sum + s.maxDrawdownPct, 0) / numSimulations,
  };
}

async function runBacktestForStrategy(
  strategy: BacktestStrategy,
  config: Omit<StrategyComparisonConfig, 'strategies'>
): Promise<StrategyComparisonResult> {
  const { startingBankroll, stakeType, stakeAmount, minConfidence, days, league } = config;
  const startDate = startOfDay(subDays(new Date(), days)).toISOString();

  const preds = await fetchAllPredictions({
    startDate,
    league,
    statuses: ['won', 'lost'],
    excludeNullPrediction: true,
    ascending: true,
  });

  // Group predictions by match
  const matchPredictions = new Map<string, typeof preds>();
  for (const pred of preds) {
    if (!matchPredictions.has(pred.match_id)) {
      matchPredictions.set(pred.match_id, []);
    }
    matchPredictions.get(pred.match_id)!.push(pred);
  }

  // Calculate algorithm stats for best_performer
  const algorithmStats = new Map<string, { wins: number; total: number }>();
  for (const pred of preds) {
    const algId = pred.algorithm_id || 'unknown';
    if (!algorithmStats.has(algId)) {
      algorithmStats.set(algId, { wins: 0, total: 0 });
    }
    const stats = algorithmStats.get(algId)!;
    stats.total++;
    if (pred.status === 'won') stats.wins++;
  }

  // Simulate
  let bankroll = startingBankroll;
  let totalStaked = 0;
  const betHistory: BacktestBet[] = [];
  const profitByDayMap = new Map<string, { profit: number; bets: number }>();
  let peakBankroll = startingBankroll;
  let maxDrawdown = 0;
  let maxDrawdownPct = 0;
  let currentWinStreak = 0;
  let currentLoseStreak = 0;
  let longestWinStreak = 0;
  let longestLoseStreak = 0;

  const sortedMatches = Array.from(matchPredictions.entries())
    .sort((a, b) => new Date(a[1][0].predicted_at).getTime() - new Date(b[1][0].predicted_at).getTime());

  for (const [, matchPreds] of sortedMatches) {
    let selectedPred: typeof preds[0] | null = null;
    let algorithmsAgreed = 0;

    const predictionCounts = new Map<string, typeof preds>();
    for (const pred of matchPreds) {
      const p = pred.prediction || '';
      if (!predictionCounts.has(p)) predictionCounts.set(p, []);
      predictionCounts.get(p)!.push(pred);
    }

    const maxAgreement = Math.max(...Array.from(predictionCounts.values()).map(v => v.length));
    const majorityPrediction = Array.from(predictionCounts.entries())
      .find(([, preds]) => preds.length === maxAgreement)?.[0];

    switch (strategy) {
      case 'all_agree':
        if (matchPreds.length >= 3 && maxAgreement === matchPreds.length) {
          selectedPred = matchPreds.reduce((best, curr) =>
            (curr.confidence || 0) > (best.confidence || 0) ? curr : best
          );
          algorithmsAgreed = matchPreds.length;
        }
        break;

      case 'majority_agree':
        if (maxAgreement >= 2 && majorityPrediction) {
          const agreeing = predictionCounts.get(majorityPrediction)!;
          selectedPred = agreeing.reduce((best, curr) =>
            (curr.confidence || 0) > (best.confidence || 0) ? curr : best
          );
          algorithmsAgreed = agreeing.length;
        }
        break;

      case 'highest_confidence':
        selectedPred = matchPreds.reduce((best, curr) =>
          (curr.confidence || 0) > (best.confidence || 0) ? curr : best
        );
        algorithmsAgreed = (predictionCounts.get(selectedPred?.prediction || '') ?? []).length || 1;
        break;

      case 'best_performer':
        let bestWinRate = 0;
        for (const pred of matchPreds) {
          const stats = algorithmStats.get(pred.algorithm_id || 'unknown');
          if (stats && stats.total > 0) {
            const winRate = stats.wins / stats.total;
            if (winRate > bestWinRate) {
              bestWinRate = winRate;
              selectedPred = pred;
            }
          }
        }
        if (selectedPred) {
          algorithmsAgreed = (predictionCounts.get(selectedPred.prediction || '') ?? []).length || 1;
        }
        break;

      case 'ml_power_index':
      case 'value_pick_finder':
      case 'statistical_edge':
        const targetName = strategy === 'ml_power_index' ? 'ML Power Index' :
          strategy === 'value_pick_finder' ? 'Value Pick Finder' : 'Statistical Edge';
        selectedPred = matchPreds.find(p =>
          getAlgorithmNameFromId(p.algorithm_id || '') === targetName
        ) || null;
        if (selectedPred) {
          algorithmsAgreed = (predictionCounts.get(selectedPred.prediction || '') ?? []).length || 1;
        }
        break;
    }

    if (!selectedPred || (selectedPred.confidence || 0) < minConfidence) continue;

    let stake = 0;
    switch (stakeType) {
      case 'flat':
        stake = Math.min(stakeAmount, bankroll);
        break;
      case 'percentage':
        stake = Math.min(bankroll * (stakeAmount / 100), bankroll);
        break;
      case 'kelly':
        const confidence = (selectedPred.confidence || 50) / 100;
        const edge = confidence - 0.5238;
        if (edge > 0) {
          const kellyFraction = (edge / 0.4762) * (stakeAmount / 100);
          stake = Math.min(bankroll * kellyFraction, bankroll * 0.25);
        }
        break;
    }

    if (stake <= 0 || stake > bankroll) continue;

    const odds = -110;
    const isWin = selectedPred.status === 'won';
    const profit = isWin ? stake * 0.9091 : -stake;

    bankroll += profit;
    totalStaked += stake;

    if (bankroll > peakBankroll) peakBankroll = bankroll;
    const drawdown = peakBankroll - bankroll;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownPct = (drawdown / peakBankroll) * 100;
    }

    if (isWin) {
      currentWinStreak++;
      currentLoseStreak = 0;
      if (currentWinStreak > longestWinStreak) longestWinStreak = currentWinStreak;
    } else {
      currentLoseStreak++;
      currentWinStreak = 0;
      if (currentLoseStreak > longestLoseStreak) longestLoseStreak = currentLoseStreak;
    }

    const betDate = format(parseISO(selectedPred.predicted_at), 'yyyy-MM-dd');
    if (!profitByDayMap.has(betDate)) {
      profitByDayMap.set(betDate, { profit: 0, bets: 0 });
    }
    const dayStats = profitByDayMap.get(betDate)!;
    dayStats.profit += profit;
    dayStats.bets++;

    betHistory.push({
      date: format(parseISO(selectedPred.predicted_at), 'MMM d, yyyy'),
      matchTitle: selectedPred.match_title || 'Unknown',
      league: selectedPred.league || 'Unknown',
      prediction: selectedPred.prediction || '',
      confidence: selectedPred.confidence || 0,
      stake,
      odds,
      result: isWin ? 'won' : 'lost',
      profit,
      bankrollAfter: bankroll,
      strategy: getStrategyDisplayName(strategy),
      algorithmsAgreed,
    });
  }

  const sortedDays = Array.from(profitByDayMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  let cumulative = 0;
  let runningBankroll = startingBankroll;
  const profitByDay = sortedDays.map(([date, stats]) => {
    cumulative += stats.profit;
    runningBankroll += stats.profit;
    return {
      date: format(parseISO(date), 'MMM d'),
      profit: stats.profit,
      cumulative,
      bankroll: runningBankroll,
    };
  });

  let bestDayEntry = { date: 'N/A', profit: 0 };
  let worstDayEntry = { date: 'N/A', profit: 0 };
  if (sortedDays.length > 0) {
    const best = sortedDays.reduce((best, curr) => curr[1].profit > best[1].profit ? curr : best);
    const worst = sortedDays.reduce((worst, curr) => curr[1].profit < worst[1].profit ? curr : worst);
    bestDayEntry = { date: format(parseISO(best[0]), 'MMM d'), profit: best[1].profit };
    worstDayEntry = { date: format(parseISO(worst[0]), 'MMM d'), profit: worst[1].profit };
  }

  const wins = betHistory.filter(b => b.result === 'won').length;
  const losses = betHistory.filter(b => b.result === 'lost').length;
  const totalBets = wins + losses;
  const totalProfit = bankroll - startingBankroll;

  const result: BacktestResult = {
    totalBets,
    wins,
    losses,
    winRate: totalBets > 0 ? (wins / totalBets) * 100 : 0,
    totalProfit,
    roi: totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0,
    finalBankroll: bankroll,
    maxDrawdown,
    maxDrawdownPct,
    bestDay: bestDayEntry,
    worstDay: worstDayEntry,
    longestWinStreak,
    longestLoseStreak,
    avgBetSize: totalBets > 0 ? totalStaked / totalBets : 0,
    profitByDay,
    betHistory,
    filtersApplied: {
      homeAwayFilter: 'all',
      sharpMoneyAlignment: false,
      excludeBackToBack: false,
      conferenceGamesOnly: false,
      minAlgorithmsAgreeing: 1,
      skippedByFilters: 0,
    },
  };

  // Run Monte Carlo
  const monteCarloSummary = runMonteCarloForStrategy(betHistory, startingBankroll, stakeType, stakeAmount);

  return {
    strategy,
    strategyName: getStrategyDisplayName(strategy),
    result,
    monteCarloSummary,
  };
}

export function useStrategyComparison(config: StrategyComparisonConfig, enabled: boolean = true) {
  const { strategies, ...restConfig } = config;

  const queries = useQueries({
    queries: strategies.map((strategy) => ({
      queryKey: ['strategyComparison', strategy, restConfig],
      queryFn: () => runBacktestForStrategy(strategy, restConfig),
      enabled,
      staleTime: 60000,
    })),
  });

  const isLoading = queries.some(q => q.isLoading);
  const isError = queries.some(q => q.isError);
  const data = queries
    .map(q => q.data)
    .filter((d): d is StrategyComparisonResult => d !== undefined);

  // Sort by total profit descending
  const sortedData = [...data].sort((a, b) => b.result.totalProfit - a.result.totalProfit);

  return {
    data: sortedData,
    isLoading,
    isError,
    refetch: () => queries.forEach(q => q.refetch()),
  };
}
