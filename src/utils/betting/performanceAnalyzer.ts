import { UserBet } from '@/types/betting';
import { startOfWeek, endOfWeek, subWeeks, isWithinInterval, format, differenceInHours, parseISO } from 'date-fns';

export interface WeeklyStats {
  totalBets: number;
  wins: number;
  losses: number;
  pushes: number;
  pending: number;
  winRate: number;
  totalStaked: number;
  totalProfit: number;
  roi: number;
  avgOdds: number;
  avgCLV: number;
  dailyProfits: { day: string; profit: number; cumulative: number }[];
}

export interface RankedBet {
  bet: UserBet;
  rank: number;
  highlights: string[];
}

export interface LeagueStats {
  league: string;
  totalBets: number;
  wins: number;
  losses: number;
  winRate: number;
  profit: number;
}

export interface BetTypeStats {
  betType: string;
  totalBets: number;
  wins: number;
  losses: number;
  winRate: number;
  profit: number;
}

export interface OddsRangeStats {
  range: string;
  min: number;
  max: number;
  totalBets: number;
  wins: number;
  losses: number;
  winRate: number;
  profit: number;
}

export interface DayStats {
  day: string;
  totalBets: number;
  wins: number;
  losses: number;
  winRate: number;
  profit: number;
}

export interface Insight {
  type: 'warning' | 'success' | 'tip';
  title: string;
  description: string;
  metric?: number;
}

// Get bets for a specific week (0 = current week, 1 = last week, etc.)
export function getWeekBets(bets: UserBet[], weekOffset: number = 0): UserBet[] {
  const now = new Date();
  const targetWeekStart = startOfWeek(subWeeks(now, weekOffset), { weekStartsOn: 1 });
  const targetWeekEnd = endOfWeek(subWeeks(now, weekOffset), { weekStartsOn: 1 });

  return bets.filter((bet) => {
    const betDate = parseISO(bet.placed_at);
    return isWithinInterval(betDate, { start: targetWeekStart, end: targetWeekEnd });
  });
}

// Calculate weekly stats from bets
export function calculateWeeklyStats(bets: UserBet[]): WeeklyStats {
  const settledBets = bets.filter((b) => b.status !== 'pending' && b.status !== 'cancelled');
  const wins = settledBets.filter((b) => b.status === 'won').length;
  const losses = settledBets.filter((b) => b.status === 'lost').length;
  const pushes = settledBets.filter((b) => b.status === 'push').length;
  const pending = bets.filter((b) => b.status === 'pending').length;

  const totalStaked = bets.reduce((sum, b) => sum + b.stake, 0);
  const totalProfit = settledBets.reduce((sum, b) => sum + (b.result_profit || 0), 0);
  const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;
  const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;

  const avgOdds = bets.length > 0
    ? bets.reduce((sum, b) => sum + b.odds_at_placement, 0) / bets.length
    : 0;

  const betsWithCLV = bets.filter((b) => b.clv_percentage !== undefined && b.clv_percentage !== null);
  const avgCLV = betsWithCLV.length > 0
    ? betsWithCLV.reduce((sum, b) => sum + (b.clv_percentage || 0), 0) / betsWithCLV.length
    : 0;

  // Calculate daily profits
  const dailyProfits = calculateDailyProfits(settledBets);

  return {
    totalBets: bets.length,
    wins,
    losses,
    pushes,
    pending,
    winRate,
    totalStaked,
    totalProfit,
    roi,
    avgOdds,
    avgCLV,
    dailyProfits,
  };
}

function calculateDailyProfits(bets: UserBet[]): { day: string; profit: number; cumulative: number }[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const profitsByDay: Record<string, number> = {};

  days.forEach((d) => (profitsByDay[d] = 0));

  bets.forEach((bet) => {
    if (bet.settled_at) {
      const dayName = format(parseISO(bet.settled_at), 'EEE');
      if (profitsByDay[dayName] !== undefined) {
        profitsByDay[dayName] += bet.result_profit || 0;
      }
    }
  });

  let cumulative = 0;
  return days.map((day) => {
    cumulative += profitsByDay[day];
    return { day, profit: profitsByDay[day], cumulative };
  });
}

