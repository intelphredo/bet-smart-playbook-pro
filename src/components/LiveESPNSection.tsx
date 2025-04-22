import { League, Match } from "@/types/sports";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LeagueSelector from "@/components/LeagueSelector";
import UpcomingGamesTab from "./LiveESPNTabs/UpcomingGamesTab";
import LiveMatchesTab from "./LiveESPNTabs/LiveMatchesTab";
import FinishedMatchesTab from "./LiveESPNTabs/FinishedMatchesTab";
import LiveESPNHeader from "./LiveESPNHeader";
import SmartScoreSection from "./SmartScoreSection";

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
}: Props) => {
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
  }, [upcomingMatches, liveMatches, finishedMatches]);

  return (
    <div className="space-y-4">
      <LiveESPNHeader
        selectedLeague={selectedLeague}
        setSelectedLeague={setSelectedLeague}
        isLoading={isLoading}
        handleRefreshData={handleRefreshData}
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
        <SmartScoreSection 
          matches={[...processedMatches.live, ...processedMatches.upcoming]} 
        />
      )}

      <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="finished">Finished</TabsTrigger>
        </TabsList>
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
            finishedMatches={finishedMatches} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LiveESPNSection;
