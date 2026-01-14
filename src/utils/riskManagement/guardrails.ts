/**
 * Psychological guardrails system for responsible betting
 */

import { UserBet } from '@/types/betting';
import { PsychologicalGuardrail, GuardrailsConfig, DEFAULT_GUARDRAILS_CONFIG } from '@/types/riskManagement';

const LOCKOUT_KEY = 'betting_lockout';
const SESSION_START_KEY = 'betting_session_start';
const LAST_LOSS_KEY = 'last_loss_timestamp';
const GUARDRAILS_CONFIG_KEY = 'guardrails_config';

export interface LockoutState {
  isLocked: boolean;
  reason: string;
  lockedAt: Date | null;
  unlocksAt: Date | null;
  remainingMinutes: number;
}

export function getGuardrailsConfig(): GuardrailsConfig {
  const stored = localStorage.getItem(GUARDRAILS_CONFIG_KEY);
  if (stored) {
    try {
      return { ...DEFAULT_GUARDRAILS_CONFIG, ...JSON.parse(stored) };
    } catch {
      return DEFAULT_GUARDRAILS_CONFIG;
    }
  }
  return DEFAULT_GUARDRAILS_CONFIG;
}

export function saveGuardrailsConfig(config: Partial<GuardrailsConfig>): void {
  const current = getGuardrailsConfig();
  localStorage.setItem(GUARDRAILS_CONFIG_KEY, JSON.stringify({ ...current, ...config }));
}

export function checkLockoutState(): LockoutState {
  const stored = localStorage.getItem(LOCKOUT_KEY);
  if (!stored) {
    return { isLocked: false, reason: '', lockedAt: null, unlocksAt: null, remainingMinutes: 0 };
  }
  
  try {
    const lockout = JSON.parse(stored);
    const unlocksAt = new Date(lockout.unlocksAt);
    const now = new Date();
    
    if (now >= unlocksAt) {
      // Lockout expired
      localStorage.removeItem(LOCKOUT_KEY);
      return { isLocked: false, reason: '', lockedAt: null, unlocksAt: null, remainingMinutes: 0 };
    }
    
    const remainingMs = unlocksAt.getTime() - now.getTime();
    const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));
    
    return {
      isLocked: true,
      reason: lockout.reason,
      lockedAt: new Date(lockout.lockedAt),
      unlocksAt,
      remainingMinutes,
    };
  } catch {
    localStorage.removeItem(LOCKOUT_KEY);
    return { isLocked: false, reason: '', lockedAt: null, unlocksAt: null, remainingMinutes: 0 };
  }
}

export function triggerLockout(reason: string, durationHours: number): void {
  const lockedAt = new Date();
  const unlocksAt = new Date(lockedAt.getTime() + durationHours * 60 * 60 * 1000);
  
  localStorage.setItem(LOCKOUT_KEY, JSON.stringify({
    reason,
    lockedAt: lockedAt.toISOString(),
    unlocksAt: unlocksAt.toISOString(),
  }));
}

export function clearLockout(): void {
  localStorage.removeItem(LOCKOUT_KEY);
}

export function recordLoss(): void {
  localStorage.setItem(LAST_LOSS_KEY, new Date().toISOString());
}

export function checkCoolDownPeriod(): { inCoolDown: boolean; remainingMinutes: number } {
  const config = getGuardrailsConfig();
  const lastLoss = localStorage.getItem(LAST_LOSS_KEY);
  
  if (!lastLoss || config.coolDownAfterLoss === 0) {
    return { inCoolDown: false, remainingMinutes: 0 };
  }
  
  const lastLossTime = new Date(lastLoss);
  const coolDownEnd = new Date(lastLossTime.getTime() + config.coolDownAfterLoss * 60 * 1000);
  const now = new Date();
  
  if (now >= coolDownEnd) {
    return { inCoolDown: false, remainingMinutes: 0 };
  }
  
  const remainingMs = coolDownEnd.getTime() - now.getTime();
  return {
    inCoolDown: true,
    remainingMinutes: Math.ceil(remainingMs / (1000 * 60)),
  };
}

export function startSession(): void {
  if (!localStorage.getItem(SESSION_START_KEY)) {
    localStorage.setItem(SESSION_START_KEY, new Date().toISOString());
  }
}

export function getSessionDuration(): number {
  const start = localStorage.getItem(SESSION_START_KEY);
  if (!start) return 0;
  
  const startTime = new Date(start);
  const now = new Date();
  return Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
}

