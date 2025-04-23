import React, { useMemo, useState } from "react";
import { useSportsData } from "@/hooks/useSportsData";
import { applyAdvancedPredictions } from "@/utils/advancedPredictionAlgorithm";
import { Match } from "@/types/sports";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { format, isToday, parseISO, addDays, startOfDay, endOfDay } from "date-fns";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

/**
 * TodaysTeamPredictions - Displays a table of all matches happening today and upcoming week with their predictions.
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

function isMatchInDateRange(match: Match, startDate: Date, endDate: Date) {
  try {
    const matchDate = parseISO(match.startTime);
    const start = startOfDay(startDate);
    const end = endOfDay(endDate);
    return matchDate >= start && matchDate <= end;
  } catch (err) {
    console.error("Error parsing match date:", err, match);
    return false;
  }
}

const TodaysTeamPredictions = () => {
  const [showUpcomingWeek, setShowUpcomingWeek] = useState(true);
  const [dataProvider, setDataProvider] = useState<string>("ESPN");
  
  const { 
    verifiedMatches: allMatches, 
    lastRefreshTime,
    refetchWithTimestamp,
    isLoading, 
    error,
    dataSource,
    setDataSource,
    availableDataSources
  } = useSportsData({ 
    league: "ALL", 
    refreshInterval: 60000,
    includeSchedule: true,
    useExternalApis: true
  });

  // Update the external data source when the dropdown changes
  React.useEffect(() => {
    if (dataProvider !== dataSource) {
      setDataSource(dataProvider as any);
    }
  }, [dataProvider, dataSource, setDataSource]);

  // Apply advanced predictions to matches before using them
  const matchesWithPredictions = useMemo(() => {
    // We must always run applyAdvancedPredictions, ensuring .prediction is populated
    return applyAdvancedPredictions(allMatches || []);
  }, [allMatches]);

  const filteredMatches: Match[] = useMemo(() => {
    const today = new Date();
    const oneWeekLater = addDays(today, 7);
    
    const filtered = matchesWithPredictions.filter(m => {
      if (!m.startTime) return false;
      try {
        const matchDate = parseISO(m.startTime);
        if (showUpcomingWeek) {
          return isMatchInDateRange(m, today, oneWeekLater);
        } else {
          return isToday(matchDate);
        }
      } catch (err) {
        return false;
      }
    });

    filtered.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    return filtered;
  }, [matchesWithPredictions, showUpcomingWeek]);

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return isToday(date) ? `Today, ${format(date, "h:mm a")}` : format(date, "EEE, MMM d, h:mm a");
    } catch (err) {
      console.error("Error formatting date:", err);
      return dateString;
    }
  };

  if (isLoading) return <div>Loading predictions...</div>;
  if (error) return <div className="text-red-500">Error loading predictions: {error.message}</div>;
  if (!filteredMatches.length) return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{showUpcomingWeek ? "This Week's" : "Today's"} Team Predictions</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Last updated: {formatDistanceToNow(parseISO(lastRefreshTime), { addSuffix: true })}
          </span>
          <Button size="sm" onClick={refetchWithTimestamp}>
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="flex gap-2 mb-4">
        <Button 
          variant={!showUpcomingWeek ? "default" : "outline"} 
          onClick={() => setShowUpcomingWeek(false)}
        >
          Today Only
        </Button>
        <Button 
          variant={showUpcomingWeek ? "default" : "outline"} 
          onClick={() => setShowUpcomingWeek(true)}
        >
          Upcoming Week
        </Button>
      </div>
      <div>No team predictions {showUpcomingWeek ? "for the upcoming week" : "for today"} yet.</div>
    </div>
  );

  return (
    <div className="overflow-x-auto mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{showUpcomingWeek ? "This Week's" : "Today's"} Team Predictions</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Last updated: {formatDistanceToNow(parseISO(lastRefreshTime), { addSuffix: true })}
          </span>
          <Button size="sm" onClick={refetchWithTimestamp}>
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="flex gap-2 mb-4">
        <Button 
          variant={!showUpcomingWeek ? "default" : "outline"} 
          onClick={() => setShowUpcomingWeek(false)}
        >
          Today Only
        </Button>
        <Button 
          variant={showUpcomingWeek ? "default" : "outline"} 
          onClick={() => setShowUpcomingWeek(true)}
        >
          Upcoming Week
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>League</TableHead>
            <TableHead>Match</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Prediction</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Projected Score</TableHead>
            <TableHead>Data Source</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredMatches.map(match => (
            <TableRow key={match.id}>
              <TableCell>{match.league}</TableCell>
              <TableCell>
                {match.homeTeam.shortName} vs {match.awayTeam.shortName}
                {match.verification && (
                  <Badge
                    variant={match.verification.isVerified ? "default" : "destructive"}
                    className="ml-2 text-xs"
                    title={`Confidence: ${match.verification.confidenceScore}%\nSources: ${match.verification.sources.join(", ")}`}
                  >
                    {match.verification.isVerified ? "Verified" : "Unverified"}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {formatDate(match.startTime)}
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
              <TableCell>
                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded-full">
                  {dataProvider}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TodaysTeamPredictions;
