import { useState, useCallback } from 'react';
import { getAlgorithmNameFromId } from '@/utils/predictions/algorithms';
import { startOfDay, format, parseISO } from 'date-fns';
import { fetchAllPredictions } from '@/utils/fetchAllPredictions';
import type { BacktestStrategy, BacktestBet } from './useBacktestSimulator';
import { getStrategyDisplayName } from './useBacktestSimulator';

export interface OptimizationConfig {
  strategies: BacktestStrategy[];
  startingBankroll: number;
  startDate?: Date;
  endDate?: Date;
  league?: string;
  // Parameter ranges to search
  confidenceRange: { min: number; max: number; step: number };
  stakeTypes: ('flat' | 'percentage' | 'kelly')[];
  kellyFractions: number[]; // For kelly type
}

export interface OptimizationResult {
  strategy: BacktestStrategy;
  strategyName: string;
  minConfidence: number;
  stakeType: 'flat' | 'percentage' | 'kelly';
  stakeAmount: number;
  totalProfit: number;
  roi: number;
  winRate: number;
  totalBets: number;
  maxDrawdownPct: number;
  sharpeRatio: number;
}

export interface OptimizerState {
  isRunning: boolean;
  progress: number;
  currentStep: string;
  results: OptimizationResult[];
  bestResult: OptimizationResult | null;
  heatmapData: Array<{
    strategy: string;
    confidence: number;
    stakeType: string;
    roi: number;
    profit: number;
    winRate: number;
  }>;
}

// Run single backtest configuration
async function runSingleBacktest(
  predictions: any[],
  strategy: BacktestStrategy,
  startingBankroll: number,
  stakeType: 'flat' | 'percentage' | 'kelly',
  stakeAmount: number,
  minConfidence: number
): Promise<{ totalProfit: number; roi: number; winRate: number; totalBets: number; maxDrawdownPct: number; dailyReturns: number[] }> {
  // Group predictions by match
  const matchPredictions = new Map<string, typeof predictions>();
  for (const pred of predictions) {
    if (!matchPredictions.has(pred.match_id)) {
      matchPredictions.set(pred.match_id, []);
    }
    matchPredictions.get(pred.match_id)!.push(pred);
  }

  // Calculate algorithm stats for best_performer
  const algorithmStats = new Map<string, { wins: number; total: number }>();
  for (const pred of predictions) {
    const algId = pred.algorithm_id || 'unknown';
    if (!algorithmStats.has(algId)) {
      algorithmStats.set(algId, { wins: 0, total: 0 });
    }
    const stats = algorithmStats.get(algId)!;
    stats.total++;
    if (pred.status === 'won') stats.wins++;
  }

  let bankroll = startingBankroll;
  let totalStaked = 0;
  let wins = 0;
  let losses = 0;
  let peakBankroll = startingBankroll;
  let maxDrawdownPct = 0;
  const dailyReturns: number[] = [];
  let lastBankroll = startingBankroll;

  const sortedMatches = Array.from(matchPredictions.entries())
    .sort((a, b) => new Date(a[1][0].predicted_at).getTime() - new Date(b[1][0].predicted_at).getTime());

  for (const [, matchPreds] of sortedMatches) {
    let selectedPred: typeof predictions[0] | null = null;

    const predictionCounts = new Map<string, typeof predictions>();
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
        }
        break;
      case 'majority_agree':
        if (maxAgreement >= 2 && majorityPrediction) {
          const agreeing = predictionCounts.get(majorityPrediction)!;
          selectedPred = agreeing.reduce((best, curr) =>
            (curr.confidence || 0) > (best.confidence || 0) ? curr : best
          );
        }
        break;
      case 'highest_confidence':
        selectedPred = matchPreds.reduce((best, curr) =>
          (curr.confidence || 0) > (best.confidence || 0) ? curr : best
        );
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
        break;
      case 'ml_power_index':
      case 'value_pick_finder':
      case 'statistical_edge':
        const targetName = strategy === 'ml_power_index' ? 'ML Power Index' :
          strategy === 'value_pick_finder' ? 'Value Pick Finder' : 'Statistical Edge';
        selectedPred = matchPreds.find(p =>
          getAlgorithmNameFromId(p.algorithm_id || '') === targetName
        ) || null;
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

    const isWin = selectedPred.status === 'won';
    const profit = isWin ? stake * 0.9091 : -stake;

    // Track daily return
    const dailyReturn = profit / lastBankroll;
    dailyReturns.push(dailyReturn);
    lastBankroll = bankroll + profit;

    bankroll += profit;
    totalStaked += stake;

    if (isWin) wins++;
    else losses++;

    if (bankroll > peakBankroll) peakBankroll = bankroll;
    const drawdown = ((peakBankroll - bankroll) / peakBankroll) * 100;
    if (drawdown > maxDrawdownPct) maxDrawdownPct = drawdown;
  }

  const totalBets = wins + losses;
  const totalProfit = bankroll - startingBankroll;

  return {
    totalProfit,
    roi: totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0,
    winRate: totalBets > 0 ? (wins / totalBets) * 100 : 0,
    totalBets,
    maxDrawdownPct,
    dailyReturns,
  };
}

