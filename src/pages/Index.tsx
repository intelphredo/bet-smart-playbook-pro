import { useState, useMemo } from "react";
import { League } from "@/types/sports";
import StatsOverview from "@/components/StatsOverview";
import { useToast } from "@/hooks/use-toast";
import ConfidentPicks from "@/components/ConfidentPicks";
import HeroHeader from "@/components/HeroHeader";
import ArbitrageOpportunitiesSection from "@/components/ArbitrageOpportunitiesSection";
import LiveESPNSection from "@/components/LiveESPNSection";
import AlgorithmsSection from "@/components/AlgorithmsSection";
import PremiumSubscribeCard from "@/components/PremiumSubscribeCard";
import PageFooter from "@/components/PageFooter";
import NavBar from "@/components/NavBar";
import FilterSection from "@/components/FilterSection";
import QuickStatsDashboard from "@/components/QuickStatsDashboard";
import CLVLeaderboard from "@/components/CLVLeaderboard";
import LineMovementsCard from "@/components/LineMovementsCard";
import { useSportsData } from "@/hooks/useSportsData";
import { SportCategory } from "@/types/LeagueRegistry";
import { DataViewSource } from "@/components/filters/DataSourceFilter";
import DevToolsPanel from "@/components/DevToolsPanel";
import { isDevMode } from "@/utils/devMode";
import { useArbitrageCalculator } from "@/hooks/useArbitrageCalculator";

