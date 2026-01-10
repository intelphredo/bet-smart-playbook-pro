
import { Match } from "@/types/sports";
import { SocialSignal, MatchSocialIntelligence, SocialImpactFactor, TeamIntelligence } from "@/types/socialIntelligence";
import { MOCK_SOCIAL_SIGNALS, MOCK_TEAM_INTELLIGENCE } from "@/data/socialIntelligenceData";

interface SocialImpactResult {
  score: number;
  factors: SocialImpactFactor[];
  signals: SocialSignal[];
  recommendation: string;
  edgeDirection: 'home' | 'away' | 'neutral';
  confidenceAdjustment: number;
}

export function calculateSocialImpact(match: Match): SocialImpactResult {
  // Get team intelligence (mock data for now)
  const homeTeamId = match.homeTeam?.shortName || match.homeTeam?.name?.substring(0, 3).toUpperCase();
  const awayTeamId = match.awayTeam?.shortName || match.awayTeam?.name?.substring(0, 3).toUpperCase();
  
  const homeTeam = MOCK_TEAM_INTELLIGENCE.find(t => 
    t.teamId === homeTeamId || t.teamName.toLowerCase().includes(match.homeTeam?.name?.toLowerCase() || '')
  );
  const awayTeam = MOCK_TEAM_INTELLIGENCE.find(t => 
    t.teamId === awayTeamId || t.teamName.toLowerCase().includes(match.awayTeam?.name?.toLowerCase() || '')
  );
  
  const factors: SocialImpactFactor[] = [];
  const signals: SocialSignal[] = [];
  let homeScore = 50;
  let awayScore = 50;
  
  // Analyze home team factors
  if (homeTeam) {
    const homeMoraleImpact = (homeTeam.lockerRoomMorale - 50) / 5;
    homeScore += homeMoraleImpact;
    factors.push({
      name: 'Locker Room Morale',
      icon: 'Users',
      impact: homeMoraleImpact,
      description: homeTeam.lockerRoomMorale > 70 ? 'Team chemistry is excellent' : 
                   homeTeam.lockerRoomMorale < 40 ? 'Internal tensions reported' : 'Normal team dynamics',
      affectedTeam: 'home'
    });
    
    const homeInjuryImpact = -homeTeam.injuryImpact / 10;
    homeScore += homeInjuryImpact;
    factors.push({
      name: 'Injury Impact',
      icon: 'Heart',
      impact: homeInjuryImpact,
      description: homeTeam.injuryImpact > 50 ? 'Key players out' : 
                   homeTeam.injuryImpact > 20 ? 'Minor injuries' : 'Healthy roster',
      affectedTeam: 'home'
    });
    
    const homeFatigueImpact = -homeTeam.travelFatigue / 10;
    homeScore += homeFatigueImpact;
    factors.push({
      name: 'Travel Fatigue',
      icon: 'Plane',
      impact: homeFatigueImpact,
      description: homeTeam.travelFatigue > 60 ? 'Exhausting travel schedule' :
                   homeTeam.travelFatigue > 30 ? 'Moderate travel' : 'Well rested',
      affectedTeam: 'home'
    });
    
    const homeMotivationImpact = (homeTeam.motivationLevel - 50) / 5;
    homeScore += homeMotivationImpact;
    factors.push({
      name: 'Motivation Level',
      icon: 'Flame',
      impact: homeMotivationImpact,
      description: homeTeam.motivationLevel > 80 ? 'Highly motivated' :
                   homeTeam.motivationLevel < 40 ? 'Lacking urgency' : 'Normal motivation',
      affectedTeam: 'home'
    });
    
    signals.push(...homeTeam.signals);
  }
  
  // Analyze away team factors
  if (awayTeam) {
    const awayMoraleImpact = (awayTeam.lockerRoomMorale - 50) / 5;
    awayScore += awayMoraleImpact;
    factors.push({
      name: 'Locker Room Morale',
      icon: 'Users',
      impact: awayMoraleImpact,
      description: awayTeam.lockerRoomMorale > 70 ? 'Team chemistry is excellent' :
                   awayTeam.lockerRoomMorale < 40 ? 'Internal tensions reported' : 'Normal team dynamics',
      affectedTeam: 'away'
    });
    
    const awayInjuryImpact = -awayTeam.injuryImpact / 10;
    awayScore += awayInjuryImpact;
    factors.push({
      name: 'Injury Impact',
      icon: 'Heart',
      impact: awayInjuryImpact,
      description: awayTeam.injuryImpact > 50 ? 'Key players out' :
                   awayTeam.injuryImpact > 20 ? 'Minor injuries' : 'Healthy roster',
      affectedTeam: 'away'
    });
    
    const awayFatigueImpact = -awayTeam.travelFatigue / 10;
    awayScore += awayFatigueImpact;
    factors.push({
      name: 'Travel Fatigue',
      icon: 'Plane',
      impact: awayFatigueImpact,
      description: awayTeam.travelFatigue > 60 ? 'Exhausting travel schedule' :
                   awayTeam.travelFatigue > 30 ? 'Moderate travel' : 'Well rested',
      affectedTeam: 'away'
    });
    
    const awayMotivationImpact = (awayTeam.motivationLevel - 50) / 5;
    awayScore += awayMotivationImpact;
    factors.push({
      name: 'Motivation Level',
      icon: 'Flame',
      impact: awayMotivationImpact,
      description: awayTeam.motivationLevel > 80 ? 'Highly motivated' :
                   awayTeam.motivationLevel < 40 ? 'Lacking urgency' : 'Normal motivation',
      affectedTeam: 'away'
    });
    
    signals.push(...awayTeam.signals);
  }
  
  // Check for additional signals
  const relevantSignals = MOCK_SOCIAL_SIGNALS.filter(s => 
    s.teamId === homeTeamId || s.teamId === awayTeamId
  );
  
  relevantSignals.forEach(signal => {
    if (signal.teamId === homeTeamId) {
      homeScore += signal.impactOnBetting;
    } else {
      awayScore += signal.impactOnBetting;
    }
    if (!signals.find(s => s.id === signal.id)) {
      signals.push(signal);
    }
  });
  
  // Calculate overall score and edge
  const scoreDiff = homeScore - awayScore;
  const normalizedScore = Math.min(100, Math.max(0, 50 + scoreDiff));
  
  const edgeDirection: 'home' | 'away' | 'neutral' = 
    scoreDiff > 10 ? 'home' : scoreDiff < -10 ? 'away' : 'neutral';
  
  const confidenceAdjustment = Math.min(15, Math.max(-15, scoreDiff / 3));
  
  // Generate recommendation
  let recommendation = '';
  if (edgeDirection === 'home') {
    recommendation = `Social factors favor ${match.homeTeam?.name || 'home team'}. `;
    recommendation += factors.filter(f => f.affectedTeam === 'home' && f.impact > 0)
      .map(f => f.description).slice(0, 2).join('. ');
  } else if (edgeDirection === 'away') {
    recommendation = `Social factors favor ${match.awayTeam?.name || 'away team'}. `;
    recommendation += factors.filter(f => f.affectedTeam === 'away' && f.impact > 0)
      .map(f => f.description).slice(0, 2).join('. ');
  } else {
    recommendation = 'Social factors are neutral for this matchup.';
  }
  
  return {
    score: Math.round(normalizedScore),
    factors,
    signals: signals.slice(0, 5), // Top 5 signals
    recommendation,
    edgeDirection,
    confidenceAdjustment: Math.round(confidenceAdjustment)
  };
}

