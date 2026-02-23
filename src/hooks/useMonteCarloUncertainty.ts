/**
 * React hook for Monte Carlo uncertainty estimation.
 * Runs MC simulation over ensemble/consensus predictions (pure computation, no API).
 */

import { useMemo } from "react";
import { ConsensusResult } from "@/domain/prediction/consensusEngine";
import { EnsembleResult } from "@/domain/prediction/ensembleEngine";
import {
  MonteCarloResult,
  MonteCarloConfig,
  DEFAULT_MC_CONFIG,
  runMonteCarloFromEnsemble,
  runMonteCarloFromConsensus,
} from "@/domain/prediction/monteCarloEngine";

/**
 * Compute MC uncertainty from an EnsembleResult (preferred — richer signal)
 */
export function useMonteCarloUncertainty(
  ensemble: EnsembleResult | null,
  config: MonteCarloConfig = DEFAULT_MC_CONFIG
): MonteCarloResult | null {
  return useMemo(() => {
    if (!ensemble) return null;
    return runMonteCarloFromEnsemble(ensemble, config);
  }, [ensemble, config]);
}

/**
 * Compute MC uncertainty from a ConsensusResult (fallback)
 */
export function useMonteCarloFromConsensus(
  consensus: ConsensusResult | null,
  config: MonteCarloConfig = DEFAULT_MC_CONFIG
): MonteCarloResult | null {
  return useMemo(() => {
    if (!consensus) return null;
    return runMonteCarloFromConsensus(consensus, config);
  }, [consensus, config]);
}