// Get best performing bets
export function getBestPicks(bets: UserBet[], limit: number = 3): RankedBet[] {
  const wonBets = bets.filter((b) => b.status === 'won' && b.result_profit !== undefined);

  return wonBets
    .sort((a, b) => (b.result_profit || 0) - (a.result_profit || 0))
    .slice(0, limit)
    .map((bet, index) => {
      const highlights: string[] = [];

      if ((bet.result_profit || 0) > 50) {
        highlights.push('Big Win');
      }
      if (bet.model_confidence && bet.model_confidence >= 70) {
        highlights.push('High Confidence');
      }
      if (bet.clv_percentage && bet.clv_percentage > 2) {
        highlights.push('Beat Closing Line');
      }
      if (bet.odds_at_placement >= 2.5) {
        highlights.push('Underdog Hit');
      }

      return { bet, rank: index + 1, highlights };
    });
}

// Breakdown by league
export function getLeagueBreakdown(bets: UserBet[]): LeagueStats[] {
  const leagueMap = new Map<string, UserBet[]>();

  bets.forEach((bet) => {
    const league = bet.league || 'Unknown';
    if (!leagueMap.has(league)) {
      leagueMap.set(league, []);
    }
    leagueMap.get(league)!.push(bet);
  });

  return Array.from(leagueMap.entries()).map(([league, leagueBets]) => {
    const settled = leagueBets.filter((b) => b.status !== 'pending' && b.status !== 'cancelled');
    const wins = settled.filter((b) => b.status === 'won').length;
    const losses = settled.filter((b) => b.status === 'lost').length;
    const profit = settled.reduce((sum, b) => sum + (b.result_profit || 0), 0);

    return {
      league,
      totalBets: leagueBets.length,
      wins,
      losses,
      winRate: wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0,
      profit,
    };
  }).sort((a, b) => b.profit - a.profit);
}

// Breakdown by bet type
export function getBetTypeBreakdown(bets: UserBet[]): BetTypeStats[] {
  const typeMap = new Map<string, UserBet[]>();

  bets.forEach((bet) => {
    const betType = bet.bet_type;
    if (!typeMap.has(betType)) {
      typeMap.set(betType, []);
    }
    typeMap.get(betType)!.push(bet);
  });

  return Array.from(typeMap.entries()).map(([betType, typeBets]) => {
    const settled = typeBets.filter((b) => b.status !== 'pending' && b.status !== 'cancelled');
    const wins = settled.filter((b) => b.status === 'won').length;
    const losses = settled.filter((b) => b.status === 'lost').length;
    const profit = settled.reduce((sum, b) => sum + (b.result_profit || 0), 0);

    return {
      betType,
      totalBets: typeBets.length,
      wins,
      losses,
      winRate: wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0,
      profit,
    };
  }).sort((a, b) => b.profit - a.profit);
}

// Breakdown by odds range
export function getOddsRangeBreakdown(bets: UserBet[]): OddsRangeStats[] {
  const ranges = [
    { range: 'Heavy Favorites', min: 1.01, max: 1.5 },
    { range: 'Favorites', min: 1.5, max: 2.0 },
    { range: 'Even Money', min: 2.0, max: 2.5 },
    { range: 'Slight Underdogs', min: 2.5, max: 3.5 },
    { range: 'Underdogs', min: 3.5, max: 100 },
  ];

  return ranges.map(({ range, min, max }) => {
    const rangeBets = bets.filter(
      (b) => b.odds_at_placement >= min && b.odds_at_placement < max
    );
    const settled = rangeBets.filter((b) => b.status !== 'pending' && b.status !== 'cancelled');
    const wins = settled.filter((b) => b.status === 'won').length;
    const losses = settled.filter((b) => b.status === 'lost').length;
    const profit = settled.reduce((sum, b) => sum + (b.result_profit || 0), 0);

    return {
      range,
      min,
      max,
      totalBets: rangeBets.length,
      wins,
      losses,
      winRate: wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0,
      profit,
    };
  }).filter((r) => r.totalBets > 0);
}

