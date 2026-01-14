import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart as BarChartIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import React, { useState, useMemo } from "react";
import LeagueStatsModal from "./LeagueStatsModal";
import { Match } from "@/types/sports";
import { useSportsData } from "@/hooks/useSportsData";
import { Badge } from "@/components/ui/badge";
import { useAlgorithmPerformance } from "@/hooks/useAlgorithmPerformance";

// Determine if a prediction was correct
function isPredictionCorrect(match: Match): boolean | null {
  if (!match.prediction || !match.score) return null;
  const { recommended } = match.prediction;
  if (recommended === "home" && match.score.home > match.score.away) return true;
  if (recommended === "away" && match.score.away > match.score.home) return true;
  if (recommended === "draw" && match.score.home === match.score.away) return true;
  return false;
}

// Define the type for algorithm stats with isFiltered and totalPicks properties
interface LeagueStatItem {
  name: string;
  picks: number;
  wins: number;
  winRate: number;
  isFiltered?: boolean;
  totalPicks?: number;
}

// Get unique league names for display order
const leagueNames = ["NBA", "NFL", "MLB", "NHL", "Soccer"];

const StatsOverview = () => {
  // Modal state
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Algorithm performance data from the hook
  const { data: algorithmData, isLoading: isAlgorithmDataLoading } = useAlgorithmPerformance();

  // Get all matches using sportsData hook to include MLB-specific data
  const { 
    finishedMatches, 
    upcomingMatches, 
    liveMatches, 
    isLoading: isSportsDataLoading 
  } = useSportsData({ 
    league: "ALL", 
    refreshInterval: 60000 
  });

  // Compute league win rates and pick counts by analyzing finishedMatches
  const leagueStats = useMemo(() => {
    if (algorithmData && algorithmData.length > 0) {
      // If we have algorithm data, use that instead of calculating from matches
      return algorithmData.map(algo => ({
        name: algo.name,
        picks: algo.totalPicks || 0,
        wins: Math.round((algo.winRate / 100) * (algo.totalPicks || 0)),
        winRate: algo.winRate,
        isFiltered: algo.isFiltered,
        totalPicks: algo.totalPicks
      }));
    }

    // Fallback: Calculate from matches if no algorithm data
    const stats: Record<string, LeagueStatItem> = {};

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
  }, [finishedMatches, algorithmData]);

  const isLoading = isSportsDataLoading || isAlgorithmDataLoading;

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

  // Check if any stats are filtered
  const hasFilteredStats = leagueStats.some(stat => stat.isFiltered);

  return (
    <Card variant="premium" className="border-primary/10 overflow-hidden">
      {/* Gold accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <BarChartIcon className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-xl font-bold">Algorithm Performance</CardTitle>
          </div>
          {hasFilteredStats && (
            <Badge variant="outline" className="ml-2 text-xs bg-primary/10 border-primary/30 text-primary">
              Filtered View
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="skeleton-card-premium h-[250px] w-full rounded-xl" />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
              {Array.from({length: 5}).map((_, i) => (
                <div key={i} className="skeleton-card-premium h-20 w-full rounded-xl" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="h-[250px] w-full p-4 rounded-xl bg-gradient-to-br from-card via-card to-primary/5 border border-border/30">
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
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    formatter={(value, name) => [
                      `${value}%`,
                      hasFilteredStats ? "Filtered Win Rate" : "All-Time Win Rate"
                    ]}
                    labelFormatter={(value) => `${value} League`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--primary) / 0.2)',
                      borderRadius: '0.75rem',
                      boxShadow: '0 10px 40px -10px hsl(var(--primary) / 0.2)',
                    }}
                  />
                  <Bar
                    dataKey="winRate"
                    fill="hsl(var(--primary))"
                    radius={[6, 6, 0, 0]}
                    isAnimationActive={true}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-6">
              {leagueStats.map((item, index) => (
                <button
                  type="button"
                  key={item.name}
                  className="group relative block text-center p-4 rounded-xl bg-gradient-to-br from-card via-card to-primary/5 border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 overflow-hidden"
                  onClick={() => {
                    setSelectedLeague(item.name);
                    setModalOpen(true);
                  }}
                  aria-label={`Show ${item.name} picks and data`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Hover shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  
                  <div className="relative">
                    <div className="text-2xl font-bold bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-200">
                      {item.winRate ? `${item.winRate}%` : "--"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1.5 font-semibold">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-primary/60 mt-0.5">
                      {item.totalPicks || item.picks || 0} picks
                    </div>
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
