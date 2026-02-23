import { describe, it, expect } from 'vitest';
import {
  applyGradientBoosting,
  detectSequentialPattern,
  calculateDiversityScore,
  DEFAULT_ENSEMBLE_CONFIG,
} from './ensembleEngine';
import { PredictionResult } from './interfaces';
import { AlgorithmWeight } from './consensusEngine';

const makePred = (id: string, name: string, confidence: number, rec: 'home' | 'away' = 'home'): PredictionResult => ({
  matchId: 'test',
  recommended: rec,
  confidence,
  trueProbability: confidence / 100,
  projectedScore: { home: 100, away: 95 },
  impliedOdds: 2.0,
  expectedValue: 0.05,
  evPercentage: 5,
  kellyFraction: 0.02,
  kellyStakeUnits: 2,
  factors: {
    teamStrength: { home: { offense: 60, defense: 55, momentum: 65, overall: 60 }, away: { offense: 55, defense: 50, momentum: 50, overall: 51.7 }, differential: 8.3 },
    homeAdvantage: 2.5,
    momentum: { home: 65, away: 50, differential: 15 },
  },
  algorithmId: id,
  algorithmName: name,
  generatedAt: new Date().toISOString(),
});

const makeWeight = (id: string, name: string, weight: number): AlgorithmWeight => ({
  algorithmId: id,
  algorithmName: name,
  weight,
  winRate: 55,
  totalPredictions: 50,
  avgConfidence: 60,
  reliability: 0.8,
});

describe('Ensemble Engine', () => {
  describe('applyGradientBoosting', () => {
    it('produces adjustments for each algorithm', () => {
      const preds = [
        makePred('a', 'A', 65),
        makePred('b', 'B', 55),
        makePred('c', 'C', 70),
      ];
      const weights = [
        makeWeight('a', 'A', 0.33),
        makeWeight('b', 'B', 0.33),
        makeWeight('c', 'C', 0.34),
      ];
      const result = applyGradientBoosting(preds, weights, DEFAULT_ENSEMBLE_CONFIG);
      expect(result.boostAdjustments.size).toBe(3);
      expect(result.round).toBe(5);
    });
  });

  describe('detectSequentialPattern', () => {
    it('detects a win streak', () => {
      const result = detectSequentialPattern(['W', 'W', 'W', 'W', 'W']);
      expect(result.type).toBe('streak');
      expect(result.strength).toBeGreaterThan(0.5);
    });

    it('detects alternating pattern', () => {
      const result = detectSequentialPattern(['W', 'L', 'W', 'L', 'W', 'L']);
      expect(result.type).toBe('alternating');
    });

    it('returns none for insufficient data', () => {
      const result = detectSequentialPattern(['W', 'L']);
      expect(result.type).toBe('none');
    });

    it('returns none for empty input', () => {
      const result = detectSequentialPattern();
      expect(result.type).toBe('none');
    });
  });

  describe('calculateDiversityScore', () => {
    it('returns 0 for single prediction', () => {
      const score = calculateDiversityScore([makePred('a', 'A', 60)]);
      expect(score).toBe(0);
    });

    it('returns higher diversity for disagreeing predictions', () => {
      const agree = calculateDiversityScore([
        makePred('a', 'A', 60, 'home'),
        makePred('b', 'B', 62, 'home'),
      ]);
      const disagree = calculateDiversityScore([
        makePred('a', 'A', 60, 'home'),
        makePred('b', 'B', 45, 'away'),
      ]);
      expect(disagree).toBeGreaterThan(agree);
    });
  });
});
