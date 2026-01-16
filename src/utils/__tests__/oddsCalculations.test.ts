import { describe, it, expect } from 'vitest';
import {
  americanToDecimal,
  oddsToImpliedProbability,
  probabilityToFairOdds,
  calculateEdge,
  calculateExpectedValue,
  calculateKellyStake,
} from '@/utils/betting/kellyCalculator';

describe('Odds Calculations', () => {
  describe('americanToDecimal', () => {
    it('converts positive American odds correctly', () => {
      expect(americanToDecimal(100)).toBe(2);
      expect(americanToDecimal(150)).toBe(2.5);
      expect(americanToDecimal(200)).toBe(3);
      expect(americanToDecimal(300)).toBe(4);
      expect(americanToDecimal(500)).toBe(6);
    });

    it('converts negative American odds correctly', () => {
      expect(americanToDecimal(-100)).toBe(2);
      expect(americanToDecimal(-110)).toBeCloseTo(1.909, 2);
      expect(americanToDecimal(-150)).toBeCloseTo(1.667, 2);
      expect(americanToDecimal(-200)).toBe(1.5);
      expect(americanToDecimal(-300)).toBeCloseTo(1.333, 2);
    });

    it('handles edge cases', () => {
      expect(americanToDecimal(1000)).toBe(11);
      expect(americanToDecimal(-1000)).toBe(1.1);
    });
  });

  describe('oddsToImpliedProbability', () => {
    it('converts decimal odds to probability', () => {
      expect(oddsToImpliedProbability(2)).toBe(0.5);
      expect(oddsToImpliedProbability(3)).toBeCloseTo(0.333, 2);
      expect(oddsToImpliedProbability(1.5)).toBeCloseTo(0.667, 2);
      expect(oddsToImpliedProbability(4)).toBe(0.25);
    });

    it('handles extreme odds', () => {
      expect(oddsToImpliedProbability(1.1)).toBeCloseTo(0.909, 2);
      expect(oddsToImpliedProbability(10)).toBe(0.1);
    });
  });

  describe('probabilityToFairOdds', () => {
    it('converts probability to decimal odds', () => {
      expect(probabilityToFairOdds(0.5)).toBe(2);
      expect(probabilityToFairOdds(0.25)).toBe(4);
      expect(probabilityToFairOdds(0.75)).toBeCloseTo(1.333, 2);
    });

    it('is the inverse of oddsToImpliedProbability', () => {
      const odds = 2.5;
      const prob = oddsToImpliedProbability(odds);
      expect(probabilityToFairOdds(prob)).toBeCloseTo(odds, 5);
    });
  });

  describe('calculateEdge', () => {
    it('calculates positive edge correctly', () => {
      // Model says 55% chance, book implies 50% (2.0 odds)
      const edge = calculateEdge(0.55, 2.0);
      expect(edge).toBeCloseTo(0.05, 5);
    });

    it('calculates negative edge correctly', () => {
      // Model says 45% chance, book implies 50% (2.0 odds)
      const edge = calculateEdge(0.45, 2.0);
      expect(edge).toBeCloseTo(-0.05, 5);
    });

    it('handles zero edge', () => {
      // Model agrees with book
      const edge = calculateEdge(0.5, 2.0);
      expect(edge).toBe(0);
    });

    it('works with varied odds', () => {
      // Model says 40%, book implies 33.3% (3.0 odds)
      const edge = calculateEdge(0.4, 3.0);
      expect(edge).toBeCloseTo(0.0667, 3);
    });
  });

  describe('calculateExpectedValue', () => {
    it('calculates positive EV correctly', () => {
      // 55% win prob at 2.0 odds
      const result = calculateExpectedValue(0.55, 2.0);
      expect(result.isPositiveEV).toBe(true);
      expect(result.evPercentage).toBeCloseTo(10, 0);
    });

    it('calculates negative EV correctly', () => {
      // 45% win prob at 2.0 odds
      const result = calculateExpectedValue(0.45, 2.0);
      expect(result.isPositiveEV).toBe(false);
      expect(result.evPercentage).toBeCloseTo(-10, 0);
    });

    it('calculates zero EV correctly', () => {
      // 50% win prob at 2.0 odds (break even)
      const result = calculateExpectedValue(0.5, 2.0);
      expect(result.ev).toBe(0);
      expect(result.evPercentage).toBe(0);
    });

    it('works with longshot odds', () => {
      // 25% win prob at 5.0 odds (break even)
      const result = calculateExpectedValue(0.25, 5.0);
      expect(result.evPercentage).toBeCloseTo(0, 0);
    });

    it('works with favorite odds', () => {
      // 70% win prob at 1.5 odds (break even at 66.7%)
      const result = calculateExpectedValue(0.7, 1.5);
      expect(result.isPositiveEV).toBe(true);
    });
  });

  describe('calculateKellyStake', () => {
    const baseConfig = {
      trueProbability: 0.55,
      bookmakerOdds: 2.0,
      bankroll: 1000,
      kellyFraction: 0.25,
      unitSize: 10,
      minEVThreshold: 3,
      maxBetPercentage: 5,
    };

    it('recommends a stake for positive EV bets', () => {
      const result = calculateKellyStake(baseConfig);
      expect(result.isPositiveEV).toBe(true);
      expect(result.recommendedStake).toBeGreaterThan(0);
      expect(result.recommendedStakePercentage).toBeLessThanOrEqual(5);
    });

    it('recommends zero stake for negative EV bets', () => {
      const result = calculateKellyStake({
        ...baseConfig,
        trueProbability: 0.45,
      });
      expect(result.isPositiveEV).toBe(false);
      expect(result.recommendedStake).toBe(0);
    });

    it('recommends zero stake when EV below threshold', () => {
      const result = calculateKellyStake({
        ...baseConfig,
        trueProbability: 0.51, // ~2% EV, below 3% threshold
      });
      expect(result.recommendedStake).toBe(0);
    });

    it('caps stake at max bet percentage', () => {
      const result = calculateKellyStake({
        ...baseConfig,
        trueProbability: 0.8, // Very high edge
        kellyFraction: 1.0, // Full Kelly would suggest large bet
      });
      expect(result.recommendedStakePercentage).toBeLessThanOrEqual(5);
    });

    it('applies fractional Kelly correctly', () => {
      const fullKelly = calculateKellyStake({
        ...baseConfig,
        kellyFraction: 1.0,
      });
      const quarterKelly = calculateKellyStake({
        ...baseConfig,
        kellyFraction: 0.25,
      });
      
      // Quarter Kelly should have smaller stake
      expect(quarterKelly.adjustedKelly).toBeLessThan(fullKelly.adjustedKelly);
    });

    it('calculates risk level correctly', () => {
      const lowRisk = calculateKellyStake({
        ...baseConfig,
        trueProbability: 0.52,
      });
      expect(lowRisk.riskLevel).toBe('low');

      const highRisk = calculateKellyStake({
        ...baseConfig,
        trueProbability: 0.8,
        kellyFraction: 1.0,
      });
      expect(highRisk.riskLevel).toBe('high');
    });

    it('throws error for invalid probability', () => {
      expect(() => calculateKellyStake({
        ...baseConfig,
        trueProbability: 0,
      })).toThrow();

      expect(() => calculateKellyStake({
        ...baseConfig,
        trueProbability: 1,
      })).toThrow();
    });

    it('throws error for invalid odds', () => {
      expect(() => calculateKellyStake({
        ...baseConfig,
        bookmakerOdds: 1,
      })).toThrow();
    });

    it('throws error for invalid bankroll', () => {
      expect(() => calculateKellyStake({
        ...baseConfig,
        bankroll: 0,
      })).toThrow();
    });

    it('calculates recommended stake in units', () => {
      const result = calculateKellyStake(baseConfig);
      const expectedUnits = result.recommendedStake / 10;
      expect(result.recommendedStakeUnits).toBeCloseTo(expectedUnits, 1);
    });
  });
});

