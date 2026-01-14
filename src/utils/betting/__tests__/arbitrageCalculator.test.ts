import { describe, it, expect } from 'vitest';

// Pure utility functions extracted for testing
// (These would normally be exported from useArbitrageCalculator.ts)

interface OddsData {
  homeWin: number;
  awayWin: number;
  draw?: number;
}

/**
 * Calculate arbitrage percentage from odds
 * Lower percentage = better arbitrage opportunity
 * Under 100% = guaranteed profit opportunity
 */
export function calculateArbitragePercentage(odds: OddsData[]): number {
  if (odds.length === 0) return 100;
  
  const bestHome = Math.max(...odds.map(o => o.homeWin).filter(Boolean));
  const bestAway = Math.max(...odds.map(o => o.awayWin).filter(Boolean));
  const hasDraw = odds.some(o => o.draw !== undefined);
  const bestDraw = hasDraw ? Math.max(...odds.map(o => o.draw || 0).filter(Boolean)) : 0;
  
  if (bestHome <= 0 || bestAway <= 0) return 100;
  
  let arbPercentage = (1 / bestHome) + (1 / bestAway);
  if (hasDraw && bestDraw > 0) {
    arbPercentage += (1 / bestDraw);
  }
  
  return arbPercentage * 100;
}

/**
 * Calculate optimal stake percentages for arbitrage
 */
export function calculateStakePercentages(
  odds: OddsData, 
  hasDraw: boolean
): { home: number; away: number; draw?: number } {
  const totalImpliedProb = 
    (1 / odds.homeWin) + 
    (1 / odds.awayWin) + 
    (hasDraw && odds.draw ? (1 / odds.draw) : 0);
  
  const homeStake = ((1 / odds.homeWin) / totalImpliedProb) * 100;
  const awayStake = ((1 / odds.awayWin) / totalImpliedProb) * 100;
  const drawStake = hasDraw && odds.draw 
    ? ((1 / odds.draw) / totalImpliedProb) * 100 
    : undefined;
  
  return { home: homeStake, away: awayStake, draw: drawStake };
}

/**
 * Calculate potential profit from arbitrage
 */
export function calculateArbitrageProfit(
  totalStake: number, 
  arbPercentage: number
): number {
  if (arbPercentage >= 100) return 0;
  return (100 - arbPercentage) / 100 * totalStake;
}

