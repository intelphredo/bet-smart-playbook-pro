
import { Team, League } from "@/types/sports";
import { TeamStrength } from "../types";

/**
 * Calculate team strength based on available data
 */
export function calculateTeamStrength(team: Team, league: League): TeamStrength {
  // Default values
  let offense = 50;
  let defense = 50;
  let momentum = 50;
  
  // Adjust based on team record if available
  if (team.record) {
    const recordParts = team.record.split('-');
    if (recordParts.length === 2) {
      const wins = parseInt(recordParts[0]);
      const losses = parseInt(recordParts[1]);
      
      if (!isNaN(wins) && !isNaN(losses) && (wins + losses > 0)) {
        const winningPct = wins / (wins + losses);
        offense += (winningPct * 100 - 50) * 0.4;
        defense += (winningPct * 100 - 50) * 0.4;
      }
    }
  }
  
  // Adjust based on recent form if available - with stronger emphasis
  if (team.recentForm && team.recentForm.length > 0) {
    let recentWins = 0;
    let weightSum = 0;
    
    // Weight recent games more heavily
    team.recentForm.forEach((result, index) => {
      const weight = team.recentForm.length - index; // More recent games have higher weight
      if (result === 'W') recentWins += weight;
      weightSum += weight;
    });
    
    const weightedWinPct = weightSum > 0 ? recentWins / weightSum : 0.5;
    momentum += (weightedWinPct * 100 - 50) * 1.0; // Stronger emphasis on momentum
  }
  
  // Make sure values are within bounds
  return {
    offense: Math.max(30, Math.min(95, offense)),
    defense: Math.max(30, Math.min(95, defense)),
    momentum: Math.max(20, Math.min(95, momentum))
  };
}

/**
 * Calculate MLB team strength based on record and form
 */
export function calculateMLBTeamStrength(team: Team): number {
  let strength = 50; // baseline
  
  // Factor in team record
  if (team.record) {
    const parts = team.record.split('-');
    if (parts.length === 2) {
      const wins = parseInt(parts[0]);
      const losses = parseInt(parts[1]);
      
      if (!isNaN(wins) && !isNaN(losses) && (wins + losses > 0)) {
        const winPct = wins / (wins + losses);
        strength += (winPct - 0.5) * 40; // adjust strength based on win percentage
      }
    }
  }
  
  // Factor in recent form
  if (team.recentForm && team.recentForm.length > 0) {
    const recentWins = team.recentForm.filter(r => r === 'W').length;
    const recentWinPct = recentWins / team.recentForm.length;
    
    strength += (recentWinPct - 0.5) * 20; // recent form has less impact than overall record
  }
  
  // Return strength between 30-70 for most teams
  return Math.max(30, Math.min(70, strength));
}
