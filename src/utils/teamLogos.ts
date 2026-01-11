import { League } from "@/types/sports";

// ESPN CDN base URLs for team logos
const ESPN_CDN_BASE = "https://a.espncdn.com/i/teamlogos";

// Team name to abbreviation mappings by league
const NBA_TEAMS: Record<string, string> = {
  "los angeles lakers": "lal",
  "lakers": "lal",
  "golden state warriors": "gs",
  "warriors": "gs",
  "boston celtics": "bos",
  "celtics": "bos",
  "milwaukee bucks": "mil",
  "bucks": "mil",
  "phoenix suns": "phx",
  "suns": "phx",
  "miami heat": "mia",
  "heat": "mia",
  "philadelphia 76ers": "phi",
  "76ers": "phi",
  "denver nuggets": "den",
  "nuggets": "den",
  "cleveland cavaliers": "cle",
  "cavaliers": "cle",
  "memphis grizzlies": "mem",
  "grizzlies": "mem",
  "dallas mavericks": "dal",
  "mavericks": "dal",
  "sacramento kings": "sac",
  "kings": "sac",
  "brooklyn nets": "bkn",
  "nets": "bkn",
  "new york knicks": "ny",
  "knicks": "ny",
  "atlanta hawks": "atl",
  "hawks": "atl",
  "minnesota timberwolves": "min",
  "timberwolves": "min",
  "los angeles clippers": "lac",
  "clippers": "lac",
  "new orleans pelicans": "no",
  "pelicans": "no",
  "toronto raptors": "tor",
  "raptors": "tor",
  "chicago bulls": "chi",
  "bulls": "chi",
  "oklahoma city thunder": "okc",
  "thunder": "okc",
  "utah jazz": "utah",
  "jazz": "utah",
  "portland trail blazers": "por",
  "trail blazers": "por",
  "indiana pacers": "ind",
  "pacers": "ind",
  "washington wizards": "wsh",
  "wizards": "wsh",
  "orlando magic": "orl",
  "magic": "orl",
  "charlotte hornets": "cha",
  "hornets": "cha",
  "san antonio spurs": "sa",
  "spurs": "sa",
  "detroit pistons": "det",
  "pistons": "det",
  "houston rockets": "hou",
  "rockets": "hou",
};

const NFL_TEAMS: Record<string, string> = {
  "kansas city chiefs": "kc",
  "chiefs": "kc",
  "new england patriots": "ne",
  "patriots": "ne",
  "green bay packers": "gb",
  "packers": "gb",
  "seattle seahawks": "sea",
  "seahawks": "sea",
  "san francisco 49ers": "sf",
  "49ers": "sf",
  "dallas cowboys": "dal",
  "cowboys": "dal",
  "philadelphia eagles": "phi",
  "eagles": "phi",
  "buffalo bills": "buf",
  "bills": "buf",
  "baltimore ravens": "bal",
  "ravens": "bal",
  "miami dolphins": "mia",
  "dolphins": "mia",
  "detroit lions": "det",
  "lions": "det",
  "cincinnati bengals": "cin",
  "bengals": "cin",
  "los angeles rams": "lar",
  "rams": "lar",
  "los angeles chargers": "lac",
  "chargers": "lac",
  "las vegas raiders": "lv",
  "raiders": "lv",
  "minnesota vikings": "min",
  "vikings": "min",
  "cleveland browns": "cle",
  "browns": "cle",
  "pittsburgh steelers": "pit",
  "steelers": "pit",
  "jacksonville jaguars": "jax",
  "jaguars": "jax",
  "atlanta falcons": "atl",
  "falcons": "atl",
  "chicago bears": "chi",
  "bears": "chi",
  "denver broncos": "den",
  "broncos": "den",
  "houston texans": "hou",
  "texans": "hou",
  "indianapolis colts": "ind",
  "colts": "ind",
  "new orleans saints": "no",
  "saints": "no",
  "new york giants": "nyg",
  "giants": "nyg",
  "new york jets": "nyj",
  "jets": "nyj",
  "tampa bay buccaneers": "tb",
  "buccaneers": "tb",
  "arizona cardinals": "ari",
  "cardinals": "ari",
  "carolina panthers": "car",
  "panthers": "car",
  "tennessee titans": "ten",
  "titans": "ten",
  "washington commanders": "wsh",
  "commanders": "wsh",
};