// Breakdown by day of week
export function getDayBreakdown(bets: UserBet[]): DayStats[] {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayMap = new Map<string, UserBet[]>();

  days.forEach((d) => dayMap.set(d, []));

  bets.forEach((bet) => {
    const dayName = format(parseISO(bet.placed_at), 'EEEE');
    if (dayMap.has(dayName)) {
      dayMap.get(dayName)!.push(bet);
    }
  });

  return days.map((day) => {
    const dayBets = dayMap.get(day) || [];
    const settled = dayBets.filter((b) => b.status !== 'pending' && b.status !== 'cancelled');
    const wins = settled.filter((b) => b.status === 'won').length;
    const losses = settled.filter((b) => b.status === 'lost').length;
    const profit = settled.reduce((sum, b) => sum + (b.result_profit || 0), 0);

    return {
      day,
      totalBets: dayBets.length,
      wins,
      losses,
      winRate: wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0,
      profit,
    };
  }).filter((d) => d.totalBets > 0);
}

// Generate improvement insights
export function generateInsights(bets: UserBet[], currentWeekStats: WeeklyStats): Insight[] {
  const insights: Insight[] = [];

  // Check for chasing losses pattern
  const sortedBets = [...bets].sort((a, b) => 
    new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime()
  );

  let chaseLossCount = 0;
  for (let i = 1; i < sortedBets.length; i++) {
    const prevBet = sortedBets[i - 1];
    const currBet = sortedBets[i];
    if (prevBet.status === 'lost') {
      const hoursDiff = differenceInHours(
        parseISO(currBet.placed_at),
        parseISO(prevBet.placed_at)
      );
      if (hoursDiff <= 2 && currBet.stake > prevBet.stake) {
        chaseLossCount++;
      }
    }
  }

  if (chaseLossCount >= 2) {
    insights.push({
      type: 'warning',
      title: 'Possible Loss Chasing',
      description: `You placed ${chaseLossCount} larger bets within 2 hours after a loss. Consider adding a cooldown period.`,
      metric: chaseLossCount,
    });
  }

  // Check underdog performance
  const underdogBets = bets.filter((b) => b.odds_at_placement >= 2.5);
  const underdogSettled = underdogBets.filter((b) => b.status === 'won' || b.status === 'lost');
  const underdogWins = underdogSettled.filter((b) => b.status === 'won').length;
  const underdogLosses = underdogSettled.filter((b) => b.status === 'lost').length;

  if (underdogSettled.length >= 3 && underdogWins / underdogSettled.length < 0.3) {
    insights.push({
      type: 'warning',
      title: 'Underdog Struggles',
      description: `${underdogWins}-${underdogLosses} on underdogs (+150 or higher). Your edge may be in favorites.`,
      metric: underdogWins / underdogSettled.length,
    });
  }

  // Find strongest league
  const leagueBreakdown = getLeagueBreakdown(bets);
  const strongestLeague = leagueBreakdown.find((l) => l.winRate >= 60 && l.totalBets >= 3);
  if (strongestLeague) {
    insights.push({
      type: 'success',
      title: `Strong in ${strongestLeague.league}`,
      description: `${strongestLeague.wins}-${strongestLeague.losses} (${strongestLeague.winRate.toFixed(0)}%) with $${strongestLeague.profit.toFixed(2)} profit. Consider focusing here.`,
      metric: strongestLeague.winRate,
    });
  }

  // CLV analysis
  const betsWithCLV = bets.filter((b) => b.clv_percentage !== undefined && b.clv_percentage !== null);
  if (betsWithCLV.length >= 4) {
    const positiveCLV = betsWithCLV.filter((b) => (b.clv_percentage || 0) > 0);
    const negativeCLV = betsWithCLV.filter((b) => (b.clv_percentage || 0) <= 0);

    const posWins = positiveCLV.filter((b) => b.status === 'won').length;
    const posTotal = positiveCLV.filter((b) => b.status === 'won' || b.status === 'lost').length;
    const negWins = negativeCLV.filter((b) => b.status === 'won').length;
    const negTotal = negativeCLV.filter((b) => b.status === 'won' || b.status === 'lost').length;

    if (posTotal >= 2 && negTotal >= 2) {
      const posWinRate = posTotal > 0 ? (posWins / posTotal) * 100 : 0;
      const negWinRate = negTotal > 0 ? (negWins / negTotal) * 100 : 0;

      if (posWinRate > negWinRate + 15) {
        insights.push({
          type: 'tip',
          title: 'CLV Matters',
          description: `Positive CLV bets: ${posWins}-${posTotal - posWins} (${posWinRate.toFixed(0)}%). Negative CLV: ${negWins}-${negTotal - negWins} (${negWinRate.toFixed(0)}%).`,
          metric: posWinRate - negWinRate,
        });
      }
    }
  }

  // High win rate encouragement
  if (currentWeekStats.winRate >= 55 && currentWeekStats.totalBets >= 5) {
    insights.push({
      type: 'success',
      title: 'Great Week!',
      description: `${currentWeekStats.winRate.toFixed(0)}% win rate this week. Keep up the disciplined approach.`,
      metric: currentWeekStats.winRate,
    });
  }

  // Low volume tip
  if (currentWeekStats.totalBets < 3) {
    insights.push({
      type: 'tip',
      title: 'Low Volume Week',
      description: 'Only a few bets this week. Being selective is good—quality over quantity!',
      metric: currentWeekStats.totalBets,
    });
  }

  return insights.slice(0, 4); // Limit to 4 insights
}

