
import { League } from "@/types/sports";
import { TeamStrength } from "../types";
import { getDynamicHomeAdvantage } from "./homeAdvantage";

/**
 * Project score based on team strengths - balanced approach
 */
export function projectScore(
  teamStrength: TeamStrength, 
  opponentStrength: TeamStrength, 
  isHome: boolean, 
  league: League
): number {
  // Base scoring rates by league
  let baseScore = 0;
  switch (league) {
    case 'NBA': baseScore = 105; break; // Average NBA team score
    case 'NFL': baseScore = 24; break;  // Average NFL team score
    case 'MLB': baseScore = 4.1; break; // Average MLB team score - slightly reduced
    case 'NHL': baseScore = 3; break;   // Average NHL team score
    case 'SOCCER': baseScore = 1.3; break; // Average soccer team score
    default: baseScore = 10;
  }
  
  // Calculate offensive vs defensive strength
  const offenseDefenseFactor = (teamStrength.offense - opponentStrength.defense) / 100;
  
  // Add home advantage if applicable - reduced impact
  const homeAdvantage = isHome ? (getDynamicHomeAdvantage(league, { 
    id: "", 
    name: "", 
    shortName: "",
    logo: "" // Adding the missing required 'logo' property
  }) / 20) : 0;
  
  // Calculate projected score - fairly between teams
  let rawScore = baseScore * (1 + offenseDefenseFactor + homeAdvantage);
  
  // Add some randomness - give both teams similar randomness
  const randomSeed = Date.now() + (isHome ? 1 : 0);
  const pseudoRandom = Math.sin(randomSeed) * 0.5 + 0.5; // Generate value between 0-1
  rawScore *= (0.95 + (pseudoRandom * 0.1)); // +/- 5% randomness
  
  // Round to appropriate precision based on league
  if (league === 'MLB' || league === 'NHL' || league === 'SOCCER') {
    return Math.max(0, Math.round(rawScore));
  } else {
    return Math.max(0, Math.round(rawScore));
  }
}
