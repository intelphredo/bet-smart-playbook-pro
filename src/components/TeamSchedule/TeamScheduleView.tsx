import React, { useState, useMemo } from "react";
import { Match, League } from "@/types/sports";
import { TeamSelector } from "./TeamSelector";
import { TeamScheduleCard } from "./TeamScheduleCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CalendarDays, ChevronLeft, Trophy, TrendingUp } from "lucide-react";
import { format, parseISO, startOfDay, isAfter, isBefore, addDays } from "date-fns";
import { cn } from "@/lib/utils";

interface TeamScheduleViewProps {
  matches: Match[];
  selectedLeague?: League | "ALL";
  onBack?: () => void;
}

export const TeamScheduleView: React.FC<TeamScheduleViewProps> = ({
  matches,
  selectedLeague = "ALL",
  onBack,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // Filter matches for selected team
  const teamMatches = useMemo(() => {
    if (!selectedTeamId) return [];

    return matches
      .filter(
        (match) =>
          match.homeTeam.id === selectedTeamId ||
          match.awayTeam.id === selectedTeamId
      )
      .filter((match) => match.status === "scheduled" || match.status === "pre")
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
  }, [matches, selectedTeamId]);

  // Get selected team info
  const selectedTeam = useMemo(() => {
    if (!selectedTeamId) return null;
    const match = matches.find(
      (m) =>
        m.homeTeam.id === selectedTeamId || m.awayTeam.id === selectedTeamId
    );
    if (!match) return null;
    return match.homeTeam.id === selectedTeamId
      ? match.homeTeam
      : match.awayTeam;
  }, [matches, selectedTeamId]);

  // Group matches by date
  const matchesByDate = useMemo(() => {
    const grouped: Record<string, Match[]> = {};
    teamMatches.forEach((match) => {
      const dateKey = format(parseISO(match.startTime), "yyyy-MM-dd");
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(match);
    });
    return grouped;
  }, [teamMatches]);

  // Calculate team stats from upcoming matches
  const teamStats = useMemo(() => {
    if (!selectedTeamId || teamMatches.length === 0) return null;

    let homeGames = 0;
    let awayGames = 0;
    let favoredGames = 0;

    teamMatches.forEach((match) => {
      const isHome = match.homeTeam.id === selectedTeamId;
      if (isHome) homeGames++;
      else awayGames++;

      const predictionFavorsTeam =
        (isHome && match.prediction?.recommended === "home") ||
        (!isHome && match.prediction?.recommended === "away");
      if (predictionFavorsTeam) favoredGames++;
    });

    return {
      totalGames: teamMatches.length,
      homeGames,
      awayGames,
      favoredGames,
      favoredPercentage: Math.round((favoredGames / teamMatches.length) * 100),
    };
  }, [teamMatches, selectedTeamId]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Team Schedule
            </h2>
            <p className="text-sm text-muted-foreground">
              View upcoming games for any team
            </p>
          </div>
        </div>
        <TeamSelector
          matches={matches}
          selectedTeamId={selectedTeamId}
          onTeamSelect={setSelectedTeamId}
          selectedLeague={selectedLeague}
        />
      </div>

      {/* Team Info Card */}
      {selectedTeam && teamStats && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <img
                src={selectedTeam.logo}
                alt={selectedTeam.name}
                className="h-16 w-16 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
              <div className="flex-1">
                <h3 className="text-lg font-bold">{selectedTeam.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Record: {selectedTeam.record || "0-0"}
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {teamStats.totalGames}
                  </p>
                  <p className="text-xs text-muted-foreground">Upcoming</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{teamStats.homeGames}</p>
                  <p className="text-xs text-muted-foreground">Home</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{teamStats.awayGames}</p>
                  <p className="text-xs text-muted-foreground">Away</p>
                </div>
                <div>
                  <p
                    className={cn(
                      "text-2xl font-bold",
                      teamStats.favoredPercentage >= 50
                        ? "text-green-600 dark:text-green-400"
                        : "text-muted-foreground"
                    )}
                  >
                    {teamStats.favoredPercentage}%
                  </p>
                  <p className="text-xs text-muted-foreground">Favored</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Content */}
      {selectedTeamId ? (
        teamMatches.length > 0 ? (
          <div className="space-y-4">
            {Object.entries(matchesByDate).map(([dateKey, dayMatches]) => (
              <div key={dateKey}>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-medium">
                    {format(parseISO(dateKey), "EEEE, MMMM d, yyyy")}
                  </h4>
                  <Badge variant="secondary" className="text-xs">
                    {dayMatches.length} game{dayMatches.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {dayMatches.map((match) => (
                    <TeamScheduleCard
                      key={match.id}
                      match={match}
                      selectedTeamId={selectedTeamId}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Upcoming Games</h3>
              <p className="text-muted-foreground">
                No scheduled games found for this team in the next 7 days.
              </p>
            </CardContent>
          </Card>
        )
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Select a Team</h3>
            <p className="text-muted-foreground">
              Choose a team from the dropdown above to view their upcoming schedule.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
