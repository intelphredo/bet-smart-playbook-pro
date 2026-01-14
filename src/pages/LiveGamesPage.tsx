// ESPN-style Live Games Page
import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import PageFooter from "@/components/PageFooter";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { ScoreboardRow } from "@/components/layout/ScoreboardRow";
import { useSportsData } from "@/hooks/useSportsData";
import { applySmartScores } from "@/utils/smartScoreCalculator";
import TopLoader from "@/components/ui/TopLoader";
import LiveRefreshIndicator from "@/components/LiveRefreshIndicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radio, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { GroupedLeagueSelect } from "@/components/filters/GroupedLeagueSelect";
import { getLeagueLogoUrl, getLeagueDisplayName } from "@/utils/teamLogos";

export default function LiveGamesPage() {
  const { toast } = useToast();
  const [leagueFilter, setLeagueFilter] = useState<string>("all");
  
  const {
    liveMatches: rawLive,
    isLoading,
    isFetching,
    refetchWithTimestamp,
    hasLiveGames,
    lastRefresh,
    secondsUntilRefresh,
    activeInterval,
  } = useSportsData({
    league: 'ALL' as any,
    refreshInterval: 30000, // 30 seconds base
    useExternalApis: true,
  });

  const liveMatches = useMemo(() => applySmartScores(rawLive), [rawLive]);

  // Filter by league
  const filteredMatches = useMemo(() => {
    if (leagueFilter === "all") return liveMatches;
    return liveMatches.filter(m => m.league === leagueFilter);
  }, [liveMatches, leagueFilter]);

  // Get unique leagues from live matches
  const availableLeagues = useMemo(() => {
    return [...new Set(liveMatches.map(m => m.league).filter(Boolean))];
  }, [liveMatches]);

  // Group by league
  const matchesByLeague = useMemo(() => {
    const grouped: Record<string, typeof filteredMatches> = {};
    filteredMatches.forEach(match => {
      const league = match.league || 'OTHER';
      if (!grouped[league]) grouped[league] = [];
      grouped[league].push(match);
    });
    return grouped;
  }, [filteredMatches]);

  const handleRefresh = () => {
    refetchWithTimestamp();
    toast({ title: "Refreshing live scores..." });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopLoader isLoading={isLoading} />
      <NavBar />

      <div className="flex-1 flex">
        <SidebarNav liveCount={liveMatches.length} className="hidden lg:flex" />

        <main className="flex-1 overflow-auto">
          {/* Header */}
          <div className="border-b bg-red-500/5">
            <div className="container px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <Radio className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                      Live Games
                      {liveMatches.length > 0 && (
                        <Badge variant="destructive" className="animate-pulse">
                          {liveMatches.length} Live
                        </Badge>
                      )}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Real-time scores and updates
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {availableLeagues.length > 1 && (
                    <GroupedLeagueSelect
                      value={leagueFilter}
                      onValueChange={setLeagueFilter}
                      leagues={availableLeagues}
                      allLabel="All Live"
                      className="w-[160px]"
                    />
                  )}
                  <LiveRefreshIndicator
                    hasLiveGames={hasLiveGames}
                    secondsUntilRefresh={secondsUntilRefresh}
                    isFetching={isFetching}
                    lastRefresh={lastRefresh}
                    activeInterval={activeInterval}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isLoading || isFetching}
                  >
                    <RefreshCw className={cn("h-4 w-4 mr-2", (isLoading || isFetching) && "animate-spin")} />
                    Refresh
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="container px-4 py-6">
            {filteredMatches.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Radio className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  <h3 className="text-lg font-medium mb-1">
                    {leagueFilter !== "all" ? `No Live ${getLeagueDisplayName(leagueFilter)} Games` : "No Live Games"}
                  </h3>
                  <p className="text-muted-foreground">
                    {leagueFilter !== "all" 
                      ? "Try selecting a different league or check back soon"
                      : "Check back soon for live action"
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(matchesByLeague).map(([league, matches]) => (
                  <Card key={league}>
                    <CardHeader className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <img 
                          src={getLeagueLogoUrl(league)} 
                          alt={league} 
                          className="w-5 h-5 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <CardTitle className="text-base">{getLeagueDisplayName(league)}</CardTitle>
                        <Badge variant="outline">{matches.length}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {matches.map((match) => (
                          <ScoreboardRow key={match.id} match={match} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <PageFooter />
    </div>
  );
}
