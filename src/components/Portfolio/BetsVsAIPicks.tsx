import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserBet } from '@/types/betting';
import { Brain, User, TrendingUp, TrendingDown, Equal, CheckCircle, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface BetsVsAIPicksProps {
  bets: UserBet[];
}

export default function BetsVsAIPicks({ bets }: BetsVsAIPicksProps) {
  // Fetch AI predictions that overlap with user bet match IDs
  const matchIds = useMemo(() => bets.map(b => b.match_id), [bets]);

  const { data: aiPredictions } = useQuery({
    queryKey: ['ai-predictions-for-comparison', matchIds.slice(0, 50)],
    queryFn: async () => {
      if (matchIds.length === 0) return [];
      const { data } = await supabase
        .from('algorithm_predictions')
        .select('*')
        .in('match_id', matchIds.slice(0, 50))
        .order('predicted_at', { ascending: false });
      return data || [];
    },
    enabled: matchIds.length > 0,
  });

  const comparison = useMemo(() => {
    if (!aiPredictions || aiPredictions.length === 0) return null;

    // Match user bets with AI predictions
    const matched: Array<{
      bet: UserBet;
      aiPick: string | null;
      aiConfidence: number | null;
      agreed: boolean | null;
      userResult: string;
      aiResult: string | null;
    }> = [];

    const settledBets = bets.filter(b => b.status === 'won' || b.status === 'lost');

    settledBets.forEach(bet => {
      const aiPred = aiPredictions.find(p => p.match_id === bet.match_id);
      if (!aiPred) return;

      const aiPick = aiPred.prediction || null;
      const aiConfidence = aiPred.confidence || aiPred.adjusted_confidence || null;
      
      // Simple agreement check: does AI pick contain same team reference as user selection
      const agreed = aiPick && bet.selection
        ? aiPick.toLowerCase().includes(bet.selection.split(' ')[0].toLowerCase()) ||
          bet.selection.toLowerCase().includes((aiPick.split(' ')[0] || '').toLowerCase())
        : null;

      matched.push({
        bet,
        aiPick: aiPick ? String(aiPick) : null,
        aiConfidence: aiConfidence ? Number(aiConfidence) : null,
        agreed,
        userResult: bet.status,
        aiResult: aiPred.status === 'correct' ? 'won' : aiPred.status === 'incorrect' ? 'lost' : null,
      });
    });

    const userWins = matched.filter(m => m.userResult === 'won').length;
    const userLosses = matched.filter(m => m.userResult === 'lost').length;
    const aiWins = matched.filter(m => m.aiResult === 'won').length;
    const aiLosses = matched.filter(m => m.aiResult === 'lost').length;
    const agreements = matched.filter(m => m.agreed === true).length;
    const disagreements = matched.filter(m => m.agreed === false).length;

    return {
      matched,
      userWinRate: (userWins + userLosses) > 0 ? (userWins / (userWins + userLosses)) * 100 : 0,
      aiWinRate: (aiWins + aiLosses) > 0 ? (aiWins / (aiWins + aiLosses)) * 100 : 0,
      totalMatched: matched.length,
      agreements,
      disagreements,
      userWins,
      userLosses,
      aiWins,
      aiLosses,
    };
  }, [bets, aiPredictions]);

  if (!comparison || comparison.totalMatched === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Brain className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No overlapping data between your bets and AI predictions yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Place bets on games the AI has predicted to see comparisons.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Head-to-Head Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">You vs. AI — Head to Head</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-muted/30">
              <User className="h-6 w-6 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{comparison.userWinRate.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">Your Win Rate</p>
              <p className="text-xs text-muted-foreground">{comparison.userWins}W-{comparison.userLosses}L</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 flex flex-col items-center justify-center">
              <Equal className="h-6 w-6 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">{comparison.totalMatched} games</p>
              <p className="text-xs text-muted-foreground">compared</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <Brain className="h-6 w-6 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{comparison.aiWinRate.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">AI Win Rate</p>
              <p className="text-xs text-muted-foreground">{comparison.aiWins}W-{comparison.aiLosses}L</p>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg border">
            <p className="text-sm text-muted-foreground">
              You and the AI agreed on <span className="font-medium text-foreground">{comparison.agreements}</span> picks
              and disagreed on <span className="font-medium text-foreground">{comparison.disagreements}</span>.
              {comparison.userWinRate > comparison.aiWinRate
                ? " 🎯 You're outperforming the AI!"
                : comparison.userWinRate < comparison.aiWinRate
                ? " 🤖 The AI has a slight edge. Consider its picks more!"
                : " 🤝 You're neck and neck!"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Matched Bets List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Matched Games</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
          {comparison.matched.slice(0, 20).map((m, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.bet.match_title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    <User className="h-3 w-3 mr-1" />
                    {m.bet.selection}
                  </Badge>
                  {m.aiPick && (
                    <Badge variant="secondary" className="text-xs">
                      <Brain className="h-3 w-3 mr-1" />
                      {m.aiPick}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                {m.agreed ? (
                  <Badge className="bg-green-500/10 text-green-500 text-xs">Agreed</Badge>
                ) : m.agreed === false ? (
                  <Badge className="bg-yellow-500/10 text-yellow-500 text-xs">Disagreed</Badge>
                ) : null}
                {m.userResult === 'won' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
