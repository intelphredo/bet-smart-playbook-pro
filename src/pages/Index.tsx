// ESPN-style Home Page - Tab-based clean dashboard with performance optimizations
import { useState, useMemo, useCallback, useDeferredValue, startTransition, memo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Match } from "@/types/sports";
import NavBar from "@/components/NavBar";
import PageFooter from "@/components/PageFooter";
import PremiumHero from "@/components/PremiumHero";
import { useSportsData } from "@/hooks/useSportsData";
import { useArbitrageCalculator } from "@/hooks/useArbitrageCalculator";
import { useBetTracking } from "@/hooks/useBetTracking";
import { applySmartScores } from "@/utils/smartScoreCalculator";
import { useLockedPredictions } from "@/hooks/useLockedPredictions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/hooks/usePreferences";

// Layout Components
import { ScoreboardStrip } from "@/components/layout/ScoreboardStrip";
import { MemoizedScoreboardRow } from "@/components/layout/MemoizedScoreboardRow";
import TopLoader from "@/components/ui/TopLoader";

// Feature Components
import ConfidentPicks from "@/components/ConfidentPicks";
import SmartScoreSection from "@/components/SmartScoreSection";
import ArbitrageOpportunitiesSection from "@/components/ArbitrageOpportunitiesSection";
import { HighValueAlertBanner } from "@/components/HighValueAlertBanner";
import { useHighValueAlerts } from "@/hooks/useHighValueAlerts";
import { SharpMoneySection, SteamMoveMonitor, SharpMoneyLeaderboard } from "@/components/SharpMoney";
import LiveRefreshIndicator from "@/components/LiveRefreshIndicator";
import FavoritesTab from "@/components/FavoritesTab";
import { AnimatedBadge } from "@/components/ui/AnimatedBadge";
import { SpotlightHeader, UpcomingAlertsBadge } from "@/components/SpotlightValuePicks";
import { PredictionDisclaimer } from "@/components/legal";
import { useSmartNotifications } from "@/hooks/useSmartNotifications";
import { RankingsTable } from "@/components/NCAAB";
import { LiveScoresProvider } from "@/providers/LiveScoresProvider";
import { SavingsWidget } from "@/components/Savings/SavingsWidget";

import { 
  Radio, Clock, TrendingUp, RefreshCw, ChevronRight, 
  Trophy, Zap, DollarSign, Activity, Brain, BarChart3,
  Target, Flame, LineChart, Star
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GroupedLeagueSelect, LEAGUE_CATEGORIES } from "@/components/filters/GroupedLeagueSelect";
import { motion } from "framer-motion";

const RESULTS_PER_PAGE_OPTIONS = [5, 10, 25, 50];

// Get all available leagues from categories
const ALL_LEAGUES = Object.values(LEAGUE_CATEGORIES).flatMap(cat => cat.leagues);

// Tab persistence key
const TAB_STORAGE_KEY = 'betly-active-tab';

