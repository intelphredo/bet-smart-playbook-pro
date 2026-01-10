
import { BankrollSettings, BankrollSimulation, BankrollProjection, BankrollRisk } from "@/types/bankroll";

interface SimulationConfig {
  numBets: number;
  winRate: number;
  avgOdds: number;
  kellyFraction: number;
  numSimulations?: number;
}

export function runMonteCarloSimulation(
  settings: BankrollSettings,
  config: SimulationConfig
): BankrollSimulation[] {
  const { numBets, winRate, avgOdds, kellyFraction, numSimulations = 1000 } = config;
  
  const scenarios: BankrollSimulation[] = [];
  
  // Bull scenario (optimistic)
  scenarios.push(simulateScenario(settings, {
    ...config,
    winRate: Math.min(winRate + 0.05, 0.65),
    scenario: 'bull'
  }));
  
  // Realistic scenario
  scenarios.push(simulateScenario(settings, {
    ...config,
    scenario: 'realistic'
  }));
  
  // Bear scenario (pessimistic)
  scenarios.push(simulateScenario(settings, {
    ...config,
    winRate: Math.max(winRate - 0.05, 0.45),
    scenario: 'bear'
  }));
  
  return scenarios;
}

function simulateScenario(
  settings: BankrollSettings,
  config: SimulationConfig & { scenario: 'bull' | 'bear' | 'realistic' }
): BankrollSimulation {
  const { numBets, winRate, avgOdds, kellyFraction, numSimulations = 1000, scenario } = config;
  const startingBankroll = settings.currentBankroll;
  
  const allFinalBankrolls: number[] = [];
  const allPaths: number[][] = [];
  let ruinCount = 0;
  let profitCount = 0;
  let maxDrawdowns: number[] = [];
  
  for (let sim = 0; sim < numSimulations; sim++) {
    let bankroll = startingBankroll;
    let peak = startingBankroll;
    let maxDrawdown = 0;
    const path: number[] = [bankroll];
    
    for (let bet = 0; bet < numBets; bet++) {
      // Calculate stake using Kelly
      const edge = (winRate * avgOdds) - 1;
      const kellyStake = Math.max(0, (edge / (avgOdds - 1)) * kellyFraction);
      const stakePercent = Math.min(kellyStake, settings.maxBetPercentage / 100);
      const stake = bankroll * stakePercent;
      
      // Simulate bet outcome
      const won = Math.random() < winRate;
      
      if (won) {
        bankroll += stake * (avgOdds - 1);
      } else {
        bankroll -= stake;
      }
      
      // Track peak and drawdown
      if (bankroll > peak) peak = bankroll;
      const drawdown = (peak - bankroll) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      
      path.push(bankroll);
      
      // Check for ruin (below 10% of starting)
      if (bankroll < startingBankroll * 0.1) {
        ruinCount++;
        break;
      }
    }
    
    allFinalBankrolls.push(bankroll);
    allPaths.push(path);
    maxDrawdowns.push(maxDrawdown);
    
    if (bankroll > startingBankroll) profitCount++;
  }
  
  // Calculate median path for visualization
  const medianPath = calculateMedianPath(allPaths, numBets);
  
  // Calculate statistics
  const avgFinal = allFinalBankrolls.reduce((a, b) => a + b, 0) / numSimulations;
  const avgMaxDrawdown = maxDrawdowns.reduce((a, b) => a + b, 0) / numSimulations;
  
  // Calculate Sharpe Ratio
  const returns = allFinalBankrolls.map(f => (f - startingBankroll) / startingBankroll);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / numSimulations;
  const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / numSimulations;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;
  
  return {
    scenario,
    projectedBankroll: medianPath,
    winRate,
    avgOdds,
    numBets,
    probabilityOfProfit: profitCount / numSimulations,
    probabilityOfRuin: ruinCount / numSimulations,
    maxDrawdown: avgMaxDrawdown,
    sharpeRatio,
    expectedGrowth: ((avgFinal - startingBankroll) / startingBankroll) * 100
  };
}