// Calculate Sharpe Ratio
function calculateSharpeRatio(dailyReturns: number[]): number {
  if (dailyReturns.length < 2) return 0;
  
  const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / dailyReturns.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return 0;
  
  // Annualized Sharpe (assuming ~365 betting days)
  return (avgReturn / stdDev) * Math.sqrt(365);
}

export function useBacktestOptimizer() {
  const [state, setState] = useState<OptimizerState>({
    isRunning: false,
    progress: 0,
    currentStep: '',
    results: [],
    bestResult: null,
    heatmapData: [],
  });

  const runOptimization = useCallback(async (config: OptimizationConfig) => {
    setState(prev => ({ 
      ...prev, 
      isRunning: true, 
      progress: 0, 
      currentStep: 'Fetching predictions...',
      results: [],
      bestResult: null,
      heatmapData: [],
    }));

    try {
      // Fetch predictions with pagination
      const preds = await fetchAllPredictions({
        startDate: config.startDate ? startOfDay(config.startDate).toISOString() : undefined,
        endDate: config.endDate ? config.endDate.toISOString() : undefined,
        league: config.league,
        statuses: ['won', 'lost'],
        excludeNullPrediction: true,
        ascending: true,
      });
      
      if (preds.length === 0) {
        setState(prev => ({ 
          ...prev, 
          isRunning: false, 
          currentStep: 'No predictions found in date range',
        }));
        return;
      }

      // Generate all parameter combinations
      const combinations: Array<{
        strategy: BacktestStrategy;
        minConfidence: number;
        stakeType: 'flat' | 'percentage' | 'kelly';
        stakeAmount: number;
      }> = [];

      for (const strategy of config.strategies) {
        for (let conf = config.confidenceRange.min; conf <= config.confidenceRange.max; conf += config.confidenceRange.step) {
          for (const stakeType of config.stakeTypes) {
            if (stakeType === 'kelly') {
              for (const fraction of config.kellyFractions) {
                combinations.push({ strategy, minConfidence: conf, stakeType, stakeAmount: fraction });
              }
            } else {
              // For flat/percentage, use default values
              const amount = stakeType === 'flat' ? 100 : 5;
              combinations.push({ strategy, minConfidence: conf, stakeType, stakeAmount: amount });
            }
          }
        }
      }

      const totalCombinations = combinations.length;
      const results: OptimizationResult[] = [];
      const heatmapData: OptimizerState['heatmapData'] = [];

      // Run all combinations
      for (let i = 0; i < combinations.length; i++) {
        const combo = combinations[i];
        
        setState(prev => ({
          ...prev,
          progress: Math.round(((i + 1) / totalCombinations) * 100),
          currentStep: `Testing ${getStrategyDisplayName(combo.strategy)} @ ${combo.minConfidence}% conf, ${combo.stakeType}...`,
        }));

        const result = await runSingleBacktest(
          preds,
          combo.strategy,
          config.startingBankroll,
          combo.stakeType,
          combo.stakeAmount,
          combo.minConfidence
        );

        const sharpeRatio = calculateSharpeRatio(result.dailyReturns);

        const optimizationResult: OptimizationResult = {
          strategy: combo.strategy,
          strategyName: getStrategyDisplayName(combo.strategy),
          minConfidence: combo.minConfidence,
          stakeType: combo.stakeType,
          stakeAmount: combo.stakeAmount,
          totalProfit: result.totalProfit,
          roi: result.roi,
          winRate: result.winRate,
          totalBets: result.totalBets,
          maxDrawdownPct: result.maxDrawdownPct,
          sharpeRatio,
        };

        results.push(optimizationResult);

        heatmapData.push({
          strategy: getStrategyDisplayName(combo.strategy),
          confidence: combo.minConfidence,
          stakeType: combo.stakeType,
          roi: result.roi,
          profit: result.totalProfit,
          winRate: result.winRate,
        });

        // Small delay to prevent UI freeze
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      // Sort by ROI and find best
      results.sort((a, b) => b.roi - a.roi);
      const bestResult = results[0] || null;

      setState({
        isRunning: false,
        progress: 100,
        currentStep: 'Optimization complete',
        results,
        bestResult,
        heatmapData,
      });
    } catch (error) {
      console.error('Optimization error:', error);
      setState(prev => ({
        ...prev,
        isRunning: false,
        currentStep: 'Error during optimization',
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isRunning: false,
      progress: 0,
      currentStep: '',
      results: [],
      bestResult: null,
      heatmapData: [],
    });
  }, []);

  return {
    ...state,
    runOptimization,
    reset,
  };
}