const Index = () => {
  const navigate = useNavigate();
  const [selectedLeague, setSelectedLeague] = useState<string>("ALL");
  // Tab persistence - restore from localStorage
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TAB_STORAGE_KEY) || 'scores';
    }
    return 'scores';
  });
  const [recentResultsLimit, setRecentResultsLimit] = useState<number>(5);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const { toast } = useToast();
  const { stats } = useBetTracking();
  const { preferences } = usePreferences();

  // Deferred league value for non-blocking filter updates
  const deferredLeague = useDeferredValue(selectedLeague);

  // Persist tab changes
  useEffect(() => {
    localStorage.setItem(TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  // Optimized tab change with transition
  const handleTabChange = useCallback((value: string) => {
    startTransition(() => {
      setActiveTab(value);
    });
  }, []);

  // Optimized league change with transition
  const handleLeagueChange = useCallback((league: string) => {
    startTransition(() => {
      setSelectedLeague(league);
    });
  }, []);

  // Count favorites for badge (safe access for potentially missing arrays)
  const favMatches = Array.isArray(preferences?.favorites?.matches) ? preferences.favorites.matches : [];
  const favTeams = Array.isArray(preferences?.favorites?.teams) ? preferences.favorites.teams : [];
  const favoritesCount = favMatches.length + favTeams.length;

  const handleMatchClick = (match: Match) => {
    navigate(`/game/${match.id}`);
  };

  const {
    upcomingMatches: rawUpcoming,
    liveMatches: rawLive,
    finishedMatches: rawFinished,
    isLoading,
    isFetching,
    refetchWithTimestamp,
    hasLiveGames,
    lastRefresh: dataLastRefresh,
    secondsUntilRefresh,
    activeInterval,
  } = useSportsData({
    league: selectedLeague as any,
    refreshInterval: 60000,
    useExternalApis: true,
  });

  // Hydrate locked predictions cache from DB so prediction engine respects pre-live locks
  const allMatchIds = useMemo(() => [...rawUpcoming, ...rawLive].map(m => m.id), [rawUpcoming, rawLive]);
  useLockedPredictions(allMatchIds.length > 0 ? allMatchIds : undefined);

  // Apply smart scores
  const upcomingMatches = useMemo(() => applySmartScores(rawUpcoming), [rawUpcoming]);
  const liveMatches = useMemo(() => applySmartScores(rawLive), [rawLive]);
  const finishedMatches = useMemo(() => rawFinished, [rawFinished]);

  // Filter by league
  const filterByLeague = (matches: Match[]) => {
    if (selectedLeague === "ALL") return matches;
    return matches.filter(m => m.league?.toUpperCase() === selectedLeague);
  };

  const filteredUpcoming = useMemo(() => filterByLeague(upcomingMatches), [upcomingMatches, selectedLeague]);
  const filteredLive = useMemo(() => filterByLeague(liveMatches), [liveMatches, selectedLeague]);
  const filteredFinished = useMemo(() => filterByLeague(finishedMatches), [finishedMatches, selectedLeague]);

  // Arbitrage
  const allMatchesWithOdds = useMemo(() => 
    [...filteredUpcoming, ...filteredLive].filter(m => m.liveOdds && Array.isArray(m.liveOdds) && m.liveOdds.length >= 2),
    [filteredUpcoming, filteredLive]
  );
  const { opportunities } = useArbitrageCalculator(allMatchesWithOdds);

  // High-value alerts
  const allActiveMatches = useMemo(() => [...filteredUpcoming, ...filteredLive], [filteredUpcoming, filteredLive]);
  useHighValueAlerts({
    matches: allActiveMatches,
    confidenceThreshold: 75,
    smartScoreThreshold: 70,
    evThreshold: 5,
    enabled: true,
  });

  // Smart 24/2 notifications with injury monitoring
  const { 
    alerts: smartAlerts, 
    alertsToday, 
    remainingAlerts,
    injuryAlertsCount,
    isInjuryScanning 
  } = useSmartNotifications({
    matches: allActiveMatches,
    enabled: true,
    valueThreshold: 5,
    confidenceThreshold: 70,
    maxAlertsPerDay: 2,
    enableInjuryMonitoring: true,
  });

  const handleRefresh = () => {
    refetchWithTimestamp();
    setLastRefresh(new Date());
    toast({ title: "Data refreshed", description: "Latest sports data loaded" });
  };

  // Combined scores for ticker
  const allScores = useMemo(() => 
    [...filteredLive, ...filteredFinished.slice(0, 10), ...filteredUpcoming.slice(0, 10)],
    [filteredLive, filteredFinished, filteredUpcoming]
  );

  // Calculate high confidence picks count
  const highConfidencePicks = useMemo(() => 
    [...filteredUpcoming, ...filteredLive].filter(m => (m.prediction?.confidence || 0) >= 75).length,
    [filteredUpcoming, filteredLive]
  );

  // All matches for live scores provider
  const allMatchesForLiveScores = useMemo(() => 
    [...filteredLive, ...filteredUpcoming, ...filteredFinished.slice(0, 20)],
    [filteredLive, filteredUpcoming, filteredFinished]
  );

  // Get match IDs with user bets for priority polling
  const matchesWithBets = useMemo<string[]>(() => [], []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopLoader isLoading={isLoading} />
      <NavBar />

      {/* Premium Hero Section */}
      <PremiumHero 
        liveGamesCount={filteredLive.length}
        upcomingGamesCount={filteredUpcoming.length}
        highConfidencePicks={highConfidencePicks}
      />

      {/* Live Scores Provider - Enables tiered polling for all matches */}
      <LiveScoresProvider
        matches={allMatchesForLiveScores}
        matchesWithBets={matchesWithBets}
        enabled={true}
        onScoreChange={(matchId, score) => {
          console.log(`[LiveScores] Score update for ${matchId}:`, score);
        }}
      >
        {/* Scores Ticker */}
        <ScoreboardStrip matches={allScores.slice(0, 20)} />

      {/* Main Content */}
      <main className="flex-1">
        {/* Header Bar with League Filter + Refresh */}
        <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="container px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* League Filter */}
              <div className="flex items-center gap-3">
                <GroupedLeagueSelect
                  value={selectedLeague === "ALL" ? "all" : selectedLeague}
                  onValueChange={(val) => setSelectedLeague(val === "all" ? "ALL" : val)}
                  leagues={ALL_LEAGUES}
                  allLabel={`All Leagues (${(rawUpcoming?.length ?? 0) + (rawLive?.length ?? 0)})`}
                  className="w-[200px]"
                />
              </div>
              
              <div className="flex items-center gap-3 shrink-0">
                <LiveRefreshIndicator
                  hasLiveGames={hasLiveGames}
                  secondsUntilRefresh={secondsUntilRefresh}
                  isFetching={isFetching}
                  lastRefresh={dataLastRefresh}
                  activeInterval={activeInterval}
                />
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading || isFetching}>
                  <RefreshCw className={cn("h-4 w-4", (isLoading || isFetching) && "animate-spin")} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="container px-4 py-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            {/* Tab Navigation - Premium Gold Styling */}
            <TabsList className="relative grid w-full max-w-2xl mx-auto grid-cols-4 h-14 bg-gradient-to-r from-card/90 via-card to-card/90 backdrop-blur-md border border-primary/10 shadow-lg shadow-primary/5 rounded-xl p-1.5">
              <TabsTrigger 
                value="scores" 
                className="relative gap-2 text-sm rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/15 data-[state=active]:via-primary/10 data-[state=active]:to-transparent data-[state=active]:shadow-md data-[state=active]:shadow-primary/10"
              >
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Activity className="h-4 w-4 group-data-[state=active]:text-primary transition-colors" />
                </motion.div>
                <span className="hidden sm:inline font-medium">Scores</span>
                <AnimatedBadge count={filteredLive.length} variant="live" pulse />
              </TabsTrigger>
              <TabsTrigger 
                value="favorites" 
                className="relative gap-2 text-sm rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/15 data-[state=active]:via-primary/10 data-[state=active]:to-transparent data-[state=active]:shadow-md data-[state=active]:shadow-primary/10"
              >
                <motion.div whileHover={{ scale: 1.1, rotate: 15 }} whileTap={{ scale: 0.95 }}>
                  <Star className="h-4 w-4" />
                </motion.div>
                <span className="hidden sm:inline font-medium">Favorites</span>
                <AnimatedBadge count={favoritesCount} variant="gold" />
              </TabsTrigger>
              <TabsTrigger 
                value="picks" 
                className="relative gap-2 text-sm rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/15 data-[state=active]:via-primary/10 data-[state=active]:to-transparent data-[state=active]:shadow-md data-[state=active]:shadow-primary/10"
              >
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Target className="h-4 w-4" />
                </motion.div>
                <span className="hidden sm:inline font-medium">Picks</span>
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="relative gap-2 text-sm rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/15 data-[state=active]:via-primary/10 data-[state=active]:to-transparent data-[state=active]:shadow-md data-[state=active]:shadow-primary/10"
              >
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <BarChart3 className="h-4 w-4" />
                </motion.div>
                <span className="hidden sm:inline font-medium">Analytics</span>
                <AnimatedBadge count={opportunities.length} variant="success" />
              </TabsTrigger>
            </TabsList>

            {/* Prediction Disclaimer */}
            <PredictionDisclaimer className="mb-4" />

            {/* Spotlight Value Picks - "Bet with Rights" header */}
            <SpotlightHeader
              matches={allActiveMatches}
              onViewMatch={handleMatchClick}
              maxPicks={3}
              minConfidence={65}
              minEV={3}
            />
            {/* Scores Tab */}
            <TabsContent value="scores" className="space-y-6 mt-0">
              <motion.div
                key="scores"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="space-y-6"
              >
                {/* Live Games */}
                {filteredLive.length > 0 && (
                  <Card className="border-destructive/30 premium-card">
                    <CardHeader className="py-4 px-6 flex flex-row items-center justify-between bg-destructive/5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-destructive/10">
                          <Radio className="h-5 w-5 text-destructive animate-pulse" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Live Now</CardTitle>
                          <p className="text-sm text-muted-foreground">{filteredLive.length} games in progress</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => navigate('/live')} className="text-primary hover:text-primary hover:bg-primary/10">
                        View All <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-border/50">
                        {filteredLive.map((match) => (
                          <MemoizedScoreboardRow key={match.id} match={match} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Upcoming Games */}
                <Card className="premium-card border-primary/20">
                  <CardHeader className="py-4 px-6 flex flex-row items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Upcoming</CardTitle>
                        <p className="text-sm text-muted-foreground">{filteredUpcoming.length} scheduled games</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/games')} className="text-primary hover:text-primary hover:bg-primary/10">
                      Full Schedule <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/50">
                      {filteredUpcoming.slice(0, 8).map((match) => (
                        <MemoizedScoreboardRow key={match.id} match={match} />
                      ))}
                      {filteredUpcoming.length === 0 && (
                        <div className="py-16 text-center text-muted-foreground">
                          <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                          <p>No upcoming games</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Results */}
                {filteredFinished.length > 0 && (
                  <Card className="premium-card">
                    <CardHeader className="py-4 px-6 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Trophy className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Recent Results</CardTitle>
                          <p className="text-sm text-muted-foreground">Latest completed games</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select value={String(recentResultsLimit)} onValueChange={(v) => setRecentResultsLimit(Number(v))}>
                          <SelectTrigger className="w-[100px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RESULTS_PER_PAGE_OPTIONS.map(option => (
                              <SelectItem key={option} value={String(option)}>
                                {option} results
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate('/recent-results')}
                          className="flex items-center gap-1"
                        >
                          View All
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {filteredFinished.slice(0, recentResultsLimit).map((match) => (
                          <MemoizedScoreboardRow key={match.id} match={match} showOdds={false} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </TabsContent>

            {/* Favorites Tab */}
            <TabsContent value="favorites" className="space-y-6 mt-0">
              <motion.div
                key="favorites"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <FavoritesTab allMatches={[...filteredUpcoming, ...filteredLive, ...filteredFinished]} />
              </motion.div>
            </TabsContent>

            {/* Picks Tab */}
            <TabsContent value="picks" className="space-y-6 mt-0">
              <motion.div
                key="picks"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="grid gap-6 md:grid-cols-2"
              >
                {/* Sharp Money */}
                <Card className="border-purple-500/30 md:col-span-2">
                  <CardHeader className="py-4 px-6 bg-purple-500/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-purple-500/10">
                        <Brain className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Sharp Money</CardTitle>
                        <p className="text-sm text-muted-foreground">Professional betting action signals</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <SharpMoneySection 
                      matches={allActiveMatches} 
                      league={selectedLeague as any}
                      maxItems={6}
                      showFilter={true}
                      compact={false}
                    />
                  </CardContent>
                </Card>

                {/* AI Picks - Pass matches to prevent duplicate fetch */}
                <Card>
                  <CardHeader className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Zap className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">AI Picks</CardTitle>
                        <p className="text-sm text-muted-foreground">Algorithm-powered selections</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ConfidentPicks matches={allActiveMatches} />
                  </CardContent>
                </Card>

                {/* Smart Scores */}
                <Card>
                  <CardHeader className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-green-500/10">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Top Rated</CardTitle>
                        <p className="text-sm text-muted-foreground">Highest value opportunities</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <SmartScoreSection matches={filteredUpcoming.slice(0, 5)} />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6 mt-0">
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="space-y-6"
              >
                {/* Bet Savings Vault */}
                <SavingsWidget />

                {/* Stats Overview */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard 
                    icon={<Trophy className="h-5 w-5" />}
                    label="Win Rate" 
                    value={`${((stats?.wins || 0) / Math.max(stats?.total_bets || 1, 1) * 100).toFixed(0)}%`}
                    positive={(stats?.wins || 0) / Math.max(stats?.total_bets || 1, 1) >= 0.5}
                    color="primary"
                  />
                  <StatCard 
                    icon={<DollarSign className="h-5 w-5" />}
                    label="Profit/Loss" 
                    value={`${(stats?.total_profit || 0) >= 0 ? '+' : ''}$${Math.abs(stats?.total_profit || 0).toFixed(0)}`}
                    positive={(stats?.total_profit || 0) >= 0}
                    color={(stats?.total_profit || 0) >= 0 ? "green" : "red"}
                  />
                  <StatCard 
                    icon={<Activity className="h-5 w-5" />}
                    label="Total Bets" 
                    value={stats?.total_bets?.toString() || '0'}
                    color="blue"
                  />
                  <StatCard 
                    icon={<Flame className="h-5 w-5" />}
                    label="Current Streak" 
                    value={stats?.current_streak?.toString() || '0'}
                    positive={(stats?.current_streak || 0) > 0}
                    color={(stats?.current_streak || 0) > 0 ? "green" : "red"}
                  />
                </div>

                {/* Arbitrage Opportunities */}
                <Card className={cn(
                  opportunities.length > 0 && "border-green-500/30"
                )}>
                  <CardHeader className="py-4 px-6 bg-green-500/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-green-500/10">
                          <DollarSign className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Arbitrage Opportunities</CardTitle>
                          <p className="text-sm text-muted-foreground">Risk-free profit opportunities</p>
                        </div>
                      </div>
                      {opportunities.length > 0 && (
                        <Badge className="bg-green-500 text-white">
                          {opportunities.length} Found
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {opportunities.length > 0 ? (
                      <ArbitrageOpportunitiesSection
                        selectedLeague={selectedLeague as any}
                        arbitrageOpportunitiesToShow={opportunities.slice(0, 5)}
                      />
                    ) : (
                      <div className="py-12 text-center text-muted-foreground">
                        <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p>No arbitrage opportunities found</p>
                        <p className="text-xs mt-1">Check back when more odds are available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* NCAAB Rankings - Show when NCAAB is selected */}
                {(selectedLeague === "NCAAB" || selectedLeague === "ALL") && (
                  <RankingsTable 
                    maxTeams={25} 
                    compact={selectedLeague === "ALL"}
                  />
                )}

                {/* Sharp Money Leaderboard */}
                <Card>
                  <CardHeader className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-purple-500/10">
                        <LineChart className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Sharp Money Performance</CardTitle>
                        <p className="text-sm text-muted-foreground">Track professional betting signals</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <SharpMoneyLeaderboard />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      </LiveScoresProvider>

      <PageFooter />
    </div>
  );
};

// Stat Card Component
function StatCard({ 
  icon, 
  label, 
  value, 
  positive, 
  color = "primary" 
}: { 
  icon: React.ReactNode;
  label: string; 
  value: string; 
  positive?: boolean;
  color?: "primary" | "green" | "red" | "blue";
}) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    green: "bg-green-500/10 text-green-500",
    red: "bg-red-500/10 text-red-500",
    blue: "bg-blue-500/10 text-blue-500",
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-full", colorClasses[color])}>
            {icon}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={cn(
              "text-xl font-bold",
              positive === true && "text-green-500",
              positive === false && "text-red-500"
            )}>
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default Index;
