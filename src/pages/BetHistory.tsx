import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import PageFooter from '@/components/PageFooter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MinusCircle,
  ArrowLeft,
  DollarSign,
  Target,
  Percent,
  BarChart3,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useBetSlip } from '@/components/BetSlip/BetSlipContext';
import { useAuth } from '@/hooks/useAuth';
import { UserBet, BetStatus } from '@/types/betting';
import { format } from 'date-fns';
import { isDevMode } from '@/utils/devMode';

const statusConfig: Record<BetStatus, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-500', label: 'Pending' },
  won: { icon: CheckCircle, color: 'text-green-500', label: 'Won' },
  lost: { icon: XCircle, color: 'text-red-500', label: 'Lost' },
  push: { icon: MinusCircle, color: 'text-muted-foreground', label: 'Push' },
  cancelled: { icon: XCircle, color: 'text-muted-foreground', label: 'Cancelled' },
};

export default function BetHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const devMode = isDevMode();
  const { bets, stats, isLoading, updateBetStatus, deleteBet, refetch } = useBetSlip();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredBets = statusFilter === 'all' 
    ? bets 
    : bets.filter((b) => b.status === statusFilter);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleSettleBet = async (bet: UserBet, status: BetStatus) => {
    let profit = 0;
    if (status === 'won') {
      profit = bet.potential_payout - bet.stake;
    } else if (status === 'lost') {
      profit = -bet.stake;
    }
    await updateBetStatus(bet.id, status, profit);
  };

  if (!user && !devMode) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-secondary/30 to-accent/10">
        <NavBar />
        <main className="flex-1 container px-4 py-12 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-bold mb-2">Track Your Bets</h2>
              <p className="text-muted-foreground mb-6">
                Login to start tracking your betting performance and see detailed analytics.
              </p>
              <Button onClick={() => navigate('/auth')}>Login to Continue</Button>
            </CardContent>
          </Card>
        </main>
        <PageFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      <NavBar />
      <main className="flex-1 container px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Bet History</h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{stats.total_bets}</p>
                    <p className="text-xs text-muted-foreground">Total Bets</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Percent className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">
                      {stats.total_bets > 0 ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1) : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">Win Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <div>
                    <p className={`text-2xl font-bold ${stats.roi_percentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {stats.roi_percentage >= 0 ? '+' : ''}{stats.roi_percentage.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">ROI</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <div>
                    <p className={`text-2xl font-bold ${stats.total_profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {stats.total_profit >= 0 ? '+' : '-'}${Math.abs(stats.total_profit).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Profit</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bets List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your Bets</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bets</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="push">Push</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredBets.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {statusFilter === 'all' 
                    ? 'No bets yet. Start tracking your bets to see them here.'
                    : `No ${statusFilter} bets found.`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBets.map((bet) => {
                  const StatusIcon = statusConfig[bet.status].icon;
                  return (
                    <div
                      key={bet.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <StatusIcon className={`h-5 w-5 mt-0.5 ${statusConfig[bet.status].color}`} />
                        <div>
                          <p className="font-medium">{bet.match_title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {bet.bet_type}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {bet.selection} @ {bet.odds_at_placement.toFixed(2)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(bet.placed_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${bet.stake.toFixed(2)}</p>
                        {bet.status === 'pending' ? (
                          <div className="flex gap-1 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-green-600 hover:bg-green-50 hover:text-green-700"
                              onClick={() => handleSettleBet(bet, 'won')}
                            >
                              Won
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => handleSettleBet(bet, 'lost')}
                            >
                              Lost
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => handleSettleBet(bet, 'push')}
                            >
                              Push
                            </Button>
                          </div>
                        ) : bet.result_profit !== undefined ? (
                          <p className={`text-sm font-medium ${bet.result_profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {bet.result_profit >= 0 ? '+' : ''}{bet.result_profit.toFixed(2)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <PageFooter />
    </div>
  );
}
