// Intelligent Notification Engine
// Generates 5 types of smart alerts based on real-time data analysis
// 1. Steam Move Alert - rapid line movement
// 2. Sharp Money Alert - professional money detection
// 3. AI Confidence Alert - model confidence threshold crossing
// 4. Value Drop Alert - SmartScore + odds value convergence
// 5. Daily Briefing - summary of high-value opportunities

import { Match } from '@/types/sports';
import { supabase } from '@/integrations/supabase/client';
import { NotificationPreferences } from '@/types/preferences';

export interface IntelligentAlert {
  id: string;
  type: 'steam_move' | 'sharp_money' | 'ai_confidence' | 'value_drop' | 'daily_briefing';
  title: string;
  message: string;
  matchId?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  data?: Record<string, any>;
  timestamp: Date;
}

// ─── Steam Move Detection ───────────────────────────────────────────
export function detectSteamMoves(
  currentMatches: Match[],
  previousOdds: Map<string, { homeWin: number; awayWin: number; timestamp: number }>
): IntelligentAlert[] {
  const alerts: IntelligentAlert[] = [];
  const now = Date.now();
  const FIVE_MINUTES = 5 * 60 * 1000;

  currentMatches.forEach(match => {
    const prev = previousOdds.get(match.id);
    if (!prev || now - prev.timestamp > FIVE_MINUTES) return;

    const currentHome = match.odds?.homeWin || 0;
    const movementHome = Math.abs(currentHome - prev.homeWin);

    // Detect 30+ point moneyline swing (equivalent to ~2 point spread move)
    if (movementHome >= 30 && prev.homeWin !== 0) {
      const direction = currentHome > prev.homeWin ? 'toward' : 'away from';
      const teamName = match.homeTeam.shortName || match.homeTeam.name;
      alerts.push({
        id: `steam-${match.id}-${now}`,
        type: 'steam_move',
        title: `⚡ Steam Move: ${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`,
        message: `Line moved ${movementHome.toFixed(0)} points in last 5 min ${direction} ${teamName} (${prev.homeWin > 0 ? '+' : ''}${Math.round(prev.homeWin)} → ${currentHome > 0 ? '+' : ''}${Math.round(currentHome)}).`,
        matchId: match.id,
        priority: movementHome >= 50 ? 'critical' : 'high',
        data: { previousOdds: prev.homeWin, currentOdds: currentHome, movement: movementHome },
        timestamp: new Date(),
      });
    }
  });

  return alerts;
}

// ─── Sharp Money Detection ──────────────────────────────────────────
export function detectSharpMoney(matches: Match[]): IntelligentAlert[] {
  const alerts: IntelligentAlert[] = [];

  matches.forEach(match => {
    // Use smartScore factors as proxy for sharp money detection
    const confidence = match.prediction?.confidence || 0;
    const evPct = match.prediction?.evPercentage || 0;
    const smartScore = match.smartScore?.overall || 0;

    // High EV + high confidence but odds still favorable = sharp money indicator
    if (evPct >= 8 && confidence >= 65 && smartScore >= 70) {
      const sharpSide = match.prediction?.recommended === 'home'
        ? match.homeTeam.shortName || match.homeTeam.name
        : match.awayTeam.shortName || match.awayTeam.name;

      alerts.push({
        id: `sharp-${match.id}-${Date.now()}`,
        type: 'sharp_money',
        title: `🧠 Sharp Money: ${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`,
        message: `Sharp indicators favor ${sharpSide} — +${evPct.toFixed(1)}% EV, ${confidence.toFixed(0)}% confidence, SmartScore ${smartScore.toFixed(0)}. ${match.league}`,
        matchId: match.id,
        priority: evPct >= 12 ? 'critical' : 'high',
        data: { evPct, confidence, smartScore, sharpSide },
        timestamp: new Date(),
      });
    }
  });

  return alerts;
}

// ─── AI Confidence Threshold Crossing ───────────────────────────────
export function detectAIConfidenceCrossings(
  matches: Match[],
  previousConfidence: Map<string, number>,
  threshold: number = 80
): IntelligentAlert[] {
  const alerts: IntelligentAlert[] = [];

  matches.forEach(match => {
    const confidence = match.prediction?.confidence || 0;
    const prevConfidence = previousConfidence.get(match.id) || 0;

    // Crossed above threshold
    if (confidence >= threshold && prevConfidence < threshold && prevConfidence > 0) {
      const team = match.prediction?.recommended === 'home'
        ? match.homeTeam.shortName || match.homeTeam.name
        : match.awayTeam.shortName || match.awayTeam.name;

      alerts.push({
        id: `aiconf-${match.id}-${Date.now()}`,
        type: 'ai_confidence',
        title: `🎯 AI Confidence: ${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`,
        message: `Model confidence just crossed ${threshold}% on ${team} (${prevConfidence.toFixed(0)}% → ${confidence.toFixed(0)}%). ${match.league}`,
        matchId: match.id,
        priority: confidence >= 85 ? 'critical' : 'high',
        data: { confidence, prevConfidence, team, league: match.league },
        timestamp: new Date(),
      });
    }
  });

  return alerts;
}

