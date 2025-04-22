
import { Team } from "@/types/sports";

/**
 * Calculate momentum score based on recent form
 */
export function calculateMomentumScore(team: Team): number {
  if (!team.recentForm || team.recentForm.length === 0) {
    return 0;
  }
  
  // Weight recent games more heavily
  let momentumScore = 0;
  const recentGames = [...team.recentForm].slice(0, Math.min(5, team.recentForm.length));
  
  // Give more weight to most recent games
  recentGames.forEach((result, index) => {
    const gameWeight = (recentGames.length - index) / recentGames.length; // More recent games have higher weight
    momentumScore += result === 'W' ? (3 * gameWeight) : (-2 * gameWeight);
  });
  
  return momentumScore;
}

/**
 * Calculate number of wins in recent form
 */
export function calculateRecentWins(recentForm: string[]): number {
  return recentForm.filter(result => result === 'W').length;
}

/**
 * Calculate weighted recent form that emphasizes more recent games
 */
export function calculateWeightedRecentForm(team: Team): number {
  if (!team.recentForm || team.recentForm.length === 0) {
    return 0;
  }
  
  let weightedScore = 0;
  const recentGames = [...team.recentForm].slice(0, Math.min(5, team.recentForm.length));
  
  // Give more weight to most recent games
  recentGames.forEach((result, index) => {
    const gameWeight = (recentGames.length - index) / recentGames.length;
    weightedScore += result === 'W' ? gameWeight : -gameWeight;
  });
  
  return weightedScore;
}
