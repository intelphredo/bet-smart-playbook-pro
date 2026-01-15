import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ALGORITHM_IDS, getAlgorithmNameFromId } from '@/utils/predictions/algorithms';
import { subDays, startOfDay, format } from 'date-fns';

export interface AlgorithmSummary {
  algorithmId: string;
  algorithmName: string;
  totalPredictions: number;
  wins: number;
  losses: number;
  winRate: number;
  avgConfidence: number;
  recentResults: ('W' | 'L')[];
  roi: number; // Simulated based on win rate
  streak: number; // Current streak (positive = wins, negative = losses)
}

export interface HeadToHeadResult {
  algorithm1Id: string;
  algorithm1Name: string;
  algorithm2Id: string;
  algorithm2Name: string;
  disagreements: number;
  algorithm1Wins: number;
  algorithm2Wins: number;
  winRate1: number;
  winRate2: number;
}

export interface ConsensusPick {
  matchId: string;
  matchTitle: string;
  league: string;
  date: string;
  algorithms: {
    algorithmId: string;
    algorithmName: string;
    prediction: string;
    confidence: number;
  }[];
  consensusPrediction: string;
  consensusConfidence: number;
  result: 'won' | 'lost' | 'pending';
  agreementLevel: 'full' | 'partial' | 'split';
}

export interface PerformanceByContext {
  byLeague: {
    league: string;
    algorithms: {
      algorithmId: string;
      algorithmName: string;
      winRate: number;
      total: number;
    }[];
  }[];
  byConfidence: {
    range: string;
    algorithms: {
      algorithmId: string;
      algorithmName: string;
      winRate: number;
      total: number;
    }[];
  }[];
}

export interface DailyTrend {
  date: string;
  displayDate: string;
  algorithms: {
    algorithmId: string;
    algorithmName: string;
    wins: number;
    losses: number;
    total: number;
    winRate: number;
    cumulativeWinRate: number;
  }[];
}

export interface ComparisonData {
  algorithms: AlgorithmSummary[];
  headToHead: HeadToHeadResult[];
  consensusPicks: ConsensusPick[];
  performanceByContext: PerformanceByContext;
  dailyTrends: DailyTrend[];
  agreementStats: {
    fullAgreement: number;
    partialAgreement: number;
    noAgreement: number;
    fullAgreementWinRate: number;
    partialAgreementWinRate: number;
    noAgreementWinRate: number;
  };
}

interface UseAlgorithmComparisonOptions {
  days?: number;
  league?: string;
}