const MLB_TEAMS: Record<string, string> = {
  "los angeles dodgers": "lad",
  "dodgers": "lad",
  "san francisco giants": "sf",
  "giants": "sf",
  "new york yankees": "nyy",
  "yankees": "nyy",
  "boston red sox": "bos",
  "red sox": "bos",
  "houston astros": "hou",
  "astros": "hou",
  "atlanta braves": "atl",
  "braves": "atl",
  "philadelphia phillies": "phi",
  "phillies": "phi",
  "san diego padres": "sd",
  "padres": "sd",
  "texas rangers": "tex",
  "rangers": "tex",
  "seattle mariners": "sea",
  "mariners": "sea",
  "new york mets": "nym",
  "mets": "nym",
  "chicago cubs": "chc",
  "cubs": "chc",
  "chicago white sox": "chw",
  "white sox": "chw",
  "cleveland guardians": "cle",
  "guardians": "cle",
  "detroit tigers": "det",
  "tigers": "det",
  "minnesota twins": "min",
  "twins": "min",
  "tampa bay rays": "tb",
  "rays": "tb",
  "toronto blue jays": "tor",
  "blue jays": "tor",
  "baltimore orioles": "bal",
  "orioles": "bal",
  "kansas city royals": "kc",
  "royals": "kc",
  "los angeles angels": "laa",
  "angels": "laa",
  "oakland athletics": "oak",
  "athletics": "oak",
  "cincinnati reds": "cin",
  "reds": "cin",
  "milwaukee brewers": "mil",
  "brewers": "mil",
  "st. louis cardinals": "stl",
  "cardinals": "stl",
  "pittsburgh pirates": "pit",
  "pirates": "pit",
  "arizona diamondbacks": "ari",
  "diamondbacks": "ari",
  "colorado rockies": "col",
  "rockies": "col",
  "miami marlins": "mia",
  "marlins": "mia",
  "washington nationals": "wsh",
  "nationals": "wsh",
};

const NHL_TEAMS: Record<string, string> = {
  "boston bruins": "bos",
  "bruins": "bos",
  "toronto maple leafs": "tor",
  "maple leafs": "tor",
  "montreal canadiens": "mtl",
  "canadiens": "mtl",
  "tampa bay lightning": "tb",
  "lightning": "tb",
  "florida panthers": "fla",
  "panthers": "fla",
  "carolina hurricanes": "car",
  "hurricanes": "car",
  "new york rangers": "nyr",
  "rangers": "nyr",
  "new jersey devils": "njd",
  "devils": "njd",
  "pittsburgh penguins": "pit",
  "penguins": "pit",
  "detroit red wings": "det",
  "red wings": "det",
  "colorado avalanche": "col",
  "avalanche": "col",
  "dallas stars": "dal",
  "stars": "dal",
  "vegas golden knights": "vgk",
  "golden knights": "vgk",
  "edmonton oilers": "edm",
  "oilers": "edm",
  "winnipeg jets": "wpg",
  "jets": "wpg",
  "minnesota wild": "min",
  "wild": "min",
  "st. louis blues": "stl",
  "blues": "stl",
  "nashville predators": "nsh",
  "predators": "nsh",
  "chicago blackhawks": "chi",
  "blackhawks": "chi",
  "los angeles kings": "la",
  "kings": "la",
  "san jose sharks": "sj",
  "sharks": "sj",
  "anaheim ducks": "ana",
  "ducks": "ana",
  "seattle kraken": "sea",
  "kraken": "sea",
  "vancouver canucks": "van",
  "canucks": "van",
  "calgary flames": "cgy",
  "flames": "cgy",
  "ottawa senators": "ott",
  "senators": "ott",
  "philadelphia flyers": "phi",
  "flyers": "phi",
  "buffalo sabres": "buf",
  "sabres": "buf",
  "new york islanders": "nyi",
  "islanders": "nyi",
  "washington capitals": "wsh",
  "capitals": "wsh",
  "columbus blue jackets": "cbj",
  "blue jackets": "cbj",
  "arizona coyotes": "ari",
  "coyotes": "ari",
};

