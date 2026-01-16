/**
 * Comprehensive team abbreviation mapping for all supported leagues.
 * This provides a single source of truth for team name -> abbreviation conversions.
 */

import { League } from "@/types/sports";

// NBA Teams
export const NBA_TEAMS: Record<string, string> = {
  // Standard names
  "Atlanta Hawks": "ATL",
  "Boston Celtics": "BOS",
  "Brooklyn Nets": "BKN",
  "Charlotte Hornets": "CHA",
  "Chicago Bulls": "CHI",
  "Cleveland Cavaliers": "CLE",
  "Dallas Mavericks": "DAL",
  "Denver Nuggets": "DEN",
  "Detroit Pistons": "DET",
  "Golden State Warriors": "GSW",
  "Houston Rockets": "HOU",
  "Indiana Pacers": "IND",
  "LA Clippers": "LAC",
  "Los Angeles Clippers": "LAC",
  "LA Lakers": "LAL",
  "Los Angeles Lakers": "LAL",
  "Memphis Grizzlies": "MEM",
  "Miami Heat": "MIA",
  "Milwaukee Bucks": "MIL",
  "Minnesota Timberwolves": "MIN",
  "New Orleans Pelicans": "NOP",
  "New York Knicks": "NYK",
  "Oklahoma City Thunder": "OKC",
  "Orlando Magic": "ORL",
  "Philadelphia 76ers": "PHI",
  "Phoenix Suns": "PHX",
  "Portland Trail Blazers": "POR",
  "Sacramento Kings": "SAC",
  "San Antonio Spurs": "SAS",
  "Toronto Raptors": "TOR",
  "Utah Jazz": "UTA",
  "Washington Wizards": "WAS",
  // Aliases
  "Hawks": "ATL",
  "Celtics": "BOS",
  "Nets": "BKN",
  "Hornets": "CHA",
  "Bulls": "CHI",
  "Cavaliers": "CLE",
  "Cavs": "CLE",
  "Mavericks": "DAL",
  "Mavs": "DAL",
  "Nuggets": "DEN",
  "Pistons": "DET",
  "Warriors": "GSW",
  "Rockets": "HOU",
  "Pacers": "IND",
  "Clippers": "LAC",
  "Lakers": "LAL",
  "Grizzlies": "MEM",
  "Heat": "MIA",
  "Bucks": "MIL",
  "Timberwolves": "MIN",
  "Wolves": "MIN",
  "Pelicans": "NOP",
  "Knicks": "NYK",
  "Thunder": "OKC",
  "Magic": "ORL",
  "76ers": "PHI",
  "Sixers": "PHI",
  "Suns": "PHX",
  "Trail Blazers": "POR",
  "Blazers": "POR",
  "Kings": "SAC",
  "Spurs": "SAS",
  "Raptors": "TOR",
  "Jazz": "UTA",
  "Wizards": "WAS",
};

