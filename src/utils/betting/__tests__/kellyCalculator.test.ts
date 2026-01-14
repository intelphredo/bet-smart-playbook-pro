import { describe, it, expect } from 'vitest';
import {
  calculateKellyStake,
  calculateExpectedValue,
  americanToDecimal,
  oddsToImpliedProbability,
  probabilityToFairOdds,
  calculateEdge,
  simulateKellyBetting,
  KellyConfig,
} from '../kellyCalculator';

describe('Kelly Criterion Calculator', () => {
  describe('calculateKellyStake', () => {
    it('should return zero stake when EV is negative', () => {
      const config: KellyConfig = {
        trueProbability: 0.4, // Model thinks 40% chance
        bookmakerOdds: 2.0,   // Book offers 2.0 (50% implied)
        bankroll: 1000,
      };

      const result = calculateKellyStake(config);

      expect(result.isPositiveEV).toBe(false);
      expect(result.recommendedStake).toBe(0);
      expect(result.fullKelly).toBe(0);
    });

    it('should calculate correct stake for positive EV bet', () => {
      const config: KellyConfig = {
        trueProbability: 0.6,  // Model thinks 60% chance
        bookmakerOdds: 2.0,    // Book offers 2.0 (50% implied) - edge for us!
        bankroll: 1000,
        kellyFraction: 0.25,   // Quarter Kelly
      };

      const result = calculateKellyStake(config);

      expect(result.isPositiveEV).toBe(true);
      expect(result.evPercentage).toBeGreaterThan(0);
      expect(result.recommendedStake).toBeGreaterThan(0);
      expect(result.fullKelly).toBeGreaterThan(0);
      expect(result.adjustedKelly).toBeLessThanOrEqual(result.fullKelly);
    });

    it('should not exceed max bet percentage', () => {
      const config: KellyConfig = {
        trueProbability: 0.8,  // Very confident
        bookmakerOdds: 2.5,    // Great odds
        bankroll: 1000,
        maxBetPercentage: 5,   // Cap at 5%
      };

      const result = calculateKellyStake(config);

      expect(result.recommendedStakePercentage).toBeLessThanOrEqual(5);
      expect(result.recommendedStake).toBeLessThanOrEqual(50); // 5% of 1000
    });

    it('should reject probability outside 0-1 range', () => {
      expect(() => calculateKellyStake({
        trueProbability: 0,
        bookmakerOdds: 2.0,
        bankroll: 1000,
      })).toThrow('True probability must be between 0 and 1');

      expect(() => calculateKellyStake({
        trueProbability: 1,
        bookmakerOdds: 2.0,
        bankroll: 1000,
      })).toThrow('True probability must be between 0 and 1');
    });

    it('should reject invalid odds', () => {
      expect(() => calculateKellyStake({
        trueProbability: 0.5,
        bookmakerOdds: 0.5,
        bankroll: 1000,
      })).toThrow('Bookmaker odds must be greater than 1');

      expect(() => calculateKellyStake({
        trueProbability: 0.5,
        bookmakerOdds: 1,
        bankroll: 1000,
      })).toThrow('Bookmaker odds must be greater than 1');
    });

    it('should reject negative bankroll', () => {
      expect(() => calculateKellyStake({
        trueProbability: 0.5,
        bookmakerOdds: 2.0,
        bankroll: -100,
      })).toThrow('Bankroll must be positive');
    });

    it('should respect minimum EV threshold', () => {
      const config: KellyConfig = {
        trueProbability: 0.52, // Small edge
        bookmakerOdds: 2.0,
        bankroll: 1000,
        minEVThreshold: 5.0,  // Require 5% EV
      };

      const result = calculateKellyStake(config);

      // EV is positive but below threshold
      expect(result.isPositiveEV).toBe(true);
      expect(result.evPercentage).toBeLessThan(5);
      expect(result.recommendedStake).toBe(0);
    });

    it('should calculate correct risk levels', () => {
      // Low risk: < 2% stake
      const lowRisk = calculateKellyStake({
        trueProbability: 0.55,
        bookmakerOdds: 2.0,
        bankroll: 1000,
        kellyFraction: 0.1,
      });
      expect(lowRisk.riskLevel).toBe('low');

      // High risk: >= 5% stake
      const highRisk = calculateKellyStake({
        trueProbability: 0.75,
        bookmakerOdds: 2.5,
        bankroll: 1000,
        kellyFraction: 0.5,
        maxBetPercentage: 10,
      });
      expect(highRisk.riskLevel).toBe('high');
    });

    it('should calculate units correctly', () => {
      const config: KellyConfig = {
        trueProbability: 0.6,
        bookmakerOdds: 2.0,
        bankroll: 1000,
        unitSize: 10, // 1 unit = $10
      };

      const result = calculateKellyStake(config);
      
      // recommendedStakeUnits should be recommendedStake / unitSize
      const expectedUnits = result.recommendedStake / 10;
      expect(result.recommendedStakeUnits).toBeCloseTo(expectedUnits, 1);
    });
  });

  describe('calculateExpectedValue', () => {
    it('should calculate positive EV for valuable bet', () => {
      const result = calculateExpectedValue(0.6, 2.0);

      // EV = (0.6 * 1) - 0.4 = 0.2 = 20%
      expect(result.isPositiveEV).toBe(true);
      expect(result.evPercentage).toBeCloseTo(20, 0);
    });

    it('should calculate negative EV for bad bet', () => {
      const result = calculateExpectedValue(0.4, 2.0);

      // EV = (0.4 * 1) - 0.6 = -0.2 = -20%
      expect(result.isPositiveEV).toBe(false);
      expect(result.evPercentage).toBeCloseTo(-20, 0);
    });

    it('should calculate zero EV for fair odds', () => {
      // 50% chance at 2.0 odds is break-even
      const result = calculateExpectedValue(0.5, 2.0);

      expect(result.evPercentage).toBeCloseTo(0, 1);
    });
  });

  describe('americanToDecimal', () => {
    it('should convert positive American odds correctly', () => {
      expect(americanToDecimal(100)).toBeCloseTo(2.0, 2);
      expect(americanToDecimal(150)).toBeCloseTo(2.5, 2);
      expect(americanToDecimal(200)).toBeCloseTo(3.0, 2);
      expect(americanToDecimal(500)).toBeCloseTo(6.0, 2);
    });

    it('should convert negative American odds correctly', () => {
      expect(americanToDecimal(-100)).toBeCloseTo(2.0, 2);
      expect(americanToDecimal(-150)).toBeCloseTo(1.667, 2);
      expect(americanToDecimal(-200)).toBeCloseTo(1.5, 2);
      expect(americanToDecimal(-110)).toBeCloseTo(1.909, 2);
    });
  });

  describe('oddsToImpliedProbability', () => {
    it('should calculate implied probability correctly', () => {
      expect(oddsToImpliedProbability(2.0)).toBeCloseTo(0.5, 3);
      expect(oddsToImpliedProbability(4.0)).toBeCloseTo(0.25, 3);
      expect(oddsToImpliedProbability(1.5)).toBeCloseTo(0.667, 2);
    });
  });

  describe('probabilityToFairOdds', () => {
    it('should calculate fair odds correctly', () => {
      expect(probabilityToFairOdds(0.5)).toBeCloseTo(2.0, 2);
      expect(probabilityToFairOdds(0.25)).toBeCloseTo(4.0, 2);
      expect(probabilityToFairOdds(0.75)).toBeCloseTo(1.333, 2);
    });
  });

  describe('calculateEdge', () => {
    it('should calculate positive edge when model gives higher probability', () => {
      // Model says 60%, book implies 50% -> 10% edge
      const edge = calculateEdge(0.6, 2.0);
      expect(edge).toBeCloseTo(0.1, 2);
    });

    it('should calculate negative edge when model gives lower probability', () => {
      // Model says 40%, book implies 50% -> -10% edge
      const edge = calculateEdge(0.4, 2.0);
      expect(edge).toBeCloseTo(-0.1, 2);
    });

    it('should calculate zero edge for fair bet', () => {
      const edge = calculateEdge(0.5, 2.0);
      expect(edge).toBeCloseTo(0, 3);
    });
  });

  describe('simulateKellyBetting', () => {
    it('should run simulation and return valid results', () => {
      const config: KellyConfig = {
        trueProbability: 0.55,
        bookmakerOdds: 2.0,
        bankroll: 1000,
      };

      const results = simulateKellyBetting(config, 100, 10);

      expect(results.averageFinalBankroll).toBeGreaterThan(0);
      expect(results.medianFinalBankroll).toBeGreaterThan(0);
      expect(results.bestCase).toBeGreaterThanOrEqual(results.medianFinalBankroll);
      expect(results.worstCase).toBeLessThanOrEqual(results.medianFinalBankroll);
      expect(results.probabilityOfProfit).toBeGreaterThanOrEqual(0);
      expect(results.probabilityOfProfit).toBeLessThanOrEqual(1);
      expect(results.probabilityOfRuin).toBeGreaterThanOrEqual(0);
      expect(results.probabilityOfRuin).toBeLessThanOrEqual(1);
    });

    it('should show positive EV leads to growth on average', () => {
      const config: KellyConfig = {
        trueProbability: 0.6, // Good edge
        bookmakerOdds: 2.0,
        bankroll: 1000,
        kellyFraction: 0.25,
      };

      // Run many simulations for statistical significance
      const results = simulateKellyBetting(config, 200, 50);

      // With positive EV, average should be above starting bankroll
      expect(results.averageFinalBankroll).toBeGreaterThan(1000);
    });
  });
});