export function useAlgorithmComparison(options: UseAlgorithmComparisonOptions = {}) {
  const { days = 30, league } = options;

  return useQuery({
    queryKey: ['algorithmComparison', days, league],
    queryFn: async (): Promise<ComparisonData> => {
      const startDate = startOfDay(subDays(new Date(), days)).toISOString();

      // Fetch all predictions with actual data
      let query = supabase
        .from('algorithm_predictions')
        .select('*')
        .gte('predicted_at', startDate)
        .not('prediction', 'is', null)
        .order('predicted_at', { ascending: false });

      if (league && league !== 'all') {
        query = query.eq('league', league);
      }

      const { data: predictions, error } = await query;

      if (error) {
        console.error('Error fetching predictions for comparison:', error);
        throw error;
      }

      const preds = predictions || [];

      // Build algorithm summaries
      const algorithmMap = new Map<string, typeof preds>();
      for (const pred of preds) {
        const algId = pred.algorithm_id || 'unknown';
        if (!algorithmMap.has(algId)) {
          algorithmMap.set(algId, []);
        }
        algorithmMap.get(algId)!.push(pred);
      }

      const algorithms: AlgorithmSummary[] = [];
      for (const [algId, algPreds] of algorithmMap) {
        const settled = algPreds.filter(p => p.status === 'won' || p.status === 'lost');
        const wins = settled.filter(p => p.status === 'won').length;
        const losses = settled.filter(p => p.status === 'lost').length;
        const total = settled.length;

        const recentResults = settled
          .slice(0, 10)
          .map(p => (p.status === 'won' ? 'W' : 'L') as 'W' | 'L');

        const avgConfidence = algPreds.length > 0
          ? algPreds.reduce((sum, p) => sum + (p.confidence || 0), 0) / algPreds.length
          : 0;

        // Calculate streak
        let streak = 0;
        for (const result of recentResults) {
          if (streak === 0) {
            streak = result === 'W' ? 1 : -1;
          } else if ((streak > 0 && result === 'W') || (streak < 0 && result === 'L')) {
            streak += streak > 0 ? 1 : -1;
          } else {
            break;
          }
        }

        // Simulated ROI based on flat betting at -110
        const roi = total > 0 ? ((wins * 0.91 - losses) / total) * 100 : 0;

        algorithms.push({
          algorithmId: algId,
          algorithmName: getAlgorithmNameFromId(algId),
          totalPredictions: total,
          wins,
          losses,
          winRate: total > 0 ? (wins / total) * 100 : 0,
          avgConfidence,
          recentResults,
          roi,
          streak,
        });
      }

      // Sort by win rate
      algorithms.sort((a, b) => b.winRate - a.winRate);

      // Build head-to-head comparisons
      const matchPredictions = new Map<string, typeof preds>();
      for (const pred of preds) {
        if (!matchPredictions.has(pred.match_id)) {
          matchPredictions.set(pred.match_id, []);
        }
        matchPredictions.get(pred.match_id)!.push(pred);
      }

      const headToHead: HeadToHeadResult[] = [];
      const algIds = Array.from(algorithmMap.keys());
      
      for (let i = 0; i < algIds.length; i++) {
        for (let j = i + 1; j < algIds.length; j++) {
          const alg1 = algIds[i];
          const alg2 = algIds[j];
          let disagreements = 0;
          let alg1Wins = 0;
          let alg2Wins = 0;

          for (const [, matchPreds] of matchPredictions) {
            const pred1 = matchPreds.find(p => p.algorithm_id === alg1);
            const pred2 = matchPreds.find(p => p.algorithm_id === alg2);

            if (pred1 && pred2 && pred1.prediction !== pred2.prediction) {
              const settled1 = pred1.status === 'won' || pred1.status === 'lost';
              const settled2 = pred2.status === 'won' || pred2.status === 'lost';

              if (settled1 && settled2) {
                disagreements++;
                if (pred1.status === 'won') alg1Wins++;
                if (pred2.status === 'won') alg2Wins++;
              }
            }
          }

          if (disagreements > 0) {
            headToHead.push({
              algorithm1Id: alg1,
              algorithm1Name: getAlgorithmNameFromId(alg1),
              algorithm2Id: alg2,
              algorithm2Name: getAlgorithmNameFromId(alg2),
              disagreements,
              algorithm1Wins: alg1Wins,
              algorithm2Wins: alg2Wins,
              winRate1: (alg1Wins / disagreements) * 100,
              winRate2: (alg2Wins / disagreements) * 100,
            });
          }
        }
      }

      // Build consensus picks
      const consensusPicks: ConsensusPick[] = [];
      let fullAgreement = 0, partialAgreement = 0, noAgreement = 0;
      let fullAgreementWins = 0, fullAgreementTotal = 0;
      let partialAgreementWins = 0, partialAgreementTotal = 0;
      let noAgreementWins = 0, noAgreementTotal = 0;

      for (const [matchId, matchPreds] of matchPredictions) {
        if (matchPreds.length < 2) continue;

        const predictionCounts = new Map<string, number>();
        for (const pred of matchPreds) {
          const p = pred.prediction || '';
          predictionCounts.set(p, (predictionCounts.get(p) || 0) + 1);
        }

        const maxCount = Math.max(...predictionCounts.values());
        const consensusPrediction = Array.from(predictionCounts.entries())
          .find(([, count]) => count === maxCount)?.[0] || '';

        const agreementLevel: 'full' | 'partial' | 'split' = 
          maxCount === matchPreds.length ? 'full' :
          maxCount > 1 ? 'partial' : 'split';

        const settled = matchPreds.filter(p => p.status === 'won' || p.status === 'lost');
        const result: 'won' | 'lost' | 'pending' = 
          settled.length === 0 ? 'pending' :
          settled.some(p => p.status === 'won' && p.prediction === consensusPrediction) ? 'won' : 'lost';

        // Track agreement stats
        if (agreementLevel === 'full') {
          fullAgreement++;
          if (result !== 'pending') {
            fullAgreementTotal++;
            if (result === 'won') fullAgreementWins++;
          }
        } else if (agreementLevel === 'partial') {
          partialAgreement++;
          if (result !== 'pending') {
            partialAgreementTotal++;
            if (result === 'won') partialAgreementWins++;
          }
        } else {
          noAgreement++;
          if (result !== 'pending') {
            noAgreementTotal++;
            if (result === 'won') noAgreementWins++;
          }
        }

        const avgConfidence = matchPreds.reduce((sum, p) => sum + (p.confidence || 0), 0) / matchPreds.length;

        consensusPicks.push({
          matchId,
          matchTitle: matchPreds[0].match_title || 'Unknown Match',
          league: matchPreds[0].league || 'Unknown',
          date: format(new Date(matchPreds[0].predicted_at), 'MMM d, yyyy'),
          algorithms: matchPreds.map(p => ({
            algorithmId: p.algorithm_id || 'unknown',
            algorithmName: getAlgorithmNameFromId(p.algorithm_id || 'unknown'),
            prediction: p.prediction || '',
            confidence: p.confidence || 0,
          })),
          consensusPrediction,
          consensusConfidence: avgConfidence,
          result,
          agreementLevel,
        });
      }

      // Sort by date descending
      consensusPicks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Build performance by context
      const leagueMap = new Map<string, Map<string, { wins: number; total: number }>>();
      const confidenceRanges = [
        { range: '50-59%', min: 50, max: 59 },
        { range: '60-69%', min: 60, max: 69 },
        { range: '70-79%', min: 70, max: 79 },
        { range: '80%+', min: 80, max: 100 },
      ];
      const confidenceMap = new Map<string, Map<string, { wins: number; total: number }>>();

      for (const pred of preds) {
        if (pred.status !== 'won' && pred.status !== 'lost') continue;
        const algId = pred.algorithm_id || 'unknown';
        const leagueKey = pred.league || 'Unknown';
        const isWin = pred.status === 'won';

        // By league
        if (!leagueMap.has(leagueKey)) {
          leagueMap.set(leagueKey, new Map());
        }
        const leagueAlgs = leagueMap.get(leagueKey)!;
        if (!leagueAlgs.has(algId)) {
          leagueAlgs.set(algId, { wins: 0, total: 0 });
        }
        const leagueStats = leagueAlgs.get(algId)!;
        leagueStats.total++;
        if (isWin) leagueStats.wins++;

        // By confidence
        const conf = pred.confidence || 0;
        for (const range of confidenceRanges) {
          if (conf >= range.min && conf <= range.max) {
            if (!confidenceMap.has(range.range)) {
              confidenceMap.set(range.range, new Map());
            }
            const confAlgs = confidenceMap.get(range.range)!;
            if (!confAlgs.has(algId)) {
              confAlgs.set(algId, { wins: 0, total: 0 });
            }
            const confStats = confAlgs.get(algId)!;
            confStats.total++;
            if (isWin) confStats.wins++;
            break;
          }
        }
      }

      const byLeague = Array.from(leagueMap.entries()).map(([leagueKey, algs]) => ({
        league: leagueKey,
        algorithms: Array.from(algs.entries()).map(([algId, stats]) => ({
          algorithmId: algId,
          algorithmName: getAlgorithmNameFromId(algId),
          winRate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0,
          total: stats.total,
        })).sort((a, b) => b.winRate - a.winRate),
      })).sort((a, b) => {
        const totalA = a.algorithms.reduce((sum, alg) => sum + alg.total, 0);
        const totalB = b.algorithms.reduce((sum, alg) => sum + alg.total, 0);
        return totalB - totalA;
      });

      const byConfidence = confidenceRanges.map(range => {
        const algs = confidenceMap.get(range.range) || new Map();
        return {
          range: range.range,
          algorithms: Array.from(algs.entries()).map(([algId, stats]) => ({
            algorithmId: algId,
            algorithmName: getAlgorithmNameFromId(algId),
            winRate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0,
            total: stats.total,
          })).sort((a, b) => b.winRate - a.winRate),
        };
      });

      // Build daily trends for performance over time
      const dailyTrendsMap = new Map<string, Map<string, { wins: number; losses: number }>>();
      const algCumulativeStats = new Map<string, { wins: number; losses: number }>();
      
      // Initialize cumulative stats for each algorithm
      for (const algId of algorithmMap.keys()) {
        algCumulativeStats.set(algId, { wins: 0, losses: 0 });
      }
      
      // Create date buckets for the selected period
      for (let i = days - 1; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        dailyTrendsMap.set(date, new Map());
        for (const algId of algorithmMap.keys()) {
          dailyTrendsMap.get(date)!.set(algId, { wins: 0, losses: 0 });
        }
      }
      
      // Fill in the data
      for (const pred of preds) {
        if (pred.status !== 'won' && pred.status !== 'lost') continue;
        const algId = pred.algorithm_id || 'unknown';
        const date = format(new Date(pred.predicted_at), 'yyyy-MM-dd');
        
        if (dailyTrendsMap.has(date)) {
          const dayAlgs = dailyTrendsMap.get(date)!;
          if (dayAlgs.has(algId)) {
            const stats = dayAlgs.get(algId)!;
            if (pred.status === 'won') stats.wins++;
            else stats.losses++;
          }
        }
      }
      
      // Convert to array with cumulative stats
      const dailyTrends: DailyTrend[] = [];
      const runningTotals = new Map<string, { wins: number; losses: number }>();
      
      for (const algId of algorithmMap.keys()) {
        runningTotals.set(algId, { wins: 0, losses: 0 });
      }
      
      for (const [date, algMap] of dailyTrendsMap) {
        const algorithms: DailyTrend['algorithms'] = [];
        
        for (const [algId, stats] of algMap) {
          const running = runningTotals.get(algId)!;
          running.wins += stats.wins;
          running.losses += stats.losses;
          const total = running.wins + running.losses;
          
          algorithms.push({
            algorithmId: algId,
            algorithmName: getAlgorithmNameFromId(algId),
            wins: stats.wins,
            losses: stats.losses,
            total: stats.wins + stats.losses,
            winRate: stats.wins + stats.losses > 0 
              ? (stats.wins / (stats.wins + stats.losses)) * 100 
              : 0,
            cumulativeWinRate: total > 0 ? (running.wins / total) * 100 : 0,
          });
        }
        
        // Only include days with some activity
        if (algorithms.some(a => a.total > 0)) {
          dailyTrends.push({
            date,
            displayDate: format(new Date(date), 'MMM d'),
            algorithms,
          });
        }
      }

      return {
        algorithms,
        headToHead,
        consensusPicks: consensusPicks.slice(0, 50), // Limit for performance
        performanceByContext: { byLeague, byConfidence },
        dailyTrends,
        agreementStats: {
          fullAgreement,
          partialAgreement,
          noAgreement,
          fullAgreementWinRate: fullAgreementTotal > 0 ? (fullAgreementWins / fullAgreementTotal) * 100 : 0,
          partialAgreementWinRate: partialAgreementTotal > 0 ? (partialAgreementWins / partialAgreementTotal) * 100 : 0,
          noAgreementWinRate: noAgreementTotal > 0 ? (noAgreementWins / noAgreementTotal) * 100 : 0,
        },
      };
    },
    staleTime: 60000,
    refetchInterval: 300000,
  });
}