describe('Odds Conversion Integration', () => {
  it('converts American to Decimal and back to probability consistently', () => {
    const americanOdds = [-150, -110, +100, +150, +200];
    
    for (const american of americanOdds) {
      const decimal = americanToDecimal(american);
      const probability = oddsToImpliedProbability(decimal);
      const backToOdds = probabilityToFairOdds(probability);
      
      expect(backToOdds).toBeCloseTo(decimal, 5);
      expect(probability).toBeGreaterThan(0);
      expect(probability).toBeLessThan(1);
    }
  });

  it('maintains consistent EV calculations across odds formats', () => {
    // -110 odds at 52.4% break-even
    const americanOdds = -110;
    const decimalOdds = americanToDecimal(americanOdds);
    const breakEvenProb = oddsToImpliedProbability(decimalOdds);
    
    // At break-even probability, EV should be ~0
    const evAtBreakEven = calculateExpectedValue(breakEvenProb, decimalOdds);
    expect(Math.abs(evAtBreakEven.evPercentage)).toBeLessThan(0.1);
    
    // With 5% edge, EV should be positive
    const evWithEdge = calculateExpectedValue(breakEvenProb + 0.05, decimalOdds);
    expect(evWithEdge.isPositiveEV).toBe(true);
  });
});

describe('Arbitrage Detection', () => {
  /**
   * Helper to detect arbitrage opportunity between two books
   */
  function hasArbitrage(
    homeOdds: number,
    awayOdds: number
  ): { exists: boolean; margin: number } {
    const homeProb = oddsToImpliedProbability(homeOdds);
    const awayProb = oddsToImpliedProbability(awayOdds);
    const totalProb = homeProb + awayProb;
    
    return {
      exists: totalProb < 1,
      margin: 1 - totalProb,
    };
  }

  it('detects arbitrage when implied probabilities sum below 100%', () => {
    // Arb opportunity: home 2.1 (47.6%) + away 2.1 (47.6%) = 95.2%
    const result = hasArbitrage(2.1, 2.1);
    expect(result.exists).toBe(true);
    expect(result.margin).toBeCloseTo(0.048, 2);
  });

  it('detects no arbitrage when probabilities sum above 100%', () => {
    // Standard book margin: home 1.9 (52.6%) + away 1.9 (52.6%) = 105.2%
    const result = hasArbitrage(1.9, 1.9);
    expect(result.exists).toBe(false);
    expect(result.margin).toBeLessThan(0);
  });

  it('handles three-way markets', () => {
    function hasArbitrage3Way(
      homeOdds: number,
      drawOdds: number,
      awayOdds: number
    ): { exists: boolean; margin: number } {
      const totalProb = 
        oddsToImpliedProbability(homeOdds) +
        oddsToImpliedProbability(drawOdds) +
        oddsToImpliedProbability(awayOdds);
      
      return {
        exists: totalProb < 1,
        margin: 1 - totalProb,
      };
    }

    // No arb with standard margins
    const noArb = hasArbitrage3Way(2.5, 3.2, 2.9);
    expect(noArb.exists).toBe(false);

    // Arb with inflated odds
    const arb = hasArbitrage3Way(3.5, 4.0, 3.5);
    expect(arb.exists).toBe(true);
  });
});

