import { Match } from "@/types";

export function calculateInjuryImpact(match: Match) {
  let injuriesScore = 75;
  const injuryFactors = [];
  // This could be enhanced with real injury data from an API
  return { injuriesScore, injuryFactors };
}
