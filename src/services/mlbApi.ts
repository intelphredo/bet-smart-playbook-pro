import { League, Match, Team, PlayerStats } from "@/types";

const MLB_API_BASE = "https://statsapi.mlb.com/api/v1";

// Fetch MLB schedules
export const fetchMLBSchedule = async (): Promise<Match[]> => {
  try {
    // Fetch today's games by default
    const endpoint = `${MLB_API_BASE}/schedule?sportId=1&hydrate=team,linescore,probablePitcher,flags,broadcasts(all)`;
    
    console.log(`Fetching data from MLB API: ${endpoint}`);
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch MLB data: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("MLB API Schedule Response:", data);
    
    // Map MLB games to our Match type
    return mapMLBGameToMatch(data);
  } catch (error) {
    console.error("Error fetching MLB schedule data:", error);
    return [];
  }
};

// Fetch MLB team information
export const fetchMLBTeams = async (): Promise<Team[]> => {
  try {
    const endpoint = `${MLB_API_BASE}/teams?sportId=1`;
    
    console.log(`Fetching team data from MLB API: ${endpoint}`);
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch MLB team data: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("MLB API Teams Response:", data);
    
    // Map MLB teams to our Team type
    return mapMLBTeamsResponse(data);
  } catch (error) {
    console.error("Error fetching MLB team data:", error);
    return [];
  }
};

// Fetch MLB player statistics
export const fetchMLBPlayerStats = async (teamId: string): Promise<PlayerStats[]> => {
  try {
    const endpoint = `${MLB_API_BASE}/teams/${teamId}/roster/Active?hydrate=person(stats(type=season))`;
    
    console.log(`Fetching player stats from MLB API: ${endpoint}`);
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch MLB player stats: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("MLB API Player Stats Response:", data);
    
    // Map MLB player stats to our PlayerStats type
    return mapMLBPlayerStats(data);
  } catch (error) {
    console.error("Error fetching MLB player stats data:", error);
    return [];
  }
};

// Fetch MLB standings
export const fetchMLBStandings = async (): Promise<MLBStandingsResponse> => {
  try {
    const endpoint = `${MLB_API_BASE}/standings?leagueId=103,104&season=2024&standingsTypes=regularSeason&hydrate=division,conference,sport,league,team`;
    
    console.log(`Fetching standings from MLB API: ${endpoint}`);
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch MLB standings: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("MLB API Standings Response:", data);
    
    return data;
  } catch (error) {
    console.error("Error fetching MLB standings data:", error);
    throw error;
  }
};

// Fetch live game data / play-by-play
export const fetchMLBLiveData = async (gameId: string): Promise<MLBGameResponse> => {
  try {
    const endpoint = `${MLB_API_BASE}/game/${gameId}/feed/live`;
    
    console.log(`Fetching live data from MLB API: ${endpoint}`);
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch MLB live game data: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("MLB API Live Game Response:", data);
    
    return data;
  } catch (error) {
    console.error("Error fetching MLB live game data:", error);
    throw error;
  }
};
