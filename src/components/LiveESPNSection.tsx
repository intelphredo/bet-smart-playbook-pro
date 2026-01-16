
import React, { useState, useEffect, useMemo } from "react";
import { League, Match } from "@/types/sports";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LeagueSelector from "@/components/LeagueSelector";
import UpcomingGamesTab from "./LiveESPNTabs/UpcomingGamesTab";
import LiveMatchesTab from "./LiveESPNTabs/LiveMatchesTab";
import FinishedMatchesTab from "./LiveESPNTabs/FinishedMatchesTab";
import LiveESPNHeader from "./LiveESPNHeader";
import SmartScoreSection from "./SmartScoreSection";
import PremiumContent from "./PremiumContent";
import PremiumSectionHeader from "./PremiumSectionHeader";
import FavoritesTab from "./FavoritesTab";
import { applySmartScores } from "@/utils/smartScoreCalculator";
import { usePreferences } from "@/hooks/usePreferences";
import { Star } from "lucide-react";

interface DataSourceInfo {
  source: "live" | "mock";
  lastUpdated: Date;
  gamesLoaded: number;
  errors?: string[];
}

interface OddsApiStatus {
  isLoading: boolean;
  isError: boolean;
  matchCount: number;
  hasData: boolean;
}

interface Props {
  selectedLeague: League | "ALL";
  setSelectedLeague: (v: League | "ALL") => void;
  activeTab: string;
  setActiveTab: (v: string) => void;
  isLoading: boolean;
  error: any;
  handleRefreshData: () => void;
  upcomingMatches: Match[];
  liveMatches: Match[];
  finishedMatches: Match[];
  dataSource?: DataSourceInfo;
  oddsApiStatus?: OddsApiStatus;
}

const LiveESPNSection = ({
  selectedLeague,
  setSelectedLeague,
  activeTab,
  setActiveTab,
  isLoading,
  error,
  handleRefreshData,
  upcomingMatches,
  liveMatches,
  finishedMatches,
  dataSource,
  oddsApiStatus,
}: Props) => {
  const { preferences } = usePreferences();
  const [processedMatches, setProcessedMatches] = useState({
    upcoming: [] as Match[],
    live: [] as Match[],
    finished: [] as Match[],
  });

  useEffect(() => {
    setProcessedMatches({
      upcoming: applySmartScores(upcomingMatches),
      live: applySmartScores(liveMatches),
      finished: finishedMatches,
    });
    
    // Store processed matches in window.__EdgeIQ for debugging
    if (typeof window !== 'undefined' && window.__EdgeIQ) {
      window.__EdgeIQ.upcomingMatches = applySmartScores(upcomingMatches);
      window.__EdgeIQ.liveMatches = applySmartScores(liveMatches);
      window.__EdgeIQ.finishedMatches = finishedMatches;
    }
  }, [upcomingMatches, liveMatches, finishedMatches]);

  const allMatches = useMemo(() => [
    ...processedMatches.upcoming,
    ...processedMatches.live,
    ...processedMatches.finished,
  ], [processedMatches]);

  const favoritesCount = preferences.favorites.matches.length + 
    allMatches.filter(match => {
      const homeTeam = match.homeTeam?.shortName || match.homeTeam?.name || "";
      const awayTeam = match.awayTeam?.shortName || match.awayTeam?.name || "";
      return preferences.favorites.teams.some(team => 
        homeTeam.toLowerCase().includes(team.toLowerCase()) ||
        awayTeam.toLowerCase().includes(team.toLowerCase())
      ) && !preferences.favorites.matches.includes(match.id);
    }).length;

  return (
    <div className="space-y-4">
      <LiveESPNHeader
        selectedLeague={selectedLeague}
        setSelectedLeague={setSelectedLeague}
        isLoading={isLoading}
        handleRefreshData={handleRefreshData}
        dataSource={dataSource}
        oddsApiStatus={oddsApiStatus}
      />

      {error && (
        <Card>
          <CardContent className="p-4">
            <p className="text-red-600 dark:text-red-400">
              Error loading ESPN data. Please try refreshing.
            </p>
          </CardContent>
        </Card>
      )}

      {(processedMatches.upcoming.length > 0 || processedMatches.live.length > 0) && (
        <>
          <PremiumSectionHeader />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PremiumContent
              title="Smart Score Analysis"
              description="Get detailed insights into matches with our advanced Smart Score analysis."
            >
              <SmartScoreSection 
                matches={[...processedMatches.live, ...processedMatches.upcoming]} 
              />
            </PremiumContent>

            <PremiumContent
              title="Advanced Analytics"
              description="Access advanced statistics and trends for better decision making."
            >
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-2">Match Analytics</h3>
                  <p className="text-muted-foreground">
                    Unlock detailed statistics, historical data, and advanced metrics to improve your predictions.
                  </p>
                </CardContent>
              </Card>
            </PremiumContent>
          </div>
        </>
      )}

      <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="favorites" className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5" />
            Favorites
            {favoritesCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-full">
                {favoritesCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="finished">Finished</TabsTrigger>
        </TabsList>
        <TabsContent value="favorites" className="mt-4">
          <FavoritesTab allMatches={allMatches} />
        </TabsContent>
        <TabsContent value="upcoming" className="mt-4">
          <UpcomingGamesTab 
            isLoading={isLoading} 
            matches={processedMatches.upcoming} 
          />
        </TabsContent>
        <TabsContent value="live" className="mt-4">
          <LiveMatchesTab 
            isLoading={isLoading} 
            liveMatches={processedMatches.live} 
          />
        </TabsContent>
        <TabsContent value="finished" className="mt-4">
          <FinishedMatchesTab 
            isLoading={isLoading} 
            finishedMatches={processedMatches.finished} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LiveESPNSection;