// Soccer team IDs for ESPN CDN
const SOCCER_TEAMS: Record<string, string> = {
  "manchester united": "360",
  "manchester city": "382",
  "liverpool": "364",
  "chelsea": "363",
  "arsenal": "359",
  "tottenham hotspur": "367",
  "tottenham": "367",
  "newcastle united": "361",
  "newcastle": "361",
  "west ham united": "371",
  "west ham": "371",
  "aston villa": "362",
  "brighton": "331",
  "brighton & hove albion": "331",
  "everton": "368",
  "nottingham forest": "393",
  "fulham": "370",
  "crystal palace": "384",
  "wolverhampton wanderers": "380",
  "wolves": "380",
  "bournemouth": "349",
  "brentford": "337",
  "leicester city": "375",
  "leicester": "375",
  "ipswich town": "373",
  "ipswich": "373",
  "southampton": "376",
  "luton town": "399",
  "sheffield united": "398",
  "burnley": "379",
  // La Liga
  "real madrid": "86",
  "barcelona": "83",
  "atletico madrid": "1068",
  // Serie A
  "juventus": "111",
  "inter milan": "110",
  "ac milan": "103",
  // Bundesliga
  "bayern munich": "132",
  "borussia dortmund": "124",
  // Ligue 1
  "paris saint-germain": "160",
  "psg": "160",
};

// Real sportsbook logos
export const SPORTSBOOK_LOGOS: Record<string, string> = {
  draftkings: "https://img.sportsbookreview.com/uploads/d7af8eb4-c42a-49bc-84fd-6ee7ba3c216e.png",
  fanduel: "https://img.sportsbookreview.com/uploads/75fe5bfb-5f53-47fa-876d-2b2dc02ac925.png",
  betmgm: "https://img.sportsbookreview.com/uploads/e395bccd-8b86-4b9b-9a69-71c3f69bab6a.png",
  caesars: "https://img.sportsbookreview.com/uploads/2d97abcc-f1f5-4b13-b06c-a58c1fbfc3dc.png",
  pointsbet: "https://img.sportsbookreview.com/uploads/42b78d53-5db5-431e-9f86-48b314a50ed7.png",
  betrivers: "https://img.sportsbookreview.com/uploads/f477c99d-4019-4e2e-8c44-c20c00c127af.png",
  espnbet: "https://a.espncdn.com/i/espn/teamlogos/lrg/trans/espn_dotcom_black.gif",
  williamhill: "https://img.sportsbookreview.com/uploads/0e1e4c3e-b3dc-40ae-9e23-7faa34ae3e13.png",
  bet365: "https://img.sportsbookreview.com/uploads/a0d3e3a2-9ee0-4aba-9cd3-5d13fd2d7e3a.png",
  unibet: "https://img.sportsbookreview.com/uploads/0f9c7e9d-3c95-491b-b12e-3c0c0ebfb1e7.png",
  pinnacle: "https://img.sportsbookreview.com/uploads/a0d0ab9a-c1e3-4c75-a469-8ce2d1a5a0e3.png",
  bovada: "https://img.sportsbookreview.com/uploads/bovada-logo.png",
  // Fallback generic sportsbook icon
  default: "https://a.espncdn.com/i/espn/teamlogos/lrg/trans/espn_dotcom_black.gif",
};

/**
 * Get the abbreviation for a team name
 */
