import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getAlgorithmNameFromId } from '@/utils/predictions/algorithms';
import { subDays, startOfDay, format, parseISO } from 'date-fns';
import { SituationalFiltersState } from '@/components/Backtest/SituationalFilters';

export type BacktestStrategy = 
  | 'all_agree'           // Only bet when all 3 algorithms agree
  | 'majority_agree'      // Bet when 2+ algorithms agree (follow majority)
  | 'highest_confidence'  // Follow the algorithm with highest confidence
  | 'best_performer'      // Follow the algorithm with best historical win rate
  | 'ml_power_index'      // Always follow ML Power Index
  | 'value_pick_finder'   // Always follow Value Pick Finder
  | 'statistical_edge';   // Always follow Statistical Edge

export interface BacktestConfig {
  strategy: BacktestStrategy;
  startingBankroll: number;
  stakeType: 'flat' | 'percentage' | 'kelly';
  stakeAmount: number; // Either flat amount or percentage of bankroll
  minConfidence: number; // Minimum confidence to place bet (0-100)
  days: number;
  league?: string;
  situationalFilters?: SituationalFiltersState;
}

export interface BacktestResult {
  totalBets: number;
  wins: number;
  losses: number;
  winRate: number;
  totalProfit: number;
  roi: number;
  finalBankroll: number;
  maxDrawdown: number;
  maxDrawdownPct: number;
  bestDay: { date: string; profit: number };
  worstDay: { date: string; profit: number };
  longestWinStreak: number;
  longestLoseStreak: number;
  avgBetSize: number;
  profitByDay: { date: string; profit: number; cumulative: number; bankroll: number }[];
  betHistory: BacktestBet[];
  filtersApplied: {
    homeAwayFilter: string;
    sharpMoneyAlignment: boolean;
    excludeBackToBack: boolean;
    conferenceGamesOnly: boolean;
    minAlgorithmsAgreeing: number;
    skippedByFilters: number;
  };
}

export interface BacktestBet {
  date: string;
  matchTitle: string;
  league: string;
  prediction: string;
  confidence: number;
  stake: number;
  odds: number;
  result: 'won' | 'lost';
  profit: number;
  bankrollAfter: number;
  strategy: string;
  algorithmsAgreed: number;
  isHomePick?: boolean;
  sharpAligned?: boolean;
}

interface UseBacktestSimulatorOptions extends BacktestConfig {}

