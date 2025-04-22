
import { Match } from "@/types/sports";

export function calculateWeatherImpact(match: Match) {
  // Default starting score and empty factors array
  let weatherImpact = 80;
  const weatherFactors = [];
  
  // In a real implementation, this would check weather APIs for the match location
  // Let's simulate some factors based on pattern matching in the team names
  
  // Outdoor teams affected more by weather
  const outdoorVenues = ["Yankees", "Cubs", "Red Sox", "Royals", "Braves", "Packers", "Bears", "Chiefs"];
  const indoorVenues = ["Rays", "Marlins", "Bucks", "Timberwolves", "Lakers", "Clippers"];
  
  // Check if teams likely play in outdoor venues
  const isOutdoor = outdoorVenues.some(team => 
    match.homeTeam.name.includes(team) || 
    match.homeTeam.shortName.includes(team)
  );
  
  const isIndoor = indoorVenues.some(team => 
    match.homeTeam.name.includes(team) || 
    match.homeTeam.shortName.includes(team)
  );
  
  if (isOutdoor) {
    weatherImpact -= 15;
    weatherFactors.push("Outdoor venue (weather conditions may affect play)");
  }
  
  if (isIndoor) {
    weatherImpact += 10;
    weatherFactors.push("Indoor venue (controlled climate)");
  }
  
  // Return the calculated impact
  return { weatherImpact, weatherFactors };
}
