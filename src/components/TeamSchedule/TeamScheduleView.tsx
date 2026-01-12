import React, { useState, useMemo } from "react";
import { Match, League } from "@/types/sports";
import { TeamSelector } from "./TeamSelector";
import { TeamScheduleCard } from "./TeamScheduleCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calendar, 
  CalendarDays, 
  ChevronLeft, 
  Trophy, 
  TrendingUp,
  MapPin,
  Plane,
  BarChart3,
  Target,
  Clock,
  Zap
} from "lucide-react";
import { format, parseISO, startOfDay, isAfter, isBefore, addDays, isToday, isTomorrow, isThisWeek } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface TeamScheduleViewProps {
  matches: Match[];
  selectedLeague?: League | "ALL";
  onBack?: () => void;
}

type TimeFilter = "all" | "today" | "tomorrow" | "week";

export const TeamScheduleView: React.FC<TeamScheduleViewProps> = ({
  matches,
  selectedLeague = "ALL",
  onBack,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");

  // Filter matches for selected team
  const teamMatches = useMemo(() => {
    if (!selectedTeamId) return [];

    let filtered = matches
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

    // Apply time filter
    const now = new Date();
    switch (timeFilter) {
      case "today":
        filtered = filtered.filter(m => isToday(parseISO(m.startTime)));
        break;
      case "tomorrow":
        filtered = filtered.filter(m => isTomorrow(parseISO(m.startTime)));
        break;
      case "week":
        filtered = filtered.filter(m => isThisWeek(parseISO(m.startTime)));
        break;
    }

    return filtered;
  }, [matches, selectedTeamId, timeFilter]);

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
    if (!selectedTeamId) return null;

    // Get all matches for this team (not just filtered by time)
    const allTeamMatches = matches
      .filter(
        (match) =>
          match.homeTeam.id === selectedTeamId ||
          match.awayTeam.id === selectedTeamId
      )
      .filter((match) => match.status === "scheduled" || match.status === "pre");

    if (allTeamMatches.length === 0) return null;

    let homeGames = 0;
    let awayGames = 0;
    let favoredGames = 0;
    let totalConfidence = 0;
    let highValueGames = 0;

    allTeamMatches.forEach((match) => {
      const isHome = match.homeTeam.id === selectedTeamId;
      if (isHome) homeGames++;
      else awayGames++;

      const predictionFavorsTeam =
        (isHome && match.prediction?.recommended === "home") ||
        (!isHome && match.prediction?.recommended === "away");
      if (predictionFavorsTeam) {
        favoredGames++;
        if (match.prediction?.confidence) {
          totalConfidence += match.prediction.confidence;
        }
      }

      if (match.smartScore?.overall && match.smartScore.overall >= 70) {
        highValueGames++;
      }
    });

    return {
      totalGames: allTeamMatches.length,
      homeGames,
      awayGames,
      favoredGames,
      favoredPercentage: Math.round((favoredGames / allTeamMatches.length) * 100),
      avgConfidence: favoredGames > 0 ? Math.round(totalConfidence / favoredGames) : 0,
      highValueGames,
    };
  }, [matches, selectedTeamId]);

  // Get next game for quick view
  const nextGame = teamMatches[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-primary" />
              Team Schedule
            </h2>
            <p className="text-sm text-muted-foreground">
              Select a team to view their upcoming games and predictions
            </p>
          </div>
        </div>
        
        {/* Team Selector - Full Width on Mobile */}
        <TeamSelector
          matches={matches}
          selectedTeamId={selectedTeamId}
          onTeamSelect={setSelectedTeamId}
          selectedLeague={selectedLeague}
        />
      </div>

      <AnimatePresence mode="wait">
        {selectedTeam && teamStats ? (
          <motion.div
            key="team-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Team Info Card */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <img
                    src={selectedTeam.logo}
                    alt={selectedTeam.name}
                    className="h-20 w-20 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold">{selectedTeam.name}</h3>
                    <p className="text-muted-foreground">
                      Record: <span className="font-semibold">{selectedTeam.record || "0-0"}</span>
                    </p>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-4 text-center w-full sm:w-auto">
                    <div className="bg-background/50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-primary">{teamStats.totalGames}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Games</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3">
                      <div className="flex items-center justify-center gap-1">
                        <MapPin className="h-3 w-3 text-green-500" />
                        <span className="text-2xl font-bold">{teamStats.homeGames}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase">Home</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3">
                      <div className="flex items-center justify-center gap-1">
                        <Plane className="h-3 w-3 text-blue-500" />
                        <span className="text-2xl font-bold">{teamStats.awayGames}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase">Away</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3">
                      <p className={cn(
                        "text-2xl font-bold",
                        teamStats.favoredPercentage >= 50 ? "text-green-500" : "text-yellow-500"
                      )}>
                        {teamStats.favoredPercentage}%
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase">Favored</p>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                {teamStats.highValueGames > 0 && (
                  <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-4">
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      <Zap className="h-3 w-3 mr-1" />
                      {teamStats.highValueGames} High-Value Game{teamStats.highValueGames !== 1 ? 's' : ''}
                    </Badge>
                    {teamStats.avgConfidence > 0 && (
                      <Badge variant="outline">
                        <Target className="h-3 w-3 mr-1" />
                        Avg {teamStats.avgConfidence}% Confidence When Favored
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Time Filter Tabs */}
            <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" className="text-xs">
                  All Games
                </TabsTrigger>
                <TabsTrigger value="today" className="text-xs">
                  Today
                </TabsTrigger>
                <TabsTrigger value="tomorrow" className="text-xs">
                  Tomorrow
                </TabsTrigger>
                <TabsTrigger value="week" className="text-xs">
                  This Week
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Schedule Content */}
            {teamMatches.length > 0 ? (
              <div className="space-y-6">
                {Object.entries(matchesByDate).map(([dateKey, dayMatches], groupIndex) => (
                  <motion.div 
                    key={dateKey}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: groupIndex * 0.1 }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold">
                        {isToday(parseISO(dateKey)) 
                          ? "Today" 
                          : isTomorrow(parseISO(dateKey))
                          ? "Tomorrow"
                          : format(parseISO(dateKey), "EEEE, MMMM d, yyyy")}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {dayMatches.length} game{dayMatches.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {dayMatches.map((match, matchIndex) => (
                        <motion.div
                          key={match.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: groupIndex * 0.1 + matchIndex * 0.05 }}
                        >
                          <TeamScheduleCard
                            match={match}
                            selectedTeamId={selectedTeamId}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No Games {timeFilter !== "all" ? `${timeFilter === "today" ? "Today" : timeFilter === "tomorrow" ? "Tomorrow" : "This Week"}` : "Scheduled"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {timeFilter !== "all" 
                      ? "Try expanding your time filter to see more games."
                      : "No upcoming games found for this team."}
                  </p>
                  {timeFilter !== "all" && (
                    <Button variant="outline" onClick={() => setTimeFilter("all")}>
                      Show All Games
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <CalendarDays className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Select a Team</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Choose a team from the dropdown above to view their complete schedule, 
                  predictions, and betting insights.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
