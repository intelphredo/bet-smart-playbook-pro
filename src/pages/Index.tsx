// ESPN-style Home Page - Clean, organized sports dashboard
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Match } from "@/types/sports";
import NavBar from "@/components/NavBar";
import PageFooter from "@/components/PageFooter";
import { useSportsData } from "@/hooks/useSportsData";
import { SportCategory } from "@/types/LeagueRegistry";
import { useArbitrageCalculator } from "@/hooks/useArbitrageCalculator";
import { useBetTracking } from "@/hooks/useBetTracking";
import { applySmartScores } from "@/utils/smartScoreCalculator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Layout Components
import { ScoreboardStrip } from "@/components/layout/ScoreboardStrip";
import { ScoreboardRow } from "@/components/layout/ScoreboardRow";
import { SidebarNav } from "@/components/layout/SidebarNav";
import TopLoader from "@/components/ui/TopLoader";

// Feature Components
import ConfidentPicks from "@/components/ConfidentPicks";
import SmartScoreSection from "@/components/SmartScoreSection";
import ArbitrageOpportunitiesSection from "@/components/ArbitrageOpportunitiesSection";
import { HighValueAlertBanner } from "@/components/HighValueAlertBanner";
import { useHighValueAlerts } from "@/hooks/useHighValueAlerts";

import { 
  Radio, Clock, TrendingUp, RefreshCw, ChevronRight, 
  Trophy, Zap, DollarSign, Activity, Calendar
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// League tabs for filtering
const LEAGUE_TABS = [
  { id: 'ALL', label: 'All', icon: Activity },
  { id: 'NBA', label: 'NBA', icon: Trophy },
  { id: 'NFL', label: 'NFL', icon: Trophy },
  { id: 'NCAAB', label: 'NCAAB', icon: Trophy },
  { id: 'NHL', label: 'NHL', icon: Trophy },
  { id: 'MLB', label: 'MLB', icon: Trophy },
  { id: 'SOCCER', label: 'Soccer', icon: Trophy },
];

const Index = () => {
  const navigate = useNavigate();
  const [selectedLeague, setSelectedLeague] = useState<string>("ALL");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const { toast } = useToast();
  const { stats } = useBetTracking();

  const handleMatchClick = (match: Match) => {
    navigate(`/game/${match.id}`);
  };

  const {
    upcomingMatches: rawUpcoming,
    liveMatches: rawLive,
    finishedMatches: rawFinished,
    isLoading,
    refetchWithTimestamp,
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

      {/* Main Layout */}
      <div className="flex-1 flex">
        {/* Sidebar - Hidden on mobile */}
        <SidebarNav liveCount={filteredLive.length} className="hidden lg:flex" />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {/* League Filter Bar */}
          <div className="border-b bg-muted/30 sticky top-0 z-30">
            <div className="container px-4">
              <div className="flex items-center justify-between py-2">
                <ScrollArea className="flex-1">
                  <div className="flex items-center gap-1">
                    {LEAGUE_TABS.map((tab) => (
                      <Button
                        key={tab.id}
                        variant={selectedLeague === tab.id ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setSelectedLeague(tab.id)}
                        className="shrink-0"
                      >
                        {tab.label}
                        {tab.id === 'ALL' && (
                          <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">
                            {rawUpcoming.length + rawLive.length}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {lastRefresh.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isLoading}
                  >
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* High Value Alerts */}
          <div className="container px-4 py-3">
            <HighValueAlertBanner
              matches={allActiveMatches}
              confidenceThreshold={75}
              smartScoreThreshold={70}
              evThreshold={5}
              maxAlerts={3}
              onMatchClick={handleMatchClick}
            />
          </div>

          {/* Content Grid */}
          <div className="container px-4 pb-8">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Main Scoreboard - 3 cols */}
              <div className="xl:col-span-3 space-y-6">
                {/* Live Games */}
                {filteredLive.length > 0 && (
                  <Card>
                    <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Radio className="h-4 w-4 text-red-500" />
                        <CardTitle className="text-base">Live Games</CardTitle>
                        <Badge variant="destructive" className="animate-pulse">
                          {filteredLive.length}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => navigate('/live')}>
                        See All <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {filteredLive.slice(0, 5).map((match) => (
                          <ScoreboardRow key={match.id} match={match} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Upcoming Games */}
                <Card>
                  <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base">Upcoming Games</CardTitle>
                      <Badge variant="secondary">{filteredUpcoming.length}</Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/games')}>
                      Full Schedule <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {filteredUpcoming.slice(0, 10).map((match) => (
                        <ScoreboardRow key={match.id} match={match} />
                      ))}
                      {filteredUpcoming.length === 0 && (
                        <div className="py-12 text-center text-muted-foreground">
                          <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p>No upcoming games</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Results */}
                {filteredFinished.length > 0 && (
                  <Card>
                    <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base">Recent Results</CardTitle>
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
              </div>

              {/* Right Sidebar - 1 col */}
              <div className="space-y-6">
                {/* AI Picks */}
                <Card>
                  <CardHeader className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base">AI Picks</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ConfidentPicks />
                  </CardContent>
                </Card>

                {/* Smart Scores */}
                <Card>
                  <CardHeader className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <CardTitle className="text-base">Top Rated</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <SmartScoreSection matches={filteredUpcoming.slice(0, 5)} />
                  </CardContent>
                </Card>

                {/* Arbitrage */}
                {opportunities.length > 0 && (
                  <Card className="border-green-500/30 bg-green-500/5">
                    <CardHeader className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <CardTitle className="text-base">Arbitrage</CardTitle>
                        <Badge className="bg-green-500">{opportunities.length}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ArbitrageOpportunitiesSection
                        selectedLeague={selectedLeague as any}
                        arbitrageOpportunitiesToShow={opportunities.slice(0, 3)}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Quick Stats */}
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-base">Your Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-3">
                      <StatBox 
                        label="Win Rate" 
                        value={`${((stats?.wins || 0) / Math.max(stats?.total_bets || 1, 1) * 100).toFixed(0)}%`}
                        positive={(stats?.wins || 0) / Math.max(stats?.total_bets || 1, 1) >= 0.5}
                      />
                      <StatBox 
                        label="P/L" 
                        value={`${(stats?.total_profit || 0) >= 0 ? '+' : ''}$${Math.abs(stats?.total_profit || 0).toFixed(0)}`}
                        positive={(stats?.total_profit || 0) >= 0}
                      />
                      <StatBox 
                        label="Total Bets" 
                        value={stats?.total_bets?.toString() || '0'}
                      />
                      <StatBox 
                        label="Streak" 
                        value={stats?.current_streak?.toString() || '0'}
                        positive={(stats?.current_streak || 0) > 0}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>

      <PageFooter />
    </div>
  );
};

function StatBox({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 text-center">
      <div className={cn(
        "text-lg font-bold",
        positive === true && "text-green-500",
        positive === false && "text-red-500"
      )}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export default Index;
