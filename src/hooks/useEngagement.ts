import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// ── Achievement definitions ──────────────────────────────────────────
export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
  xpReward: number;
  condition: (stats: EngagementStats) => boolean;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  xpReward: number;
  completed: boolean;
}

export interface EngagementStats {
  predictions_viewed: number;
  sharp_signals_found: number;
  value_bets_found: number;
  bets_placed: number;
  wins: number;
  losses: number;
  pages_visited: number;
  ai_picks_followed: number;
  leagues_explored: number;
  days_active: number;
}

export interface EngagementData {
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  achievements: UnlockedAchievement[];
  dailyChallenges: DailyChallenge[];
  dailyChallengesDate: string | null;
  stats: EngagementStats;
}

const DEFAULT_STATS: EngagementStats = {
  predictions_viewed: 0,
  sharp_signals_found: 0,
  value_bets_found: 0,
  bets_placed: 0,
  wins: 0,
  losses: 0,
  pages_visited: 0,
  ai_picks_followed: 0,
  leagues_explored: 0,
  days_active: 0,
};

// XP needed per level: level * 100
export const xpForLevel = (level: number) => level * 100;
export const xpProgress = (xp: number, level: number) => {
  const needed = xpForLevel(level);
  const prevTotal = Array.from({ length: level - 1 }, (_, i) => xpForLevel(i + 1)).reduce((a, b) => a + b, 0);
  const currentXp = xp - prevTotal;
  return { current: Math.max(0, currentXp), needed, percent: Math.min(100, (currentXp / needed) * 100) };
};

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_login', name: 'Welcome Aboard', description: 'Start your journey', icon: '🎯', xpReward: 10, condition: (s) => s.days_active >= 1 },
  { id: 'streak_3', name: 'Consistent', description: '3-day login streak', icon: '🔥', xpReward: 50, condition: (s) => s.days_active >= 3 },
  { id: 'streak_7', name: 'On Fire', description: '7-day login streak', icon: '💥', xpReward: 150, condition: (s) => s.days_active >= 7 },
  { id: 'streak_30', name: 'Dedicated', description: '30-day login streak', icon: '⭐', xpReward: 500, condition: (s) => s.days_active >= 30 },
  { id: 'sharp_spotter', name: 'Sharp Spotter', description: 'Find 10 sharp money signals', icon: '🦅', xpReward: 100, condition: (s) => s.sharp_signals_found >= 10 },
  { id: 'sharp_master', name: 'Sharp Master', description: 'Find 50 sharp money signals', icon: '🏆', xpReward: 300, condition: (s) => s.sharp_signals_found >= 50 },
  { id: 'value_hunter', name: 'Value Hunter', description: 'Find 10 value bets', icon: '💎', xpReward: 100, condition: (s) => s.value_bets_found >= 10 },
  { id: 'prediction_explorer', name: 'Prediction Explorer', description: 'View 50 predictions', icon: '🔮', xpReward: 75, condition: (s) => s.predictions_viewed >= 50 },
  { id: 'prediction_guru', name: 'Prediction Guru', description: 'View 200 predictions', icon: '🧙', xpReward: 200, condition: (s) => s.predictions_viewed >= 200 },
  { id: 'first_bet', name: 'In the Game', description: 'Place your first bet', icon: '🎰', xpReward: 25, condition: (s) => s.bets_placed >= 1 },
  { id: 'bet_10', name: 'Regular Bettor', description: 'Place 10 bets', icon: '📊', xpReward: 100, condition: (s) => s.bets_placed >= 10 },
  { id: 'first_win', name: 'Winner Winner', description: 'Win your first bet', icon: '🏅', xpReward: 50, condition: (s) => s.wins >= 1 },
  { id: 'win_streak_5', name: 'Hot Hand', description: 'Win 5 bets', icon: '✋', xpReward: 150, condition: (s) => s.wins >= 5 },
  { id: 'league_explorer', name: 'League Explorer', description: 'Explore 3 different leagues', icon: '🌍', xpReward: 50, condition: (s) => s.leagues_explored >= 3 },
  { id: 'ai_follower', name: 'AI Disciple', description: 'Follow 5 AI picks', icon: '🤖', xpReward: 75, condition: (s) => s.ai_picks_followed >= 5 },
];

