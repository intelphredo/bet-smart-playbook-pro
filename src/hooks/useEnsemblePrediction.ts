/**
 * React hook for advanced ensemble predictions.
 * Provides both instant local ensemble and async AI meta-synthesis.
 */

import { useQuery } from "@tanstack/react-query";
import { MatchData } from "@/domain/prediction/interfaces";
import { ConsensusResult } from "@/domain/prediction/consensusEngine";
import { runLocalEnsemble } from "@/services/prediction/ensembleService";
import { runFullEnsemble, FullEnsembleResult } from "@/services/prediction/ensembleService";
import { EnsembleResult } from "@/domain/prediction/ensembleEngine";

/**
 * Instant local ensemble (no API calls)
 */
export function useLocalEnsemble(
  consensus: ConsensusResult | null,
  match: MatchData | null
): EnsembleResult | null {
  if (!consensus || !match) return null;
  return runLocalEnsemble(consensus, match);
}

/**
 * Full ensemble with AI meta-synthesis (async, cached)
 */
export function useFullEnsemble(
  consensus: ConsensusResult | null,
  match: MatchData | null,
  enabled: boolean = true
) {
  return useQuery<FullEnsembleResult>({
    queryKey: ['ensemble-full', match?.id, consensus?.generatedAt],
    queryFn: () => runFullEnsemble(consensus!, match!),
    enabled: enabled && !!consensus && !!match,
    staleTime: 15 * 60 * 1000, // 15 min cache
    retry: 1,
  });
}