// ─── Value Drop Detection ───────────────────────────────────────────
export function detectValueDrops(matches: Match[]): IntelligentAlert[] {
  const alerts: IntelligentAlert[] = [];

  matches.forEach(match => {
    const smartScore = match.smartScore?.overall || 0;
    const homeOdds = match.odds?.homeWin || 0;
    const awayOdds = match.odds?.awayWin || 0;

    // SmartScore 70+ with favorable odds (around -110 or better)
    if (smartScore >= 70) {
      const bestOdds = Math.max(homeOdds, awayOdds);
      const favorableSide = homeOdds > awayOdds
        ? match.homeTeam.shortName || match.homeTeam.name
        : match.awayTeam.shortName || match.awayTeam.name;

      if (bestOdds >= -115) {
        alerts.push({
          id: `value-${match.id}-${Date.now()}`,
          type: 'value_drop',
          title: `💰 Value Alert: ${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`,
          message: `SmartScore ${smartScore.toFixed(0)}+ game: ${favorableSide} now at ${bestOdds > 0 ? '+' : ''}${Math.round(bestOdds)} odds. ${match.league}`,
          matchId: match.id,
          priority: smartScore >= 80 ? 'critical' : 'high',
          data: { smartScore, odds: bestOdds, team: favorableSide },
          timestamp: new Date(),
        });
      }
    }
  });

  return alerts;
}

// ─── Daily Briefing Generator ───────────────────────────────────────
export function generateDailyBriefing(matches: Match[]): IntelligentAlert | null {
  const highValue = matches.filter(m => {
    const smartScore = m.smartScore?.overall || 0;
    const confidence = m.prediction?.confidence || 0;
    return smartScore >= 65 || confidence >= 70;
  });

  if (highValue.length === 0) return null;

  const topPicks = highValue
    .sort((a, b) => (b.smartScore?.overall || 0) - (a.smartScore?.overall || 0))
    .slice(0, 5);

  const summaryLines = topPicks.map(m => {
    const team = m.prediction?.recommended === 'home'
      ? m.homeTeam.shortName || m.homeTeam.name
      : m.awayTeam.shortName || m.awayTeam.name;
    const score = m.smartScore?.overall || 0;
    return `${team} (Score: ${score.toFixed(0)})`;
  });

  return {
    id: `briefing-${Date.now()}`,
    type: 'daily_briefing',
    title: `📊 Daily Briefing: ${highValue.length} high-value opportunities`,
    message: `Top picks: ${summaryLines.join(', ')}. ${highValue.length > 5 ? `+${highValue.length - 5} more.` : ''}`,
    priority: highValue.length >= 5 ? 'high' : 'medium',
    data: { count: highValue.length, topPicks: summaryLines },
    timestamp: new Date(),
  };
}

// ─── Save alert to database ─────────────────────────────────────────
export async function saveIntelligentAlert(
  alert: IntelligentAlert,
  userId: string
): Promise<void> {
  try {
    await supabase.from('user_alerts').insert({
      user_id: userId,
      type: alert.type,
      title: alert.title,
      message: alert.message,
      match_id: alert.matchId || null,
      metadata: {
        priority: alert.priority,
        alertData: alert.data,
      },
      is_read: false,
    });
  } catch (err) {
    console.error('Error saving intelligent alert:', err);
  }
}

// ─── Filter alerts based on user preferences ────────────────────────
export function filterAlertsByPreferences(
  alerts: IntelligentAlert[],
  prefs: NotificationPreferences
): IntelligentAlert[] {
  return alerts.filter(alert => {
    switch (alert.type) {
      case 'steam_move': return prefs.steam_moves;
      case 'sharp_money': return prefs.sharp_money;
      case 'ai_confidence': return prefs.ai_confidence;
      case 'value_drop': return prefs.value_drops;
      case 'daily_briefing': return prefs.daily_briefing;
      default: return true;
    }
  });
}
