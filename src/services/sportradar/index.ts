// Sportradar Services - Main Export
// Re-exports all Sportradar API services for easy consumption

// Core utilities
export {
  isApiKeyConfigured,
  shouldUseMockData,
  getCachedData,
  setCachedData,
  clearCache,
  fetchSportradar,
  buildEdgeFunctionUrl,
  formatDateForApi,
  getSeasonParams
} from './sportradarCore';

// Injuries Service
export {
  fetchLeagueInjuries,
  fetchDailyInjuries,
  getTeamInjuries,
  calculateInjuryImpact,
  fetchAllInjuries
} from './injuriesService';

// Standings Service
export {
  fetchStandings,
  getConferenceStandings,
  getDivisionStandings,
  getTeamStanding,
  getPlayoffPicture,
  getTeamForm,
  fetchAllStandings
} from './standingsService';

// Player Service
export {
  fetchPlayerProfile,
  fetchLeagueLeaders,
  searchPlayers
} from './playerService';

// Team Service
export {
  fetchTeamProfile,
  fetchTeamRoster,
  fetchDepthChart,
  getTeamWithRoster
} from './teamService';

// Game Service
export {
  fetchGameBoxscore,
  fetchGameSummary,
  fetchDailySchedule,
  getMatchIntelligence
} from './gameService';
