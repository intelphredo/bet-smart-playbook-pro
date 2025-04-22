import React, { useMemo, useState } from "react";
import { useESPNData } from "@/hooks/useESPNData";
import { useSportsData } from "@/hooks/useSportsData";
import { applyAdvancedPredictions } from "@/utils/advancedPredictionAlgorithm";
import { Match } from "@/types/sports";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { format, isToday, parseISO, addDays, startOfDay, endOfDay } from "date-fns";
import { Button } from "./ui/button";

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
  
  const { allMatches, isLoading, error } = useSportsData({ 
    league: "ALL", 
    refreshInterval: 60000,
    includeSchedule: true 
  });

  console.log("Raw matches data:", allMatches);

  const matchesWithPredictions = useMemo(() => {
    return applyAdvancedPredictions(allMatches || []);
  }, [allMatches]);

  const filteredMatches: Match[] = useMemo(() => {
    const today = new Date();
    const oneWeekLater = addDays(today, 7);
    
    console.log("Filtering matches between:", format(today, 'yyyy-MM-dd HH:mm:ss'), 
      "and", format(oneWeekLater, 'yyyy-MM-dd HH:mm:ss'));

    const filtered = matchesWithPredictions.filter(m => {
      if (!m.startTime) {
        console.log("Match missing startTime:", m);
        return false;
      }

      try {
        const matchDate = parseISO(m.startTime);
        console.log("Checking match:", m.homeTeam.shortName, "vs", m.awayTeam.shortName, 
          "Date:", format(matchDate, 'yyyy-MM-dd HH:mm:ss'));
        
        if (showUpcomingWeek) {
          return isMatchInDateRange(m, today, oneWeekLater);
        } else {
          return isToday(matchDate);
        }
      } catch (err) {
        console.error("Error processing match:", err, m);
        return false;
      }
    });

    filtered.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    console.log("Filtered matches:", filtered.length, "matches found");
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
  if (error) return <div className="text-red-500">Error loading predictions</div>;
  if (!filteredMatches.length) return (
    <div>
      <h2 className="text-xl font-bold mb-2">{showUpcomingWeek ? "This Week's" : "Today's"} Team Predictions</h2>
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
      <h2 className="text-xl font-bold mb-2">{showUpcomingWeek ? "This Week's" : "Today's"} Team Predictions</h2>
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredMatches.map(match => (
            <TableRow key={match.id}>
              <TableCell>{match.league}</TableCell>
              <TableCell>
                {match.homeTeam.shortName} vs {match.awayTeam.shortName}
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TodaysTeamPredictions;
