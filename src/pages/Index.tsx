import { useState, useMemo } from "react";
import { Match } from "@/types/sports";
import NavBar from "@/components/NavBar";
import PageFooter from "@/components/PageFooter";
import { useSportsData } from "@/hooks/useSportsData";
import { SportCategory } from "@/types/LeagueRegistry";
import { useArbitrageCalculator } from "@/hooks/useArbitrageCalculator";
import { usePreferences } from "@/hooks/usePreferences";
import { useBetTracking } from "@/hooks/useBetTracking";
import { applySmartScores } from "@/utils/smartScoreCalculator";
import { useToast } from "@/hooks/use-toast";

// Layout Components
import DashboardHeader from "@/components/layout/DashboardHeader";
import SportCategoryNav from "@/components/layout/SportCategoryNav";
import StatsBar from "@/components/layout/StatsBar";
import ContentSection from "@/components/layout/ContentSection";
import MatchesGrid from "@/components/layout/MatchesGrid";

// Feature Components
import ConfidentPicks from "@/components/ConfidentPicks";
import SmartScoreSection from "@/components/SmartScoreSection";
import ArbitrageOpportunitiesSection from "@/components/ArbitrageOpportunitiesSection";
import LineMovementsCard from "@/components/LineMovementsCard";
import CLVLeaderboard from "@/components/CLVLeaderboard";
import AlgorithmsSection from "@/components/AlgorithmsSection";
import StatsOverview from "@/components/StatsOverview";
import HistoricalPredictionsSection from "@/components/HistoricalPredictionsSection";

