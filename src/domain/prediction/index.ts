/**
 * Domain Layer Exports
 */

// Interfaces
export * from './interfaces';

// Engine
export { 
  BasePredictionEngine,
  calculateTeamStrengthMetrics,
  calculateHomeAdvantage,
  projectScore,
  calculateKellyCriterion,
  calculateExpectedValue,
} from './engine';

// Algorithms
export {
  ALGORITHM_IDS,
  ALGORITHM_REGISTRY,
  createPredictionEngine,
  MLPowerIndexEngine,
  ValuePickFinderEngine,
  StatisticalEdgeEngine,
} from './algorithms';
export type { AlgorithmId } from './algorithms';

// Consensus
export {
  fetchAlgorithmWeights,
  synthesizeConsensus,
} from './consensusEngine';
export type { AlgorithmWeight, ConsensusResult } from './consensusEngine';