// NFL Teams
export const NFL_TEAMS: Record<string, string> = {
  // Standard names
  "Arizona Cardinals": "ARI",
  "Atlanta Falcons": "ATL",
  "Baltimore Ravens": "BAL",
  "Buffalo Bills": "BUF",
  "Carolina Panthers": "CAR",
  "Chicago Bears": "CHI",
  "Cincinnati Bengals": "CIN",
  "Cleveland Browns": "CLE",
  "Dallas Cowboys": "DAL",
  "Denver Broncos": "DEN",
  "Detroit Lions": "DET",
  "Green Bay Packers": "GB",
  "Houston Texans": "HOU",
  "Indianapolis Colts": "IND",
  "Jacksonville Jaguars": "JAX",
  "Kansas City Chiefs": "KC",
  "Las Vegas Raiders": "LV",
  "Los Angeles Chargers": "LAC",
  "Los Angeles Rams": "LAR",
  "Miami Dolphins": "MIA",
  "Minnesota Vikings": "MIN",
  "New England Patriots": "NE",
  "New Orleans Saints": "NO",
  "New York Giants": "NYG",
  "New York Jets": "NYJ",
  "Philadelphia Eagles": "PHI",
  "Pittsburgh Steelers": "PIT",
  "San Francisco 49ers": "SF",
  "Seattle Seahawks": "SEA",
  "Tampa Bay Buccaneers": "TB",
  "Tennessee Titans": "TEN",
  "Washington Commanders": "WAS",
  "Washington Football Team": "WAS",
  // Aliases
  "Cardinals": "ARI",
  "Falcons": "ATL",
  "Ravens": "BAL",
  "Bills": "BUF",
  "Panthers": "CAR",
  "Bears": "CHI",
  "Bengals": "CIN",
  "Browns": "CLE",
  "Cowboys": "DAL",
  "Broncos": "DEN",
  "Lions": "DET",
  "Packers": "GB",
  "Texans": "HOU",
  "Colts": "IND",
  "Jaguars": "JAX",
  "Jags": "JAX",
  "Chiefs": "KC",
  "Raiders": "LV",
  "Chargers": "LAC",
  "Rams": "LAR",
  "Dolphins": "MIA",
  "Vikings": "MIN",
  "Vikes": "MIN",
  "Patriots": "NE",
  "Pats": "NE",
  "Saints": "NO",
  "Giants": "NYG",
  "Jets": "NYJ",
  "Eagles": "PHI",
  "Steelers": "PIT",
  "49ers": "SF",
  "Niners": "SF",
  "Seahawks": "SEA",
  "Buccaneers": "TB",
  "Bucs": "TB",
  "Titans": "TEN",
  "Commanders": "WAS",
};

// MLB Teams
export const MLB_TEAMS: Record<string, string> = {
  // Standard names
  "Arizona Diamondbacks": "ARI",
  "Atlanta Braves": "ATL",
  "Baltimore Orioles": "BAL",
  "Boston Red Sox": "BOS",
  "Chicago Cubs": "CHC",
  "Chicago White Sox": "CWS",
  "Cincinnati Reds": "CIN",
  "Cleveland Guardians": "CLE",
  "Cleveland Indians": "CLE",
  "Colorado Rockies": "COL",
  "Detroit Tigers": "DET",
  "Houston Astros": "HOU",
  "Kansas City Royals": "KC",
  "Los Angeles Angels": "LAA",
  "Los Angeles Dodgers": "LAD",
  "Miami Marlins": "MIA",
  "Milwaukee Brewers": "MIL",
  "Minnesota Twins": "MIN",
  "New York Mets": "NYM",
  "New York Yankees": "NYY",
  "Oakland Athletics": "OAK",
  "Philadelphia Phillies": "PHI",
  "Pittsburgh Pirates": "PIT",
  "San Diego Padres": "SD",
  "San Francisco Giants": "SF",
  "Seattle Mariners": "SEA",
  "St. Louis Cardinals": "STL",
  "Tampa Bay Rays": "TB",
  "Texas Rangers": "TEX",
  "Toronto Blue Jays": "TOR",
  "Washington Nationals": "WSH",
  // Aliases
  "Diamondbacks": "ARI",
  "D-backs": "ARI",
  "Braves": "ATL",
  "Orioles": "BAL",
  "O's": "BAL",
  "Red Sox": "BOS",
  "Sox": "BOS",
  "Cubs": "CHC",
  "White Sox": "CWS",
  "Reds": "CIN",
  "Guardians": "CLE",
  "Indians": "CLE",
  "Rockies": "COL",
  "Tigers": "DET",
  "Astros": "HOU",
  "Royals": "KC",
  "Angels": "LAA",
  "Dodgers": "LAD",
  "Marlins": "MIA",
  "Brewers": "MIL",
  "Twins": "MIN",
  "Mets": "NYM",
  "Yankees": "NYY",
  "Athletics": "OAK",
  "A's": "OAK",
  "Phillies": "PHI",
  "Pirates": "PIT",
  "Padres": "SD",
  "Giants": "SF",
  "Mariners": "SEA",
  "Cardinals": "STL",
  "Cards": "STL",
  "Rays": "TB",
  "Rangers": "TEX",
  "Blue Jays": "TOR",
  "Jays": "TOR",
  "Nationals": "WSH",
  "Nats": "WSH",
};

