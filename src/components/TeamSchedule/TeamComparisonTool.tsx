import React, { useState, useMemo } from "react";
import { Match, League, Team } from "@/types/sports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GitCompare,
  ChevronDown,
  Check,
  X,
  Trophy,
  MapPin,
  Plane,
  Calendar,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  BarChart3,
  Swords,
  ArrowRight,
  Clock,
  Percent,
  History,
  Minus,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, isToday, isTomorrow, addDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useHeadToHead } from "@/hooks/useHeadToHead";

interface TeamComparisonToolProps {
  matches: Match[];
  selectedLeague?: League | "ALL";
}

interface TeamData {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  league: League;
  record?: string;
}

interface TeamStats {
  totalGames: number;
  homeGames: number;
  awayGames: number;
  favoredGames: number;
  favoredPercentage: number;
  avgConfidence: number;
  highValueGames: number;
  avgSmartScore: number;
  nextGame: Match | null;
  upcomingOpponents: string[];
}

const LEAGUE_ORDER: (League | "ALL")[] = ["ALL", "NBA", "NFL", "NHL", "MLB", "SOCCER", "NCAAF", "NCAAB"];

export const TeamComparisonTool: React.FC<TeamComparisonToolProps> = ({
  matches,
  selectedLeague = "ALL",
}) => {
  const [team1Id, setTeam1Id] = useState<string | null>(null);
  const [team2Id, setTeam2Id] = useState<string | null>(null);
  const [open1, setOpen1] = useState(false);
  const [open2, setOpen2] = useState(false);

  // Extract unique teams
  const teams = useMemo(() => {
    const teamMap = new Map<string, TeamData>();
    matches.forEach((match) => {
      if (!teamMap.has(match.homeTeam.id)) {
        teamMap.set(match.homeTeam.id, {
          id: match.homeTeam.id,
          name: match.homeTeam.name,
          shortName: match.homeTeam.shortName,
          logo: match.homeTeam.logo,
          league: match.league,
          record: match.homeTeam.record,
        });
      }
      if (!teamMap.has(match.awayTeam.id)) {
        teamMap.set(match.awayTeam.id, {
          id: match.awayTeam.id,
          name: match.awayTeam.name,
          shortName: match.awayTeam.shortName,
          logo: match.awayTeam.logo,
          league: match.league,
          record: match.awayTeam.record,
        });
      }
    });
    return Array.from(teamMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [matches]);

  // Filter teams by league
  const filteredTeams = useMemo(() => {
    if (selectedLeague === "ALL") return teams;
    return teams.filter(t => t.league === selectedLeague);
  }, [teams, selectedLeague]);

  // Group teams by league
  const teamsByLeague = useMemo(() => {
    const grouped: Record<string, TeamData[]> = {};
    filteredTeams.forEach((team) => {
      if (!grouped[team.league]) grouped[team.league] = [];
      grouped[team.league].push(team);
    });
    return grouped;
  }, [filteredTeams]);

  // Get selected teams
  const team1 = teams.find(t => t.id === team1Id) || null;
  const team2 = teams.find(t => t.id === team2Id) || null;

  // Calculate stats for a team
  const calculateTeamStats = (teamId: string | null): TeamStats | null => {
    if (!teamId) return null;

    const teamMatches = matches
      .filter(m => m.homeTeam.id === teamId || m.awayTeam.id === teamId)
      .filter(m => m.status === "scheduled" || m.status === "pre")
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    if (teamMatches.length === 0) return null;

    let homeGames = 0, awayGames = 0, favoredGames = 0, totalConfidence = 0, highValueGames = 0, totalSmartScore = 0;
    const opponents: string[] = [];

    teamMatches.forEach((match) => {
      const isHome = match.homeTeam.id === teamId;
      if (isHome) {
        homeGames++;
        opponents.push(match.awayTeam.name);
      } else {
        awayGames++;
        opponents.push(match.homeTeam.name);
      }

      const predictionFavorsTeam =
        (isHome && match.prediction?.recommended === "home") ||
        (!isHome && match.prediction?.recommended === "away");

      if (predictionFavorsTeam) {
        favoredGames++;
        if (match.prediction?.confidence) totalConfidence += match.prediction.confidence;
      }

      if (match.smartScore?.overall) {
        totalSmartScore += match.smartScore.overall;
        if (match.smartScore.overall >= 70) highValueGames++;
      }
    });

    return {
      totalGames: teamMatches.length,
      homeGames,
      awayGames,
      favoredGames,
      favoredPercentage: Math.round((favoredGames / teamMatches.length) * 100),
      avgConfidence: favoredGames > 0 ? Math.round(totalConfidence / favoredGames) : 0,
      highValueGames,
      avgSmartScore: Math.round(totalSmartScore / teamMatches.length),
      nextGame: teamMatches[0],
      upcomingOpponents: opponents.slice(0, 5),
    };
  };

  const team1Stats = useMemo(() => calculateTeamStats(team1Id), [team1Id, matches]);
  const team2Stats = useMemo(() => calculateTeamStats(team2Id), [team2Id, matches]);

  // Find head-to-head matchup
  const headToHead = useMemo(() => {
    if (!team1Id || !team2Id) return null;
    return matches.find(m =>
      (m.homeTeam.id === team1Id && m.awayTeam.id === team2Id) ||
      (m.homeTeam.id === team2Id && m.awayTeam.id === team1Id)
    );
  }, [team1Id, team2Id, matches]);

  // Fetch head-to-head history using the hook
  const { 
    data: h2hHistory, 
    isLoading: h2hLoading, 
    refetch: refetchH2H,
    isFetching: h2hFetching 
  } = useHeadToHead(team1, team2);

  // Team selector component
  const TeamSelector = ({
    selectedTeam,
    onSelect,
    open,
    setOpen,
    excludeTeamId,
    label,
  }: {
    selectedTeam: TeamData | null;
    onSelect: (id: string | null) => void;
    open: boolean;
    setOpen: (open: boolean) => void;
    excludeTeamId: string | null;
    label: string;
  }) => (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full h-16 justify-between",
            selectedTeam && "border-primary/50"
          )}
        >
          {selectedTeam ? (
            <div className="flex items-center gap-3">
              <img
                src={selectedTeam.logo}
                alt={selectedTeam.name}
                className="h-10 w-10 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
              <div className="text-left">
                <p className="font-semibold">{selectedTeam.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedTeam.record || selectedTeam.league}
                </p>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">{label}</span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search teams..." />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No teams found.</CommandEmpty>
            {selectedTeam && (
              <CommandGroup>
                <CommandItem onSelect={() => { onSelect(null); setOpen(false); }}>
                  <X className="h-4 w-4 mr-2" />
                  Clear selection
                </CommandItem>
              </CommandGroup>
            )}
            {Object.entries(teamsByLeague).map(([league, leagueTeams]) => (
              <CommandGroup key={league} heading={league}>
                {leagueTeams
                  .filter(t => t.id !== excludeTeamId)
                  .map((team) => (
                    <CommandItem
                      key={team.id}
                      value={`${team.name} ${team.shortName}`}
                      onSelect={() => { onSelect(team.id); setOpen(false); }}
                      className="flex items-center gap-2 py-2"
                    >
                      <img
                        src={team.logo}
                        alt={team.name}
                        className="h-6 w-6 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <span className="flex-1 truncate">{team.name}</span>
                      {selectedTeam?.id === team.id && <Check className="h-4 w-4" />}
                    </CommandItem>
                  ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

  // Stat comparison row
  const StatRow = ({
    label,
    icon: Icon,
    value1,
    value2,
    format: formatFn = (v) => String(v),
    higherIsBetter = true,
  }: {
    label: string;
    icon: React.ElementType;
    value1: number | string | undefined;
    value2: number | string | undefined;
    format?: (v: number | string) => string;
    higherIsBetter?: boolean;
  }) => {
    const v1 = typeof value1 === "number" ? value1 : 0;
    const v2 = typeof value2 === "number" ? value2 : 0;
    const team1Better = higherIsBetter ? v1 > v2 : v1 < v2;
    const team2Better = higherIsBetter ? v2 > v1 : v2 < v1;

    return (
      <div className="grid grid-cols-3 items-center gap-2 py-3 border-b border-border/50 last:border-0">
        <div
          className={cn(
            "text-right font-semibold text-lg",
            team1Better && "text-green-500",
            team2Better && "text-muted-foreground"
          )}
        >
          {value1 !== undefined ? formatFn(value1) : "-"}
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </div>
        <div
          className={cn(
            "text-left font-semibold text-lg",
            team2Better && "text-green-500",
            team1Better && "text-muted-foreground"
          )}
        >
          {value2 !== undefined ? formatFn(value2) : "-"}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <GitCompare className="h-6 w-6 text-primary" />
          Team Comparison
        </h2>
        <p className="text-sm text-muted-foreground">
          Compare stats and upcoming matchups between two teams
        </p>
      </div>

      {/* Team Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-center">
            <TeamSelector
              selectedTeam={team1}
              onSelect={setTeam1Id}
              open={open1}
              setOpen={setOpen1}
              excludeTeamId={team2Id}
              label="Select Team 1"
            />

            <div className="flex justify-center">
              <div className="bg-primary/10 rounded-full p-3">
                <Swords className="h-6 w-6 text-primary" />
              </div>
            </div>

            <TeamSelector
              selectedTeam={team2}
              onSelect={setTeam2Id}
              open={open2}
              setOpen={setOpen2}
              excludeTeamId={team1Id}
              label="Select Team 2"
            />
          </div>

          {/* Swap Button */}
          {team1 && team2 && (
            <div className="flex justify-center mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTeam1Id(team2Id);
                  setTeam2Id(team1Id);
                }}
              >
                <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
                Swap Teams
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparison Content */}
      <AnimatePresence mode="wait">
        {team1 && team2 && team1Stats && team2Stats ? (
          <motion.div
            key="comparison"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Head to Head Alert */}
            {headToHead && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="border-primary/50 bg-primary/5">
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Swords className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Head-to-Head Matchup Found!</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Badge variant="outline">
                          <Calendar className="h-3 w-3 mr-1" />
                          {isToday(parseISO(headToHead.startTime))
                            ? "Today"
                            : isTomorrow(parseISO(headToHead.startTime))
                            ? "Tomorrow"
                            : format(parseISO(headToHead.startTime), "MMM d")}
                        </Badge>
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(parseISO(headToHead.startTime), "h:mm a")}
                        </Badge>
                        {headToHead.smartScore?.overall && (
                          <Badge className="bg-primary/20 text-primary">
                            <Zap className="h-3 w-3 mr-1" />
                            Score: {headToHead.smartScore.overall}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {headToHead.prediction && (
                      <div className="mt-3 pt-3 border-t border-primary/20 flex flex-wrap gap-2 items-center">
                        <span className="text-sm text-muted-foreground">Prediction:</span>
                        <Badge
                          className={cn(
                            headToHead.prediction.recommended === "home" && "bg-green-500/20 text-green-500",
                            headToHead.prediction.recommended === "away" && "bg-blue-500/20 text-blue-500"
                          )}
                        >
                          {headToHead.prediction.recommended === "home"
                            ? headToHead.homeTeam.name
                            : headToHead.awayTeam.name}
                        </Badge>
                        <Badge variant="outline">
                          <Target className="h-3 w-3 mr-1" />
                          {headToHead.prediction.confidence}% confident
                        </Badge>
                        <Badge variant="outline">
                          Projected: {headToHead.prediction.projectedScore.home} - {headToHead.prediction.projectedScore.away}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Stats Comparison */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Stats Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Team Headers */}
                <div className="grid grid-cols-3 items-center gap-2 mb-4 pb-4 border-b">
                  <div className="flex items-center gap-2 justify-end">
                    <div className="text-right">
                      <p className="font-semibold truncate">{team1.name}</p>
                      <p className="text-xs text-muted-foreground">{team1.record || team1.league}</p>
                    </div>
                    <img
                      src={team1.logo}
                      alt={team1.name}
                      className="h-10 w-10 object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                    />
                  </div>
                  <div className="text-center text-sm text-muted-foreground font-medium">VS</div>
                  <div className="flex items-center gap-2">
                    <img
                      src={team2.logo}
                      alt={team2.name}
                      className="h-10 w-10 object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                    />
                    <div className="text-left">
                      <p className="font-semibold truncate">{team2.name}</p>
                      <p className="text-xs text-muted-foreground">{team2.record || team2.league}</p>
                    </div>
                  </div>
                </div>

                {/* Stats Rows */}
                <div>
                  <StatRow
                    label="Upcoming Games"
                    icon={Calendar}
                    value1={team1Stats.totalGames}
                    value2={team2Stats.totalGames}
                  />
                  <StatRow
                    label="Home Games"
                    icon={MapPin}
                    value1={team1Stats.homeGames}
                    value2={team2Stats.homeGames}
                  />
                  <StatRow
                    label="Away Games"
                    icon={Plane}
                    value1={team1Stats.awayGames}
                    value2={team2Stats.awayGames}
                  />
                  <StatRow
                    label="Favored %"
                    icon={TrendingUp}
                    value1={team1Stats.favoredPercentage}
                    value2={team2Stats.favoredPercentage}
                    format={(v) => `${v}%`}
                  />
                  <StatRow
                    label="Avg Confidence"
                    icon={Target}
                    value1={team1Stats.avgConfidence}
                    value2={team2Stats.avgConfidence}
                    format={(v) => `${v}%`}
                  />
                  <StatRow
                    label="Avg Smart Score"
                    icon={Zap}
                    value1={team1Stats.avgSmartScore}
                    value2={team2Stats.avgSmartScore}
                  />
                  <StatRow
                    label="High-Value Games"
                    icon={Trophy}
                    value1={team1Stats.highValueGames}
                    value2={team2Stats.highValueGames}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Head-to-Head History */}
            {h2hLoading ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Head-to-Head History
                    <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground ml-2" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </CardContent>
              </Card>
            ) : h2hHistory && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <History className="h-5 w-5 text-primary" />
                      Head-to-Head History
                      {h2hHistory.isLiveData ? (
                        <Badge variant="outline" className="text-[10px] gap-1 ml-2">
                          <Wifi className="h-3 w-3 text-green-500" />
                          Live ESPN Data
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] gap-1 ml-2">
                          <WifiOff className="h-3 w-3 text-muted-foreground" />
                          Simulated
                        </Badge>
                      )}
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => refetchH2H()}
                      disabled={h2hFetching}
                      className="h-8"
                    >
                      <RefreshCw className={cn("h-4 w-4", h2hFetching && "animate-spin")} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Overall Record */}
                  <div className="grid grid-cols-3 items-center gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <img
                          src={team1.logo}
                          alt={team1.name}
                          className="h-8 w-8 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                        />
                      </div>
                      <p className={cn(
                        "text-3xl font-bold",
                        h2hHistory.team1Wins > h2hHistory.team2Wins && "text-green-500"
                      )}>
                        {h2hHistory.team1Wins}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase">Wins</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Minus className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-2xl font-bold text-muted-foreground">
                        {h2hHistory.ties}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase">Ties</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <img
                          src={team2.logo}
                          alt={team2.name}
                          className="h-8 w-8 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                        />
                      </div>
                      <p className={cn(
                        "text-3xl font-bold",
                        h2hHistory.team2Wins > h2hHistory.team1Wins && "text-green-500"
                      )}>
                        {h2hHistory.team2Wins}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase">Wins</p>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-muted/30 rounded-lg p-3 text-center">
                      <p className="text-lg font-semibold">{h2hHistory.totalGames}</p>
                      <p className="text-xs text-muted-foreground">Total Games</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3 text-center">
                      <p className="text-lg font-semibold">{h2hHistory.avgTeam1Score.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">{team1.shortName} Avg Pts</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3 text-center">
                      <p className="text-lg font-semibold">{h2hHistory.avgTeam2Score.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">{team2.shortName} Avg Pts</p>
                    </div>
                    {h2hHistory.streakTeam && h2hHistory.streakCount > 1 && (
                      <div className="bg-primary/10 rounded-lg p-3 text-center">
                        <p className="text-lg font-semibold text-primary">{h2hHistory.streakCount}W</p>
                        <p className="text-xs text-muted-foreground">
                          {h2hHistory.streakTeam === team1.name ? team1.shortName : team2.shortName} Streak
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Recent Matchups */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Recent Matchups
                    </h4>
                    <div className="space-y-2">
                      {h2hHistory.lastMeetings.map((match, idx) => {
                        // Handle both API format (homeTeamId) and mock format (homeTeam name)
                        const matchAny = match as any;
                        const team1IsHome = matchAny.homeTeamId === team1.id || 
                          match.homeTeam.toLowerCase().includes(team1.name.toLowerCase().split(" ").pop() || "") ||
                          match.homeTeam === team1.name;
                        const team1Score = team1IsHome ? match.homeScore : match.awayScore;
                        const team2Score = team1IsHome ? match.awayScore : match.homeScore;
                        const team1Won = (team1IsHome && match.winner === "home") || (!team1IsHome && match.winner === "away");
                        const team2Won = (team1IsHome && match.winner === "away") || (!team1IsHome && match.winner === "home");
                        
                        return (
                          <motion.div
                            key={match.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-xs text-muted-foreground w-20">
                                {format(parseISO(match.date), "MMM d, yyyy")}
                              </div>
                              <Badge variant="outline" className="text-[10px]">
                                {match.season}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "flex items-center gap-2",
                                team1Won && "font-bold"
                              )}>
                                <span className={cn(
                                  "text-sm",
                                  team1Won && "text-green-500"
                                )}>
                                  {team1.shortName}
                                </span>
                                <span className={cn(
                                  "text-lg font-mono",
                                  team1Won && "text-green-500"
                                )}>
                                  {team1Score}
                                </span>
                              </div>
                              
                              <span className="text-muted-foreground text-xs">-</span>
                              
                              <div className={cn(
                                "flex items-center gap-2",
                                team2Won && "font-bold"
                              )}>
                                <span className={cn(
                                  "text-lg font-mono",
                                  team2Won && "text-green-500"
                                )}>
                                  {team2Score}
                                </span>
                                <span className={cn(
                                  "text-sm",
                                  team2Won && "text-green-500"
                                )}>
                                  {team2.shortName}
                                </span>
                              </div>
                            </div>
                            
                            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate max-w-[100px]">{match.venue}</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Data source indicator */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                    {h2hHistory.isLiveData ? (
                      <>
                        <Wifi className="h-3 w-3 text-green-500" />
                        <span>Data from ESPN API • {h2hHistory.totalGames} historical matchups found</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3 w-3" />
                        <span>Simulated data (no historical matchups found in API)</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Opponents */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { team: team1, stats: team1Stats, label: "Team 1" },
                { team: team2, stats: team2Stats, label: "Team 2" },
              ].map(({ team, stats }) => (
                <Card key={team.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <img
                        src={team.logo}
                        alt={team.name}
                        className="h-6 w-6 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                      />
                      {team.name} - Next Up
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.nextGame ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src={
                                stats.nextGame.homeTeam.id === team.id
                                  ? stats.nextGame.awayTeam.logo
                                  : stats.nextGame.homeTeam.logo
                              }
                              alt="opponent"
                              className="h-8 w-8 object-contain"
                              onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                            />
                            <div>
                              <p className="font-medium">
                                {stats.nextGame.homeTeam.id === team.id ? "vs" : "@"}{" "}
                                {stats.nextGame.homeTeam.id === team.id
                                  ? stats.nextGame.awayTeam.name
                                  : stats.nextGame.homeTeam.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(parseISO(stats.nextGame.startTime), "EEE, MMM d 'at' h:mm a")}
                              </p>
                            </div>
                          </div>
                          {stats.nextGame.smartScore?.overall && (
                            <Badge
                              className={cn(
                                stats.nextGame.smartScore.overall >= 70 && "bg-green-500/20 text-green-500",
                                stats.nextGame.smartScore.overall >= 50 &&
                                  stats.nextGame.smartScore.overall < 70 &&
                                  "bg-yellow-500/20 text-yellow-500",
                                stats.nextGame.smartScore.overall < 50 && "bg-muted text-muted-foreground"
                              )}
                            >
                              <Zap className="h-3 w-3 mr-1" />
                              {stats.nextGame.smartScore.overall}
                            </Badge>
                          )}
                        </div>

                        {stats.upcomingOpponents.length > 1 && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-2">Upcoming schedule:</p>
                            <div className="flex flex-wrap gap-1">
                              {stats.upcomingOpponents.slice(0, 5).map((opp, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {opp}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No upcoming games scheduled
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <GitCompare className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Select Two Teams</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Choose two teams above to compare their stats, upcoming matchups, and predictions.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
