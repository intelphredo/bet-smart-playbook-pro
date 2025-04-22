import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import React, { useState, useMemo } from "react";
import LeagueStatsModal from "./LeagueStatsModal";
import { useESPNData } from "@/hooks/useESPNData";
import { Match } from "@/types/sports";
import { algorithmPerformanceData } from "@/data/algorithmPerformanceData";
import { Skeleton } from "@/components/ui/skeleton";
import { useSportsData } from "@/hooks/useSportsData";
import { Badge } from "@/components/ui/badge";

// Determine if a prediction was correct
function isPredictionCorrect(match: Match): boolean | null {
  if (!match.prediction || !match.score) return null;
  const { recommended } = match.prediction;
  if (recommended === "home" && match.score.home > match.score.away) return true;
  if (recommended === "away" && match.score.away > match.score.home) return true;
  if (recommended === "draw" && match.score.home === match.score.away) return true;
  return false;
}

// Get unique league names from algorithmPerformanceData for display order
const leagueNames = algorithmPerformanceData.map((d) => d.name);

const StatsOverview = () => {
  // Modal state
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Get all matches using sportsData hook to include MLB-specific data
  const { 
    finishedMatches, 
    upcomingMatches, 
    liveMatches, 
    isLoading 
  } = useSportsData({ 
    league: "ALL", 
    refreshInterval: 60000 
  });

  // Compute league win rates and pick counts by analyzing finishedMatches
  const leagueStats = useMemo(() => {
    // Map for each league: { name, picks, winRate }
    const stats: Record<string, { name: string; picks: number; wins: number; winRate: number }> = {};

    // Only consider finished matches that have a prediction and league property
    for (const match of finishedMatches || []) {
      if (!match.league || !match.prediction) continue;
      const league = match.league;
      if (!stats[league]) stats[league] = { name: league, picks: 0, wins: 0, winRate: 0 };
      stats[league].picks += 1;
      if (isPredictionCorrect(match)) stats[league].wins += 1;
    }
    
    // Convert to array and calculate win rate (%) per league
    return leagueNames.map((name) => {
      const stat = stats[name] || { name, picks: 0, wins: 0, winRate: 0 };
      stat.winRate = stat.picks > 0 ? Math.round((stat.wins / stat.picks) * 100) : 0;
      return stat;
    });
  }, [finishedMatches]);

  // All matches with predictions (for LeagueStatsModal)
  const allMatchesWithPred: Match[] = useMemo(
    () =>
      [...(upcomingMatches || []), ...(liveMatches || []), ...(finishedMatches || [])].filter(
        (m) => !!m.prediction && typeof m.prediction.confidence === "number"
      ),
    [upcomingMatches, liveMatches, finishedMatches]
  );

  // Get matches by league for LeagueStatsModal
  const getLeagueMatches = (leagueName: string): Match[] =>
    allMatchesWithPred.filter(
      (m) => m.league.toUpperCase() === leagueName.toUpperCase()
    );

  // Modal info
  const leagueMeta =
    selectedLeague &&
    leagueStats.find(
      (d) => d.name.toUpperCase() === selectedLeague.toUpperCase()
    );

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Algorithm Performance</CardTitle>
          {leagueStats[0]?.isFiltered && (
            <Badge variant="outline" className="ml-2">
              Filtered View
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[250px] w-full" />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
              {Array.from({length: 5}).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={leagueStats}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip
                    formatter={(value, name) => [
                      `${value}%`,
                      leagueStats[0]?.isFiltered ? "Filtered Win Rate" : "All-Time Win Rate"
                    ]}
                    labelFormatter={(value) => `${value} League`}
                  />
                  <Bar
                    dataKey="winRate"
                    fill="#ffd700"
                    className="fill-gold-500 dark:fill-gold-400"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={true}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
              {leagueStats.map((item) => (
                <button
                  type="button"
                  key={item.name}
                  className="block text-center focus:outline-none focus:ring-2 rounded p-1 transition hover:bg-navy-50 dark:hover:bg-navy-800"
                  onClick={() => {
                    setSelectedLeague(item.name);
                    setModalOpen(true);
                  }}
                  aria-label={`Show ${item.name} picks and data`}
                >
                  <div className="text-2xl font-bold text-navy-500 dark:text-navy-200 underline">
                    {item.winRate ? `${item.winRate}%` : "--"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.name} | {item.totalPicks} pick{item.totalPicks !== 1 ? "s" : ""}
                    {item.isFiltered && " (filtered)"}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
        <LeagueStatsModal
          open={modalOpen}
          onOpenChange={(open) => setModalOpen(open)}
          leagueName={selectedLeague || ""}
          matches={selectedLeague ? getLeagueMatches(selectedLeague) : []}
          winRate={leagueMeta?.winRate}
          picks={leagueMeta?.picks}
        />
      </CardContent>
    </Card>
  );
};

export default StatsOverview;