export function endSession(): void {
  localStorage.removeItem(SESSION_START_KEY);
}

export function evaluateGuardrails(
  bets: UserBet[],
  bankroll: number,
  proposedBetAmount?: number
): PsychologicalGuardrail[] {
  const config = getGuardrailsConfig();
  const guardrails: PsychologicalGuardrail[] = [];
  
  // Get today's bets
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysBets = bets.filter(bet => {
    const betDate = new Date(bet.placed_at || bet.created_at || '');
    betDate.setHours(0, 0, 0, 0);
    return betDate.getTime() === today.getTime();
  });
  
  // Calculate today's losses
  const todaysLosses = todaysBets
    .filter(bet => bet.status === 'lost')
    .reduce((sum, bet) => sum + bet.stake, 0);
  
  // Calculate current loss streak
  const settledBets = bets
    .filter(bet => bet.status === 'won' || bet.status === 'lost')
    .sort((a, b) => new Date(b.settled_at || b.updated_at || '').getTime() - 
                    new Date(a.settled_at || a.updated_at || '').getTime());
  
  let lossStreak = 0;
  for (const bet of settledBets) {
    if (bet.status === 'lost') lossStreak++;
    else break;
  }
  
  // 1. Loss streak lockout
  const lossStreakTriggered = lossStreak >= config.maxLossStreak;
  guardrails.push({
    id: 'loss_streak',
    type: 'loss_streak_lockout',
    enabled: config.enableAutoLockout,
    threshold: config.maxLossStreak,
    action: lossStreakTriggered ? 'lockout' : 'warn',
    lockoutDuration: config.lockoutHours,
    description: `Lock account after ${config.maxLossStreak} consecutive losses`,
    currentValue: lossStreak,
    isTriggered: lossStreakTriggered,
  });
  
  // 2. Max bet limit
  const betPercentage = proposedBetAmount ? (proposedBetAmount / bankroll) * 100 : 0;
  const maxBetTriggered = betPercentage > config.maxSingleBetPercent;
  guardrails.push({
    id: 'max_bet',
    type: 'max_bet_limit',
    enabled: config.enableBetSizeWarnings,
    threshold: config.maxSingleBetPercent,
    action: maxBetTriggered ? 'block' : 'warn',
    description: `Never allow a single bet > ${config.maxSingleBetPercent}% of bankroll`,
    currentValue: betPercentage,
    isTriggered: maxBetTriggered,
  });
  
  // 3. Daily loss limit
  const dailyLossTriggered = todaysLosses >= config.dailyLossLimit;
  guardrails.push({
    id: 'daily_loss',
    type: 'daily_loss_limit',
    enabled: true,
    threshold: config.dailyLossLimit,
    action: dailyLossTriggered ? 'block' : 'warn',
    description: `Stop betting after losing $${config.dailyLossLimit} in a day`,
    currentValue: todaysLosses,
    isTriggered: dailyLossTriggered,
  });
  
  // 4. Session time limit
  const sessionMinutes = getSessionDuration();
  const sessionTriggered = sessionMinutes >= config.sessionTimeLimit;
  guardrails.push({
    id: 'session_time',
    type: 'session_time_limit',
    enabled: true,
    threshold: config.sessionTimeLimit,
    action: sessionTriggered ? 'warn' : 'warn',
    description: `Take a break after ${config.sessionTimeLimit / 60} hours of betting`,
    currentValue: sessionMinutes,
    isTriggered: sessionTriggered,
  });
  
  // 5. Cool down period
  const coolDown = checkCoolDownPeriod();
  guardrails.push({
    id: 'cool_down',
    type: 'cool_down_period',
    enabled: config.coolDownAfterLoss > 0,
    threshold: config.coolDownAfterLoss,
    action: coolDown.inCoolDown ? 'block' : 'warn',
    description: `Wait ${config.coolDownAfterLoss} minutes after a loss`,
    currentValue: coolDown.remainingMinutes,
    isTriggered: coolDown.inCoolDown,
  });
  
  return guardrails;
}

export function shouldBlockBet(guardrails: PsychologicalGuardrail[]): {
  blocked: boolean;
  reason: string;
} {
  const blockingGuardrails = guardrails.filter(g => g.enabled && g.isTriggered && g.action === 'block');
  
  if (blockingGuardrails.length === 0) {
    return { blocked: false, reason: '' };
  }
  
  return {
    blocked: true,
    reason: blockingGuardrails.map(g => g.description).join('; '),
  };
}
