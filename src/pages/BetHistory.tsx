import { useState, useMemo, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import PageFooter from '@/components/PageFooter';
import AppBreadcrumb from '@/components/layout/AppBreadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MinusCircle,
  DollarSign,
  Target,
  Percent,
  BarChart3,
  RefreshCw,
  Loader2,
  Calendar,
  Zap,
  Award,
  ExternalLink
} from 'lucide-react';
import { useBetSlip } from '@/components/BetSlip/BetSlipContext';
import { useAuth } from '@/hooks/useAuth';
import { UserBet, BetStatus } from '@/types/betting';
import { format } from 'date-fns';
import { isDevMode } from '@/utils/devMode';
import WeeklyPerformanceSummary from '@/components/WeeklyPerformanceSummary';
import HistoricalPredictionsSection from '@/components/HistoricalPredictionsSection';
import AlgorithmAccuracyDashboard from '@/components/AlgorithmAccuracyDashboard';
import VirtualizedList from '@/components/VirtualizedList';
import BetDetailsDialog from '@/components/BetDetailsDialog';

const statusConfig: Record<BetStatus, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-500', label: 'Pending' },
  won: { icon: CheckCircle, color: 'text-green-500', label: 'Won' },
  lost: { icon: XCircle, color: 'text-red-500', label: 'Lost' },
  push: { icon: MinusCircle, color: 'text-muted-foreground', label: 'Push' },
  cancelled: { icon: XCircle, color: 'text-muted-foreground', label: 'Cancelled' },
};

// Memoized bet row component
const BetRow = memo(function BetRow({ 
  bet, 
  onSettle,
  onClick
}: { 
  bet: UserBet; 
  onSettle: (bet: UserBet, status: BetStatus) => void;
  onClick: () => void;
}) {
  const StatusIcon = statusConfig[bet.status].icon;
  
  return (
    <div 
      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer group"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
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
              {bet.selection} @ {bet.odds_at_placement > 0 ? '+' : ''}{Math.round(bet.odds_at_placement)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {format(new Date(bet.placed_at), 'MMM d, yyyy h:mm a')}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="font-medium">${bet.stake.toFixed(2)}</p>
          {bet.status === 'pending' ? (
            <div className="flex gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-green-600 hover:bg-green-50 hover:text-green-700"
                onClick={() => onSettle(bet, 'won')}
              >
                Won
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => onSettle(bet, 'lost')}
              >
                Lost
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => onSettle(bet, 'push')}
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
        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
});

// Stats card component
const StatCard = memo(function StatCard({ 
  icon: Icon, 
  value, 
  label, 
  valueClassName 
}: { 
  icon: React.ElementType; 
  value: string | number; 
  label: string;
  valueClassName?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <div>
            <p className={`text-2xl font-bold ${valueClassName || ''}`}>{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default function BetHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const devMode = isDevMode();
  const { bets, stats, isLoading, updateBetStatus, refetch } = useBetSlip();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(!user && !devMode ? 'predictions' : 'bets');
  const [selectedBet, setSelectedBet] = useState<UserBet | null>(null);
  const [betDialogOpen, setBetDialogOpen] = useState(false);

  const handleBetClick = useCallback((bet: UserBet) => {
    setSelectedBet(bet);
    setBetDialogOpen(true);
  }, []);

  const filteredBets = useMemo(() => {
    return statusFilter === 'all' 
      ? bets 
      : bets.filter((b) => b.status === statusFilter);
  }, [bets, statusFilter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleSettleBet = useCallback(async (bet: UserBet, status: BetStatus) => {
    let profit = 0;
    if (status === 'won') {
      profit = bet.potential_payout - bet.stake;
    } else if (status === 'lost') {
      profit = -bet.stake;
    }
    await updateBetStatus(bet.id, status, profit);
  }, [updateBetStatus]);

  // Memoized stats display values
  const statsDisplay = useMemo(() => {
    if (!stats) return null;
    
    const winRate = stats.total_bets > 0 
      ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1) 
      : '0';
    
    return {
      totalBets: stats.total_bets,
      winRate: `${winRate}%`,
      roi: `${stats.roi_percentage >= 0 ? '+' : ''}${stats.roi_percentage.toFixed(1)}%`,
      roiClass: stats.roi_percentage >= 0 ? 'text-green-500' : 'text-red-500',
      profit: `${stats.total_profit >= 0 ? '+' : '-'}$${Math.abs(stats.total_profit).toFixed(2)}`,
      profitClass: stats.total_profit >= 0 ? 'text-green-500' : 'text-red-500',
    };
  }, [stats]);

  const isAuthenticated = user || devMode;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      <NavBar />
      <main className="flex-1 container px-4 py-6">
        <AppBreadcrumb className="mb-4" />
        
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Bet History</h1>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="flex-wrap h-auto gap-1">
            {isAuthenticated && (
              <TabsTrigger value="bets" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Your Bets
              </TabsTrigger>
            )}
            <TabsTrigger value="predictions" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              AI Predictions
            </TabsTrigger>
            <TabsTrigger value="accuracy" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Accuracy
            </TabsTrigger>
            {isAuthenticated && (
              <TabsTrigger value="summary" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Weekly Summary
              </TabsTrigger>
            )}
          </TabsList>

          {isAuthenticated && (
            <TabsContent value="bets" className="mt-6">
              {/* Stats Overview */}
              {statsDisplay && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <StatCard icon={Target} value={statsDisplay.totalBets} label="Total Bets" />
                  <StatCard icon={Percent} value={statsDisplay.winRate} label="Win Rate" />
                  <StatCard 
                    icon={BarChart3} 
                    value={statsDisplay.roi} 
                    label="ROI" 
                    valueClassName={statsDisplay.roiClass}
                  />
                  <StatCard 
                    icon={DollarSign} 
                    value={statsDisplay.profit} 
                    label="Total Profit"
                    valueClassName={statsDisplay.profitClass}
                  />
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
                    <VirtualizedList
                      items={filteredBets}
                      renderItem={(bet) => (
                        <BetRow bet={bet} onSettle={handleSettleBet} />
                      )}
                      estimatedItemHeight={100}
                      maxHeight={600}
                      className="space-y-3"
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="predictions" className="mt-6">
            <HistoricalPredictionsSection />
          </TabsContent>

          <TabsContent value="accuracy" className="mt-6">
            <AlgorithmAccuracyDashboard />
          </TabsContent>

          {isAuthenticated && (
            <TabsContent value="summary" className="mt-6">
              <WeeklyPerformanceSummary />
            </TabsContent>
          )}
        </Tabs>
      </main>
      <PageFooter />
    </div>
  );
}
