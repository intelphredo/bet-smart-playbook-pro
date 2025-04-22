
import { Match } from "@/types/sports";

export function calculateInjuryImpact(match: Match) {
  // Default starting score and empty factors array
  let injuriesScore = 75;
  const injuryFactors = [];
  
  // In a real implementation, this would check injury reports APIs
  // For now, let's simulate based on match data patterns
  
  // Check if any injury info is in the match description or notes
  if (match.description && match.description.toLowerCase().includes("injur")) {
    injuriesScore -= 20;
    injuryFactors.push("Key injuries mentioned in match description");
  }
  
  // Check for injury indicators in team records
  if (match.homeTeam.record && match.homeTeam.record.includes("L")) {
    // More losses recently might indicate injury problems
    const losses = (match.homeTeam.record.match(/L/g) || []).length;
    if (losses >= 3) {
      injuriesScore -= 10;
      injuryFactors.push(`${match.homeTeam.shortName} on losing streak (possible injury impact)`);
    }
  }
  
  if (match.awayTeam.record && match.awayTeam.record.includes("L")) {
    const losses = (match.awayTeam.record.match(/L/g) || []).length;
    if (losses >= 3) {
      injuriesScore -= 10;
      injuryFactors.push(`${match.awayTeam.shortName} on losing streak (possible injury impact)`);
    }
  }
  
  // If no injury factors were found, add a default one
  if (injuryFactors.length === 0) {
    injuryFactors.push("No major injuries reported");
  }
  
  return { injuriesScore, injuryFactors };
}
