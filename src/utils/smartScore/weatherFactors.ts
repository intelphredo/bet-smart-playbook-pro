
import { Match } from "@/types/sports";

export function calculateWeatherImpact(match: Match) {
  // Default starting score
  let weatherImpact = 80;
  const weatherFactors = [];
  
  // Seed a pseudo-random value based on match ID to ensure consistency
  const seed = match.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const pseudoRandom = (seed % 100) / 100;
  
  // In a real implementation, this would check weather APIs for the match location
  // For now, we'll simulate factors based on match data
  
  // League-specific weather impacts
  switch (match.league) {
    case "MLB":
      // Baseball is heavily affected by weather
      return calculateMLBWeatherImpact(match, pseudoRandom);
      
    case "NFL":
      // Football weather factors
      return calculateNFLWeatherImpact(match, pseudoRandom);
      
    case "SOCCER":
      // Soccer weather factors - moderate impact
      if (pseudoRandom < 0.25) {
        weatherImpact -= 15;
        weatherFactors.push({
          key: 'rain-soccer',
          impact: 'negative',
          weight: 7,
          description: 'Rainy conditions affecting field play'
        });
      } else if (pseudoRandom < 0.35) {
        weatherImpact -= 20;
        weatherFactors.push({
          key: 'heavy-rain-soccer',
          impact: 'negative',
          weight: 8,
          description: 'Heavy rain affecting passing and visibility'
        });
      } else {
        weatherFactors.push({
          key: 'favorable-conditions-soccer',
          impact: 'positive',
          weight: 3,
          description: 'Favorable playing conditions'
        });
      }
      break;
      
    case "NHL":
      // Hockey is indoor, minimal weather impact
      weatherImpact += 15;
      weatherFactors.push({
        key: 'indoor-hockey',
        impact: 'positive',
        weight: 2,
        description: 'Indoor climate-controlled environment'
      });
      break;
      
    case "NBA":
      // Basketball is indoor, minimal weather impact
      weatherImpact += 15;
      weatherFactors.push({
        key: 'indoor-basketball',
        impact: 'positive',
        weight: 2,
        description: 'Indoor climate-controlled environment'
      });
      break;
      
    default:
      // Default weather impact for other sports
      if (pseudoRandom < 0.3) {
        weatherImpact -= 10;
        weatherFactors.push({
          key: 'unfavorable-conditions',
          impact: 'negative',
          weight: 5,
          description: 'Potentially unfavorable weather conditions'
        });
      } else {
        weatherFactors.push({
          key: 'standard-conditions',
          impact: 'neutral',
          weight: 2,
          description: 'Standard playing conditions'
        });
      }
  }
  
  return { weatherImpact, weatherFactors };
}

// MLB-specific weather impact calculation
function calculateMLBWeatherImpact(match: Match, pseudoRandom: number) {
  let weatherImpact = 80;
  const weatherFactors = [];
  
  // Outdoor venue check based on team names
  const outdoorVenues = ["Yankees", "Cubs", "Red Sox", "Cardinals", "Royals", "Braves", "Giants", "Orioles", "Nationals"];
  const indoorVenues = ["Rays", "Marlins", "Blue Jays", "Diamondbacks", "Rangers", "Astros"];
  
  // Check if team plays in a dome or outdoor stadium
  const isIndoor = indoorVenues.some(team => 
    match.homeTeam.name.includes(team) || 
    match.homeTeam.shortName.includes(team)
  );
  
  const isOutdoor = outdoorVenues.some(team => 
    match.homeTeam.name.includes(team) || 
    match.homeTeam.shortName.includes(team)
  ) || !isIndoor; // Default to outdoor if not explicitly indoor
  
  if (isIndoor) {
    // Indoor baseball has consistent conditions
    weatherImpact += 15;
    weatherFactors.push({
      key: 'dome-baseball',
      impact: 'positive',
      weight: 8,
      description: 'Dome stadium with controlled climate'
    });
    
    return { weatherImpact, weatherFactors };
  }
  
  if (isOutdoor) {
    // Generate random weather conditions for outdoor games
    if (pseudoRandom < 0.15) {
      // Rain possibility
      weatherImpact -= 25;
      weatherFactors.push({
        key: 'rain-baseball',
        impact: 'negative',
        weight: 9,
        description: 'Rain affecting pitching grip and ball flight'
      });
    } else if (pseudoRandom < 0.25) {
      // High winds
      weatherImpact -= 20;
      weatherFactors.push({
        key: 'wind-baseball',
        impact: 'negative',
        weight: 8,
        description: 'High winds affecting fly balls and pitching'
      });
    } else if (pseudoRandom < 0.45) {
      // Hot/humid day
      weatherImpact -= 10;
      weatherFactors.push({
        key: 'heat-baseball',
        impact: 'negative',
        weight: 6,
        description: 'Heat/humidity affecting player stamina'
      });
    } else {
      // Favorable conditions
      weatherFactors.push({
        key: 'favorable-baseball',
        impact: 'positive',
        weight: 3,
        description: 'Favorable baseball playing conditions'
      });
    }
  }
  
  return { weatherImpact, weatherFactors };
}

// NFL-specific weather impact calculation
function calculateNFLWeatherImpact(match: Match, pseudoRandom: number) {
  let weatherImpact = 80;
  const weatherFactors = [];
  
  // Outdoor venue check based on team names
  const outdoorVenues = ["Packers", "Bears", "Bills", "Patriots", "Eagles", "Steelers", "Chiefs", "Ravens"];
  const indoorVenues = ["Saints", "Vikings", "Falcons", "Lions", "Colts", "Raiders"];
  
  // Check if team plays in a dome or outdoor stadium
  const isIndoor = indoorVenues.some(team => 
    match.homeTeam.name.includes(team) || 
    match.homeTeam.shortName.includes(team)
  );
  
  const isOutdoor = outdoorVenues.some(team => 
    match.homeTeam.name.includes(team) || 
    match.homeTeam.shortName.includes(team)
  ) || !isIndoor; // Default to outdoor if not explicitly indoor
  
  if (isIndoor) {
    // Indoor football has consistent conditions
    weatherImpact += 15;
    weatherFactors.push({
      key: 'dome-football',
      impact: 'positive',
      weight: 8,
      description: 'Dome stadium with ideal passing conditions'
    });
    
    return { weatherImpact, weatherFactors };
  }
  
  if (isOutdoor) {
    // Generate random weather conditions for outdoor games
    if (pseudoRandom < 0.15) {
      // Snow possibility
      weatherImpact -= 30;
      weatherFactors.push({
        key: 'snow-football',
        impact: 'negative',
        weight: 10,
        description: 'Snow affecting field conditions and passing game'
      });
    } else if (pseudoRandom < 0.30) {
      // Rain possibility
      weatherImpact -= 20;
      weatherFactors.push({
        key: 'rain-football',
        impact: 'negative',
        weight: 8,
        description: 'Rain affecting ball handling and footing'
      });
    } else if (pseudoRandom < 0.45) {
      // High winds
      weatherImpact -= 15;
      weatherFactors.push({
        key: 'wind-football',
        impact: 'negative',
        weight: 7,
        description: 'High winds affecting passing and kicking game'
      });
    } else {
      // Favorable conditions
      weatherFactors.push({
        key: 'favorable-football',
        impact: 'positive',
        weight: 3,
        description: 'Favorable football playing conditions'
      });
    }
  }
  
  return { weatherImpact, weatherFactors };
}