function calculateMedianPath(paths: number[][], numBets: number): number[] {
  const medianPath: number[] = [];
  
  for (let i = 0; i <= numBets; i++) {
    const valuesAtStep = paths
      .filter(p => p.length > i)
      .map(p => p[i])
      .sort((a, b) => a - b);
    
    if (valuesAtStep.length > 0) {
      const mid = Math.floor(valuesAtStep.length / 2);
      medianPath.push(valuesAtStep[mid]);
    }
  }
  
  return medianPath;
}

export function calculateRiskOfRuin(
  settings: BankrollSettings,
  winRate: number,
  avgOdds: number
): number {
  // Simplified risk of ruin calculation
  const edge = (winRate * avgOdds) - 1;
  if (edge <= 0) return 1; // 100% ruin if no edge
  
  const q = 1 - winRate;
  const p = winRate;
  
  // Risk of ruin with fractional Kelly
  const a = Math.pow(q / p, settings.currentBankroll / settings.unitSize);
  return Math.min(1, Math.max(0, a));
}

export function calculateBankrollRisk(
  settings: BankrollSettings,
  history: { bankroll: number; date: string }[]
): BankrollRisk {
  const current = settings.currentBankroll;
  const starting = settings.startingBankroll;
  
  // Calculate current and max drawdown from history
  let peak = starting;
  let maxDrawdown = 0;
  
  history.forEach(h => {
    if (h.bankroll > peak) peak = h.bankroll;
    const dd = (peak - h.bankroll) / peak;
    if (dd > maxDrawdown) maxDrawdown = dd;
  });
  
  const currentDrawdown = peak > 0 ? (peak - current) / peak : 0;
  
  // Estimate days to recovery based on typical growth
  const dailyGrowthRate = 0.01; // 1% daily expected
  const daysToRecovery = currentDrawdown > 0 
    ? Math.ceil(Math.log(peak / current) / Math.log(1 + dailyGrowthRate))
    : 0;
  
  // Calculate health score (0-100)
  const drawdownPenalty = currentDrawdown * 50;
  const ruinRisk = calculateRiskOfRuin(settings, 0.54, 1.9) * 30;
  const healthScore = Math.max(0, Math.min(100, 100 - drawdownPenalty - ruinRisk));
  
  return {
    riskOfRuin: calculateRiskOfRuin(settings, 0.54, 1.9),
    currentDrawdown,
    maxDrawdown,
    daysToRecovery,
    healthScore
  };
}

export function generateBankrollProjections(
  settings: BankrollSettings,
  days: number = 30,
  winRate: number = 0.54,
  betsPerDay: number = 3
): BankrollProjection[] {
  const projections: BankrollProjection[] = [];
  
  let optimistic = settings.currentBankroll;
  let realistic = settings.currentBankroll;
  let pessimistic = settings.currentBankroll;
  
  const avgOdds = 1.9;
  const dailyEdgeOptimistic = ((winRate + 0.03) * avgOdds - 1) * betsPerDay * 0.02;
  const dailyEdgeRealistic = (winRate * avgOdds - 1) * betsPerDay * 0.02;
  const dailyEdgePessimistic = ((winRate - 0.03) * avgOdds - 1) * betsPerDay * 0.02;
  
  for (let day = 0; day <= days; day++) {
    projections.push({
      day,
      optimistic: Math.round(optimistic),
      realistic: Math.round(realistic),
      pessimistic: Math.round(pessimistic)
    });
    
    optimistic *= (1 + dailyEdgeOptimistic);
    realistic *= (1 + dailyEdgeRealistic);
    pessimistic *= (1 + Math.min(0, dailyEdgePessimistic));
  }
  
  return projections;
}

export function calculateOptimalUnitSize(
  bankroll: number,
  winRate: number,
  avgOdds: number,
  kellyFraction: number = 0.25
): number {
  const edge = (winRate * avgOdds) - 1;
  if (edge <= 0) return bankroll * 0.01; // Minimum 1% if no edge
  
  const fullKelly = edge / (avgOdds - 1);
  const adjustedKelly = fullKelly * kellyFraction;
  
  return Math.round(bankroll * adjustedKelly * 100) / 100;
}