// NHL Teams
export const NHL_TEAMS: Record<string, string> = {
  // Standard names
  "Anaheim Ducks": "ANA",
  "Arizona Coyotes": "ARI",
  "Utah Hockey Club": "UTA",
  "Boston Bruins": "BOS",
  "Buffalo Sabres": "BUF",
  "Calgary Flames": "CGY",
  "Carolina Hurricanes": "CAR",
  "Chicago Blackhawks": "CHI",
  "Colorado Avalanche": "COL",
  "Columbus Blue Jackets": "CBJ",
  "Dallas Stars": "DAL",
  "Detroit Red Wings": "DET",
  "Edmonton Oilers": "EDM",
  "Florida Panthers": "FLA",
  "Los Angeles Kings": "LAK",
  "Minnesota Wild": "MIN",
  "Montreal Canadiens": "MTL",
  "Nashville Predators": "NSH",
  "New Jersey Devils": "NJD",
  "New York Islanders": "NYI",
  "New York Rangers": "NYR",
  "Ottawa Senators": "OTT",
  "Philadelphia Flyers": "PHI",
  "Pittsburgh Penguins": "PIT",
  "San Jose Sharks": "SJS",
  "Seattle Kraken": "SEA",
  "St. Louis Blues": "STL",
  "Tampa Bay Lightning": "TBL",
  "Toronto Maple Leafs": "TOR",
  "Vancouver Canucks": "VAN",
  "Vegas Golden Knights": "VGK",
  "Washington Capitals": "WSH",
  "Winnipeg Jets": "WPG",
  // Aliases
  "Ducks": "ANA",
  "Coyotes": "ARI",
  "Bruins": "BOS",
  "Sabres": "BUF",
  "Flames": "CGY",
  "Hurricanes": "CAR",
  "Canes": "CAR",
  "Blackhawks": "CHI",
  "Hawks": "CHI",
  "Avalanche": "COL",
  "Avs": "COL",
  "Blue Jackets": "CBJ",
  "Stars": "DAL",
  "Red Wings": "DET",
  "Wings": "DET",
  "Oilers": "EDM",
  "Panthers": "FLA",
  "Kings": "LAK",
  "Wild": "MIN",
  "Canadiens": "MTL",
  "Habs": "MTL",
  "Predators": "NSH",
  "Preds": "NSH",
  "Devils": "NJD",
  "Islanders": "NYI",
  "Isles": "NYI",
  "Rangers": "NYR",
  "Senators": "OTT",
  "Sens": "OTT",
  "Flyers": "PHI",
  "Penguins": "PIT",
  "Pens": "PIT",
  "Sharks": "SJS",
  "Kraken": "SEA",
  "Blues": "STL",
  "Lightning": "TBL",
  "Bolts": "TBL",
  "Maple Leafs": "TOR",
  "Leafs": "TOR",
  "Canucks": "VAN",
  "Nucks": "VAN",
  "Golden Knights": "VGK",
  "Knights": "VGK",
  "Capitals": "WSH",
  "Caps": "WSH",
  "Jets": "WPG",
};

// NCAAF Teams (Major Programs)
export const NCAAF_TEAMS: Record<string, string> = {
  "Alabama Crimson Tide": "ALA",
  "Ohio State Buckeyes": "OSU",
  "Georgia Bulldogs": "UGA",
  "Michigan Wolverines": "MICH",
  "Texas Longhorns": "TEX",
  "Clemson Tigers": "CLEM",
  "USC Trojans": "USC",
  "Notre Dame Fighting Irish": "ND",
  "Oregon Ducks": "ORE",
  "Penn State Nittany Lions": "PSU",
  "Oklahoma Sooners": "OU",
  "Florida State Seminoles": "FSU",
  "LSU Tigers": "LSU",
  "Tennessee Volunteers": "TENN",
  "Miami Hurricanes": "MIA",
  "Florida Gators": "UF",
  "Wisconsin Badgers": "WIS",
  "Auburn Tigers": "AUB",
  "Iowa Hawkeyes": "IOWA",
  "Texas A&M Aggies": "TAMU",
  // Aliases
  "Crimson Tide": "ALA",
  "Alabama": "ALA",
  "Buckeyes": "OSU",
  "Bulldogs": "UGA",
  "Georgia": "UGA",
  "Wolverines": "MICH",
  "Michigan": "MICH",
  "Longhorns": "TEX",
  "Texas": "TEX",
  "Tigers": "CLEM",
  "Clemson": "CLEM",
  "Trojans": "USC",
  "Fighting Irish": "ND",
  "Irish": "ND",
  "Ducks": "ORE",
  "Oregon": "ORE",
  "Nittany Lions": "PSU",
  "Sooners": "OU",
  "Oklahoma": "OU",
  "Seminoles": "FSU",
  "Noles": "FSU",
  "Volunteers": "TENN",
  "Vols": "TENN",
  "Gators": "UF",
  "Florida": "UF",
  "Badgers": "WIS",
  "Hawkeyes": "IOWA",
  "Aggies": "TAMU",
};

