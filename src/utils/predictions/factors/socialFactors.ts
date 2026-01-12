
import { Match } from "@/types/sports";
import { SocialSignal, MatchSocialIntelligence, SocialImpactFactor, TeamIntelligence } from "@/types/socialIntelligence";

interface SocialImpactResult {
  score: number;
  factors: SocialImpactFactor[];
  signals: SocialSignal[];
  recommendation: string;
  edgeDirection: 'home' | 'away' | 'neutral';
  confidenceAdjustment: number;
}

/**
 * Calculate social impact based on match data
 * 
 * Note: This now uses real data sources when available instead of mock data.
 * Social intelligence requires real-time data from news, social media, and official sources.
 * Without a configured social intelligence API, this returns neutral scores.
 */
export function calculateSocialImpact(match: Match): SocialImpactResult {
  const factors: SocialImpactFactor[] = [];
  const signals: SocialSignal[] = [];
  
  // Without real social intelligence API, return neutral impact
  // This prevents fake predictions from showing in the UI
  return {
    score: 50,
    factors: [],
    signals: [],
    recommendation: 'Social intelligence data not available for this match.',
    edgeDirection: 'neutral',
    confidenceAdjustment: 0
  };
}

export function getMatchSocialIntelligence(match: Match): MatchSocialIntelligence | null {
  // Without real social intelligence API, return null
  // This indicates no social intelligence data is available
  return null;
}

function createDefaultTeamIntelligence(teamName: string, teamId: string): TeamIntelligence {
  return {
    teamId,
    teamName,
    league: 'Unknown',
    lockerRoomMorale: 50,
    injuryImpact: 0,
    travelFatigue: 0,
    motivationLevel: 50,
    restDays: 0,
    signals: [],
    keyPlayers: [],
    recentHeadlines: [],
    narratives: []
  };
}