describe('Line Movement Calculations', () => {
  function calculateLineMovement(
    openingOdds: number,
    closingOdds: number
  ): { direction: 'steam' | 'reverse' | 'stable'; magnitude: number } {
    const openingProb = oddsToImpliedProbability(openingOdds);
    const closingProb = oddsToImpliedProbability(closingOdds);
    const diff = closingProb - openingProb;
    
    if (Math.abs(diff) < 0.01) {
      return { direction: 'stable', magnitude: 0 };
    }
    
    return {
      direction: diff > 0 ? 'steam' : 'reverse',
      magnitude: Math.abs(diff) * 100,
    };
  }

  it('detects steam move (odds shortening)', () => {
    // Odds moved from 2.2 to 1.8 (team is steaming)
    const result = calculateLineMovement(2.2, 1.8);
    expect(result.direction).toBe('steam');
    expect(result.magnitude).toBeGreaterThan(0);
  });

  it('detects reverse line movement (odds lengthening)', () => {
    // Odds moved from 1.8 to 2.2 despite action
    const result = calculateLineMovement(1.8, 2.2);
    expect(result.direction).toBe('reverse');
    expect(result.magnitude).toBeGreaterThan(0);
  });

  it('detects stable line', () => {
    const result = calculateLineMovement(2.0, 2.01);
    expect(result.direction).toBe('stable');
  });
});

describe('CLV (Closing Line Value) Calculations', () => {
  function calculateCLV(
    betOdds: number,
    closingOdds: number
  ): { clvPercent: number; isPositive: boolean } {
    const betProb = oddsToImpliedProbability(betOdds);
    const closingProb = oddsToImpliedProbability(closingOdds);
    const clv = (closingProb - betProb) / betProb * 100;
    
    return {
      clvPercent: Math.round(clv * 100) / 100,
      isPositive: clv > 0,
    };
  }

  it('calculates positive CLV when you beat the closing line', () => {
    // Got 2.2 odds, line closed at 1.9 (you got better price)
    const result = calculateCLV(2.2, 1.9);
    expect(result.isPositive).toBe(true);
    expect(result.clvPercent).toBeGreaterThan(0);
  });

  it('calculates negative CLV when line moves against you', () => {
    // Got 1.8 odds, line closed at 2.1 (price got better after you bet)
    const result = calculateCLV(1.8, 2.1);
    expect(result.isPositive).toBe(false);
    expect(result.clvPercent).toBeLessThan(0);
  });

  it('calculates zero CLV when odds unchanged', () => {
    const result = calculateCLV(2.0, 2.0);
    expect(result.clvPercent).toBe(0);
  });
});