import { Radio, Clock, CheckCircle2, TrendingUp, Zap, BarChart3, DollarSign, Brain, Target, History } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<SportCategory | "ALL">("ALL");
  const [selectedLeague, setSelectedLeague] = useState<string>("ALL");
  const [activeSection, setActiveSection] = useState("overview");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const { toast } = useToast();
  const { preferences } = usePreferences();
  const { stats } = useBetTracking();

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

  // Filter matches by category
  const filterByCategory = (matches: Match[]) => {
    if (selectedCategory === "ALL") return matches;
    return matches.filter(match => {
      const categoryMap: Record<string, SportCategory> = {
        NBA: "basketball", NCAAB: "basketball",
        NFL: "football", NCAAF: "football",
        MLB: "baseball", NHL: "hockey",
        EPL: "soccer", MLS: "soccer",
      };
      return categoryMap[match.league?.toUpperCase()] === selectedCategory;
    });
  };

  const filteredUpcoming = useMemo(() => filterByCategory(upcomingMatches), [upcomingMatches, selectedCategory]);
  const filteredLive = useMemo(() => filterByCategory(liveMatches), [liveMatches, selectedCategory]);
  const filteredFinished = useMemo(() => filterByCategory(finishedMatches), [finishedMatches, selectedCategory]);

  // Match counts per category
  const matchCounts = useMemo(() => {
    const allMatches = [...rawUpcoming, ...rawLive];
    const counts: Record<string, number> = { total: allMatches.length };
    const categoryMap: Record<string, SportCategory> = {
      NBA: "basketball", NCAAB: "basketball",
      NFL: "football", NCAAF: "football",
      MLB: "baseball", NHL: "hockey",
      EPL: "soccer", MLS: "soccer",
    };
    allMatches.forEach(match => {
      const category = categoryMap[match.league?.toUpperCase()];
      if (category) counts[category] = (counts[category] || 0) + 1;
    });
    return counts;
  }, [rawUpcoming, rawLive]);

  // Arbitrage
  const allMatchesWithOdds = useMemo(() => 
    [...filteredUpcoming, ...filteredLive].filter(m => m.liveOdds && m.liveOdds.length >= 2),
    [filteredUpcoming, filteredLive]
  );
  const { opportunities } = useArbitrageCalculator(allMatchesWithOdds);

  // Stats for the bar
  const dashboardStats = {
    liveGames: filteredLive.length,
    upcomingGames: filteredUpcoming.length,
    arbOpportunities: opportunities.length,
    winRate: stats?.total_bets ? ((stats.wins || 0) / stats.total_bets) * 100 : 0,
    profit: stats?.total_profit || 0,
    streak: stats?.current_streak || 0,
  };

  const handleRefresh = () => {
    refetchWithTimestamp();
    setLastRefresh(new Date());
    toast({
      title: "Data refreshed",
      description: "Latest sports data loaded",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-accent/5">
      <NavBar />
      
      {/* Dashboard Header */}
      <DashboardHeader
        onRefresh={handleRefresh}
        isLoading={isLoading}
        lastUpdated={lastRefresh}
        liveCount={filteredLive.length}
      />

      {/* Sport Category Navigation */}
      <SportCategoryNav
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedLeague={selectedLeague}
        onLeagueChange={setSelectedLeague}
        matchCounts={matchCounts}
      />

      {/* Main Content */}
      <main className="flex-1 container px-4 py-6 mx-auto max-w-7xl">
        {/* Stats Bar */}
        <section className="mb-6">
          <StatsBar stats={dashboardStats} />
        </section>

        {/* Section Tabs */}
        <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-6">
          <TabsList className="bg-muted/50 p-1 flex-wrap">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="live" className="gap-2">
              <Radio className="h-4 w-4" />
              Live
              {filteredLive.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full">
                  {filteredLive.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="predictions" className="gap-2">
              <Target className="h-4 w-4" />
              Predictions
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2">
              <Clock className="h-4 w-4" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2">
              <Brain className="h-4 w-4" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="algorithms" className="gap-2">
              <Zap className="h-4 w-4" />
              Algorithms
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Live Games Section */}
            {filteredLive.length > 0 && (
              <ContentSection
                title="Live Games"
                icon={Radio}
                badge={filteredLive.length}
                badgeVariant="destructive"
                action={{ label: "View All", onClick: () => setActiveSection("live") }}
              >
                <MatchesGrid matches={filteredLive} type="live" maxItems={3} isLoading={isLoading} />
              </ContentSection>
            )}

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Top Picks */}
                <ContentSection
                  title="Confident Picks"
                  subtitle="AI-powered betting recommendations"
                  icon={TrendingUp}
                >
                  <ConfidentPicks />
                </ContentSection>

                {/* Upcoming Games */}
                <ContentSection
                  title="Upcoming Games"
                  icon={Clock}
                  badge={filteredUpcoming.length}
                  action={{ label: "View All", onClick: () => setActiveSection("upcoming") }}
                >
                  <MatchesGrid matches={filteredUpcoming} type="upcoming" maxItems={6} isLoading={isLoading} />
                </ContentSection>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Smart Scores */}
                <ContentSection
                  title="Smart Scores"
                  subtitle="Top rated matches"
                  icon={Zap}
                >
                  <SmartScoreSection matches={filteredUpcoming.slice(0, 5)} />
                </ContentSection>

                {/* Arbitrage */}
                {opportunities.length > 0 && (
                  <ContentSection
                    title="Arbitrage"
                    icon={DollarSign}
                    badge={opportunities.length}
                  >
                    <ArbitrageOpportunitiesSection
                      selectedLeague={selectedLeague as any}
                      arbitrageOpportunitiesToShow={opportunities.slice(0, 3)}
                    />
                  </ContentSection>
                )}
              </div>
            </div>

            {/* Finished Games */}
            {filteredFinished.length > 0 && (
              <ContentSection
                title="Recent Results"
                icon={CheckCircle2}
                badge={filteredFinished.length}
              >
                <MatchesGrid matches={filteredFinished} type="finished" maxItems={6} isLoading={isLoading} />
              </ContentSection>
            )}
          </TabsContent>

          {/* Live Tab */}
          <TabsContent value="live" className="mt-6">
            <ContentSection
              title="Live Games"
              subtitle="Currently in progress"
              icon={Radio}
              badge={filteredLive.length}
              badgeVariant="destructive"
            >
              {filteredLive.length > 0 ? (
                <MatchesGrid matches={filteredLive} type="live" maxItems={50} isLoading={isLoading} />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Radio className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No live games at the moment</p>
                  <p className="text-sm mt-1">Check back soon for live action</p>
                </div>
              )}
            </ContentSection>
          </TabsContent>

          {/* Upcoming Tab */}
          <TabsContent value="upcoming" className="mt-6">
            <ContentSection
              title="Upcoming Games"
              subtitle="Scheduled matches"
              icon={Clock}
              badge={filteredUpcoming.length}
            >
              <MatchesGrid matches={filteredUpcoming} type="upcoming" maxItems={50} isLoading={isLoading} />
            </ContentSection>
          </TabsContent>

          {/* Predictions History Tab */}
          <TabsContent value="predictions" className="mt-6">
            <HistoricalPredictionsSection />
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ContentSection title="Line Movements" icon={TrendingUp}>
                <LineMovementsCard />
              </ContentSection>
              <ContentSection title="CLV Leaderboard" icon={BarChart3}>
                <CLVLeaderboard />
              </ContentSection>
            </div>
            <ContentSection title="Performance Overview" icon={BarChart3}>
              <StatsOverview />
            </ContentSection>
          </TabsContent>

          {/* Algorithms Tab */}
          <TabsContent value="algorithms" className="mt-6">
            <AlgorithmsSection />
          </TabsContent>
        </Tabs>
      </main>

      <PageFooter />
    </div>
  );
};

export default Index;
