import { useState } from "react";
import { League } from "@/types/sports";
import StatsOverview from "@/components/StatsOverview";
import { useESPNData } from "@/hooks/useESPNData";
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

const Index = () => {
  const [selectedLeague, setSelectedLeague] = useState<League | "ALL">("ALL");
  const [activeTab, setActiveTab] = useState("upcoming");
  const { toast } = useToast();

  const {
    upcomingMatches,
    liveMatches,
    finishedMatches,
    isLoading,
    error,
    refetch,
  } = useESPNData({
    league: selectedLeague,
    refreshInterval: 60000,
  });

  const handleRefreshData = () => {
    refetch();
    toast({
      title: "Refreshing data",
      description: "Fetching the latest sports data from ESPN",
      variant: "default"
    });
  };

  const filteredArbitrage =
    selectedLeague === "ALL"
      ? arbitrageOpportunities
      : arbitrageOpportunities.filter(
          (opportunity) => opportunity.match.league === selectedLeague
        );

  const realTimeArbs = [...upcomingMatches, ...liveMatches]
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
          />
          <div className="animate-slide-in">
            <StatsOverview />
          </div>
          <ConfidentPicks />
          <ArbitrageOpportunitiesSection
            selectedLeague={selectedLeague}
            arbitrageOpportunitiesToShow={arbitrageOpportunitiesToShow}
          />
          <LiveESPNSection
            selectedLeague={selectedLeague}
            setSelectedLeague={setSelectedLeague}
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
