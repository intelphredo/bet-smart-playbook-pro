// ESPN-style Home Page - Tab-based clean dashboard
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Match } from "@/types/sports";
import NavBar from "@/components/NavBar";
import PageFooter from "@/components/PageFooter";
import { useSportsData } from "@/hooks/useSportsData";
import { useArbitrageCalculator } from "@/hooks/useArbitrageCalculator";
import { useBetTracking } from "@/hooks/useBetTracking";
import { applySmartScores } from "@/utils/smartScoreCalculator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/hooks/usePreferences";

// Layout Components
import { ScoreboardStrip } from "@/components/layout/ScoreboardStrip";
import { ScoreboardRow } from "@/components/layout/ScoreboardRow";
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
import { motion, AnimatePresence } from "framer-motion";

// League filter options
const LEAGUES = ['ALL', 'NBA', 'NFL', 'NCAAB', 'NHL', 'MLB', 'SOCCER'];

const Index = () => {
  const navigate = useNavigate();
  const [selectedLeague, setSelectedLeague] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<string>("scores");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const { toast } = useToast();
  const { stats } = useBetTracking();
  const { preferences } = usePreferences();

  // Count favorites for badge
  const favoritesCount = preferences.favorites.matches.length + preferences.favorites.teams.length;

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
    [...filteredUpcoming, ...filteredLive].filter(m => m.liveOdds && m.liveOdds.length >= 2),
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopLoader isLoading={isLoading} />
      <NavBar />

      {/* Scores Ticker */}
      <ScoreboardStrip matches={allScores.slice(0, 20)} />

      {/* Main Content */}
      <main className="flex-1">
        {/* Header Bar with League Filter + Refresh */}
        <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="container px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* League Pills */}
              <ScrollArea className="flex-1 -mx-2">
                <div className="flex items-center gap-2 px-2">
                  {LEAGUES.map((league) => (
                    <Button
                      key={league}
                      variant={selectedLeague === league ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedLeague(league)}
                      className="shrink-0 rounded-full"
                    >
                      {league}
                      {league === 'ALL' && (
                        <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">
                          {rawUpcoming.length + rawLive.length}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
              
              <div className="flex items-center gap-3 shrink-0">
                <SteamMoveMonitor matches={allActiveMatches} enabled={true} />
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Tab Navigation */}
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 h-12">
              <TabsTrigger value="scores" className="gap-2 text-sm">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Scores</span>
                {filteredLive.length > 0 && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-[10px] animate-pulse">
                    {filteredLive.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="favorites" className="gap-2 text-sm">
                <Star className="h-4 w-4" />
                <span className="hidden sm:inline">Favorites</span>
                {favoritesCount > 0 && (
                  <Badge className="bg-yellow-500 h-5 px-1.5 text-[10px]">
                    {favoritesCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="picks" className="gap-2 text-sm">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Picks</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2 text-sm">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
                {opportunities.length > 0 && (
                  <Badge className="bg-green-500 h-5 px-1.5 text-[10px]">
                    {opportunities.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* High Value Alerts - Always visible */}
            <HighValueAlertBanner
              matches={allActiveMatches}
              confidenceThreshold={75}
              smartScoreThreshold={70}
              evThreshold={5}
              maxAlerts={3}
              onMatchClick={handleMatchClick}
            />

            {/* Scores Tab */}
            <TabsContent value="scores" className="space-y-6 mt-0">
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Live Games */}
                  {filteredLive.length > 0 && (
                    <Card className="border-red-500/30">
                      <CardHeader className="py-4 px-6 flex flex-row items-center justify-between bg-red-500/5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-red-500/10">
                            <Radio className="h-5 w-5 text-red-500 animate-pulse" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Live Now</CardTitle>
                            <p className="text-sm text-muted-foreground">{filteredLive.length} games in progress</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/live')}>
                          View All <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y">
                          {filteredLive.map((match) => (
                            <ScoreboardRow key={match.id} match={match} />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Upcoming Games */}
                  <Card>
                    <CardHeader className="py-4 px-6 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Upcoming</CardTitle>
                          <p className="text-sm text-muted-foreground">{filteredUpcoming.length} scheduled games</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => navigate('/games')}>
                        Full Schedule <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {filteredUpcoming.slice(0, 8).map((match) => (
                          <ScoreboardRow key={match.id} match={match} />
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
                    <Card>
                      <CardHeader className="py-4 px-6 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-muted">
                            <Trophy className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Recent Results</CardTitle>
                            <p className="text-sm text-muted-foreground">Latest completed games</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y">
                          {filteredFinished.slice(0, 5).map((match) => (
                            <ScoreboardRow key={match.id} match={match} showOdds={false} />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              </AnimatePresence>
            </TabsContent>

            {/* Favorites Tab */}
            <TabsContent value="favorites" className="space-y-6 mt-0">
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <FavoritesTab allMatches={[...filteredUpcoming, ...filteredLive, ...filteredFinished]} />
                </motion.div>
              </AnimatePresence>
            </TabsContent>

            {/* Picks Tab */}
            <TabsContent value="picks" className="space-y-6 mt-0">
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
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

                  {/* AI Picks */}
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
                      <ConfidentPicks />
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
              </AnimatePresence>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6 mt-0">
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
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
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </div>
      </main>

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