// Generate sample mock bets for demo purposes
export function generateMockBets(): UserBet[] {
  const now = new Date();
  const leagues = ['NBA', 'NFL', 'NHL', 'MLB', 'Premier League'];
  const betTypes = ['moneyline', 'spread', 'total'] as const;
  const teams = [
    ['Lakers', 'Celtics'], ['Chiefs', 'Ravens'], ['Bruins', 'Rangers'],
    ['Yankees', 'Red Sox'], ['Man City', 'Liverpool'],
  ];

  const mockBets: UserBet[] = [];

  for (let i = 0; i < 15; i++) {
    const daysAgo = Math.floor(Math.random() * 14);
    const leagueIdx = Math.floor(Math.random() * leagues.length);
    const betType = betTypes[Math.floor(Math.random() * betTypes.length)];
    const teamPair = teams[leagueIdx % teams.length];
    const selection = teamPair[Math.floor(Math.random() * 2)];
    const odds = 1.5 + Math.random() * 2;
    const stake = 10 + Math.floor(Math.random() * 90);
    const status = Math.random() > 0.2 
      ? (Math.random() > 0.45 ? 'won' : 'lost') 
      : 'pending';
    const resultProfit = status === 'won' 
      ? stake * (odds - 1) 
      : status === 'lost' 
        ? -stake 
        : undefined;

    const placedAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const settledAt = status !== 'pending' 
      ? new Date(placedAt.getTime() + 3 * 60 * 60 * 1000) 
      : undefined;

    mockBets.push({
      id: `mock-${i}`,
      user_id: 'dev-user',
      match_id: `match-${i}`,
      match_title: `${teamPair[0]} vs ${teamPair[1]}`,
      league: leagues[leagueIdx],
      bet_type: betType,
      selection,
      odds_at_placement: parseFloat(odds.toFixed(2)),
      stake,
      potential_payout: stake * odds,
      status: status as 'pending' | 'won' | 'lost',
      result_profit: resultProfit,
      placed_at: placedAt.toISOString(),
      settled_at: settledAt?.toISOString(),
      clv_percentage: Math.random() > 0.5 ? (Math.random() * 6 - 2) : undefined,
      model_confidence: Math.random() > 0.3 ? 50 + Math.floor(Math.random() * 40) : undefined,
      created_at: placedAt.toISOString(),
      updated_at: placedAt.toISOString(),
    });
  }

  return mockBets;
}