// NCAAB Teams (Major Programs)
export const NCAAB_TEAMS: Record<string, string> = {
  "Duke Blue Devils": "DUKE",
  "Kentucky Wildcats": "UK",
  "Kansas Jayhawks": "KU",
  "North Carolina Tar Heels": "UNC",
  "UCLA Bruins": "UCLA",
  "Indiana Hoosiers": "IU",
  "Louisville Cardinals": "LOU",
  "Syracuse Orange": "CUSE",
  "Michigan State Spartans": "MSU",
  "Gonzaga Bulldogs": "GONZ",
  "Villanova Wildcats": "NOVA",
  "Arizona Wildcats": "ARIZ",
  "Connecticut Huskies": "CONN",
  "Purdue Boilermakers": "PUR",
  "Houston Cougars": "HOU",
  // Aliases
  "Blue Devils": "DUKE",
  "Duke": "DUKE",
  "Wildcats": "UK",
  "Kentucky": "UK",
  "Jayhawks": "KU",
  "Kansas": "KU",
  "Tar Heels": "UNC",
  "Heels": "UNC",
  "Bruins": "UCLA",
  "Hoosiers": "IU",
  "Indiana": "IU",
  "Cardinals": "LOU",
  "Orange": "CUSE",
  "Spartans": "MSU",
  "Bulldogs": "GONZ",
  "Gonzaga": "GONZ",
  "Zags": "GONZ",
  "Huskies": "CONN",
  "UConn": "CONN",
  "Boilermakers": "PUR",
  "Purdue": "PUR",
  "Cougars": "HOU",
  "Houston": "HOU",
};

// Soccer Teams (Premier League)
export const SOCCER_TEAMS: Record<string, string> = {
  "Arsenal": "ARS",
  "Aston Villa": "AVL",
  "AFC Bournemouth": "BOU",
  "Bournemouth": "BOU",
  "Brentford": "BRE",
  "Brighton & Hove Albion": "BHA",
  "Brighton": "BHA",
  "Chelsea": "CHE",
  "Crystal Palace": "CRY",
  "Everton": "EVE",
  "Fulham": "FUL",
  "Ipswich Town": "IPS",
  "Ipswich": "IPS",
  "Leicester City": "LEI",
  "Leicester": "LEI",
  "Liverpool": "LIV",
  "Manchester City": "MCI",
  "Man City": "MCI",
  "City": "MCI",
  "Manchester United": "MUN",
  "Man United": "MUN",
  "Man Utd": "MUN",
  "United": "MUN",
  "Newcastle United": "NEW",
  "Newcastle": "NEW",
  "Nottingham Forest": "NFO",
  "Forest": "NFO",
  "Southampton": "SOU",
  "Tottenham Hotspur": "TOT",
  "Tottenham": "TOT",
  "Spurs": "TOT",
  "West Ham United": "WHU",
  "West Ham": "WHU",
  "Wolverhampton Wanderers": "WOL",
  "Wolverhampton": "WOL",
  "Wolves": "WOL",
};