function generateDailyChallenges(): DailyChallenge[] {
  const pool: Omit<DailyChallenge, 'current' | 'completed'>[] = [
    { id: 'view_3_predictions', title: 'Prediction Scout', description: 'View 3 AI predictions', target: 3, xpReward: 15 },
    { id: 'find_value_bet', title: 'Value Finder', description: 'Find 1 value bet today', target: 1, xpReward: 20 },
    { id: 'check_sharp', title: 'Sharp Eye', description: 'Check sharp money signals', target: 1, xpReward: 10 },
    { id: 'explore_2_leagues', title: 'League Hopper', description: 'Browse 2 different leagues', target: 2, xpReward: 15 },
    { id: 'place_bet', title: 'Action Taker', description: 'Place a bet today', target: 1, xpReward: 25 },
    { id: 'visit_3_pages', title: 'Explorer', description: 'Visit 3 different pages', target: 3, xpReward: 10 },
    { id: 'find_3_value', title: 'Diamond Miner', description: 'Find 3 value bets today', target: 3, xpReward: 30 },
    { id: 'view_5_predictions', title: 'Deep Dive', description: 'View 5 AI predictions', target: 5, xpReward: 25 },
  ];

  // Pick 3 random challenges
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map(c => ({ ...c, current: 0, completed: false }));
}

const today = () => new Date().toISOString().split('T')[0];