export function getTeamAbbreviation(teamName: string, league?: League): string {
  const normalizedName = teamName.toLowerCase().trim();
  
  // Check league-specific mappings
  if (league === "NBA" && NBA_TEAMS[normalizedName]) {
    return NBA_TEAMS[normalizedName];
  }
  if (league === "NFL" && NFL_TEAMS[normalizedName]) {
    return NFL_TEAMS[normalizedName];
  }
  if (league === "MLB" && MLB_TEAMS[normalizedName]) {
    return MLB_TEAMS[normalizedName];
  }
  if (league === "NHL" && NHL_TEAMS[normalizedName]) {
    return NHL_TEAMS[normalizedName];
  }
  if (league === "SOCCER" && SOCCER_TEAMS[normalizedName]) {
    return SOCCER_TEAMS[normalizedName];
  }
  
  // Try all leagues if no specific league
  if (NBA_TEAMS[normalizedName]) return NBA_TEAMS[normalizedName];
  if (NFL_TEAMS[normalizedName]) return NFL_TEAMS[normalizedName];
  if (MLB_TEAMS[normalizedName]) return MLB_TEAMS[normalizedName];
  if (NHL_TEAMS[normalizedName]) return NHL_TEAMS[normalizedName];
  if (SOCCER_TEAMS[normalizedName]) return SOCCER_TEAMS[normalizedName];
  
  // Fallback: generate abbreviation from name
  const words = teamName.split(' ');
  if (words.length === 1) {
    return teamName.substring(0, 3).toLowerCase();
  }
  if (words.length === 2) {
    return (words[0][0] + words[1].substring(0, 2)).toLowerCase();
  }
  return words.slice(0, 3).map(word => word[0]).join('').toLowerCase();
}

/**
 * Get team logo URL from ESPN CDN
 */
export function getTeamLogoUrl(teamName: string, league: League): string {
  const abbr = getTeamAbbreviation(teamName, league);
  
  switch (league) {
    case "NBA":
      return `${ESPN_CDN_BASE}/nba/500/${abbr}.png`;
    case "NFL":
      return `${ESPN_CDN_BASE}/nfl/500/${abbr}.png`;
    case "MLB":
      return `${ESPN_CDN_BASE}/mlb/500/${abbr}.png`;
    case "NHL":
      return `${ESPN_CDN_BASE}/nhl/500/${abbr}.png`;
    case "SOCCER":
      // For soccer, the ID is used directly
      const soccerId = SOCCER_TEAMS[teamName.toLowerCase()];
      if (soccerId) {
        return `${ESPN_CDN_BASE}/soccer/500/${soccerId}.png`;
      }
      // Fallback for unknown soccer teams
      return `${ESPN_CDN_BASE}/soccer/500/default-team-logo.png`;
    case "NCAAF":
    case "NCAAB":
      return `${ESPN_CDN_BASE}/ncaa/500/${abbr}.png`;
    default:
      return `${ESPN_CDN_BASE}/nba/500/${abbr}.png`;
  }
}

/**
 * Get sportsbook logo URL
 */
export function getSportsbookLogo(sportsbookKey: string): string {
  const normalizedKey = sportsbookKey.toLowerCase().replace(/[\s_-]/g, '');
  
  // Check for common variations
  if (normalizedKey.includes('draftkings')) return SPORTSBOOK_LOGOS.draftkings;
  if (normalizedKey.includes('fanduel')) return SPORTSBOOK_LOGOS.fanduel;
  if (normalizedKey.includes('betmgm')) return SPORTSBOOK_LOGOS.betmgm;
  if (normalizedKey.includes('caesars')) return SPORTSBOOK_LOGOS.caesars;
  if (normalizedKey.includes('pointsbet')) return SPORTSBOOK_LOGOS.pointsbet;
  if (normalizedKey.includes('betrivers')) return SPORTSBOOK_LOGOS.betrivers;
  if (normalizedKey.includes('espn')) return SPORTSBOOK_LOGOS.espnbet;
  if (normalizedKey.includes('williamhill')) return SPORTSBOOK_LOGOS.williamhill;
  if (normalizedKey.includes('bet365')) return SPORTSBOOK_LOGOS.bet365;
  if (normalizedKey.includes('unibet')) return SPORTSBOOK_LOGOS.unibet;
  if (normalizedKey.includes('pinnacle')) return SPORTSBOOK_LOGOS.pinnacle;
  if (normalizedKey.includes('bovada')) return SPORTSBOOK_LOGOS.bovada;
  
  // Check direct key match
  if (SPORTSBOOK_LOGOS[normalizedKey]) {
    return SPORTSBOOK_LOGOS[normalizedKey];
  }
  
  return SPORTSBOOK_LOGOS.default;
}

/**
 * Generate initials fallback for team logos
 */
export function getTeamInitials(teamName: string): string {
  const words = teamName.split(' ').filter(w => w.length > 0);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
}