describe('Arbitrage Calculator', () => {
  describe('calculateArbitragePercentage', () => {
    it('should return 100 for empty odds array', () => {
      expect(calculateArbitragePercentage([])).toBe(100);
    });

    it('should detect true arbitrage opportunity (under 100%)', () => {
      // These odds create an arbitrage: best home 2.1, best away 2.1
      // 1/2.1 + 1/2.1 = 0.476 + 0.476 = 0.952 = 95.2%
      const odds: OddsData[] = [
        { homeWin: 2.1, awayWin: 1.9 },
        { homeWin: 1.95, awayWin: 2.1 },
      ];

      const result = calculateArbitragePercentage(odds);
      expect(result).toBeLessThan(100);
      expect(result).toBeCloseTo(95.24, 1);
    });

    it('should identify no arbitrage (over 100%)', () => {
      // Standard market with vig: 1.91 odds on each side
      // 1/1.91 + 1/1.91 = 0.524 + 0.524 = 1.048 = 104.8%
      const odds: OddsData[] = [
        { homeWin: 1.91, awayWin: 1.91 },
      ];

      const result = calculateArbitragePercentage(odds);
      expect(result).toBeGreaterThan(100);
      expect(result).toBeCloseTo(104.71, 1);
    });

    it('should handle three-way markets with draw', () => {
      // Soccer market with three outcomes
      const odds: OddsData[] = [
        { homeWin: 2.5, awayWin: 2.8, draw: 3.2 },
        { homeWin: 2.6, awayWin: 2.7, draw: 3.4 },
      ];

      const result = calculateArbitragePercentage(odds);
      // Best: home 2.6, away 2.8, draw 3.4
      // 1/2.6 + 1/2.8 + 1/3.4 = 0.385 + 0.357 + 0.294 = 1.036 = 103.6%
      expect(result).toBeCloseTo(103.64, 1);
    });

    it('should find best odds across multiple bookmakers', () => {
      const odds: OddsData[] = [
        { homeWin: 1.85, awayWin: 2.05 }, // Book A
        { homeWin: 1.90, awayWin: 2.00 }, // Book B
        { homeWin: 1.88, awayWin: 2.10 }, // Book C - best away
      ];

      const result = calculateArbitragePercentage(odds);
      // Best home: 1.90, best away: 2.10
      // 1/1.90 + 1/2.10 = 0.526 + 0.476 = 1.002 = 100.2%
      expect(result).toBeCloseTo(100.26, 1);
    });

    it('should return 100 when odds are invalid', () => {
      const odds: OddsData[] = [
        { homeWin: 0, awayWin: 2.0 },
      ];
      expect(calculateArbitragePercentage(odds)).toBe(100);
    });
  });

  describe('calculateStakePercentages', () => {
    it('should calculate correct stake percentages for two-way market', () => {
      const odds: OddsData = { homeWin: 2.0, awayWin: 2.0 };
      const stakes = calculateStakePercentages(odds, false);

      // Equal odds should yield equal stakes
      expect(stakes.home).toBeCloseTo(50, 1);
      expect(stakes.away).toBeCloseTo(50, 1);
      expect(stakes.draw).toBeUndefined();
    });

    it('should allocate more stake to lower odds', () => {
      const odds: OddsData = { homeWin: 1.5, awayWin: 3.0 };
      const stakes = calculateStakePercentages(odds, false);

      // Lower odds (1.5) should get higher stake
      expect(stakes.home).toBeGreaterThan(stakes.away);
      expect(stakes.home + stakes.away).toBeCloseTo(100, 1);
    });

    it('should handle three-way market', () => {
      const odds: OddsData = { homeWin: 2.5, awayWin: 3.0, draw: 3.5 };
      const stakes = calculateStakePercentages(odds, true);

      expect(stakes.home).toBeDefined();
      expect(stakes.away).toBeDefined();
      expect(stakes.draw).toBeDefined();
      expect(stakes.home! + stakes.away! + stakes.draw!).toBeCloseTo(100, 1);
    });

    it('should guarantee equal return on all outcomes', () => {
      const odds: OddsData = { homeWin: 2.1, awayWin: 2.0 };
      const stakes = calculateStakePercentages(odds, false);
      const totalStake = 100;

      const homeStakeAmount = (stakes.home / 100) * totalStake;
      const awayStakeAmount = (stakes.away / 100) * totalStake;

      const returnOnHome = homeStakeAmount * odds.homeWin;
      const returnOnAway = awayStakeAmount * odds.awayWin;

      // Returns should be equal (that's the point of arbitrage)
      expect(returnOnHome).toBeCloseTo(returnOnAway, 1);
    });
  });

  describe('calculateArbitrageProfit', () => {
    it('should calculate profit correctly for true arbitrage', () => {
      const totalStake = 1000;
      const arbPercentage = 98; // 2% arb

      const profit = calculateArbitrageProfit(totalStake, arbPercentage);
      expect(profit).toBeCloseTo(20, 0); // 2% of 1000
    });

    it('should return zero profit when no arbitrage exists', () => {
      const profit = calculateArbitrageProfit(1000, 104);
      expect(profit).toBe(0);
    });

    it('should handle edge case at exactly 100%', () => {
      const profit = calculateArbitrageProfit(1000, 100);
      expect(profit).toBe(0);
    });
  });

  describe('Real-world arbitrage scenarios', () => {
    it('should identify profitable NFL moneyline arb', () => {
      // Real-world scenario: different books offer different lines
      const odds: OddsData[] = [
        { homeWin: 1.95, awayWin: 1.95 },  // FanDuel
        { homeWin: 2.05, awayWin: 1.85 },  // DraftKings
        { homeWin: 1.90, awayWin: 2.00 },  // BetMGM
      ];

      const arbPct = calculateArbitragePercentage(odds);
      // Best: home 2.05, away 2.00
      // 1/2.05 + 1/2.00 = 0.488 + 0.500 = 0.988 = 98.8%
      expect(arbPct).toBeLessThan(100);
      
      // Calculate profit on $1000 stake
      const profit = calculateArbitrageProfit(1000, arbPct);
      expect(profit).toBeGreaterThan(0);
    });

    it('should calculate correct stakes for soccer three-way arb', () => {
      const bestOdds: OddsData = { homeWin: 3.0, awayWin: 3.0, draw: 4.0 };
      const stakes = calculateStakePercentages(bestOdds, true);
      
      // Verify proportional allocation
      // 1/3.0 : 1/3.0 : 1/4.0 = 0.333 : 0.333 : 0.25
      // Total = 0.917, so:
      // Home = 0.333/0.917 = 36.3%
      // Away = 0.333/0.917 = 36.3%
      // Draw = 0.25/0.917 = 27.3%
      expect(stakes.home).toBeCloseTo(36.36, 1);
      expect(stakes.away).toBeCloseTo(36.36, 1);
      expect(stakes.draw).toBeCloseTo(27.27, 1);
    });
  });
});