// League-specific lookup tables (partial - only major leagues have full mappings)
const LEAGUE_TABLES: Partial<Record<League, Record<string, string>>> = {
  NBA: NBA_TEAMS,
  NFL: NFL_TEAMS,
  MLB: MLB_TEAMS,
  NHL: NHL_TEAMS,
  NCAAF: NCAAF_TEAMS,
  NCAAB: NCAAB_TEAMS,
  SOCCER: SOCCER_TEAMS,
};

/**
 * Get the standard abbreviation for a team name.
 * 
 * @param teamName - Full or partial team name
 * @param league - The league the team belongs to
 * @returns The standard abbreviation, or a generated one if not found
 * 
 * @example
 * getTeamAbbreviation("Los Angeles Lakers", "NBA") // "LAL"
 * getTeamAbbreviation("Lakers", "NBA") // "LAL"
 * getTeamAbbreviation("Unknown Team", "NBA") // "UNK"
 */
export function getTeamAbbreviation(teamName: string, league: League): string {
  if (!teamName) return "???";
  
  const lookupTable = LEAGUE_TABLES[league];
  if (!lookupTable) {
    return generateAbbreviation(teamName);
  }
  
  // Try exact match first
  if (lookupTable[teamName]) {
    return lookupTable[teamName];
  }
  
  // Try case-insensitive match
  const normalizedName = teamName.trim();
  const lowerName = normalizedName.toLowerCase();
  
  for (const [key, abbr] of Object.entries(lookupTable)) {
    if (key.toLowerCase() === lowerName) {
      return abbr;
    }
  }
  
  // Try partial match (team name contains the key or vice versa)
  for (const [key, abbr] of Object.entries(lookupTable)) {
    if (lowerName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerName)) {
      return abbr;
    }
  }
  
  // Fall back to generated abbreviation
  return generateAbbreviation(teamName);
}

/**
 * Generate an abbreviation from a team name when no mapping exists.
 */
function generateAbbreviation(teamName: string): string {
  const words = teamName.trim().split(/\s+/);
  
  if (words.length === 1) {
    return words[0].substring(0, 3).toUpperCase();
  }
  
  if (words.length === 2) {
    // Take first letter of first word and first 2 of second
    return (words[0][0] + words[1].substring(0, 2)).toUpperCase();
  }
  
  // For 3+ word names, use first letters
  return words.slice(0, 3).map(word => word[0]).join('').toUpperCase();
}

/**
 * Get the full team name from an abbreviation.
 * 
 * @param abbreviation - Team abbreviation (e.g., "LAL")
 * @param league - The league to search in
 * @returns The full team name, or the abbreviation if not found
 */
export function getTeamNameFromAbbreviation(abbreviation: string, league: League): string {
  const lookupTable = LEAGUE_TABLES[league];
  if (!lookupTable) return abbreviation;
  
  const upperAbbr = abbreviation.toUpperCase();
  
  // Find the first entry that matches this abbreviation
  for (const [name, abbr] of Object.entries(lookupTable)) {
    if (abbr === upperAbbr && !name.includes(" ") === false) {
      // Prefer full names (those with spaces)
      if (name.includes(" ")) {
        return name;
      }
    }
  }
  
  // If no full name found, return any match
  for (const [name, abbr] of Object.entries(lookupTable)) {
    if (abbr === upperAbbr) {
      return name;
    }
  }
  
  return abbreviation;
}

/**
 * Check if a team name exists in our lookup table.
 */
export function isKnownTeam(teamName: string, league: League): boolean {
  const lookupTable = LEAGUE_TABLES[league];
  if (!lookupTable) return false;
  
  const lowerName = teamName.toLowerCase();
  return Object.keys(lookupTable).some(key => 
    key.toLowerCase() === lowerName || 
    key.toLowerCase().includes(lowerName) ||
    lowerName.includes(key.toLowerCase())
  );
}

export default {
  getTeamAbbreviation,
  getTeamNameFromAbbreviation,
  isKnownTeam,
  NBA_TEAMS,
  NFL_TEAMS,
  MLB_TEAMS,
  NHL_TEAMS,
  NCAAF_TEAMS,
  NCAAB_TEAMS,
  SOCCER_TEAMS,
};
