
import { useState } from "react";
import { League } from "@/types/sports";
import StatsOverview from "@/components/StatsOverview";
import { useToast } from "@/hooks/use-toast";
import { arbitrageOpportunities } from "@/data/arbitrageData";
import ConfidentPicks from "@/components/ConfidentPicks";
import HeroHeader from "@/components/HeroHeader";
import ArbitrageOpportunitiesSection from "@/components/ArbitrageOpportunitiesSection";
import LiveESPNSection from "@/components/LiveESPNSection";
import AlgorithmsSection from "@/components/AlgorithmsSection";
import PremiumSubscribeCard from "@/components/PremiumSubscribeCard";
import PageFooter from "@/components/PageFooter";
import NavBar from "@/components/NavBar";
import FilterSection from "@/components/FilterSection";
import { useSportsData } from "@/hooks/useSportsData";
import { SportCategory } from "@/types/LeagueRegistry";

const Index = () => {
  const [selectedLeague, setSelectedLeague] = useState<League | string | "ALL">("ALL");
  const [activeTab, setActiveTab] = useState("upcoming");
  const [teamFilter, setTeamFilter] = useState("");
  const [dateRange, setDateRange] = useState<{start?: Date, end?: Date}>({});
  const [sportCategoryFilter, setSportCategoryFilter] = useState<SportCategory | "ALL">("ALL");
  const { toast } = useToast();

  // Use our enhanced sports data hook
  const {
    upcomingMatches,
    liveMatches,
    finishedMatches,
    isLoading,
    error,
    refetchWithTimestamp,
    dataSource,
    setDataSource,
    availableDataSources
  } = useSportsData({
    league: selectedLeague as any,
    refreshInterval: 60000,
    useExternalApis: true,
  });

  const handleRefreshData = () => {
    refetchWithTimestamp();
    toast({
      title: "Refreshing data",
      description: `Fetching the latest sports data from ${dataSource}`,
      variant: "default"
    });
  };

  // Filter arbitrage opportunities by selected league and team
  const filteredArbitrage = arbitrageOpportunities.filter(opportunity => {
    // Filter by league
    if (selectedLeague !== "ALL" && opportunity.match.league !== selectedLeague) {
      return false;
    }
    
    // Filter by team name if provided
    if (teamFilter && !(
      opportunity.match.homeTeam.toLowerCase().includes(teamFilter.toLowerCase()) || 
      opportunity.match.awayTeam.toLowerCase().includes(teamFilter.toLowerCase())
    )) {
      return false;
    }
    
    return true;
  });

  // Create real-time arbitrage opportunities from match data
  const realTimeArbs = [...upcomingMatches, ...liveMatches]
    .filter(match => {
      // Apply team filter if active
      if (teamFilter && !(
        match.homeTeam.shortName.toLowerCase().includes(teamFilter.toLowerCase()) || 
        match.awayTeam.shortName.toLowerCase().includes(teamFilter.toLowerCase())
      )) {
        return false;
      }
      return true;
    })
    .slice(0, 3)
    .map((match) => ({
      id: match.id,
      matchId: match.id,
      match: {
        homeTeam: match.homeTeam.shortName,
        awayTeam: match.awayTeam.shortName,
        league: match.league,
        startTime: match.startTime,
      },
      bookmakers: [
        { name: "FanDuel", odds: { ...match.odds } },
        { name: "DraftKings", odds: { ...match.odds } },
      ],
      arbitragePercentage: 2.1 + Math.random(),
      potentialProfit: 21.24 + Math.random() * 30,
      bettingStrategy: [
        { bookmaker: "FanDuel", team: "home" as "home", stakePercentage: 52 + Math.random() * 10, odds: match.odds.homeWin },
        { bookmaker: "DraftKings", team: match.odds.draw !== undefined ? "draw" as "draw" : "away" as "away", stakePercentage: 48 - Math.random() * 10, odds: match.odds.awayWin },
        ...(match.odds.draw
          ? [{ bookmaker: "BetMGM", team: "draw" as "draw", stakePercentage: Math.min(100, Math.random() * 20), odds: match.odds.draw }]
          : []),
      ],
      isPremium: Math.random() > 0.5,
    }));

  const arbitrageOpportunitiesToShow =
    realTimeArbs.length > 0 ? realTimeArbs : filteredArbitrage;
    
  const resetAllFilters = () => {
    setSelectedLeague("ALL");
    setActiveTab("upcoming");
    setTeamFilter("");
    setDateRange({});
    setSportCategoryFilter("ALL");
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container px-4 py-6">
        <div className="flex flex-col space-y-6">
          <HeroHeader />
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
          />
          <div className="animate-slide-in">
            <StatsOverview />
          </div>
          <ConfidentPicks />
          <ArbitrageOpportunitiesSection
            selectedLeague={selectedLeague as any}
            arbitrageOpportunitiesToShow={arbitrageOpportunitiesToShow}
          />
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
          />
          <AlgorithmsSection />
          <PremiumSubscribeCard />
        </div>
      </div>
      <PageFooter />
    </div>
  );
};

export default Index;
