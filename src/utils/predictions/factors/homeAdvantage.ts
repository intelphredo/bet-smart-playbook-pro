
import { League, Team } from "@/types/sports";
import { calculateRecentWins } from "./momentum";

/**
 * Get dynamic home field advantage based on league and team performance
 */
export function getDynamicHomeAdvantage(league: League, team: Team): number {
  let baseAdvantage;
  
  // Base advantage by league
  switch (league) {
    case 'NFL': baseAdvantage = 2.5; // Reduced from previous value
    case 'NBA': baseAdvantage = 2.0; // Reduced from previous value
    case 'MLB': baseAdvantage = 1.0; // Significantly reduced from previous value
    case 'NHL': baseAdvantage = 1.8; // Reduced from previous value
    case 'SOCCER': baseAdvantage = 3.0; // Reduced from previous value
    default: baseAdvantage = 2.0;
  }
  
  // Adjust based on team's home performance if available
  // This would ideally use home/away split records, but we'll use recent form as proxy
  if (team.recentForm && team.recentForm.length >= 3) {
    const recentWins = calculateRecentWins(team.recentForm);
    const recentWinPct = recentWins / team.recentForm.length;
    
    // Teams that have been winning get less home field advantage (already accounted for in their strength)
    // Teams that have been losing get more home field advantage (regression to mean)
    if (recentWinPct > 0.6) {
      baseAdvantage *= 0.8; // Reduce HFA for hot teams
    } else if (recentWinPct < 0.4) {
      baseAdvantage *= 1.2; // Increase HFA for cold teams
    }
  }
  
  return baseAdvantage;
}