export function useBacktestSimulator(options: UseBacktestSimulatorOptions) {
  const { 
    strategy, 
    startingBankroll, 
    stakeType, 
    stakeAmount, 
    minConfidence,
    days, 
    league,
    situationalFilters
  } = options;

  return useQuery({
    queryKey: ['backtestSimulator', strategy, startingBankroll, stakeType, stakeAmount, minConfidence, days, league, situationalFilters],
    queryFn: async (): Promise<BacktestResult> => {
      const startDate = startOfDay(subDays(new Date(), days)).toISOString();
      let skippedByFilters = 0;

      // Fetch all settled predictions
      let query = supabase
        .from('algorithm_predictions')
        .select('*')
        .gte('predicted_at', startDate)
        .not('prediction', 'is', null)
        .in('status', ['won', 'lost'])
        .order('predicted_at', { ascending: true });

      if (league && league !== 'all') {
        query = query.eq('league', league);
      }

      const { data: predictions, error } = await query;

      if (error) {
        console.error('Error fetching predictions for backtest:', error);
        throw error;
      }

      const preds = predictions || [];

      // Group predictions by match
      const matchPredictions = new Map<string, typeof preds>();
      for (const pred of preds) {
        if (!matchPredictions.has(pred.match_id)) {
          matchPredictions.set(pred.match_id, []);
        }
        matchPredictions.get(pred.match_id)!.push(pred);
      }

      // Calculate historical algorithm performance for "best_performer" strategy
      const algorithmStats = new Map<string, { wins: number; total: number }>();
      for (const pred of preds) {
        const algId = pred.algorithm_id || 'unknown';
        if (!algorithmStats.has(algId)) {
          algorithmStats.set(algId, { wins: 0, total: 0 });
        }
        const stats = algorithmStats.get(algId)!;
        stats.total++;
        if (pred.status === 'won') stats.wins++;
      }

      // Simulate betting
      let bankroll = startingBankroll;
      let totalStaked = 0;
      const betHistory: BacktestBet[] = [];
      const profitByDayMap = new Map<string, { profit: number; bets: number }>();
      let peakBankroll = startingBankroll;
      let maxDrawdown = 0;
      let maxDrawdownPct = 0;
      let currentWinStreak = 0;
      let currentLoseStreak = 0;
      let longestWinStreak = 0;
      let longestLoseStreak = 0;

      // Sort matches by date
      const sortedMatches = Array.from(matchPredictions.entries())
        .sort((a, b) => {
          const dateA = new Date(a[1][0].predicted_at).getTime();
          const dateB = new Date(b[1][0].predicted_at).getTime();
          return dateA - dateB;
        });

      for (const [matchId, matchPreds] of sortedMatches) {
        // Determine which bet to place based on strategy
        let selectedPred: typeof preds[0] | null = null;
        let algorithmsAgreed = 0;

        // Count prediction agreements
        const predictionCounts = new Map<string, typeof preds>();
        for (const pred of matchPreds) {
          const p = pred.prediction || '';
          if (!predictionCounts.has(p)) {
            predictionCounts.set(p, []);
          }
          predictionCounts.get(p)!.push(pred);
        }

        const maxAgreement = Math.max(...Array.from(predictionCounts.values()).map(v => v.length));
        const majorityPrediction = Array.from(predictionCounts.entries())
          .find(([, preds]) => preds.length === maxAgreement)?.[0];

        switch (strategy) {
          case 'all_agree':
            if (matchPreds.length >= 3 && maxAgreement === matchPreds.length) {
              selectedPred = matchPreds.reduce((best, curr) => 
                (curr.confidence || 0) > (best.confidence || 0) ? curr : best
              );
              algorithmsAgreed = matchPreds.length;
            }
            break;

          case 'majority_agree':
            if (maxAgreement >= 2 && majorityPrediction) {
              const agreeing = predictionCounts.get(majorityPrediction)!;
              selectedPred = agreeing.reduce((best, curr) => 
                (curr.confidence || 0) > (best.confidence || 0) ? curr : best
              );
              algorithmsAgreed = agreeing.length;
            }
            break;

          case 'highest_confidence':
            selectedPred = matchPreds.reduce((best, curr) => 
              (curr.confidence || 0) > (best.confidence || 0) ? curr : best
            );
            algorithmsAgreed = predictionCounts.get(selectedPred?.prediction || '')?.length || 1;
            break;

          case 'best_performer':
            // Find the prediction from the algorithm with best historical win rate
            let bestWinRate = 0;
            for (const pred of matchPreds) {
              const stats = algorithmStats.get(pred.algorithm_id || 'unknown');
              if (stats && stats.total > 0) {
                const winRate = stats.wins / stats.total;
                if (winRate > bestWinRate) {
                  bestWinRate = winRate;
                  selectedPred = pred;
                }
              }
            }
            if (selectedPred) {
              algorithmsAgreed = predictionCounts.get(selectedPred.prediction || '')?.length || 1;
            }
            break;

          case 'ml_power_index':
          case 'value_pick_finder':
          case 'statistical_edge':
            const targetName = strategy === 'ml_power_index' ? 'ML Power Index' :
                              strategy === 'value_pick_finder' ? 'Value Pick Finder' : 'Statistical Edge';
            selectedPred = matchPreds.find(p => 
              getAlgorithmNameFromId(p.algorithm_id || '') === targetName
            ) || null;
            if (selectedPred) {
              algorithmsAgreed = predictionCounts.get(selectedPred.prediction || '')?.length || 1;
            }
            break;
        }

        // Skip if no valid prediction or below min confidence
        if (!selectedPred || (selectedPred.confidence || 0) < minConfidence) {
          continue;
        }

        // ====== SITUATIONAL FILTERS ======
        // Determine if this is a home or away pick based on prediction text
        const predText = (selectedPred.prediction || '').toLowerCase();
        const homeTeam = (selectedPred.home_team || '').toLowerCase();
        const awayTeam = (selectedPred.away_team || '').toLowerCase();
        const isHomePick = predText.includes('home') || 
                          (homeTeam && predText.includes(homeTeam.split(' ').pop() || ''));
        const isAwayPick = predText.includes('away') || 
                          (awayTeam && predText.includes(awayTeam.split(' ').pop() || ''));

        // Apply Home/Away filter
        if (situationalFilters?.homeAwayFilter === 'home' && !isHomePick) {
          skippedByFilters++;
          continue;
        }
        if (situationalFilters?.homeAwayFilter === 'away' && !isAwayPick) {
          skippedByFilters++;
          continue;
        }

        // Apply minimum algorithms agreeing filter
        if (situationalFilters?.minAlgorithmsAgreeing && situationalFilters.minAlgorithmsAgreeing > 1) {
          if (algorithmsAgreed < situationalFilters.minAlgorithmsAgreeing) {
            skippedByFilters++;
            continue;
          }
        }

        // Apply sharp money alignment filter (simulated based on algorithm agreement + high confidence)
        // In real implementation, this would check against actual sharp money data
        const sharpAligned = algorithmsAgreed >= 2 && (selectedPred.confidence || 0) >= 65;
        if (situationalFilters?.sharpMoneyAlignment && !sharpAligned) {
          skippedByFilters++;
          continue;
        }

        // Apply exclude back-to-back filter (simulated - check if same team played within 24h)
        // In real implementation, this would check the actual schedule
        if (situationalFilters?.excludeBackToBack) {
          // Check if there's another prediction for the same home/away team within 24 hours
          const predDate = new Date(selectedPred.predicted_at).getTime();
          const isBackToBack = Array.from(matchPredictions.values()).some(otherPreds => {
            const otherPred = otherPreds[0];
            if (otherPred.match_id === selectedPred.match_id) return false;
            const otherDate = new Date(otherPred.predicted_at).getTime();
            const hoursDiff = Math.abs(predDate - otherDate) / (1000 * 60 * 60);
            const sameTeamInvolved = 
              (otherPred.home_team === selectedPred.home_team) ||
              (otherPred.away_team === selectedPred.away_team) ||
              (otherPred.home_team === selectedPred.away_team) ||
              (otherPred.away_team === selectedPred.home_team);
            return hoursDiff <= 24 && sameTeamInvolved;
          });
          if (isBackToBack) {
            skippedByFilters++;
            continue;
          }
        }

        // Apply conference games only filter (simulated based on league patterns)
        // In real implementation, this would check actual division/conference data
        if (situationalFilters?.conferenceGamesOnly) {
          // For NBA/NFL, we'd check division matchups
          // For now, simulate by assuming ~40% of games are conference games
          // Use match_id hash to be deterministic
          const matchHash = selectedPred.match_id.split('').reduce((a, b) => {
            return a + b.charCodeAt(0);
          }, 0);
          const isConferenceGame = matchHash % 100 < 40; // 40% are conference games
          if (!isConferenceGame) {
            skippedByFilters++;
            continue;
          }
        }

        // Calculate stake
        let stake = 0;
        switch (stakeType) {
          case 'flat':
            stake = Math.min(stakeAmount, bankroll);
            break;
          case 'percentage':
            stake = Math.min(bankroll * (stakeAmount / 100), bankroll);
            break;
          case 'kelly':
            // Simplified Kelly: confidence-based fraction
            const confidence = (selectedPred.confidence || 50) / 100;
            const impliedOdds = 0.5238; // -110 odds implied probability
            const edge = confidence - impliedOdds;
            if (edge > 0) {
              const kellyFraction = (edge / (1 - impliedOdds)) * (stakeAmount / 100); // stakeAmount is kelly multiplier
              stake = Math.min(bankroll * kellyFraction, bankroll * 0.25); // Cap at 25%
            }
            break;
        }

        if (stake <= 0 || stake > bankroll) continue;

        // Simulate result (using -110 odds, so win = +0.91 units, loss = -1 unit)
        const odds = -110;
        const isWin = selectedPred.status === 'won';
        const profit = isWin ? stake * 0.9091 : -stake;

        bankroll += profit;
        totalStaked += stake;

        // Track peak and drawdown
        if (bankroll > peakBankroll) {
          peakBankroll = bankroll;
        }
        const drawdown = peakBankroll - bankroll;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
          maxDrawdownPct = (drawdown / peakBankroll) * 100;
        }

        // Track streaks
        if (isWin) {
          currentWinStreak++;
          currentLoseStreak = 0;
          if (currentWinStreak > longestWinStreak) longestWinStreak = currentWinStreak;
        } else {
          currentLoseStreak++;
          currentWinStreak = 0;
          if (currentLoseStreak > longestLoseStreak) longestLoseStreak = currentLoseStreak;
        }

        // Track daily P/L
        const betDate = format(parseISO(selectedPred.predicted_at), 'yyyy-MM-dd');
        if (!profitByDayMap.has(betDate)) {
          profitByDayMap.set(betDate, { profit: 0, bets: 0 });
        }
        const dayStats = profitByDayMap.get(betDate)!;
        dayStats.profit += profit;
        dayStats.bets++;

        betHistory.push({
          date: format(parseISO(selectedPred.predicted_at), 'MMM d, yyyy'),
          matchTitle: selectedPred.match_title || 'Unknown',
          league: selectedPred.league || 'Unknown',
          prediction: selectedPred.prediction || '',
          confidence: selectedPred.confidence || 0,
          stake,
          odds,
          result: isWin ? 'won' : 'lost',
          profit,
          bankrollAfter: bankroll,
          strategy: getStrategyDisplayName(strategy),
          algorithmsAgreed,
        });
      }

      // Build profit by day array
      const sortedDays = Array.from(profitByDayMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]));
      
      let cumulative = 0;
      let runningBankroll = startingBankroll;
      const profitByDay = sortedDays.map(([date, stats]) => {
        cumulative += stats.profit;
        runningBankroll += stats.profit;
        return {
          date: format(parseISO(date), 'MMM d'),
          profit: stats.profit,
          cumulative,
          bankroll: runningBankroll,
        };
      });

      // Find best and worst days
      let bestDayEntry = { date: 'N/A', profit: 0 };
      let worstDayEntry = { date: 'N/A', profit: 0 };
      
      if (sortedDays.length > 0) {
        const best = sortedDays.reduce((best, curr) => curr[1].profit > best[1].profit ? curr : best);
        const worst = sortedDays.reduce((worst, curr) => curr[1].profit < worst[1].profit ? curr : worst);
        bestDayEntry = { date: format(parseISO(best[0]), 'MMM d'), profit: best[1].profit };
        worstDayEntry = { date: format(parseISO(worst[0]), 'MMM d'), profit: worst[1].profit };
      }

      const wins = betHistory.filter(b => b.result === 'won').length;
      const losses = betHistory.filter(b => b.result === 'lost').length;
      const totalBets = wins + losses;
      const totalProfit = bankroll - startingBankroll;

      return {
        totalBets,
        wins,
        losses,
        winRate: totalBets > 0 ? (wins / totalBets) * 100 : 0,
        totalProfit,
        roi: totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0,
        finalBankroll: bankroll,
        maxDrawdown,
        maxDrawdownPct,
        bestDay: bestDayEntry,
        worstDay: worstDayEntry,
        longestWinStreak,
        longestLoseStreak,
        avgBetSize: totalBets > 0 ? totalStaked / totalBets : 0,
        profitByDay,
        betHistory,
        filtersApplied: {
          homeAwayFilter: situationalFilters?.homeAwayFilter || 'all',
          sharpMoneyAlignment: situationalFilters?.sharpMoneyAlignment || false,
          excludeBackToBack: situationalFilters?.excludeBackToBack || false,
          conferenceGamesOnly: situationalFilters?.conferenceGamesOnly || false,
          minAlgorithmsAgreeing: situationalFilters?.minAlgorithmsAgreeing || 1,
          skippedByFilters,
        },
      };
    },
    staleTime: 60000,
  });
}

export function getStrategyDisplayName(strategy: BacktestStrategy): string {
  switch (strategy) {
    case 'all_agree': return 'All 3 Agree';
    case 'majority_agree': return '2+ Agree (Majority)';
    case 'highest_confidence': return 'Highest Confidence';
    case 'best_performer': return 'Best Performer';
    case 'ml_power_index': return 'ML Power Index';
    case 'value_pick_finder': return 'Value Pick Finder';
    case 'statistical_edge': return 'Statistical Edge';
    default: return 'Unknown';
  }
}

export function getStrategyDescription(strategy: BacktestStrategy): string {
  switch (strategy) {
    case 'all_agree': return 'Only bet when all 3 algorithms agree on the same prediction. Most conservative.';
    case 'majority_agree': return 'Bet when at least 2 algorithms agree. Balanced approach with more opportunities.';
    case 'highest_confidence': return 'Always follow the algorithm with the highest confidence for each match.';
    case 'best_performer': return 'Follow the algorithm with the best historical win rate.';
    case 'ml_power_index': return 'Always follow ML Power Index predictions.';
    case 'value_pick_finder': return 'Always follow Value Pick Finder predictions.';
    case 'statistical_edge': return 'Always follow Statistical Edge predictions.';
    default: return '';
  }
}
