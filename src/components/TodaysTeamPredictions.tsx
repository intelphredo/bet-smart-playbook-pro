import React, { useMemo, useState } from "react";
import { useESPNData } from "@/hooks/useESPNData";
import { useSportsData } from "@/hooks/useSportsData";
import { applyAdvancedPredictions } from "@/utils/advancedPredictionAlgorithm";
import { Match } from "@/types/sports";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { format, isToday, parseISO, addDays, isBefore, isAfter } from "date-fns";
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
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    return (matchDate >= startDate && matchDate <= endDate);
  } catch (err) {
    console.error("Error parsing match date:", err);
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

  console.log("Total matches before filtering:", allMatches?.length || 0);
  
  const matchesWithPredictions = useMemo(() => {
    return applyAdvancedPredictions(allMatches || []);
  }, [allMatches]);
  
  console.log("Matches with predictions:", matchesWithPredictions.length);

  const filteredMatches: Match[] = useMemo(() => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const oneWeekLater = addDays(today, 7);
    oneWeekLater.setHours(23, 59, 59, 999);
    
    console.log("Date range:", today.toISOString(), "to", oneWeekLater.toISOString());
    
    const filtered = matchesWithPredictions.filter(m => {
      if (!m.startTime) {
        console.log("Match missing startTime:", m.id);
        return false;
      }
      
      try {
        if (showUpcomingWeek) {
          const inRange = isMatchInDateRange(m, today, oneWeekLater);
          if (inRange) {
            console.log("Match in range:", m.homeTeam.shortName, "vs", m.awayTeam.shortName, 
              "Start time:", new Date(m.startTime).toISOString());
          }
          return inRange;
        } else {
          return isToday(parseISO(m.startTime));
        }
      } catch (err) {
        console.error("Error filtering match:", err, m);
        return false;
      }
    });

    filtered.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    console.log("Filtered matches count:", filtered.length);
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
