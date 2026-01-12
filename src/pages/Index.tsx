import { useState, useMemo } from "react";
import { League, Match } from "@/types/sports";
import StatsOverview from "@/components/StatsOverview";
import { useToast } from "@/hooks/use-toast";
import ConfidentPicks from "@/components/ConfidentPicks";
import ArbitrageOpportunitiesSection from "@/components/ArbitrageOpportunitiesSection";
import AlgorithmsSection from "@/components/AlgorithmsSection";
import PremiumSubscribeCard from "@/components/PremiumSubscribeCard";
import PageFooter from "@/components/PageFooter";
import NavBar from "@/components/NavBar";
import QuickStatsDashboard from "@/components/QuickStatsDashboard";
import CLVLeaderboard from "@/components/CLVLeaderboard";
import LineMovementsCard from "@/components/LineMovementsCard";
import { useSportsData } from "@/hooks/useSportsData";
import { SportCategory } from "@/types/LeagueRegistry";
import { useArbitrageCalculator } from "@/hooks/useArbitrageCalculator";
import { usePreferences } from "@/hooks/usePreferences";
import SportsSidebar from "@/components/layout/SportsSidebar";
import MainContentTabs from "@/components/layout/MainContentTabs";
import QuickActions from "@/components/layout/QuickActions";
import UpcomingGamesTab from "@/components/LiveESPNTabs/UpcomingGamesTab";
import LiveMatchesTab from "@/components/LiveESPNTabs/LiveMatchesTab";
import FinishedMatchesTab from "@/components/LiveESPNTabs/FinishedMatchesTab";
import FavoritesTab from "@/components/FavoritesTab";
import SmartScoreSection from "@/components/SmartScoreSection";
import { applySmartScores } from "@/utils/smartScoreCalculator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const Index = () => {
  const [selectedLeague, setSelectedLeague] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<SportCategory | "ALL">("ALL");
  const [activeTab, setActiveTab] = useState("upcoming");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const { toast } = useToast();
  const { preferences } = usePreferences();

  const {
    upcomingMatches: rawUpcoming,
    liveMatches: rawLive,
    finishedMatches: rawFinished,
    isLoading,
    error,
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

  // Filter matches by category and league
  const filterMatches = (matches: Match[]) => {
    return matches.filter(match => {
      if (selectedLeague !== "ALL" && match.league !== selectedLeague) {
        return false;
      }
      if (selectedCategory !== "ALL") {
        const leagueCategory = getLeagueCategory(match.league);
        if (leagueCategory !== selectedCategory) {
          return false;
        }
      }
      return true;
    });
  };

  const getLeagueCategory = (league?: string): SportCategory | undefined => {
    if (!league) return undefined;
    const categoryMap: Record<string, SportCategory> = {
      NBA: "basketball",
      NCAAB: "basketball",
      NFL: "football", 
      NCAAF: "football",
      MLB: "baseball",
      NHL: "hockey",
      EPL: "soccer",
      MLS: "soccer",
    };
    return categoryMap[league.toUpperCase()];
  };

  const filteredUpcoming = useMemo(() => filterMatches(upcomingMatches), [upcomingMatches, selectedLeague, selectedCategory]);
  const filteredLive = useMemo(() => filterMatches(liveMatches), [liveMatches, selectedLeague, selectedCategory]);
  const filteredFinished = useMemo(() => filterMatches(finishedMatches), [finishedMatches, selectedLeague, selectedCategory]);

  // Calculate match counts per category
  const matchCounts = useMemo(() => {
    const allMatches = [...rawUpcoming, ...rawLive];
    const counts: Record<string, number> = { total: allMatches.length };
    
    allMatches.forEach(match => {
      const category = getLeagueCategory(match.league);
      if (category) {
        counts[category] = (counts[category] || 0) + 1;
      }
    });
    
    return counts;
  }, [rawUpcoming, rawLive]);

  // Favorites count
  const allMatches = useMemo(() => [...filteredUpcoming, ...filteredLive, ...filteredFinished], [filteredUpcoming, filteredLive, filteredFinished]);
  const favoritesCount = preferences.favorites.matches.length + 
    allMatches.filter(match => {
      const homeTeam = match.homeTeam?.shortName || match.homeTeam?.name || "";
      const awayTeam = match.awayTeam?.shortName || match.awayTeam?.name || "";
      return preferences.favorites.teams.some(team => 
        homeTeam.toLowerCase().includes(team.toLowerCase()) ||
        awayTeam.toLowerCase().includes(team.toLowerCase())
      ) && !preferences.favorites.matches.includes(match.id);
    }).length;

  // Arbitrage opportunities
  const allMatchesWithOdds = useMemo(() => 
    [...filteredUpcoming, ...filteredLive].filter(m => m.liveOdds && m.liveOdds.length >= 2),
    [filteredUpcoming, filteredLive]
  );
  const { opportunities: calculatedArbitrage } = useArbitrageCalculator(allMatchesWithOdds);
  const arbitrageOpportunitiesToShow = calculatedArbitrage.slice(0, 6);

  const handleRefreshData = () => {
    refetchWithTimestamp();
    setLastRefresh(new Date());
    toast({
      title: "Refreshing data",
      description: "Fetching the latest sports data",
      variant: "default"
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      <NavBar />
      
      <div className="flex flex-1">
        {/* Sports Sidebar - Hidden on mobile */}
        <aside className="hidden lg:block">
          <SportsSidebar
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedLeague={selectedLeague}
            onLeagueChange={setSelectedLeague}
            matchCounts={matchCounts}
            collapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
          />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="container px-4 py-4 max-w-7xl mx-auto">
            {/* Quick Stats Row */}
            <section className="mb-4">
              <QuickStatsDashboard />
            </section>

            {/* Actions Bar */}
            <section className="mb-4">
              <QuickActions 
                onRefresh={handleRefreshData} 
                isLoading={isLoading}
                lastUpdated={lastRefresh}
              />
            </section>

            {/* Main Tabs Content */}
            <MainContentTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              upcomingCount={filteredUpcoming.length}
              liveCount={filteredLive.length}
              finishedCount={filteredFinished.length}
              favoritesCount={favoritesCount}
            >
              {{
                upcoming: (
                  <div className="space-y-6">
                    {/* Smart Score + Confident Picks Row */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                      <div className="xl:col-span-2">
                        <ConfidentPicks />
                      </div>
                      <div className="xl:col-span-1">
                        <SmartScoreSection matches={filteredUpcoming.slice(0, 5)} />
                      </div>
                    </div>

                    {/* Arbitrage Section */}
                    {arbitrageOpportunitiesToShow.length > 0 && (
                      <ArbitrageOpportunitiesSection
                        selectedLeague={selectedLeague as any}
                        arbitrageOpportunitiesToShow={arbitrageOpportunitiesToShow}
                      />
                    )}

                    {/* Matches Grid */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          Upcoming Games
                          <span className="text-sm font-normal text-muted-foreground">
                            ({filteredUpcoming.length})
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <UpcomingGamesTab isLoading={isLoading} matches={filteredUpcoming} />
                      </CardContent>
                    </Card>
                  </div>
                ),
                
                live: (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          🔴 Live Games
                          <span className="text-sm font-normal text-muted-foreground">
                            ({filteredLive.length})
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <LiveMatchesTab isLoading={isLoading} liveMatches={filteredLive} />
                      </CardContent>
                    </Card>
                  </div>
                ),
                
                finished: (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          Completed Games
                          <span className="text-sm font-normal text-muted-foreground">
                            ({filteredFinished.length})
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <FinishedMatchesTab isLoading={isLoading} finishedMatches={filteredFinished} />
                      </CardContent>
                    </Card>
                  </div>
                ),
                
                favorites: (
                  <FavoritesTab allMatches={allMatches} />
                ),
                
                insights: (
                  <div className="space-y-6">
                    {/* Insights Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <LineMovementsCard />
                      <CLVLeaderboard />
                    </div>
                    
                    {/* Stats Overview */}
                    <Card className="p-4">
                      <StatsOverview />
                    </Card>
                  </div>
                ),
                
                algorithms: (
                  <div className="space-y-6">
                    <AlgorithmsSection />
                    <PremiumSubscribeCard />
                  </div>
                ),
              }}
            </MainContentTabs>
          </div>
        </main>

        {/* Right Sidebar for Desktop - Quick Stats */}
        <aside className="hidden xl:block w-72 border-l border-border/50 bg-card/30 p-4 overflow-y-auto">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Quick Stats
            </h3>
            
            <Card className="p-3">
              <div className="text-xs text-muted-foreground mb-1">Total Games Today</div>
              <div className="text-2xl font-bold">{matchCounts.total || 0}</div>
            </Card>
            
            <Card className="p-3">
              <div className="text-xs text-muted-foreground mb-1">Live Now</div>
              <div className="text-2xl font-bold text-red-500">{filteredLive.length}</div>
            </Card>
            
            <Card className="p-3">
              <div className="text-xs text-muted-foreground mb-1">Arb Opportunities</div>
              <div className="text-2xl font-bold text-green-500">{calculatedArbitrage.length}</div>
            </Card>

            {/* Category breakdown */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs text-muted-foreground uppercase tracking-wider">By Sport</h4>
              {Object.entries(matchCounts)
                .filter(([key]) => key !== "total")
                .map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{category}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </aside>
      </div>

      <PageFooter />
    </div>
  );
};

export default Index;