export function getMatchSocialIntelligence(match: Match): MatchSocialIntelligence | null {
  const socialImpact = calculateSocialImpact(match);
  
  const homeTeamId = match.homeTeam?.shortName || '';
  const awayTeamId = match.awayTeam?.shortName || '';
  
  const homeTeam = MOCK_TEAM_INTELLIGENCE.find(t => t.teamId === homeTeamId);
  const awayTeam = MOCK_TEAM_INTELLIGENCE.find(t => t.teamId === awayTeamId);
  
  if (!homeTeam && !awayTeam) return null;
  
  return {
    matchId: match.id,
    homeTeam: homeTeam || createDefaultTeamIntelligence(match.homeTeam?.name || 'Home Team', homeTeamId),
    awayTeam: awayTeam || createDefaultTeamIntelligence(match.awayTeam?.name || 'Away Team', awayTeamId),
    keySignals: socialImpact.signals,
    socialScore: socialImpact.score,
    edgeDirection: socialImpact.edgeDirection,
    confidenceBoost: socialImpact.confidenceAdjustment,
    summary: socialImpact.recommendation
  };
}

function createDefaultTeamIntelligence(teamName: string, teamId: string): TeamIntelligence {
  return {
    teamId,
    teamName,
    league: 'Unknown',
    lockerRoomMorale: 50,
    injuryImpact: 20,
    travelFatigue: 30,
    motivationLevel: 60,
    restDays: 2,
    signals: [],
    keyPlayers: [],
    recentHeadlines: [],
    narratives: []
  };
}
