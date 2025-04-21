
import React, { useMemo } from "react";
import { useESPNData } from "@/hooks/useESPNData";
import { Match } from "@/types/sports";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { format, isToday, parseISO } from "date-fns";

/**
 * TodaysTeamPredictions - Displays a table of all matches happening today with their predictions.
 * You can reuse this component on any page: <TodaysTeamPredictions />
 */

function getPredictionDescription(match: Match) {
  if (!match.prediction) return "-";
  const { recommended, confidence } = match.prediction;
  if (recommended === "home") return `${match.homeTeam.shortName} (${confidence}%)`;
  if (recommended === "away") return `${match.awayTeam.shortName} (${confidence}%)`;
  if (recommended === "draw") return `Draw (${confidence}%)`;
  return "-";
}

function isMatchToday(match: Match) {
  // Some sources use either "scheduled" or "pre" for future games
  try {
    return isToday(parseISO(match.startTime));
  } catch {
    return false;
  }
}

const TodaysTeamPredictions = () => {
  const { allMatches, isLoading, error } = useESPNData({ league: "ALL", refreshInterval: 60000 });

  // Get only today's matches
  const todaysMatches: Match[] = useMemo(() => {
    return (allMatches || [])
      .filter(m => isMatchToday(m) && m.prediction)
      .sort((a, b) => (a.startTime > b.startTime ? 1 : -1)); // earliest first
  }, [allMatches]);

  if (isLoading) return <div>Loading predictions...</div>;
  if (error) return <div className="text-red-500">Error loading predictions</div>;
  if (!todaysMatches.length) return <div>No team predictions for today yet.</div>;

  return (
    <div className="overflow-x-auto mt-4">
      <h2 className="text-xl font-bold mb-2">Today's Team Predictions</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>League</TableHead>
            <TableHead>Match</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>Prediction</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Projected Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {todaysMatches.map(match => (
            <TableRow key={match.id}>
              <TableCell>{match.league}</TableCell>
              <TableCell>
                {match.homeTeam.shortName} vs {match.awayTeam.shortName}
              </TableCell>
              <TableCell>
                {format(parseISO(match.startTime), "h:mm a")}
              </TableCell>
              <TableCell>
                {getPredictionDescription(match)}
              </TableCell>
              <TableCell>
                {match.prediction?.confidence ?? "-"}%
              </TableCell>
              <TableCell>
                {match.prediction
                  ? `${match.prediction.projectedScore.home} - ${match.prediction.projectedScore.away}`
                  : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TodaysTeamPredictions;