export function useEngagement() {
  const { user, isDevMode } = useAuth();
  const [data, setData] = useState<EngagementData>({
    xp: 0,
    level: 1,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    achievements: [],
    dailyChallenges: [],
    dailyChallengesDate: null,
    stats: { ...DEFAULT_STATS },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [newAchievements, setNewAchievements] = useState<AchievementDef[]>([]);

  // Load engagement data
  const loadData = useCallback(async () => {
    if (isDevMode) {
      const stored = localStorage.getItem('engagement_data');
      if (stored) {
        setData(JSON.parse(stored));
      }
      setIsLoading(false);
      return;
    }

    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: row, error } = await supabase
        .from('user_engagement')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (row) {
        setData({
          xp: row.xp,
          level: row.level,
          currentStreak: row.current_streak,
          longestStreak: row.longest_streak,
          lastActiveDate: row.last_active_date,
          achievements: (row.achievements as unknown as UnlockedAchievement[]) || [],
          dailyChallenges: (row.daily_challenges as unknown as DailyChallenge[]) || [],
          dailyChallengesDate: row.daily_challenges_date,
          stats: { ...DEFAULT_STATS, ...(row.stats as Partial<EngagementStats>) },
        });
      } else {
        // Create initial record
        const challenges = generateDailyChallenges();
        const { error: insertError } = await supabase
          .from('user_engagement')
          .insert({
            user_id: user.id,
            daily_challenges: challenges as any,
            daily_challenges_date: today(),
            stats: DEFAULT_STATS as any,
          });
        if (insertError) console.error('Error creating engagement:', insertError);
        setData(prev => ({ ...prev, dailyChallenges: challenges, dailyChallengesDate: today() }));
      }
    } catch (err) {
      console.error('Error loading engagement:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, isDevMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Persist data
  const persist = useCallback(async (updated: EngagementData) => {
    if (isDevMode) {
      localStorage.setItem('engagement_data', JSON.stringify(updated));
      return;
    }
    if (!user) return;

    try {
      await supabase
        .from('user_engagement')
        .update({
          xp: updated.xp,
          level: updated.level,
          current_streak: updated.currentStreak,
          longest_streak: updated.longestStreak,
          last_active_date: updated.lastActiveDate,
          achievements: updated.achievements as any,
          daily_challenges: updated.dailyChallenges as any,
          daily_challenges_date: updated.dailyChallengesDate,
          stats: updated.stats as any,
        })
        .eq('user_id', user.id);
    } catch (err) {
      console.error('Error persisting engagement:', err);
    }
  }, [user, isDevMode]);

  // Check and update streak
  const checkStreak = useCallback((current: EngagementData): EngagementData => {
    const todayStr = today();
    if (current.lastActiveDate === todayStr) return current;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = current.currentStreak;
    if (current.lastActiveDate === yesterdayStr) {
      newStreak += 1;
    } else if (current.lastActiveDate !== todayStr) {
      newStreak = 1;
    }

    // Refresh daily challenges if date changed
    let challenges = current.dailyChallenges;
    let challengeDate = current.dailyChallengesDate;
    if (challengeDate !== todayStr) {
      challenges = generateDailyChallenges();
      challengeDate = todayStr;
    }

    return {
      ...current,
      currentStreak: newStreak,
      longestStreak: Math.max(current.longestStreak, newStreak),
      lastActiveDate: todayStr,
      dailyChallenges: challenges,
      dailyChallengesDate: challengeDate,
      stats: { ...current.stats, days_active: current.stats.days_active + 1 },
    };
  }, []);

  // Check for new achievements
  const checkAchievements = useCallback((current: EngagementData): EngagementData => {
    const unlockedIds = new Set(current.achievements.map(a => a.id));
    const newlyUnlocked: AchievementDef[] = [];
    let xpGained = 0;

    for (const achievement of ACHIEVEMENTS) {
      if (!unlockedIds.has(achievement.id) && achievement.condition(current.stats)) {
        newlyUnlocked.push(achievement);
        xpGained += achievement.xpReward;
      }
    }

    if (newlyUnlocked.length === 0) return current;

    setNewAchievements(prev => [...prev, ...newlyUnlocked]);

    const updatedAchievements = [
      ...current.achievements,
      ...newlyUnlocked.map(a => ({ id: a.id, unlockedAt: new Date().toISOString() })),
    ];

    return {
      ...current,
      xp: current.xp + xpGained,
      achievements: updatedAchievements,
    };
  }, []);

  // Calculate level from XP
  const recalcLevel = useCallback((d: EngagementData): EngagementData => {
    let level = 1;
    let xpRemaining = d.xp;
    while (xpRemaining >= xpForLevel(level)) {
      xpRemaining -= xpForLevel(level);
      level++;
    }
    return { ...d, level };
  }, []);

  // Mark today active + check streak on mount
  useEffect(() => {
    if (isLoading) return;
    const updated = recalcLevel(checkAchievements(checkStreak(data)));
    if (updated !== data) {
      setData(updated);
      persist(updated);
    }
  }, [isLoading]); // Only run once after load

  // Add XP
  const addXP = useCallback((amount: number, reason?: string) => {
    setData(prev => {
      const updated = recalcLevel({ ...prev, xp: prev.xp + amount });
      persist(updated);
      if (reason) {
        toast.success(`+${amount} XP`, { description: reason, duration: 2000 });
      }
      return updated;
    });
  }, [persist, recalcLevel]);

  // Track a stat increment
  const trackStat = useCallback((stat: keyof EngagementStats, amount: number = 1) => {
    setData(prev => {
      const newStats = { ...prev.stats, [stat]: (prev.stats[stat] || 0) + amount };
      
      // Update daily challenge progress
      const challengeMap: Record<string, keyof EngagementStats> = {
        'view_3_predictions': 'predictions_viewed',
        'view_5_predictions': 'predictions_viewed',
        'find_value_bet': 'value_bets_found',
        'find_3_value': 'value_bets_found',
        'check_sharp': 'sharp_signals_found',
        'explore_2_leagues': 'leagues_explored',
        'place_bet': 'bets_placed',
        'visit_3_pages': 'pages_visited',
      };

      let xpFromChallenges = 0;
      const updatedChallenges = prev.dailyChallenges.map(c => {
        const mappedStat = challengeMap[c.id];
        if (mappedStat === stat && !c.completed) {
          const newCurrent = c.current + amount;
          const completed = newCurrent >= c.target;
          if (completed) xpFromChallenges += c.xpReward;
          return { ...c, current: newCurrent, completed };
        }
        return c;
      });

      let updated: EngagementData = {
        ...prev,
        xp: prev.xp + xpFromChallenges,
        stats: newStats,
        dailyChallenges: updatedChallenges,
      };

      updated = recalcLevel(checkAchievements(updated));
      persist(updated);
      return updated;
    });
  }, [persist, recalcLevel, checkAchievements]);

  // Dismiss achievement notification
  const dismissAchievement = useCallback(() => {
    setNewAchievements(prev => prev.slice(1));
  }, []);

  const progress = useMemo(() => xpProgress(data.xp, data.level), [data.xp, data.level]);

  const unlockedAchievementDefs = useMemo(() => {
    const ids = new Set(data.achievements.map(a => a.id));
    return ACHIEVEMENTS.filter(a => ids.has(a.id));
  }, [data.achievements]);

  const lockedAchievementDefs = useMemo(() => {
    const ids = new Set(data.achievements.map(a => a.id));
    return ACHIEVEMENTS.filter(a => !ids.has(a.id));
  }, [data.achievements]);

  return {
    data,
    isLoading,
    progress,
    addXP,
    trackStat,
    newAchievements,
    dismissAchievement,
    unlockedAchievementDefs,
    lockedAchievementDefs,
    ACHIEVEMENTS,
  };
}
