import { useMemo } from 'react';
import type { BacktestBet } from './useBacktestSimulator';

export interface MonteCarloConfig {
  numSimulations: number;
  startingBankroll: number;
  stakeType: 'flat' | 'percentage' | 'kelly';
  stakeAmount: number;
}

export interface SimulationRun {
  finalBankroll: number;
  totalProfit: number;
  maxDrawdown: number;
  maxDrawdownPct: number;
  peakBankroll: number;
  bustOut: boolean; // Did bankroll go to 0?
}

export interface MonteCarloResult {
  simulations: SimulationRun[];
  percentiles: {
    p5: number;
    p25: number;
    p50: number;
    p75: number;
    p95: number;
  };
  profitPercentiles: {
    p5: number;
    p25: number;
    p50: number;
    p75: number;
    p95: number;
  };
  bustProbability: number;
  profitProbability: number;
  avgFinalBankroll: number;
  avgProfit: number;
  avgMaxDrawdown: number;
  distribution: { range: string; count: number; percentage: number }[];
  drawdownDistribution: { range: string; count: number; percentage: number }[];
  cumulativePaths: { step: number; p5: number; p25: number; p50: number; p75: number; p95: number }[];
}

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getPercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
}

export function useMonteCarloSimulation(
  betHistory: BacktestBet[],
  config: MonteCarloConfig,
  enabled: boolean = true
): MonteCarloResult | null {
  return useMemo(() => {
    if (!enabled || betHistory.length < 5) return null;

    const { numSimulations, startingBankroll, stakeType, stakeAmount } = config;
    const simulations: SimulationRun[] = [];
    
    // Store paths for percentile bands
    const pathsData: number[][] = [];
    const numSteps = Math.min(betHistory.length, 50); // Sample up to 50 steps
    const stepSize = Math.max(1, Math.floor(betHistory.length / numSteps));

    for (let sim = 0; sim < numSimulations; sim++) {
      // Shuffle bet history to simulate different orderings
      const shuffledBets = shuffleArray(betHistory);
      
      let bankroll = startingBankroll;
      let peakBankroll = startingBankroll;
      let maxDrawdown = 0;
      let maxDrawdownPct = 0;
      let bustOut = false;
      const path: number[] = [startingBankroll];

      for (let i = 0; i < shuffledBets.length; i++) {
        const bet = shuffledBets[i];
        
        // Calculate stake based on current bankroll
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
            const impliedOdds = 0.5238;
            const edge = confidence - impliedOdds;
            if (edge > 0) {
              const kellyFraction = (edge / (1 - impliedOdds)) * (stakeAmount / 100);
              stake = Math.min(bankroll * kellyFraction, bankroll * 0.25);
            }
            break;
        }

        if (stake <= 0 || stake > bankroll) continue;

        // Apply original result
        const profit = bet.result === 'won' ? stake * 0.9091 : -stake;
        bankroll += profit;

        // Track peak and drawdown
        if (bankroll > peakBankroll) {
          peakBankroll = bankroll;
        }
        const drawdown = peakBankroll - bankroll;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
          maxDrawdownPct = (drawdown / peakBankroll) * 100;
        }

        // Check for bust
        if (bankroll <= 0) {
          bustOut = true;
          bankroll = 0;
          break;
        }

        // Record path at sample points
        if ((i + 1) % stepSize === 0 || i === shuffledBets.length - 1) {
          path.push(bankroll);
        }
      }

      // Pad path if needed
      while (path.length < numSteps + 1) {
        path.push(bankroll);
      }

      pathsData.push(path);
      simulations.push({
        finalBankroll: bankroll,
        totalProfit: bankroll - startingBankroll,
        maxDrawdown,
        maxDrawdownPct,
        peakBankroll,
        bustOut,
      });
    }

    // Calculate percentiles
    const sortedBankrolls = [...simulations.map(s => s.finalBankroll)].sort((a, b) => a - b);
    const sortedProfits = [...simulations.map(s => s.totalProfit)].sort((a, b) => a - b);
    const sortedDrawdowns = [...simulations.map(s => s.maxDrawdownPct)].sort((a, b) => a - b);

    const percentiles = {
      p5: getPercentile(sortedBankrolls, 5),
      p25: getPercentile(sortedBankrolls, 25),
      p50: getPercentile(sortedBankrolls, 50),
      p75: getPercentile(sortedBankrolls, 75),
      p95: getPercentile(sortedBankrolls, 95),
    };

    const profitPercentiles = {
      p5: getPercentile(sortedProfits, 5),
      p25: getPercentile(sortedProfits, 25),
      p50: getPercentile(sortedProfits, 50),
      p75: getPercentile(sortedProfits, 75),
      p95: getPercentile(sortedProfits, 95),
    };

    // Calculate cumulative paths at each step
    const cumulativePaths: MonteCarloResult['cumulativePaths'] = [];
    for (let step = 0; step <= numSteps; step++) {
      const valuesAtStep = pathsData.map(path => path[Math.min(step, path.length - 1)]).sort((a, b) => a - b);
      cumulativePaths.push({
        step,
        p5: getPercentile(valuesAtStep, 5),
        p25: getPercentile(valuesAtStep, 25),
        p50: getPercentile(valuesAtStep, 50),
        p75: getPercentile(valuesAtStep, 75),
        p95: getPercentile(valuesAtStep, 95),
      });
    }

    // Build distribution histogram
    const minProfit = Math.min(...sortedProfits);
    const maxProfit = Math.max(...sortedProfits);
    const range = maxProfit - minProfit || 1;
    const bucketSize = range / 10;
    const distribution: MonteCarloResult['distribution'] = [];

    for (let i = 0; i < 10; i++) {
      const bucketMin = minProfit + i * bucketSize;
      const bucketMax = minProfit + (i + 1) * bucketSize;
      const count = simulations.filter(s => 
        s.totalProfit >= bucketMin && (i === 9 ? s.totalProfit <= bucketMax : s.totalProfit < bucketMax)
      ).length;
      
      distribution.push({
        range: `$${bucketMin.toFixed(0)} to $${bucketMax.toFixed(0)}`,
        count,
        percentage: (count / numSimulations) * 100,
      });
    }

    // Drawdown distribution
    const drawdownDistribution: MonteCarloResult['drawdownDistribution'] = [
      { range: '0-10%', count: 0, percentage: 0 },
      { range: '10-20%', count: 0, percentage: 0 },
      { range: '20-30%', count: 0, percentage: 0 },
      { range: '30-50%', count: 0, percentage: 0 },
      { range: '50%+', count: 0, percentage: 0 },
    ];

    for (const sim of simulations) {
      if (sim.maxDrawdownPct < 10) drawdownDistribution[0].count++;
      else if (sim.maxDrawdownPct < 20) drawdownDistribution[1].count++;
      else if (sim.maxDrawdownPct < 30) drawdownDistribution[2].count++;
      else if (sim.maxDrawdownPct < 50) drawdownDistribution[3].count++;
      else drawdownDistribution[4].count++;
    }

    for (const bucket of drawdownDistribution) {
      bucket.percentage = (bucket.count / numSimulations) * 100;
    }

    const bustCount = simulations.filter(s => s.bustOut).length;
    const profitCount = simulations.filter(s => s.totalProfit > 0).length;

    return {
      simulations,
      percentiles,
      profitPercentiles,
      bustProbability: (bustCount / numSimulations) * 100,
      profitProbability: (profitCount / numSimulations) * 100,
      avgFinalBankroll: simulations.reduce((sum, s) => sum + s.finalBankroll, 0) / numSimulations,
      avgProfit: simulations.reduce((sum, s) => sum + s.totalProfit, 0) / numSimulations,
      avgMaxDrawdown: simulations.reduce((sum, s) => sum + s.maxDrawdownPct, 0) / numSimulations,
      distribution,
      drawdownDistribution,
      cumulativePaths,
    };
  }, [betHistory, config, enabled]);
}