const Index = () => {
  const [selectedLeague, setSelectedLeague] = useState<League | string | "ALL">("ALL");
  const [activeTab, setActiveTab] = useState("upcoming");
  const [teamFilter, setTeamFilter] = useState("");
  const [dateRange, setDateRange] = useState<{start?: Date, end?: Date}>({});
  const [sportCategoryFilter, setSportCategoryFilter] = useState<SportCategory | "ALL">("ALL");
  const [dataViewSource, setDataViewSource] = useState<DataViewSource>("combined");
  const { toast } = useToast();

  const {
    upcomingMatches: rawUpcoming,
    liveMatches: rawLive,
    finishedMatches: rawFinished,
    isLoading,
    error,
    refetchWithTimestamp,
    dataSource,
    setDataSource,
    availableDataSources,
    espnDataStatus,
    oddsApiStatus,
    oddsApiMatches
  } = useSportsData({
    league: selectedLeague as any,
    refreshInterval: 60000,
    useExternalApis: true,
  });

  // Filter matches based on data view source
  const filterBySource = (matches: any[]) => {
    if (dataViewSource === "combined") return matches;
    
    return matches.filter(match => {
      const isFromEspn = match.homeTeam?.logo && match.homeTeam.logo.length > 0;
      const hasOddsData = match.liveOdds && match.liveOdds.length > 0;
      
      if (dataViewSource === "espn") {
        return isFromEspn;
      }
      if (dataViewSource === "odds") {
        return hasOddsData && !isFromEspn;
      }
      return true;
    });
  };

  const upcomingMatches = useMemo(() => filterBySource(rawUpcoming), [rawUpcoming, dataViewSource]);
  const liveMatches = useMemo(() => filterBySource(rawLive), [rawLive, dataViewSource]);
  const finishedMatches = useMemo(() => filterBySource(rawFinished), [rawFinished, dataViewSource]);

  const handleRefreshData = () => {
    refetchWithTimestamp();
    toast({
      title: "Refreshing data",
      description: `Fetching the latest sports data from ${dataSource}`,
      variant: "default"
    });
  };

  // Calculate real arbitrage opportunities from live odds data
  const allMatchesWithOdds = useMemo(() => 
    [...upcomingMatches, ...liveMatches].filter(m => m.liveOdds && m.liveOdds.length >= 2),
    [upcomingMatches, liveMatches]
  );
  
  const { opportunities: calculatedArbitrage } = useArbitrageCalculator(allMatchesWithOdds);
  
  // Filter arbitrage by team if specified
  const arbitrageOpportunitiesToShow = useMemo(() => {
    let filtered = calculatedArbitrage;
    
    if (selectedLeague !== "ALL") {
      filtered = filtered.filter(opp => opp.match.league === selectedLeague);
    }
    
    if (teamFilter) {
      filtered = filtered.filter(opp => 
        opp.match.homeTeam.toLowerCase().includes(teamFilter.toLowerCase()) ||
        opp.match.awayTeam.toLowerCase().includes(teamFilter.toLowerCase())
      );
    }
    
    return filtered.slice(0, 6); // Show top 6 opportunities
  }, [calculatedArbitrage, selectedLeague, teamFilter]);
    
  const resetAllFilters = () => {
    setSelectedLeague("ALL");
    setActiveTab("upcoming");
    setTeamFilter("");
    setDateRange({});
    setSportCategoryFilter("ALL");
    setDataViewSource("combined");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      <NavBar />
      <main id="main-content" className="flex-1 container px-4 py-6">
        <div className="flex flex-col space-y-6">
          <HeroHeader />
          
          {/* Quick Stats Dashboard */}
          <section id="quick-stats" aria-labelledby="quick-stats-heading">
            <h2 id="quick-stats-heading" className="sr-only">Quick Stats</h2>
            <QuickStatsDashboard />
          </section>
          {/* Stats & Filters Section */}
          <section id="stats-overview" aria-labelledby="stats-heading" className="card-gradient rounded-2xl shadow-lg p-2">
            <h2 id="stats-heading" className="sr-only">Stats Overview and Filters</h2>
            <FilterSection
              selectedLeague={selectedLeague}
              onLeagueChange={setSelectedLeague}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              teamFilter={teamFilter}
              onTeamFilterChange={setTeamFilter}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              onReset={resetAllFilters}
              sportCategoryFilter={sportCategoryFilter}
              onSportCategoryChange={setSportCategoryFilter}
              dataViewSource={dataViewSource}
              onDataViewSourceChange={setDataViewSource}
            />
            <div className="animate-slide-in">
              <StatsOverview />
            </div>
          </section>
          
          {/* Confident Picks Section */}
          <section id="confident-picks" aria-labelledby="picks-heading">
            <h2 id="picks-heading" className="sr-only">Confident Picks</h2>
            <ConfidentPicks />
          </section>
          
          {/* Line Movements & CLV Leaderboard */}
          <section id="insights" aria-labelledby="insights-heading" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <h2 id="insights-heading" className="sr-only">Sharp Betting Insights</h2>
            <LineMovementsCard />
            <CLVLeaderboard />
          </section>
          
          {/* Arbitrage Section */}
          <section id="arbitrage" aria-labelledby="arb-heading">
            <h2 id="arb-heading" className="sr-only">Arbitrage Opportunities</h2>
            <ArbitrageOpportunitiesSection
              selectedLeague={selectedLeague as any}
              arbitrageOpportunitiesToShow={arbitrageOpportunitiesToShow}
            />
          </section>
          
          {/* Live Matches Section */}
          <section id="live-matches" aria-labelledby="live-heading">
            <h2 id="live-heading" className="sr-only">Live Matches</h2>
            <LiveESPNSection
              selectedLeague={selectedLeague as any}
              setSelectedLeague={setSelectedLeague as any}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isLoading={isLoading}
              error={error}
              handleRefreshData={handleRefreshData}
              upcomingMatches={upcomingMatches}
              liveMatches={liveMatches}
              finishedMatches={finishedMatches}
              dataSource={espnDataStatus}
              oddsApiStatus={oddsApiStatus}
            />
          </section>
          
          {/* Algorithms Section */}
          <section id="algorithms" aria-labelledby="algo-heading">
            <h2 id="algo-heading" className="sr-only">Winning Algorithms</h2>
            <AlgorithmsSection />
          </section>
          
          {/* Premium Section */}
          <section id="premium" aria-labelledby="premium-heading">
            <h2 id="premium-heading" className="sr-only">Premium Subscription</h2>
            <PremiumSubscribeCard />
          </section>
        </div>
      </main>
      <PageFooter />
      {isDevMode() && <DevToolsPanel />}
    </div>
  );
};

export default Index;
