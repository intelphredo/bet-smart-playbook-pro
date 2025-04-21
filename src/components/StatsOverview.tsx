
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { algorithmPerformanceData } from "@/data/algorithmPerformanceData";
import React, { useState, useMemo } from "react";
import LeagueStatsModal from "./LeagueStatsModal";
import { useESPNData } from "@/hooks/useESPNData";
import { getTopTeamPicks } from "@/utils/topTeamPickRecommendation";
import { Match } from "@/types/sports";

const StatsOverview = () => {
  const data = algorithmPerformanceData;

  // Modal state
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Get all ESPN matches with predictions
  const { upcomingMatches, liveMatches } = useESPNData({ league: "ALL", refreshInterval: 60000 });
  const allMatchesWithPred: Match[] = useMemo(
    () =>
      [...(upcomingMatches || []), ...(liveMatches || [])].filter(
        (m) => !!m.prediction && typeof m.prediction.confidence === "number"
      ),
    [upcomingMatches, liveMatches]
  );

  // Helper: get matches for a league
  const getLeagueMatches = (leagueName: string): Match[] =>
    allMatchesWithPred.filter(
      (m) => m.league.toUpperCase() === leagueName.toUpperCase()
    );

  // Modal info
  const leagueMeta =
    selectedLeague &&
    data.find(
      (d) => d.name.toUpperCase() === selectedLeague.toUpperCase()
    );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Algorithm Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[50, 80]} />
              <Tooltip
                formatter={(value, name) => [`${value}%`, "Win Rate"]}
                labelFormatter={(value) => `${value} League`}
              />
              <Bar
                dataKey="winRate"
                fill="#ffd700"
                className="fill-gold-500 dark:fill-gold-400"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
          {data.map((item) => (
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
                {item.winRate}%
              </div>
              <div className="text-xs text-muted-foreground">
                {item.name} | {item.picks} picks
              </div>
            </button>
          ))}
        </div>
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

